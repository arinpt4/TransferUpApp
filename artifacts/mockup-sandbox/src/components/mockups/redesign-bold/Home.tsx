import { ArrowRight, Bell, BookOpen, Calculator, Check, ChevronRight, CircleHelp, Home as HomeIcon, Map, School, Sparkles, UserRound } from "lucide-react";

const tabs = [
  { label: "Home", icon: HomeIcon, active: true },
  { label: "Schools", icon: School },
  { label: "Roadmap", icon: Map },
  { label: "Alerts", icon: Bell },
  { label: "Profile", icon: UserRound },
];

function TabBar() {
  return <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-[76px] items-center justify-around border-t-2 border-[#171744]/10 bg-[#fffaf0]/95 px-2 backdrop-blur-md">
    {tabs.map(({ label, icon: Icon, active }) => <button key={label} className={`flex w-16 flex-col items-center gap-1 text-[10px] font-black tracking-tight ${active ? "text-[#ff4d67]" : "text-[#77748a]"}`}>
      <span className={`flex h-9 w-11 items-center justify-center rounded-2xl ${active ? "bg-[#ff4d67] text-white shadow-[3px_3px_0_#171744]" : ""}`}><Icon size={19} strokeWidth={2.5} /></span>{label}
    </button>)}
  </nav>;
}

export function Home() {
  return <main className="min-h-screen w-full overflow-hidden bg-[#fffaf0] pb-24 font-['Nunito',sans-serif] text-[#171744]">
    <header className="relative overflow-hidden bg-[#ff4d67] px-6 pb-7 pt-10 text-white">
      <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-[#ffbf3f]/70" />
      <div className="absolute bottom-0 right-24 h-5 w-5 rotate-45 bg-[#a4e85d]" />
      <div className="relative flex items-start justify-between">
        <div><p className="text-sm font-extrabold opacity-80">Tuesday, March 3</p><h1 className="mt-1 text-[31px] font-black leading-none tracking-[-1.5px]">Hey Maya!</h1><p className="mt-2 text-sm font-bold opacity-90">Your transfer story is moving.</p></div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border-2 border-white/50 bg-[#ffbf3f] text-lg font-black text-[#171744]">MS</div>
      </div>
      <div className="relative mt-6 rounded-[25px] bg-[#171744] p-5 shadow-[5px_5px_0_#a42d49]">
        <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[1.5px] text-[#a4e85d]">Your north star</p><p className="mt-2 text-base font-black">De Anza College <ArrowRight className="mx-1 inline text-[#ffbf3f]" size={16} /> UC Berkeley</p></div><Sparkles className="text-[#ffbf3f]" size={24} /></div>
        <div className="mt-5 flex items-end gap-3"><strong className="text-5xl font-black leading-none text-[#ffbf3f]">68%</strong><span className="pb-1 text-xs font-extrabold text-white/70">transfer progress</span></div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[68%] rounded-full bg-[#a4e85d]" /></div>
      </div>
    </header>
    <section className="px-6 pt-6">
      <div className="grid grid-cols-3 gap-3">
        {[["42","units done","bg-[#a4e85d]"],["3.72","GPA","bg-[#ffbf3f]"],["18","units left","bg-[#b7a5ff]"]].map(([value,label,color]) => <div key={label} className={`${color} rounded-[20px] p-3 shadow-[3px_3px_0_#171744]`}><p className="text-[25px] font-black leading-none">{value}</p><p className="mt-2 text-[11px] font-black uppercase tracking-tight">{label}</p></div>)}
      </div>
      <div className="mt-7 flex items-center justify-between"><h2 className="text-xl font-black">Coming up</h2><button className="text-xs font-black text-[#ff4d67]">See roadmap <ChevronRight className="inline" size={15} /></button></div>
      <div className="mt-3 space-y-3">
        {[["MATH 1D","Multivariable Calculus","In Progress","#ff4d67"],["PHYS 4B","Electricity & Magnetism","In Progress","#b7a5ff"],["CIS 22C","Data Abstraction","Planned","#a4e85d"]].map(([code,name,status,color]) => <div key={code} className="flex items-center gap-3 rounded-[19px] border-2 border-[#171744]/10 bg-white p-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black" style={{backgroundColor:color}}>{code.split(" ")[0]}</div><div className="min-w-0 flex-1"><p className="text-sm font-black">{code}</p><p className="truncate text-xs font-bold text-[#77748a]">{name}</p></div><span className="rounded-full bg-[#fff1da] px-2 py-1 text-[10px] font-black">{status}</span></div>)}
      </div>
      <h2 className="mb-3 mt-7 text-xl font-black">Make a move</h2>
      <div className="grid grid-cols-3 gap-3">
        {[["Requirements",BookOpen,"#ff4d67"],["Ask advisor",CircleHelp,"#b7a5ff"],["GPA calc",Calculator,"#a4e85d"]].map(([label,Icon,color]) => <button key={label as string} className="flex min-h-[92px] flex-col items-start justify-between rounded-[20px] border-2 border-[#171744]/10 bg-white p-3 text-left font-black shadow-[2px_2px_0_#171744]/10"><span className="rounded-xl p-2" style={{backgroundColor:color as string}}><Icon size={18}/></span><span className="text-xs">{label as string}</span></button>)}
      </div>
    </section><TabBar />
  </main>;
}