"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const allowedTypes=["job","result","admit_card","answer_key","syllabus","notice"];
async function authorised(){const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/admin/login");const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();if(!profile||!["admin","editor"].includes(profile.role))throw new Error("Your account is not authorised to manage content.");return {supabase,user};}
export async function createPost(formData:FormData){const {supabase,user}=await authorised();const title=String(formData.get("title")||"").trim();const slug=String(formData.get("slug")||"").trim().toLowerCase();const type=String(formData.get("content_type")||"");const status=String(formData.get("status")||"draft");const excerpt=String(formData.get("excerpt")||"").trim();const content=String(formData.get("content_md")||"").trim();const official=String(formData.get("official_url")||"").trim();const pdf=String(formData.get("notification_pdf_url")||"").trim();if(!title||!slug||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!allowedTypes.includes(type)||!["draft","review","published"].includes(status))throw new Error("Please enter a valid title, slug, type and status.");for(const u of [official,pdf])if(u&&!/^https:\/\//i.test(u))throw new Error("Official and PDF links must use HTTPS.");const publishedAt=status==="published"?new Date().toISOString():null;const {error}=await supabase.from("posts").insert({title,slug,content_type:type,status,excerpt,content_md:content,official_url:official||null,notification_pdf_url:pdf||null,organization:String(formData.get("organization")||"").trim()||null,state_name:String(formData.get("state_name")||"").trim()||null,qualification:String(formData.get("qualification")||"").trim()||null,application_end:String(formData.get("application_end")||"")||null,seo_title:String(formData.get("seo_title")||"").trim()||title,seo_description:String(formData.get("seo_description")||"").trim()||excerpt||title,published_at:publishedAt,created_by:user.id,updated_by:user.id});if(error){if(error.code==="23505")redirect("/admin?error=slug_exists");throw new Error(error.message);}revalidatePath("/");for(const p of ["/latest-jobs","/results","/admit-cards","/answer-keys","/syllabus"])revalidatePath(p);redirect("/admin?created=1");}

export async function updatePost(formData:FormData){
 const {supabase,user}=await authorised();
 const id=String(formData.get("id")||"");
 const title=String(formData.get("title")||"").trim();
 const slug=String(formData.get("slug")||"").trim().toLowerCase();
 const status=String(formData.get("status")||"draft");
 const excerpt=String(formData.get("excerpt")||"").trim();
 const content=String(formData.get("content_md")||"").trim();
 const official=String(formData.get("official_url")||"").trim();
 const pdf=String(formData.get("notification_pdf_url")||"").trim();
 if(!id||!title||!slug||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!["draft","review","published","archived"].includes(status))throw new Error("Please enter a valid title, slug and status.");
 for(const u of [official,pdf])if(u&&!/^https:\/\//i.test(u))throw new Error("Official and PDF links must use HTTPS.");
 const {data:existing,error:readError}=await supabase.from("posts").select("published_at").eq("id",id).maybeSingle();
 if(readError||!existing)throw new Error("Notice not found or not authorised.");
 const publishedAt=status==="published"?(existing.published_at||new Date().toISOString()):null;
 const vacanciesRaw=String(formData.get("vacancies")||"").trim();const vacancies=vacanciesRaw===""?null:Number(vacanciesRaw);if(vacancies!==null&&(!Number.isInteger(vacancies)||vacancies<0))throw new Error("Vacancies must be a non-negative whole number.");const seoTitle=String(formData.get("seo_title")||"").trim();const seoDescription=String(formData.get("seo_description")||"").trim();const {error}=await supabase.from("posts").update({title,slug,status,excerpt,content_md:content,official_url:official||null,notification_pdf_url:pdf||null,organization:String(formData.get("organization")||"").trim()||null,state_name:String(formData.get("state_name")||"").trim()||null,qualification:String(formData.get("qualification")||"").trim()||null,vacancies,application_start:String(formData.get("application_start")||"")||null,application_end:String(formData.get("application_end")||"")||null,exam_date:String(formData.get("exam_date")||"")||null,result_date:String(formData.get("result_date")||"")||null,seo_title:seoTitle||title,seo_description:seoDescription||excerpt||title,published_at:publishedAt,updated_by:user.id}).eq("id",id);
 if(error)throw new Error(error.message);
 revalidatePath("/");revalidatePath("/notice/"+slug);for(const p of ["/latest-jobs","/results","/admit-cards","/answer-keys","/syllabus"])revalidatePath(p);
 redirect("/admin?updated=1");
}
