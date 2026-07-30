import { Bell, BookOpen, Calculator, Check, ChevronRight, CircleHelp, Home as HomeIcon, Map, Search, School, UserRound } from "lucide-react";
import { ReactNode } from "react";

export const ink = "#26333B";
export const plum = "#6F4C68";
export const coral = "#C86B58";

export function Shell({ active, children }: { active: string; children: ReactNode }) {
  const tabs = [
    ["Home", HomeIcon], ["Schools", School], ["Roadmap", Map], ["Alerts", Bell], ["Profile", UserRound],
  ] as const;
  return <main className="min-h-screen w-full bg-[#F7F4EF] text-[#26333B] font-['Nunito']" style={{ fontFamily: "'Nunito', ui-sans-serif, sans-serif" }}>
    <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#F7F4EF] pb-[90px]">
      <div className="h-7 bg-[#F1EAE2]" />
      {children}
      <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto flex h-[78px] max-w-[430px] items-center justify-around border-t border-[#E7DED4] bg-[#FBF9F5]/95 px-2 backdrop-blur">
        {tabs.map(([label, Icon]) => <button key={label} onClick={() => {}} className={`flex w-16 flex-col items-center gap-1 text-[10px] font-bold tracking-[.02em] transition-transform active:scale-95 ${active === label ? "text-[#6F4C68]" : "text-[#9A9994]"}`}>
          <span className={`rounded-2xl p-2 ${active === label ? "bg-[#EDE2EB]" : ""}`}><Icon size={19} strokeWidth={active === label ? 2.4 : 1.8} /></span><span>{label}</span>
        </button>)}
      </nav>
    </div>
  </main>;
}
export function SectionLabel({ children }: { children: ReactNode }) { return <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.15em] text-[#9A817D]">{children}</p>; }
export function ArrowButton({ children }: { children: ReactNode }) { return <button onClick={() => {}} className="flex w-full items-center justify-between text-left text-[13px] font-extrabold text-[#6F4C68]"><span>{children}</span><ChevronRight size={17} /></button>; }
export function CheckDot() { return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DDE8D7] text-[#547055]"><Check size={14} strokeWidth={3} /></span>; }
export { Bell, BookOpen, Calculator, CircleHelp, Search };