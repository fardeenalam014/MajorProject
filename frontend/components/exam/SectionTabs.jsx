// src/components/exam/SectionTabs.jsx
import { Lock as LockIcon } from "lucide-react";

/**
 * Strict-section tab rules (from source):
 *   • Every strict section always shows a lock icon
 *   • While the active section is a strict, unsubmitted section
 *     → ALL other tabs are disabled (activeIsUnsubmittedStrict)
 *   • After a strict section is submitted it goes into lockedSections
 *     → that tab stays visible but disabled (greyed, opacity-50)
 *   • Non-locked tabs are freely clickable once strict section is submitted
 *
 * props:
 *   sections         – array of section objects
 *   activeSectionIdx – current active index
 *   lockedSections   – Set<number> of submitted-strict section indexes
 *   isStrictSection  – whether the current active section is strict+timed
 *   answers          – answers map  { `${sec._id}_${qi}`: value }
 *   onSelect         – (sectionIndex: number) => void
 */
export default function SectionTabs({
  sections,
  activeSectionIdx,
  lockedSections,
  isStrictSection,
  answers,
  onSelect,
}) {
  if (sections.length <= 1) return null;

  // Active section is strict and NOT yet submitted → locks every other tab
  const activeIsUnsubmittedStrict = isStrictSection && !lockedSections.has(activeSectionIdx);

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950"
      style={{
        overflowX: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "#3f3f46 transparent",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {sections.map((sec, si) => {
        const secAnswered = sec.questions.filter((_, qi) => answers[`${sec._id}_${qi}`]).length;
        const isActive    = si === activeSectionIdx;
        const isLocked    = lockedSections.has(si);        // submitted strict → permanently off
        const isStrictSec = !!(sec.strictTimer && sec.duration > 0);

        // Tab is clickable: not locked AND not blocked by current unsubmitted strict section
        const isClickable = !isLocked && !activeIsUnsubmittedStrict;

        /* ── colour scheme ── */
        let tabCls;
        if (isActive && isStrictSec && !isLocked) {
          // currently inside this strict section (unsubmitted)
          tabCls = "bg-amber-500/10 border-amber-500/30 text-amber-300";
        } else if (isActive) {
          tabCls = "bg-indigo-500/10 border-indigo-500/30 text-indigo-300";
        } else if (isLocked) {
          tabCls = "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50";
        } else if (!isClickable) {
          // blocked because we're in an unsubmitted strict section
          tabCls = "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60";
        } else {
          tabCls = "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700";
        }

        /* ── lock icon colour ── */
        const lockCls = isActive && !isLocked
          ? "text-amber-400"   // currently active strict
          : isLocked
            ? "text-zinc-600"  // submitted (permanently locked)
            : "text-zinc-500"; // upcoming strict (not yet active)

        /* ── answered count colour ── */
        const countCls = isActive && isStrictSec && !isLocked
          ? "text-amber-500"
          : isActive
            ? "text-indigo-400"
            : "text-zinc-700";

        return (
          <button
            key={sec._id ?? si}
            disabled={!isClickable && !isActive}
            onClick={() => { if (isClickable && !isActive) onSelect(si); }}
            title={
              isLocked    ? "Section submitted — cannot be re-entered" :
              isStrictSec ? "Strict section — navigation locked while active" :
              undefined
            }
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl
              text-xs font-medium border transition-all whitespace-nowrap ${tabCls}`}
          >
            {/* lock icon on ALL strict sections regardless of locked state */}
            {isStrictSec && <LockIcon size={9} className={`shrink-0 ${lockCls}`} />}

            {sec.title}

            <span className={`mono text-[9px] ${countCls}`}>
              {secAnswered}/{sec.questions.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
