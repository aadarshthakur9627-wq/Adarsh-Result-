"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deletePost(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/admin?error=delete_forbidden");
  }

  const id = String(formData.get("id") || "");
  const confirmation = String(formData.get("confirm_delete") || "");
  if (!id || confirmation !== "DELETE") {
    redirect("/admin?error=delete_confirmation");
  }

  const { data: post } = await supabase
    .from("posts").select("slug").eq("id", id).maybeSingle();
  if (!post) redirect("/admin?error=notice_missing");

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) redirect("/admin?error=delete_failed");

  revalidatePath("/");
  revalidatePath("/notice/" + post.slug);
  for (const path of ["/latest-jobs", "/results", "/admit-cards", "/answer-keys", "/syllabus"]) {
    revalidatePath(path);
  }
  redirect("/admin?deleted=1");
}
