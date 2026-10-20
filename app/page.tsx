import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenCheck, CalendarDays, CheckCircle2, ChevronRight, Clock3, FileCheck2, GraduationCap, Search, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type Post = { id:string; slug:string; title:string; excerpt:string|null; content_type:string; organization:string|null; state_name:string|null; application_end:string|null; published_at:string|null };
const sections = [
 {title:"Latest Jobs",subtitle:"Vacancies & applications",href:"/latest-jobs",className:"jobs",icon:GraduationCap,count:"01"},
 {title:"Results",subtitle:"Results & merit lists",href:"/results",className:"results",icon:FileCheck2,count:"02"},
 {title:"Admit Cards",subtitle:"Hall tickets & exam dates",href:"/admit-cards",className:"admit",icon:CalendarDays,count:"03"},
 {title:"Answer Keys",subtitle:"Keys & objections",href:"/answer-keys",className:"answer",icon:BookOpenCheck,count:"04"}
];
const groups = [
 {title:"Popular categories",items:[["UP Government Jobs","/state-jobs?state=Uttar%20Pradesh"],["SSC Recruitment","/latest-jobs?category=ssc"],["Railway Recruitment","/latest-jobs?category=railway"],["Police Recruitment","/latest-jobs?category=police"],["Banking Jobs","/latest-jobs?category=banking"],["Teaching Jobs","/latest-jobs?category=teaching"]]},
 {title:"Exam updates",items:[["Latest Exam Results","/results"],["UP Board Results","/results?category=up-board"],["SSC Results","/results?category=ssc"],["Police Exam Results","/results?category=police"],["Latest Answer Keys","/answer-keys"],["Merit Lists","/results"]]},
 {title:"Prepare smart",items:[["Upcoming Admit Cards","/admit-cards"],["Exam Calendar","/exam-calendar"],["Latest Syllabus","/syllabus"],["Exam Pattern","/syllabus"],["Previous Year Papers","/previous-papers"],["Preparation Resources","/study-material"]]}
];
async function getPosts():Promise<Post[]> {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) return [];
 try { const supabase=createClient(url,key); const {data}=await supabase.from("posts").select("id,slug,title,excerpt,content_type,organization,state_name,application_end,published_at").eq("status","published").not("published_at","is",null).lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).limit(12); return (data??[]) as Post[]; } catch { return []; }
}
const prettyDate=(value:string|null)=>value?new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value)):"";
export default async function HomePage(){
 const posts=await getPosts();
 const jobs=posts.filter(p=>p.content_type==="job");
 const results=posts.filter(p=>p.content_type==="result");
 const admits=posts.filter(p=>p.content_type==="admit_card");
 const answers=posts.filter(p=>p.content_type==="answer_key");
 const latest=posts.slice(0,8);
 const admissions=posts.filter(p=>p.content_type==="admission");
 const resources = [
  {title:"Latest Jobs",href:"/latest-jobs",items:jobs,kind:"job",fallback:[["UP Government Jobs","/state-jobs?state=Uttar%20Pradesh"],["SSC Recruitment","/latest-jobs?category=ssc"],["Railway Recruitment","/latest-jobs?category=railway"],["Police Recruitment","/latest-jobs?category=police"],["Banking & Insurance Jobs","/latest-jobs?category=banking"],["Teaching Jobs","/latest-jobs?category=teaching"],["All India Government Jobs","/latest-jobs"]]},
  {title:"Results",href:"/results",items:results,kind:"result",fallback:[["Latest Exam Results","/results"],["UP Board Result","/results?category=up-board"],["SSC Exam Results","/results?category=ssc"],["Police Exam Results","/results?category=police"],["University Results","/results?category=university"],["Merit List & Cut Off","/results"],["All Results","/results"]]},
  {title:"Admit Cards",href:"/admit-cards",items:admits,kind:"admit_card",fallback:[["Latest Admit Cards","/admit-cards"],["UP Police Admit Card","/admit-cards?category=police"],["SSC Admit Card","/admit-cards?category=ssc"],["Railway Admit Card","/admit-cards?category=railway"],["UPPSC / UPSSSC Admit Card","/admit-cards?category=uppsc"],["Entrance Exam Admit Cards","/admit-cards"],["All Admit Cards","/admit-cards"]]},
  {title:"Answer Key",href:"/answer-keys",items:answers,kind:"answer_key",fallback:[["Latest Answer Keys","/answer-keys"],["SSC Answer Key","/answer-keys?category=ssc"],["UP Police Answer Key","/answer-keys?category=police"],["Railway Answer Key","/answer-keys?category=railway"],["Question Paper & Response Sheet","/answer-keys"],["Objection Notice","/answer-keys"],["All Answer Keys","/answer-keys"]]},
  {title:"Admissions",href:"/admissions",items:admissions,kind:"admission",fallback:[["Latest Admissions","/admissions"],["University Admissions","/admissions?category=university"],["ITI / Polytechnic","/admissions?category=iti"],["CUET Admissions","/admissions?category=cuet"],["Entrance Exam Forms","/admissions"],["Scholarship Updates","/scholarships"],["All Admission Forms","/admissions"]]},
  {title:"Syllabus",href:"/syllabus",items:[],kind:"syllabus",fallback:[["SSC Syllabus","/syllabus?exam=ssc"],["UP Police Syllabus","/syllabus?exam=up-police"],["UPPSC Syllabus","/syllabus?exam=uppsc"],["UPSSSC PET Syllabus","/syllabus?exam=upsssc-pet"],["Railway Exam Syllabus","/syllabus?exam=railway"],["Exam Pattern & Selection Process","/syllabus"],["All Syllabus","/syllabus"]]}
 ];
 return <div className="site-shell classic-portal">
  <div className="announcement"><div className="container announcement-inner"><span><Sparkles size={14}/> Adarsh Result — Sarkari Jobs, Results, Admit Cards & More</span><span className="announcement-right"><ShieldCheck size={14}/> Verify details on official websites</span></div></div>
  <header className="site-header"><div className="container brand-row"><Link href="/" className="brand-mark" aria-label="Adarsh Result home"><span className="brand-icon">AR<span>.</span></span><span><span className="brand-title">ADARSH RESULT</span><span className="brand-subtitle">WWW.ADARSHRESULT.COM · GOVERNMENT EXAM PORTAL</span></span></Link></div></header>
  <nav className="navbar" aria-label="Main navigation"><div className="container nav-inner">{[["Home","/"],["Latest Jobs","/latest-jobs"],["Results","/results"],["Admit Card","/admit-cards"],["Answer Key","/answer-keys"],["Syllabus","/syllabus"],["Admissions","/admissions"],["Search","/search"]].map(([t,h])=><Link key={h} href={h}>{t}</Link>)}</div></nav>
  <main className="container classic-main">
   <div className="classic-ticker"><strong>IMPORTANT UPDATES</strong><div className="ticker-window"><div className="ticker-track">{(latest.length?latest.map(p=>p.title):["Latest Government Jobs","Latest Exam Results","Admit Cards","Answer Keys","Syllabus & Admissions"]).concat(latest.length?latest.map(p=>p.title):["Latest Government Jobs","Latest Exam Results","Admit Cards","Answer Keys","Syllabus & Admissions"]).map((title,i)=><span key={title+"-"+i}>◆ {title}</span>)}</div></div></div>
   <section className="classic-intro"><h1>Welcome to <span>Adarsh Result</span></h1><p>Latest Government Jobs, Online Forms, Results, Admit Cards, Answer Keys, Syllabus and Admission Updates</p><form className="classic-search" action="/search"><Search size={19}/><label className="sr-only" htmlFor="portal-q">Search exam updates</label><input id="portal-q" name="q" type="search" placeholder="Search jobs, results, admit cards, exams..." /><button type="submit">Search</button></form></section>
   <section className="classic-shortcuts" aria-label="Main categories">{[{label:"Latest Jobs",href:"/latest-jobs",tone:"red"},{label:"Latest Results",href:"/results",tone:"green"},{label:"Admit Cards",href:"/admit-cards",tone:"blue"},{label:"Admissions",href:"/admissions",tone:"orange"},{label:"Syllabus",href:"/syllabus",tone:"purple"},{label:"Answer Key",href:"/answer-keys",tone:"teal"}].map(item=><Link href={item.href} className={"classic-shortcut "+item.tone} key={item.label}>{item.label}<ArrowUpRight size={15}/></Link>)}</section>
   <section className="classic-latest">
    <div className="classic-section-title"><span>Latest Updates</span><Link href="/latest-jobs">View all updates <ArrowRight size={14}/></Link></div>
    {latest.length?<div className="classic-update-list">{latest.map(p=><article key={p.id}><span className={"classic-dot dot-"+p.content_type.replace("_","-")}></span><Link href={"/notice/"+p.slug}>{p.title}</Link>{p.published_at&&<time>{prettyDate(p.published_at)}</time>}</article>)}</div>:<div className="classic-no-updates">New notices will appear here after they are published. Please verify urgent updates with the official recruitment board.</div>}
   </section>
   <section className="classic-directory" aria-label="Government exam information categories">{resources.map((group,i)=><section className={"classic-list-panel panel-tone-"+i} key={group.title}>
    <h2><span>{group.title}</span><Link href={group.href}>View All <ArrowRight size={13}/></Link></h2>
    <ul>{group.items.length?group.items.slice(0,7).map(p=><li key={p.id}><Link href={"/notice/"+p.slug}>{p.title}</Link>{p.application_end&&<small>Last Date: {prettyDate(p.application_end)}</small>}</li>):group.fallback.map(([label,href])=><li key={label}><Link href={href}>{label}</Link></li>)}</ul>
   </section>)}</section>
   <section className="classic-bottom-links"><h2>Important Links</h2><div>{[["Exam Calendar","/exam-calendar"],["State-wise Jobs","/state-jobs"],["Previous Year Papers","/previous-papers"],["Study Material","/study-material"],["Scholarships","/scholarships"],["Contact Us","/contact"]].map(([label,href])=><Link href={href} key={label}>{label}<ChevronRight size={14}/></Link>)}</div></section>
   <p className="classic-disclaimer"><ShieldCheck size={15}/> Adarsh Result is an independent information portal and is not a government website. Always verify eligibility, fees, deadlines and application links through the official notification.</p>
  </main>
  <footer className="footer"><div className="container footer-grid"><div className="footer-brand"><Link href="/" className="brand-mark"><span className="brand-icon">AR<span>.</span></span><span><span className="brand-title">ADARSH RESULT</span><span className="brand-subtitle">GOVERNMENT EXAM PORTAL</span></span></Link><p>Government jobs, results and exam information in one place.</p></div><div><h3>Quick Links</h3><Link href="/latest-jobs">Latest Jobs</Link><Link href="/results">Results</Link><Link href="/admit-cards">Admit Cards</Link><Link href="/answer-keys">Answer Keys</Link></div><div><h3>Information</h3><Link href="/about">About Us</Link><Link href="/contact">Contact</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/disclaimer">Disclaimer</Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Adarsh Result</span><span>Independent information portal · Verify official notices before applying</span></div></footer>
 </div>;
}
