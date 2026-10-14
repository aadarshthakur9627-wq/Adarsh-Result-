import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { OFFICIAL_SOURCES } from "@/lib/crawler/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HTML_BYTES = 2_000_000;
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

  for (const source of OFFICIAL_SOURCES) {
    try {
      const response = await fetch(source.listingUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
        headers: { "user-agent": "AdarshResultBot/1.0 (+https://adarshresult.com; official-notice-monitor)", accept: "text/html,application/xhtml+xml" },
        cache: "no-store",
      });
      checked += 1;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
          throw new Error("Listing page exceeded the 2 MB safety limit");
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
      const links = extractLinks(html, source.listingUrl);
      for (const link of links) {
        const fingerprint = createHash("sha256").update(link.url).digest("hex");
        const { data: prior, error: priorError } = await supabase.from("crawler_discoveries")
          .select("id").eq("official_url", link.url).maybeSingle();
        if (priorError) throw new Error(priorError.message);
        const { error } = await supabase.from("crawler_discoveries").upsert({
          source_id: sourceUpsert.data.id,
          source_name: source.name,
          title: link.title,
          official_url: link.url,
          source_page_url: source.listingUrl,
          content_type: classify(link.title + " " + link.url),
          fingerprint,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: "official_url" });
        if (error) throw new Error(error.message);
        if (!prior) created += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown crawler error";
      errors.push({ source: source.name, message });
      // Keep a source health record even if the page failed.
      await supabase.from("crawler_sources").upsert({
        name: source.name, listing_url: source.listingUrl, enabled: true,
        last_checked_at: new Date().toISOString(), last_status: "error", last_error: message.slice(0, 500),
      }, { onConflict: "listing_url" });
    }
  }

  const finishedAt = new Date().toISOString();
  const { error: runError } = await supabase.from("crawler_runs").insert({
    started_at: startedAt, finished_at: finishedAt, sources_checked: checked,
    discoveries_created: created, errors, status: errors.length ? (checked ? "partial" : "failed") : "success",
  });
  if (runError) return NextResponse.json({ checked, created, errors, logError: runError.message }, { status: 500 });
  return NextResponse.json({ ok: errors.length === 0, checked, created, errors, startedAt, finishedAt });
}
