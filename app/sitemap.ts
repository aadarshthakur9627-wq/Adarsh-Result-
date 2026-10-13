import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://adarshresult.com").replace(/\/$/,"");
 const routes=["","/latest-jobs","/results","/admit-cards","/answer-keys","/syllabus","/state-jobs","/exam-calendar","/previous-papers","/study-material","/about","/contact","/privacy-policy","/disclaimer"];
 const staticRoutes:MetadataRoute.Sitemap=routes.map(route=>({url:`${base}${route}`,lastModified:new Date(),changeFrequency:route===""?"daily":"weekly",priority:route===""?1:0.7}));
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return staticRoutes;
 try {const {data}=await createClient(url,key).from("posts").select("slug,published_at,updated_at").eq("status","published").not("published_at","is",null).lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).limit(5000);
  return [...staticRoutes,...(data??[]).map(p=>({url:`${base}/notice/${p.slug}`,lastModified:new Date(p.updated_at||p.published_at||Date.now()),changeFrequency:"weekly" as const,priority:0.75}))];
 } catch { return staticRoutes; }
}
