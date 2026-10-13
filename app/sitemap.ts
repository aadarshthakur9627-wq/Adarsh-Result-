import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
 const base=process.env.NEXT_PUBLIC_SITE_URL||"https://adarshresult.com";
 const routes=["","/latest-jobs","/results","/admit-cards","/answer-keys","/syllabus","/state-jobs","/about","/contact","/privacy-policy","/disclaimer"];
 return routes.map(route=>({url:`${base}${route}`,lastModified:new Date(),changeFrequency:route===""?"daily":"weekly",priority:route===""?1:0.7}));
}