import {
  ChevronLeft, ChevronRight, Clock, Camera,
  Monitor, ShieldAlert, CheckCircle2, Loader2,
  Send, AlertTriangle, Lock as LockIcon,
} from "lucide-react";


function SectionSubmitDialog({
  sectionName, answeredInSection, totalInSection,
  isLastSection, onConfirm, onCancel,
}) {
  const unanswered = totalInSection - answeredInSection;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm
      flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{   scale: 0.95,  opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6
          max-w-sm w-full space-y-4"
      >
        {/* header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20
            flex items-center justify-center shrink-0">
            <LockIcon size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-zinc-200">
              Submit "{sectionName}"?
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              You <span className="text-amber-400 font-semibold">cannot return</span> to
              this section after continuing.
            </p>
          </div>
        </div>

        {/* stats */}
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Answered</span>
            <span className="mono text-emerald-400">
              {answeredInSection} / {totalInSection}
            </span>
          </div>
          {unanswered > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Unanswered</span>
              <span className="mono text-amber-400">{unanswered} questions</span>
            </div>
          )}
          <div className="flex justify-between text-xs pt-1 border-t border-zinc-800">
            <span className="text-zinc-500">Next</span>
            <span className="mono text-zinc-400">
              {isLastSection ? "Final submission" : "Next section →"}
            </span>
          </div>
        </div>

        {/* warning */}
        <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15
          rounded-xl p-3">
          <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="mono text-[10px] text-amber-500/80 leading-relaxed">
            Once you proceed, this section will be locked. Review your answers
            before continuing.
          </p>
        </div>

        {/* buttons */}
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm
              text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all">
            Review Answers
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400
              text-sm font-semibold text-zinc-950 transition-colors
              flex items-center justify-center gap-2">
            <LockIcon size={13} />
            {isLastSection ? "Submit Exam" : "Lock & Continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}