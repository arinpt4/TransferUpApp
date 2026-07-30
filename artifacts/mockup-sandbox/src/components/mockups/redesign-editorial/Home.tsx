import { ArrowUpRight, BookOpen, Calculator, CircleHelp, MoreHorizontal } from "lucide-react";
import { ArrowButton, CheckDot, SectionLabel, Shell } from "./_shared";

export function Home() {
  return <Shell active="Home"><header className="px-6 pb-5 pt-7">
    <div className="flex items-start justify-between"><div><p className="text-[12px] font-bold text-[#9A817D]">TUESDAY, FEBRUARY 17, 2026</p><h1 className="mt-2 font-serif text-[32px] leading-none tracking-[-.04em] text-[#26333B]" style={{fontFamily:"Georgia, serif"}}>Good morning, Maya.</h1></div><button onClick={()=>{}} className="rounded-full border border-[#E3D8CF] bg-[#FBF9F5] p-2 text-[#6F4C68]"><MoreHorizontal size={21}/></button></div>
    <p className="mt-4 text-[13px] font-semibold text-[#6C7778]">De Anza College <span className="mx-1 text-[#C86B58]">→</span> UC Berkeley</p>
  </header>
  <section className="mx-5 rounded-[26px] bg-[#6F4C68] p-5 text-[#FCF8F3]">
    <div className="flex items-start justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#DCC8D8]">Your transfer path</p><p className="mt-2 text-[24px] font-black">68% ready</p></div><div className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-[7px] border-[#B99DB5] border-r-[#F0C2A8] text-[17px] font-black">68</div></div>
    <div className="mt-5 h-2 rounded-full bg-[#5B3E57]"><div className="h-2 w-[68%] rounded-full bg-[#F0C2A8]" /></div><p className="mt-3 text-[12px] font-semibold text-[#E9DDE5]">You’re building a strong case, one term at a time.</p>
  </section>
  <section className="grid grid-cols-3 gap-2 px-5 py-6">{[["42","units done"],["3.72","GPA"],["18","units left"]].map(([value,label],i)=><div key={label} className="rounded-2xl border border-[#E7DED4] bg-[#FBF9F5] p-3"><p className={`text-[21px] font-black ${i===1?"text-[#547055]":"text-[#26333B]"}`}>{value}</p><p className="mt-1 text-[10px] font-bold leading-tight text-[#92918B]">{label}</p></div>)}</section>
  <section className="px-5"><SectionLabel>On your schedule</SectionLabel><div className="divide-y divide-[#E9E0D7] rounded-2xl border border-[#E7DED4] bg-[#FBF9F5] px-4">
    {[["MATH 1D","Multivariable Calculus","In Progress","#C86B58"],["PHYS 4B","Electricity & Magnetism","In Progress","#C86B58"],["CIS 22C","Data Abstraction","Planned","#9A817D"]].map(([code,name,status,color])=><div className="flex items-center gap-3 py-3.5" key={code}><div className="h-8 w-1 rounded-full" style={{background:color}}/><div className="min-w-0 flex-1"><p className="text-[13px] font-extrabold">{code} <span className="font-semibold text-[#7F8583]">· {name}</span></p><p className="mt-1 text-[11px] font-bold" style={{color}}>{status}</p></div><ArrowUpRight size={15} className="text-[#B0AAA3]"/></div>)}</div></section>
  <section className="px-5 pb-4 pt-6"><SectionLabel>Keep moving</SectionLabel><div className="grid grid-cols-3 gap-2">{[[BookOpen,"Requirements"],[CircleHelp,"Ask advisor"],[Calculator,"GPA calc"]].map(([Icon,label])=><button onClick={()=>{}} key={label as string} className="flex min-h-[84px] flex-col items-start justify-between rounded-2xl border border-[#E7DED4] bg-[#EDE2EB] p-3 text-left text-[#6F4C68]"><Icon size={19}/><span className="text-[11px] font-extrabold">{label as string}</span></button>)}</div></section>
  </Shell>;
}