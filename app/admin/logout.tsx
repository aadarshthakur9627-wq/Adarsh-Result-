"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
export default function AdminLogout(){const router=useRouter();async function logout(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(url&&key){const supabase=createClient(url,key);await supabase.auth.signOut();}router.push("/admin/login");router.refresh();}return <button className="admin-logout" onClick={logout}>Sign out</button>}
