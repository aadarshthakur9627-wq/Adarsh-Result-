import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { convertDiscoveryToDraft, dismissDiscovery } from "./actions";
import AdminLogout from "../logout";
import SubmitButton from "../submit-button";

export const metadata = { title: "Official Website Crawler | Adarsh Result" };

type Discovery = {
  id: string; title: string; official_url: string; source_page_url: string;
  source_name: string; content_type: string; first_seen_at: string; last_seen_at: string;
};
type Source = {
  id: string; name: string; listing_url: string; last_checked_at: string | null;
  last_status: string; last_error: string | null;
};
type Run = {
  id: string; started_at: string; sources_checked: number;
  discoveries_created: number; status: string; errors: unknown;
};

export default async function CrawlerDashboard({ searchParams }: {
  searchParams: Promise<{ converted?: string; dismissed?: string; error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return <main className="container admin-dashboard"><section className="admin-box"><h1>Access not enabled</h1><p>Your account is not authorised to review crawler discoveries.</p><AdminLogout /></section></main>;
  }

  const [{ data: discoveries, error: discoveryError }, { data: sources, error: sourceError }, { data: runs }, params] = await Promise.all([
    supabase.from("crawler_discoveries").select("id,title,official_url,source_page_url,source_name,content_type,first_seen_at,last_seen_at").eq("status", "pending").order("first_seen_at", { ascending: false }).limit(100),
    supabase.from("crawler_sources").select("id,name,listing_url,last_checked_at,last_status,last_error").order("name"),
    supabase.from("crawler_runs").select("id,started_at,sources_checked,discoveries_created,status,errors").order("started_at", { ascending: false }).limit(5),
    searchParams,
  ]);

  return <main className="container admin-dashboard">
    <div className="admin-dashboard-head">
      <div><div className="section-kicker">AUTOMATION · OFFICIAL SOURCES</div><h1>Website crawler</h1><p>Signed in as {user.email} · discoveries are never published automatically.</p></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><Link className="admin-logout" href="/admin">Content dashboard</Link><AdminLogout /></div>
    </div>
    {params.converted && <div className="admin-status">Discovery converted to a draft. Verify all facts before publishing.</div>}
    {params.dismissed && <div className="admin-status">Discovery dismissed.</div>}
    {params.error === "not_found" && <div className="admin-error" role="alert">This discovery was already reviewed or no longer exists.</div>}

    <section className="admin-box" style={{marginBottom:16}}>
      <h2>Pending official links ({discoveries?.length ?? 0})</h2>
      <p>The crawler identifies candidate links from configured government pages. It does not certify that a vacancy is genuine or extract verified dates yet.</p>
      {discoveryError ? <p className="admin-error">Crawler tables are not ready. Apply <code>supabase/migrations/20261014_official_crawler.sql</code> to the Adarsh Result Supabase project first.</p> : null}
      {!discoveryError && !discoveries?.length ? <div className="admin-empty">No pending links yet. Once the daily scheduled crawler runs successfully, detected notices will appear here.</div> : null}
      <div className="admin-post-list">
        {(discoveries as Discovery[] | null)?.map((item) => <article className="admin-post" key={item.id}>
          <div className="admin-post-top"><span className="admin-badge">{item.content_type.replace("_", " ")}</span><span className="admin-badge">Pending review</span></div>
          <h3>{item.title}</h3>
          <p>{item.source_name} · First seen {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.first_seen_at))}</p>
          <p style={{marginTop:8,overflowWrap:"anywhere"}}><a href={item.official_url} target="_blank" rel="noopener noreferrer">Open official link ↗</a></p>
          <p style={{marginTop:5}}><a href={item.source_page_url} target="_blank" rel="noopener noreferrer">Open source listing page ↗</a></p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
            <form action={convertDiscoveryToDraft}><input type="hidden" name="id" value={item.id}/><SubmitButton pendingLabel="Creating draft…">Convert to draft</SubmitButton></form>
            <form action={dismissDiscovery}><input type="hidden" name="id" value={item.id}/><SubmitButton pendingLabel="Dismissing…">Dismiss</SubmitButton></form>
          </div>
        </article>)}
      </div>
    </section>

    <div className="admin-grid">
      <section className="admin-box">
        <h2>Official source health</h2><p>Only the configured government sources are scanned.</p>
        {sourceError ? <p className="admin-error">Apply the crawler database migration to load source health.</p> : null}
        <div className="admin-post-list">{(sources as Source[] | null)?.map((source) => <article className="admin-post" key={source.id}>
          <div className="admin-post-top"><strong>{source.name}</strong><span className="admin-badge">{source.last_status}</span></div>
          <p><a href={source.listing_url} target="_blank" rel="noopener noreferrer">Official listing page ↗</a></p>
          <p style={{marginTop:5}}>Last checked: {source.last_checked_at ? new Intl.DateTimeFormat("en-IN", { dateStyle:"medium", timeStyle:"short" }).format(new Date(source.last_checked_at)) : "Not checked yet"}</p>
          {source.last_error && <p style={{marginTop:5,color:"#a51d3d"}}>{source.last_error}</p>}
        </article>)}</div>
      </section>
      <section className="admin-box">
        <h2>Recent crawler runs</h2><p>Monitoring history and errors.</p>
        {!runs?.length ? <div className="admin-empty">No runs logged yet. Vercel Cron needs to be deployed and configured.</div> : <div className="admin-post-list">{(runs as Run[]).map((run) => <article className="admin-post" key={run.id}>
          <div className="admin-post-top"><span className="admin-badge">{run.status}</span><span className="admin-badge">{run.sources_checked} sources</span></div>
          <p>{new Intl.DateTimeFormat("en-IN", { dateStyle:"medium", timeStyle:"short" }).format(new Date(run.started_at))}</p>
          <p style={{marginTop:5}}>New links saved: {run.discoveries_created}</p>
          {Array.isArray(run.errors) && run.errors.length > 0 && <details style={{marginTop:8}}><summary>View errors ({run.errors.length})</summary><pre style={{whiteSpace:"pre-wrap",fontSize:11}}>{JSON.stringify(run.errors, null, 2)}</pre></details>}
        </article>)}</div>}
      </section>
    </div>
    <p className="admin-footnote">Scheduled frequency: hourly. Add <code>CRON_SECRET</code> and server-only <code>SUPABASE_SECRET_KEY</code> (or legacy <code>SUPABASE_SERVICE_ROLE_KEY</code>) to Vercel environment variables before enabling production crawling.</p>
  </main>;
}
