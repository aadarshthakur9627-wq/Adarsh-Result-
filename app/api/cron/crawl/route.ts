import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { OFFICIAL_SOURCES } from "@/lib/crawler/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HTML_BYTES = 4_000_000;
const KEYWORDS = [
  "recruitment", "vacancy", "notification", "advertisement", "advt", "apply online",
  "application form", "admit card", "hall ticket", "result", "answer key", "answer-key",
  "exam date", "exam schedule", "merit list", "cut off", "cutoff", "syllabus",
  "भर्ती", "रिक्ति", "विज्ञप्ति", "अधिसूचना", "प्रवेश पत्र", "एडमिट कार्ड",
  "परिणाम", "रिजल्ट", "उत्तर कुंजी", "परीक्षा तिथि", "आवेदन",
];
const FILE_HINTS = /\.(pdf|docx?)(?:$|[?#])/i;
type Kind = "job" | "result" | "admit_card" | "answer_key" | "syllabus" | "notice";

function classify(value: string): Kind {
  const text = value.toLowerCase();
  if (/admit.?card|hall.?ticket|प्रवेश पत्र|एडमिट कार्ड/.test(text)) return "admit_card";
  if (/answer.?key|उत्तर कुंजी/.test(text)) return "answer_key";
  if (/result|merit.?list|cut.?off|cutoff|परिणाम|रिजल्ट/.test(text)) return "result";
  if (/syllabus|पाठ्यक्रम/.test(text)) return "syllabus";
  if (/recruitment|vacancy|apply.?online|application.?form|भर्ती|रिक्ति|आवेदन/.test(text)) return "job";
  return "notice";
}
function cleanText(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim().slice(0, 400);
}

async function fetchWithRetry(
  url: string,
  init: Omit<RequestInit, "signal">,
  timeoutMs = 12_000,
  attempts = 2,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
      lastError = error;
      const withCause = error instanceof Error ? error as Error & { cause?: unknown; code?: unknown } : null;
      const cause = withCause?.cause && typeof withCause.cause === "object"
        ? withCause.cause as { code?: unknown }
        : null;
      const code = typeof cause?.code === "string" ? cause.code
        : typeof withCause?.code === "string" ? withCause.code : null;
      const retryable = error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError" ||
          ["UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_SOCKET",
            "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENOTFOUND"].includes(code || ""));
      if (!retryable || attempt === attempts) throw error;
      console.warn("[crawler] transient network failure; retrying source", {
        url, attempt, code: code || (error instanceof Error ? error.name : "unknown"),
      });
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw lastError;
}

function describeCrawlerError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown non-Error failure";

  const withCause = error as Error & { cause?: unknown; code?: unknown };
  const cause = withCause.cause && typeof withCause.cause === "object"
    ? withCause.cause as { name?: unknown; message?: unknown; code?: unknown }
    : null;
  const causeCode = typeof cause?.code === "string" ? cause.code
    : typeof withCause.code === "string" ? withCause.code : null;
  const causeName = typeof cause?.name === "string" ? cause.name : null;
  const causeMessage = typeof cause?.message === "string" ? cause.message : null;

  if (error.name === "TimeoutError" || error.name === "AbortError" ||
      causeName === "TimeoutError" || causeName === "AbortError") {
    return `Request timed out or was aborted after 12000ms${causeCode ? ` (code: ${causeCode})` : ""}`;
  }

  const details = [
    `${error.name}: ${error.message}`,
    causeCode ? `cause code: ${causeCode}` : null,
    causeMessage && causeMessage !== error.message ? `cause: ${causeMessage}` : null,
  ].filter(Boolean);
  return details.join(" | ").slice(0, 500);
}
function isApprovedHost(hostname: string, sourceHost: string): boolean {
  const host = hostname.toLowerCase();
  const source = sourceHost.toLowerCase();
  const governmentHost = /\.(gov\.in|nic\.in|gov|ac\.in|edu\.in)$/.test(host) || /^(gov\.in|nic\.in)$/.test(host);
  return host === source || governmentHost;
}
function allowedOfficialUrl(raw: string, sourceUrl: string): string | null {
  try {
    const url = new URL(raw, sourceUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!isApprovedHost(url.hostname, new URL(sourceUrl).hostname)) return null;
    url.hash = "";
    return url.toString();
  } catch { return null; }
}
function extractLinks(html: string, sourceUrl: string) {
  const links: { title: string; url: string }[] = [];
  const anchorPattern = /<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1] || match[2] || match[3] || "";
    const title = cleanText(match[4] || "");
    const url = allowedOfficialUrl(href, sourceUrl);
    if (!url || url === sourceUrl || url.startsWith("mailto:")) continue;
    const combined = (title + " " + url).toLowerCase();
    if (!KEYWORDS.some((keyword) => combined.includes(keyword))) continue;
    if (!title && !FILE_HINTS.test(url)) continue;
    links.push({ title: title || url.split("/").pop() || url, url });
    if (links.length >= 150) break;
  }
  return links;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Crawler server environment is not configured (set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const startedAt = new Date().toISOString();
  let checked = 0;
  let created = 0;
  const errors: { source: string; message: string }[] = [];

  await Promise.all(OFFICIAL_SOURCES.map(async (source) => {
    // Count every attempted source, including DNS/TLS/connection failures before a response exists.
    checked += 1;
    try {
      const response = await fetchWithRetry(source.listingUrl, {
        redirect: "follow",
        headers: { "user-agent": "AdarshResultBot/1.0 (+https://adarshresult.com; official-notice-monitor)", accept: "text/html,application/xhtml+xml" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`);
      const finalUrl = new URL(response.url);
      if (finalUrl.protocol !== "https:" || !isApprovedHost(finalUrl.hostname, new URL(source.listingUrl).hostname)) {
        throw new Error("Redirected outside the approved official domain allowlist");
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Empty response body");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_HTML_BYTES) {
          await reader.cancel();
          throw new Error(`Listing page exceeded the ${MAX_HTML_BYTES / 1_000_000} MB safety limit`);
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const html = new TextDecoder().decode(bytes);
      const sourceUpsert = await supabase.from("crawler_sources").upsert({
        name: source.name, listing_url: source.listingUrl, enabled: true,
        last_checked_at: new Date().toISOString(), last_status: "ok", last_error: null,
      }, { onConflict: "listing_url" }).select("id").single();
      if (sourceUpsert.error) throw new Error(sourceUpsert.error.message);
      const extractedLinks = extractLinks(html, source.listingUrl);
      // Some official pages repeat the same notice in multiple navigation sections.
      // Postgres cannot upsert duplicate conflict keys from one input batch.
      const links = [...new Map(extractedLinks.map((link) => [link.url, link])).values()];
      if (links.length) {
        const urls = links.map((link) => link.url);
        const { data: priorRows, error: priorError } = await supabase.from("crawler_discoveries")
          .select("official_url").in("official_url", urls);
        if (priorError) throw new Error(priorError.message);
        const previouslySeen = new Set((priorRows || []).map((row) => row.official_url));
        const seenAt = new Date().toISOString();
        const rows = links.map((link) => ({
          source_id: sourceUpsert.data.id,
          source_name: source.name,
          title: link.title,
          official_url: link.url,
          source_page_url: source.listingUrl,
          content_type: classify(link.title + " " + link.url),
          fingerprint: createHash("sha256").update(link.url).digest("hex"),
          last_seen_at: seenAt,
        }));
        const { error } = await supabase.from("crawler_discoveries").upsert(rows, { onConflict: "official_url" });
        if (error) throw new Error(error.message);
        created += links.filter((link) => !previouslySeen.has(link.url)).length;
      }
    } catch (error) {
      const message = describeCrawlerError(error);
      console.error("[crawler] source failed", { source: source.name, error: message });
      errors.push({ source: source.name, message });
      // Keep a source health record even if the page failed.
      await supabase.from("crawler_sources").upsert({
        name: source.name, listing_url: source.listingUrl, enabled: true,
        last_checked_at: new Date().toISOString(), last_status: "error", last_error: message.slice(0, 500),
      }, { onConflict: "listing_url" });
    }
  }));

  const finishedAt = new Date().toISOString();
  const { error: runError } = await supabase.from("crawler_runs").insert({
    started_at: startedAt, finished_at: finishedAt, sources_checked: checked,
    discoveries_created: created, errors, status: errors.length ? (checked ? "partial" : "failed") : "success",
  });
  if (runError) return NextResponse.json({ checked, created, errors, logError: runError.message }, { status: 500 });
  return NextResponse.json({ ok: errors.length === 0, checked, created, errors, startedAt, finishedAt });
}
