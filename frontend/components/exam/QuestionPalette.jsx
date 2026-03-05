// src/components/exam/QuestionPalette.jsx
import { Lock as LockIcon } from "lucide-react";

/**
 * Same strict navigation rules as SectionTabs:
 *   • activeIsUnsubmittedStrict → only questions in the active section are clickable
 *   • lockedSections → those questions are visible but greyed / disabled
 *
 * props:
 *   sections         – array of section objects
 *   activeSectionIdx – current active index
 *   lockedSections   – Set<number>
 *   isStrictSection  – whether current active section is strict+timed
 *   answers          – answers map
 *   onJump           – ({ sectionIdx, qKey }) => void
 */
export default function QuestionPalette({
  sections,
  activeSectionIdx,
  lockedSections,
  isStrictSection,
  answers,
  onJump,
}) {
  const activeIsUnsubmittedStrict = isStrictSection && !lockedSections.has(activeSectionIdx);

  return (
    <aside
      className="w-16 shrink-0 border-l border-zinc-800 bg-zinc-950 flex-col hidden sm:flex overflow-y-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
    >
      <div className="px-2 py-3 border-b border-zinc-800 text-center">
        <span className="mono text-[9px] text-zinc-600 uppercase tracking-widest">Nav</span>
      </div>

      <div className="flex-1 p-2 flex flex-col gap-1.5">
        {sections.map((sec, si) => {
          const isLocked    = lockedSections.has(si);
          const isStrictSec = !!(sec.strictTimer && sec.duration > 0);

          // canClick: not locked AND not blocked by unsubmitted strict (own section always clickable)
          const canClickFromPalette = !isLocked && !activeIsUnsubmittedStrict;

          return (
            <div key={sec._id ?? si}>
              {sections.length > 1 && (
                <div className="flex items-center justify-center gap-0.5 mb-1">
                  {isStrictSec && (
                    <LockIcon
                      size={7}
                      className={isLocked ? "text-zinc-600" : "text-zinc-500"}
                    />
                  )}
                  <p
                    className="mono text-[8px] uppercase tracking-widest truncate"
                    style={{ color: isLocked ? "#52525b" : "#3f3f46" }}
                  >
                    {sec.title.slice(0, 3)}
                  </p>
                </div>
              )}

              {sec.questions.map((_, qi) => {
                const key        = `${sec._id}_${qi}`;
                const isAnswered = !!(answers[key] && answers[key] !== "");
                // always allow clicking own section's questions
                const clickable  = canClickFromPalette || si === activeSectionIdx;

                return (
                  <button
                    key={key}
                    disabled={!clickable}
                    onClick={() => {
                      if (!clickable) return;
                      onJump({ sectionIdx: si, qKey: key });
                    }}
                    className={`w-full h-9 rounded-lg mono text-[10px] border transition-all
                      ${isLocked
                        ? "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50"
                        : !clickable
                          ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60"
                          : isAnswered
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:scale-105"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:scale-105"}`}
                  >
                    {qi + 1}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div className="p-2 border-t border-zinc-800 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-emerald-500/30" />
          <span className="mono text-[8px] text-zinc-600">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-zinc-800 border border-zinc-700" />
          <span className="mono text-[8px] text-zinc-600">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <LockIcon size={8} className="text-zinc-700" />
          <span className="mono text-[8px] text-zinc-600">Locked</span>
        </div>
      </div>
    </aside>
  );
}
