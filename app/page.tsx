import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, FileCheck2, GraduationCap, Search, ShieldCheck } from "lucide-react";
const sections = [
 {title:"Latest Jobs",subtitle:"New vacancies & applications",href:"/latest-jobs",className:"jobs",icon:GraduationCap},
 {title:"Results",subtitle:"Exam results & merit lists",href:"/results",className:"results",icon:FileCheck2},
 {title:"Admit Cards",subtitle:"Hall tickets & exam dates",href:"/admit-cards",className:"admit",icon:CalendarDays},
 {title:"Answer Keys",subtitle:"Answer keys & objections",href:"/answer-keys",className:"answer",icon:BookOpenCheck}
];
const groups = [
 {title:"Latest Government Jobs",items:["UP Government Jobs","SSC Recruitment","Railway Recruitment","Police Recruitment","Banking Jobs","Teaching Jobs"]},
 {title:"Results & Answer Keys",items:["Latest Exam Results","UP Board Results","SSC Results","Police Exam Results","Latest Answer Keys","Merit Lists"]},
 {title:"Admit Cards & Syllabus",items:["Upcoming Admit Cards","Exam Calendar","Latest Syllabus","Exam Pattern","Previous Year Papers","Preparation Resources"]}
];
export default function HomePage(){
 return <>
  <header className="site-header"><div className="container topline">भारत के विद्यार्थियों के लिए • Verified updates • Official links</div>
   <div className="container brand-row"><Link href="/" className="brand-mark"><span className="brand-icon">AR</span><span><span className="brand-title block">ADARSH RESULT</span><span className="brand-subtitle block">JOBS • RESULTS • EXAM UPDATES</span></span></Link><div className="header-note">Sahi jaankari. Official links. Exam ki taiyari mein ek kadam aage.</div></div>
  </header>
  <nav className="navbar" aria-label="Main navigation"><div className="container nav-inner">{[["Home","/"],["Latest Jobs","/latest-jobs"],["Results","/results"],["Admit Cards","/admit-cards"],["Answer Keys","/answer-keys"],["Syllabus","/syllabus"],["State Jobs","/state-jobs"],["Contact","/contact"]].map(([t,h])=><Link key={h} href={h}>{t}</Link>)}</div></nav>
  <main className="container">
   <section className="search-panel"><h1 className="search-title">Find your next exam update</h1><form className="search-row" action="/search"><label className="sr-only" htmlFor="q">Search jobs, results, exams</label><input id="q" name="q" type="search" placeholder="Search jobs, results, admit cards, exams..."/><button type="submit" aria-label="Search"><Search size={18}/></button></form></section>
   <section className="quick-grid" aria-label="Quick categories">{sections.map(({title,subtitle,href,className,icon:Icon})=><Link className={`quick-card ${className}`} href={href} key={title}><span className="flex items-center gap-2"><Icon size={17}/>{subtitle}</span><strong className="flex items-center justify-between">{title}<ArrowRight size={17}/></strong></Link>)}</section>
   <section className="content-grid">{groups.map((g,i)=><section className={i===1?"panel main-panel":"panel"} key={g.title}><h2 className="panel-heading">{g.title}</h2><div className="panel-body"><ul className="link-list">{g.items.map(item=><li key={item}><Link href="/latest-jobs">{item} <ArrowRight size={12} className="inline"/></Link></li>)}</ul>{i===1&&<div className="notice"><strong>Important:</strong> This is the initial layout. Live notices will be added after connecting the secure admin and Supabase database. Verify important information on the official recruiting authority website.</div>}</div></section>)}
    <section className="panel"><h2 className="panel-heading">Our Promise</h2><div className="panel-body"><ul className="link-list"><li><ShieldCheck size={17} className="inline"/> Official source links wherever available</li><li><Search size={17} className="inline"/> Easy search and mobile-friendly pages</li><li><BookOpenCheck size={17} className="inline"/> Clear dates, eligibility and exam details</li></ul></div></section>
   </section>
  </main>
  <footer className="footer"><div className="container footer-grid"><div><h3>ADARSH RESULT</h3><p>Government jobs, exam results, admit cards, answer keys and syllabus updates. Check official notifications before applying.</p></div><div><h3>Explore</h3><p><Link href="/latest-jobs">Latest Jobs</Link><br/><Link href="/results">Results</Link><br/><Link href="/admit-cards">Admit Cards</Link></p></div><div><h3>Information</h3><p><Link href="/about">About Us</Link><br/><Link href="/contact">Contact</Link><br/><Link href="/privacy-policy">Privacy Policy</Link><br/><Link href="/disclaimer">Disclaimer</Link></p></div></div><div className="container" style={{marginTop:24,fontSize:12,color:"#9ca3af"}}>© {new Date().getFullYear()} Adarsh Result. All rights reserved.</div></footer>
 </>;
}