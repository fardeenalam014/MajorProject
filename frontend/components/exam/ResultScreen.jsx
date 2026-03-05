// src/components/exam/ResultScreen.jsx
import { motion }                  from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import FontLoader from "./FontLoader";

/**
 * props:
 *   result – { percentage|pct, passed, score, totalMarks, timeTaken }
 *   onDone – () => void  (navigate away)
 */
export default function ResultScreen({ result, onDone }) {
  const pct        = result.percentage ?? result.pct ?? 0;
  const passed     = result.passed ?? pct >= 40;
  const scoreColor = pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-rose-400";

  return (
    <div
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-4"
    >
      <FontLoader />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6"
      >
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center
          ${passed
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-rose-500/10    border border-rose-500/20"}`}>
          {passed
            ? <CheckCircle2 size={28} className="text-emerald-400" />
            : <AlertTriangle size={28} className="text-rose-400"   />}
        </div>

        <div>
          <p className="text-2xl font-bold text-zinc-100">
            {passed ? "Passed! 🎉" : "Better luck next time"}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Exam submitted successfully</p>
        </div>

        <p className={`text-6xl font-bold mono ${scoreColor}`}>{pct}%</p>

        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-2.5">
          {[
            { label: "Score",      val: `${result.score} / ${result.totalMarks}` },
            { label: "Time taken", val: result.timeTaken != null
                ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`
                : "—" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-zinc-500">{r.label}</span>
              <span className="mono text-zinc-200">{r.val}</span>
            </div>
          ))}
          <div className="pt-1 flex justify-center">
            <span className={`mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-md border
              ${passed
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-rose-400   bg-rose-500/10    border-rose-500/20"}`}>
              {passed ? "PASS" : "FAIL"}
            </span>
          </div>
        </div>

        <button
          onClick={onDone}
          className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400
            text-sm font-semibold text-white transition-colors"
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
