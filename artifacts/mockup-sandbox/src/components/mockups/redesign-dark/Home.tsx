import { useState } from "react";
import { Bell, BookOpen, Calculator, ChevronRight, CircleHelp, GraduationCap, Home as HomeIcon, Map, Search, School, UserRound } from "lucide-react";

const tabs = [
  { label: "Home", icon: HomeIcon },
  { label: "Schools", icon: School },
  { label: "Roadmap", icon: Map },
  { label: "Alerts", icon: Bell },
  { label: "Profile", icon: UserRound },
];

function Nav() {
  return <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800/80 bg-[#08111f]/95 px-3 pb-5 pt-3 backdrop-blur-xl">
    <div className="mx-auto flex max-w-md items-center justify-between">
      {tabs.map(({ label, icon: Icon }) => <button key={label} className={`flex w-[62px] flex-col items-center gap-1.5 text-[10px] font-medium ${label === "Home" ? "text-cyan-300" : "text-slate-500"}`}><Icon size={19} strokeWidth={label === "Home" ? 2.4 : 1.8} /><span>{label}</span>{label === "Home" && <span className="h-1 w-1 rounded-full bg-cyan-300" />}</button>)}
    </div>
  </nav>;
}

export function Home() {
  const [notice, setNotice] = useState("");
  return <main className="min-h-screen w-full overflow-hidden bg-[#08111f] font-['Nunito'] text-slate-100">
    <div className="min-h-screen bg-[radial-gradient(circle_at_90%_0%,rgba(21,105,130,.22),transparent_34%),linear-gradient(180deg,#0a1727_0%,#08111f_45%,#091321_100%)] px-5 pb-28 pt-9">
      <header className="mb-7 flex items-start justify-between">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.22em] text-cyan-300/70">Monday, March 16</p><h1 className="text-[29px] font-bold tracking-[-.04em]">Good morning, Maya<span className="text-cyan-300">.</span></h1><p className="mt-1 text-sm text-slate-400">Your transfer plan is moving beautifully.</p></div>
        <button onClick={() => setNotice("No new alerts")} className="relative mt-1 rounded-2xl border border-slate-700 bg-slate-800/70 p-3 text-slate-300"><Bell size={19}/><i className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300"/></button>
      </header>
      {notice && <button onClick={() => setNotice("")} className="mb-4 w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-left text-xs text-cyan-200">{notice} · tap to dismiss</button>}
      <section className="relative overflow-hidden rounded-[26px] border border-cyan-300/20 bg-[#10253a] p-5 shadow-[0_18px_50px_rgba(0,0,0,.2)]">
        <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full border-[18px] border-cyan-300/10"/><div className="absolute -right-3 -top-7 h-28 w-28 rounded-full border border-cyan-300/20"/>
        <div className="relative"><div className="mb-5 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-400">Transfer path</p><p className="mt-1 text-base font-bold">De Anza College <span className="px-1 text-cyan-300">→</span> UC Berkeley</p></div><GraduationCap className="text-cyan-300" size={25}/></div>
          <div className="mb-2 flex items-end justify-between"><span className="text-sm text-slate-300">Overall progress</span><strong className="text-3xl font-bold tracking-[-.06em] text-cyan-200">68<span className="text-lg">%</span></strong></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full w-[68%] rounded-full bg-gradient-to-r from-cyan-400 to-sky-300"/></div><p className="mt-3 text-xs text-slate-400">You’re on track for Fall 2027 transfer.</p>
        </div>
      </section>
      <section className="mt-5 grid grid-cols-3 gap-2.5">
        {[["42","Units done"],["3.72","GPA"],["18","Units left"]].map(([value,label], i) => <div key={label} className="rounded-2xl border border-slate-800 bg-[#0d1b2c] px-3 py-4"><p className={`text-xl font-bold ${i===1 ? "text-emerald-300" : "text-slate-100"}`}>{value}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p></div>)}
      </section>
      <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold">Upcoming courses</h2><button onClick={() => setNotice("Roadmap opened")} className="flex items-center text-xs font-bold text-cyan-300">View roadmap <ChevronRight size={15}/></button></div>
        <div className="space-y-2.5">{[["MATH 1D","Multivariable Calculus","In Progress","5 units"],["PHYS 4B","Electricity & Magnetism","In Progress","6 units"],["CIS 22C","Data Abstraction","Planned","3 units"]].map(([code,name,status,units]) => <div key={code} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0d1b2c] p-3.5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-xs font-bold text-cyan-200">{code.slice(0,2)}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{code} <span className="font-normal text-slate-400">· {name}</span></p><p className={`mt-1 text-[11px] ${status === "Planned" ? "text-slate-500" : "text-cyan-300"}`}>{status}</p></div><span className="text-xs text-slate-500">{units}</span></div>)}</div>
      </section>
      <section className="mt-7"><h2 className="mb-3 text-base font-bold">Quick actions</h2><div className="grid grid-cols-3 gap-2.5">{[[BookOpen,"Requirements"],[CircleHelp,"Ask advisor"],[Calculator,"GPA calculator"]].map(([Icon,label]) => <button key={String(label)} onClick={() => setNotice(`${label} is ready for you`)} className="flex min-h-[82px] flex-col items-start justify-between rounded-2xl border border-slate-800 bg-[#0d1b2c] p-3 text-left transition-colors hover:border-cyan-300/40"><Icon size={19} className="text-cyan-300"/><span className="text-xs font-bold text-slate-300">{String(label)}</span></button>)}</div></section>
    </div><Nav/>
  </main>;
}