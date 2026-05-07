// src/components/exam/QuestionCard.jsx
import { OPT_LABELS } from "./examUtils";

/**
 * props:
 *   question  – question object { type, text, image, options, marks, negativeMark }
 *   qIndex    – 0-based index within the section
 *   sectionId – section._id  (used to build the answer key)
 *   answer    – current answer string
 *   onAnswer  – (key, value) => void
 */
export default function QuestionCard({ question, qIndex, sectionId, answer, onAnswer }) {
  const key = `${sectionId}_${qIndex}`;

  return (
    <div
      data-qkey={key}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition-colors"
    >
      {/* ── header row ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center mono text-xs font-bold transition-all
            ${answer ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
            {qIndex + 1}
          </span>
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            <span className="px-2.5 py-1 rounded-md mono text-[10px] uppercase tracking-widest bg-zinc-700 text-zinc-200">
              {question.type === "mcq" ? "MCQ" : "Numerical"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5">
            <span className="mono text-[11px] text-zinc-300">{question.marks}</span>
            <span className="mono text-[10px] text-zinc-500">pts</span>
          </div>
          {question.negativeMark > 0 && (
            <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5">
              <span className="mono text-[10px] text-zinc-500">-</span>
              <span className="mono text-[11px] text-rose-400">{question.negativeMark}</span>
              <span className="mono text-[10px] text-zinc-500">neg</span>
            </div>
          )}
        </div>
      </div>

      {/* ── question text ── */}
      <p className="text-sm text-zinc-200 leading-relaxed">{question.text}</p>

      {/* ── question image ── */}
      {question.image && (
        <img
          src={question.image}
          alt="question"
          className="max-h-48 rounded-xl object-contain border border-zinc-800"
        />
      )}

      {/* ── MCQ options ── */}
      {question.type === "mcq" && (
        <div className="space-y-2.5">
          {(question.options ?? []).map((opt, oi) => {
            const optText  = typeof opt === "string" ? opt : (opt.text ?? "");
            const optImage = typeof opt === "string" ? null : (opt.image ?? null);
            const selected = answer === optText;

            return (
              <button
                key={oi}
                onClick={() => onAnswer(key, selected ? "" : optText)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                  ${selected
                    ? "bg-emerald-500/8 border-emerald-500/25 text-zinc-200"
                    : "bg-zinc-800/40 border-zinc-700/40 text-zinc-300 hover:border-zinc-600"}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
                  ${selected ? "bg-emerald-500 border-emerald-500" : "border-zinc-600"}`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={`mono text-[11px] shrink-0 w-4 ${selected ? "text-emerald-400" : "text-zinc-500"}`}>
                  {OPT_LABELS[oi]}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{optText}</span>
                  {optImage && (
                    <img src={optImage} alt="option" className="mt-1.5 h-12 rounded-lg object-contain" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Numerical input ── */}
      {question.type === "numerical" && (
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">Your Answer</label>
          <input
            type="number"
            value={answer ?? ""}
            onChange={e => onAnswer(key, e.target.value)}
            placeholder="0"
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 mono text-sm text-zinc-200
              outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/15
              transition-all placeholder:text-zinc-700"
          />
        </div>
      )}
    </div>
  );
}
