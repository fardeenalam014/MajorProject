import { Zap } from "lucide-react";

export default function Logo({ size = "md" }) {
  const sizes = {
    sm: { icon: 13, wrap: "w-7 h-7 rounded-lg",  title: "text-xs",  sub: "text-[8px]"  },
    md: { icon: 16, wrap: "w-9 h-9 rounded-xl",  title: "text-sm",  sub: "text-[9px]"  },
    lg: { icon: 22, wrap: "w-12 h-12 rounded-2xl", title: "text-lg", sub: "text-[10px]" },
  };
  const s = sizes[size] ?? sizes.md;

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.wrap} bg-indigo-500 flex items-center justify-center
        shadow-lg shadow-indigo-500/25 shrink-0`}>
        <Zap size={s.icon} className="text-white" />
      </div>
      <div>
        <p className={`font-bold text-zinc-100 leading-none ${s.title}`}>
          AIExamGuard
        </p>
        <p className={`mono text-zinc-500 tracking-widest uppercase mt-0.5 ${s.sub}`}>
          Proctored Exams
        </p>
      </div>
    </div>
  );
}