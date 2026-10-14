"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function authorised() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) throw new Error("Not authorised");
  return { supabase, user };
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "official-notice";
}

export async function convertDiscoveryToDraft(formData: FormData) {
  const { supabase, user } = await authorised();
  const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid discovery ID");

  const { data: discovery, error: readError } = await supabase
    .from("crawler_discoveries")
    .select("id,title,official_url,source_page_url,source_name,content_type,status")
    .eq("id", id).eq("status", "pending").maybeSingle();
  if (readError || !discovery) redirect("/admin/crawler?error=not_found");

  const base = slugify(discovery.title);
  let slug = base;
  const { data: existing } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${base.slice(0, 78)}-${id.slice(0, 8)}`;

  const excerpt = `Update detected on ${discovery.source_name}. Verify all dates and eligibility in the official notice before publishing.`;
  const content = [
    `## Official source detected`,
    `- Authority: ${discovery.source_name}`,
    `- Official notice: ${discovery.official_url}`,
    `- Source listing page: ${discovery.source_page_url}`,
    "",
    "## Before publishing",
    "Verify the notification PDF, important dates, eligibility, vacancies, fees and application link from the official source. Replace this checklist with confirmed details.",
  ].join("\n");

  const { data: post, error: insertError } = await supabase.from("posts").insert({
    title: discovery.title.slice(0, 180), slug, content_type: discovery.content_type,
    status: "draft", excerpt, content_md: content, official_url: discovery.official_url,
    seo_title: discovery.title.slice(0, 180), seo_description: excerpt,
    created_by: user.id, updated_by: user.id,
  }).select("id").single();
  if (insertError || !post) throw new Error(insertError?.message || "Could not create draft");

  const { error: updateError } = await supabase.from("crawler_discoveries").update({
    status: "converted", post_id: post.id, reviewed_at: new Date().toISOString(), reviewed_by: user.id,
  }).eq("id", id).eq("status", "pending");
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/admin");
  revalidatePath("/admin/crawler");
  revalidatePath("/");
  redirect("/admin/crawler?converted=1");
}

export async function dismissDiscovery(formData: FormData) {
  const { supabase, user } = await authorised();
  const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid discovery ID");
  const { error } = await supabase.from("crawler_discoveries").update({
    status: "dismissed", reviewed_at: new Date().toISOString(), reviewed_by: user.id,
  }).eq("id", id).eq("status", "pending");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/crawler");
  redirect("/admin/crawler?dismissed=1");
}
