// src/components/exam/ExamSidebar.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Monitor }         from "lucide-react";
import FaceTracker    from "../FaceTracker";
import ObjectDetector from "../ObjectDetector";

/**
 * props:
 *   started        – boolean
 *   cameraVideoRef – ref for the <video> element
 *   screenSharing  – boolean
 *   warning        – current violation warning string (clears after 3s)
 *   warningCount   – total warning count
 *   tabCount       – tab-switch count
 *   faceCount      – face-alert count
 *   devCount       – device-flag count
 *   escCount       – fullscreen-exit count
 *   answeredCount  – total answered questions
 *   totalQuestions – total question count
 *   onStart        – () => void  (start exam button)
 *   onDetect       – (msg: string) => void  (violation detected by trackers)
 */
export default function ExamSidebar({
  started,
  cameraVideoRef,
  screenSharing,
  warning,
  warningCount,
  tabCount,
  faceCount,
  devCount,
  escCount,
  answeredCount,
  totalQuestions,
  onStart,
  onDetect,
}) {
  return (
    <aside
      className="w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 hidden md:flex overflow-y-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
    >
      {/* ── camera feed ── */}
      <div className="relative bg-black aspect-video shrink-0 overflow-hidden">
        {!started ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
            <Camera size={24} className="text-zinc-700" />
            <p className="mono text-[10px] text-zinc-600 text-center">Camera preview will appear here</p>
          </div>
        ) : (
          <>
            <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <FaceTracker    videoRef={cameraVideoRef} onDetect={onDetect} />
            <ObjectDetector videoRef={cameraVideoRef} onDetect={onDetect} />

            <AnimatePresence>
              {warning && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0  }}
                  exit={{ opacity: 0 }}
                  className="absolute top-2 left-2 right-2 bg-rose-500 px-3 py-1.5
                    rounded-lg mono text-[10px] font-semibold text-center shadow-lg"
                >
                  {warning}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-2 left-2 flex gap-1">
              <span className="flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded mono text-[9px] text-emerald-400">
                <Camera size={8} /> ON
              </span>
              {screenSharing && (
                <span className="flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded mono text-[9px] text-indigo-400">
                  <Monitor size={8} /> SCR
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── stats + rules ── */}
      <div className="flex-1 p-3 space-y-4">
        <div className="space-y-1">
          <p className="mono text-[9px] text-zinc-600 uppercase tracking-widest">Session</p>
          {[
            { label: "Warnings",     val: warningCount, color: "text-rose-400"   },
            { label: "Tab switches", val: tabCount,     color: "text-amber-400"  },
            { label: "Face alerts",  val: faceCount,    color: "text-rose-400"   },
            { label: "Device flags", val: devCount,     color: "text-purple-400" },
            { label: "ESC exits",    val: escCount,     color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <span className={`mono text-sm font-bold ${s.color}`}>{s.val}</span>
            </div>
          ))}
        </div>

        {started && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="mono text-[9px] text-zinc-600 uppercase tracking-widest">Progress</p>
              <span className="mono text-[10px] text-zinc-500">{answeredCount}/{totalQuestions}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="mono text-[9px] text-zinc-600 uppercase tracking-widest">Rules</p>
          {[
            "Stay in fullscreen",
            "One person in camera",
            "No phones or books",
            "Don't switch tabs",
            "Screen is being shared",
          ].map(r => (
            <p key={r} className="mono text-[9px] text-zinc-700 flex items-start gap-1.5">
              <span className="text-zinc-800 mt-0.5">•</span>{r}
            </p>
          ))}
        </div>
      </div>

      {/* ── start button ── */}
      {!started && (
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={onStart}
            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400
              text-sm font-semibold text-white transition-colors"
          >
            Start Exam
          </button>
          <p className="mono text-[9px] text-zinc-700 text-center mt-2">Camera + fullscreen required</p>
        </div>
      )}
    </aside>
  );
}
