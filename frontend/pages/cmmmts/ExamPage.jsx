/**
 * ExamPage.jsx — src/pages/ExamPage.jsx
 * Live streaming (WebRTC + socket) REMOVED.
 * Camera is local preview only. Violations still tracked and submitted with attempt.
 */
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams }  from "react-router-dom";
import { motion, AnimatePresence }  from "framer-motion";
import {
  ChevronLeft, ChevronRight, Clock, Camera,
  ShieldAlert, CheckCircle2, Loader2,
  Send, AlertTriangle, Hash, Lock as LockIcon,
} from "lucide-react";
import FaceTracker    from "../components/FaceTracker";
import ObjectDetector from "../components/ObjectDetector";
import { useAuth }    from "../context/AuthContext";
import { testAPI, attemptAPI } from "../utils/api";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const MAX_ESCAPES = 3;
const OPT_LABELS  = ["A","B","C","D","E","F","G","H"];

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    * { font-family: 'DM Sans', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
  `}</style>
);

const fmt = (s) => {
  if (s == null || s < 0) return "00:00";
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
};

function QuestionCard({ question, qIndex, sectionId, answer, onAnswer }) {
  const key = `${sectionId}_${qIndex}`;
  return (
    <div data-qkey={key}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center mono text-xs font-bold transition-all ${answer ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
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
      <p className="text-sm text-zinc-200 leading-relaxed">{question.text}</p>
      {question.image && (
        <img src={question.image} alt="question" className="max-h-48 rounded-xl object-contain border border-zinc-800" />
      )}
      {question.type === "mcq" && (
        <div className="space-y-2.5">
          {(question.options ?? []).map((opt, oi) => {
            const optText  = typeof opt === "string" ? opt : (opt.text ?? "");
            const optImage = typeof opt === "string" ? null : (opt.image ?? null);
            const selected = answer === optText;
            return (
              <button key={oi} onClick={() => onAnswer(key, selected ? "" : optText)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selected ? "bg-emerald-500/8 border-emerald-500/25 text-zinc-200" : "bg-zinc-800/40 border-zinc-700/40 text-zinc-300 hover:border-zinc-600"}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${selected ? "bg-emerald-500 border-emerald-500" : "border-zinc-600"}`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={`mono text-[11px] shrink-0 w-4 ${selected ? "text-emerald-400" : "text-zinc-500"}`}>
                  {OPT_LABELS[oi]}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{optText}</span>
                  {optImage && <img src={optImage} alt="option" className="mt-1.5 h-12 rounded-lg object-contain" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {question.type === "numerical" && (
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">Your Answer</label>
          <input type="number" value={answer ?? ""} onChange={e => onAnswer(key, e.target.value)}
            placeholder="0"
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 mono text-sm text-zinc-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/15 transition-all placeholder:text-zinc-700" />
        </div>
      )}
    </div>
  );
}

function SubmitDialog({ answered, total, onConfirm, onCancel, submitting }) {
  const unanswered = total - answered;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-zinc-200">Submit Exam?</p>
            <p className="text-xs text-zinc-500 mt-0.5">This cannot be undone.</p>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Answered</span>
            <span className="mono text-emerald-400">{answered} / {total}</span>
          </div>
          {unanswered > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Unanswered</span>
              <span className="mono text-amber-400">{unanswered}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all">
            Continue
          </button>
          <button onClick={onConfirm} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><Send size={14} /> Submit</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SectionSubmitDialog({ sectionName, answeredInSection, totalInSection, isLastSection, onConfirm, onCancel }) {
  const unanswered = totalInSection - answeredInSection;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <LockIcon size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-zinc-200">Submit "{sectionName}"?</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              You <span className="text-amber-400 font-semibold">cannot return</span> to this section after continuing.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Answered</span>
            <span className="mono text-emerald-400">{answeredInSection} / {totalInSection}</span>
          </div>
          {unanswered > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Unanswered</span>
              <span className="mono text-amber-400">{unanswered} questions</span>
            </div>
          )}
          <div className="flex justify-between text-xs pt-1 border-t border-zinc-800">
            <span className="text-zinc-500">Next</span>
            <span className="mono text-zinc-400">{isLastSection ? "Final submission" : "Next section →"}</span>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
          <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="mono text-[10px] text-amber-500/80 leading-relaxed">
            Once you proceed, this section will be locked. Review your answers before continuing.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all">
            Review Answers
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-semibold text-zinc-950 transition-colors flex items-center justify-center gap-2">
            <LockIcon size={13} />
            {isLastSection ? "Submit Exam" : "Lock & Continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ResultScreen({ result, onDone }) {
  const pct        = result.percentage ?? result.pct ?? 0;
  const passed     = result.passed ?? pct >= 40;
  const scoreColor = pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-rose-400";
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-4">
      <FontLoader />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6">
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${passed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
          {passed ? <CheckCircle2 size={28} className="text-emerald-400" /> : <AlertTriangle size={28} className="text-rose-400" />}
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-100">{passed ? "Passed! 🎉" : "Better luck next time"}</p>
          <p className="text-sm text-zinc-500 mt-1">Exam submitted successfully</p>
        </div>
        <p className={`text-6xl font-bold mono ${scoreColor}`}>{pct}%</p>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-2.5">
          {[
            { label: "Score",      val: `${result.score} / ${result.totalMarks}` },
            { label: "Time taken", val: result.timeTaken != null ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : "—" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-zinc-500">{r.label}</span>
              <span className="mono text-zinc-200">{r.val}</span>
            </div>
          ))}
          <div className="pt-1 flex justify-center">
            <span className={`mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-md border ${passed ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
              {passed ? "PASS" : "FAIL"}
            </span>
          </div>
        </div>
        <button onClick={onDone} className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold text-white transition-colors">
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

export default function ExamPage() {
  const { id: testId } = useParams();
  const navigate        = useNavigate();
  const { user }        = useAuth();

  // ── refs ──
  const cameraVideoRef  = useRef(null);
  const cameraStreamRef = useRef(null);   // local only, no streaming
  const startTimeRef    = useRef(null);
  const answersRef      = useRef({});
  const totalTimerRef   = useRef(null);
  const sectionTimerRef = useRef(null);
  const finishCalledRef = useRef(false);
  const tabRef  = useRef(0);
  const faceRef = useRef(0);
  const devRef  = useRef(0);
  const escRef  = useRef(0);

  // ── state ──
  const [testData,          setTestData]          = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [started,           setStarted]           = useState(false);
  const [cameraBlocked,     setCameraBlocked]     = useState(false);
  const [blocked,           setBlocked]           = useState(false);
  const [activeSectionIdx,  setActiveSectionIdx]  = useState(0);
  const [answers,           setAnswers]           = useState({});
  const [totalSecs,         setTotalSecs]         = useState(0);
  const [sectionSecs,       setSectionSecs]       = useState(0);
  const [warning,           setWarning]           = useState("");
  const [warningCount,      setWarningCount]      = useState(0);
  const [tabCount,          setTabCount]          = useState(0);
  const [faceCount,         setFaceCount]         = useState(0);
  const [devCount,          setDevCount]          = useState(0);
  const [escCount,          setEscCount]          = useState(0);
  const [showSubmit,        setShowSubmit]        = useState(false);
  const [submitting,        setSubmitting]        = useState(false);
  const [result,            setResult]            = useState(null);
  const [lockedSections,    setLockedSections]    = useState(new Set());
  const [showSectionSubmit, setShowSectionSubmit] = useState(false);

  const sections       = testData?.sections ?? [];
  const activeSection  = sections[activeSectionIdx] ?? null;
  const totalQuestions = useMemo(() => sections.reduce((a, s) => a + s.questions.length, 0), [sections]);
  const answeredCount  = useMemo(() => Object.values(answers).filter(v => v !== "" && v != null).length, [answers]);

  // ── load test ──
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    testAPI.getTest(testId).then(({ data, error }) => {
      if (error || !data?.test) { navigate("/student-dashboard"); return; }
      setTestData(data.test);
      setTotalSecs((data.test.duration ?? 60) * 60);
      const first = data.test.sections?.[0];
      setSectionSecs(first?.duration > 0 ? first.duration : 0);
      setLoading(false);
    });
  }, [testId, user, navigate]);

  // ── finish exam ──
  const finishExam = useCallback(async (autoSubmit = false) => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    setSubmitting(true);
    clearInterval(totalTimerRef.current);
    clearInterval(sectionTimerRef.current);
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
    const timeTaken = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const { data } = await attemptAPI.submit({
      testId, answers: answersRef.current, timeTaken,
      violations: { tabSwitches: tabRef.current, faceWarnings: faceRef.current, deviceFlags: devRef.current, fullscreenExits: escRef.current },
      abandoned: autoSubmit && Object.keys(answersRef.current).length === 0,
    });
    setSubmitting(false);
    setShowSubmit(false);
    if (data?.attempt) { setResult({ ...data.attempt, timeTaken }); }
    else { navigate("/student-dashboard"); }
  }, [testId, navigate]);

  // ── advance section (strict-aware) ──
  const advanceSection = useCallback((fromIdx, lockIt = false) => {
    const newLocked = lockIt
      ? new Set([...lockedSections, fromIdx])
      : lockedSections;

    if (lockIt) setLockedSections(newLocked);

    const findNextNavigable = (locked) => {
      for (let i = fromIdx + 1; i < sections.length; i++) {
        const s = sections[i];
        if (!locked.has(i) && !(s.strictTimer && s.duration > 0)) return i;
      }
      for (let i = 0; i < fromIdx; i++) {
        const s = sections[i];
        if (!locked.has(i) && !(s.strictTimer && s.duration > 0)) return i;
      }
      for (let i = 0; i < sections.length; i++) {
        if (i === fromIdx) continue;
        if (!locked.has(i)) return i;
      }
      return null;
    };

    const nextIdx = findNextNavigable(newLocked);
    if (nextIdx !== null) { setActiveSectionIdx(nextIdx); }
    else                  { setShowSubmit(true); }
    setShowSectionSubmit(false);
  }, [sections, lockedSections]);

  // ── total timer ──
  useEffect(() => {
    if (!started) return;
    totalTimerRef.current = setInterval(() => {
      setTotalSecs(prev => {
        if (prev <= 1) { clearInterval(totalTimerRef.current); finishExam(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(totalTimerRef.current);
  }, [started, finishExam]);

  // ── section timer ──
  useEffect(() => {
    if (!started) return;
    clearInterval(sectionTimerRef.current);
    const sec = sections[activeSectionIdx];
    if (!sec?.duration || sec.duration === 0) { setSectionSecs(0); return; }
    setSectionSecs(sec.duration);
    sectionTimerRef.current = setInterval(() => {
      setSectionSecs(prev => {
        if (prev <= 1) {
          clearInterval(sectionTimerRef.current);
          advanceSection(activeSectionIdx, sec.strictTimer ?? false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sectionTimerRef.current);
  }, [started, activeSectionIdx, sections, advanceSection]);

  // ── answer handler ──
  const handleAnswer = useCallback((key, value) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value };
      answersRef.current = next;
      return next;
    });
  }, []);

  // ── violation handler (local only, no socket emit) ──
  const handleDetect = useCallback((msg) => {
    setWarning(msg);
    setWarningCount(c => c + 1);
    setTimeout(() => setWarning(""), 3000);
    const m = msg.toLowerCase();
    if      (m.includes("tab"))                                                     { tabRef.current++;  setTabCount(tabRef.current);   }
    else if (m.includes("face") || m.includes("person") || m.includes("multiple")) { faceRef.current++; setFaceCount(faceRef.current); }
    else if (m.includes("phone") || m.includes("book") || m.includes("device"))    { devRef.current++;  setDevCount(devRef.current);   }
    else if (m.includes("fullscreen") || m.includes("esc"))                         { escRef.current++;  setEscCount(escRef.current);   }
  }, []);

  // ── start exam (camera preview only, no WebRTC/socket) ──
  const startExam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
      await document.documentElement.requestFullscreen();
      startTimeRef.current = Date.now();
      setStarted(true);
    } catch (err) { console.error("Start error:", err); setCameraBlocked(true); }
  };

  // ── fullscreen guard ──
  useEffect(() => {
    const handle = async () => {
      if (!started) return;
      if (!document.fullscreenElement) {
        setBlocked(true);
        escRef.current++; setEscCount(escRef.current);
        handleDetect(escRef.current >= MAX_ESCAPES ? "⚠️ Multiple fullscreen exits detected!" : "⚠️ Do not exit fullscreen!");
        try { await document.documentElement.requestFullscreen(); } catch {}
      } else { setBlocked(false); }
    };
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, [started, handleDetect]);

  // ── tab switch guard ──
  useEffect(() => {
    const h = () => { if (document.hidden && started) handleDetect("⚠️ Tab switched!"); };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [started, handleDetect]);

  // ── block right-click ──
  useEffect(() => {
    const b = e => e.preventDefault();
    window.addEventListener("contextmenu", b);
    return () => window.removeEventListener("contextmenu", b);
  }, []);

  // ── beforeunload beacon ──
  useEffect(() => {
    const h = () => {
      if (!started) return;
      const timeTaken = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
      navigator.sendBeacon(`${SOCKET_URL}/api/attempts`,
        new Blob([JSON.stringify({
          testId, timeTaken, abandoned: true, answers: answersRef.current,
          violations: { tabSwitches: tabRef.current, faceWarnings: faceRef.current, deviceFlags: devRef.current, fullscreenExits: escRef.current },
        })], { type: "application/json" }));
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [started, testId]);

  // ── cleanup ──
  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(totalTimerRef.current);
    clearInterval(sectionTimerRef.current);
  }, []);

  if (loading) return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center">
      <FontLoader /><Loader2 size={24} className="text-indigo-400 animate-spin" />
    </div>
  );
  if (result) return <ResultScreen result={result} onDone={() => navigate("/student-dashboard")} />;

  const totalWarnings   = tabCount + faceCount + devCount;
  const isLowTime       = totalSecs > 0 && totalSecs < 300;
  const isStrictSection = !!(activeSection?.strictTimer && activeSection?.duration > 0);

  const prevNonLockedIdx = (() => {
    for (let i = activeSectionIdx - 1; i >= 0; i--) {
      if (!lockedSections.has(i)) return i;
    }
    return null;
  })();
  const canGoBack = prevNonLockedIdx !== null && !isStrictSection;

  const nextNavigableIdx = (() => {
    for (let i = activeSectionIdx + 1; i < sections.length; i++) {
      if (!lockedSections.has(i)) return i;
    }
    return null;
  })();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none">
      <FontLoader />

      {/* HEADER */}
      <header className="h-14 shrink-0 flex items-center justify-between px-5 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-zinc-200 truncate max-w-[200px] sm:max-w-xs">{testData?.title}</p>
            <p className="mono text-[10px] text-zinc-600">{user?.username ?? user?.email}</p>
          </div>
          {started && (
            <span className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg mono text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE
            </span>
          )}
        </div>

        {started && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border mono text-sm font-bold transition-all ${isLowTime ? "bg-rose-500/10 border-rose-500/25 text-rose-400" : "bg-zinc-900 border-zinc-800 text-zinc-200"}`}>
              <Clock size={12} className={isLowTime ? "text-rose-400" : "text-zinc-500"} />{fmt(totalSecs)}
            </div>
            {sectionSecs > 0 && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border mono text-xs transition-all ${isStrictSection ? "bg-amber-500/10 border-amber-500/25 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
                {isStrictSection && <LockIcon size={9} />}
                <span className="mono text-[9px] uppercase tracking-widest text-zinc-600">SEC</span>
                {fmt(sectionSecs)}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {started && (
            <>
              <div className="hidden sm:flex items-center gap-1 mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                <Hash size={10} />{answeredCount}/{totalQuestions}
              </div>
              {totalWarnings > 0 && (
                <div className="flex items-center gap-1 mono text-[10px] text-rose-400 bg-rose-500/8 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                  <ShieldAlert size={10} /> {totalWarnings}
                </div>
              )}
              <button onClick={() => setShowSubmit(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
                <Send size={13} /> Submit
              </button>
            </>
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: camera (local preview) + stats */}
        <aside className="w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 hidden md:flex overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
          <div className="relative bg-black aspect-video shrink-0 overflow-hidden">
            {!started ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
                <Camera size={24} className="text-zinc-700" />
                <p className="mono text-[10px] text-zinc-600 text-center">Camera preview will appear here</p>
              </div>
            ) : (
              <>
                <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <FaceTracker    videoRef={cameraVideoRef} onDetect={handleDetect} />
                <ObjectDetector videoRef={cameraVideoRef} onDetect={handleDetect} />
                <AnimatePresence>
                  {warning && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute top-2 left-2 right-2 bg-rose-500 px-3 py-1.5 rounded-lg mono text-[10px] font-semibold text-center shadow-lg">
                      {warning}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <span className="flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded mono text-[9px] text-emerald-400">
                    <Camera size={8} /> ON
                  </span>
                </div>
              </>
            )}
          </div>

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
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="mono text-[9px] text-zinc-600 uppercase tracking-widest">Rules</p>
              {["Stay in fullscreen","One person in camera","No phones or books","Don't switch tabs"].map(r => (
                <p key={r} className="mono text-[9px] text-zinc-700 flex items-start gap-1.5">
                  <span className="text-zinc-800 mt-0.5">•</span>{r}
                </p>
              ))}
            </div>
          </div>

          {!started && (
            <div className="p-3 border-t border-zinc-800">
              <button onClick={startExam} className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold text-white transition-colors">Start Exam</button>
              <p className="mono text-[9px] text-zinc-700 text-center mt-2">Camera + fullscreen required</p>
            </div>
          )}
        </aside>

        {/* CENTER: questions */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* section tabs */}
          {sections.length > 1 && (
            <div
              className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950"
              style={{ overflowX: "auto", scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent", WebkitOverflowScrolling: "touch" }}
            >
              {sections.map((sec, si) => {
                const secAnswered = sec.questions.filter((_, qi) => answers[`${sec._id}_${qi}`]).length;
                const isActive    = si === activeSectionIdx;
                const isLocked    = lockedSections.has(si);
                const isStrictSec = !!(sec.strictTimer && sec.duration > 0);
                const activeIsUnsubmittedStrict = isStrictSection && !lockedSections.has(activeSectionIdx);
                const isClickable = !isLocked && !activeIsUnsubmittedStrict;
                const showLock    = isStrictSec;
                return (
                  <button
                    key={sec._id}
                    disabled={!isClickable && !isActive}
                    onClick={() => { if (isClickable && !isActive) setActiveSectionIdx(si); }}
                    title={isLocked ? "Section submitted — cannot be re-entered" : isStrictSec ? "Strict section — navigation locked while active" : undefined}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap
                      ${isActive && isStrictSec && !isLocked ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : isActive ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        : isLocked ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                        : isClickable ? "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60"}`}
                  >
                    {showLock && (
                      <LockIcon size={9} className={`shrink-0 ${isActive && !isLocked ? "text-amber-400" : isLocked ? "text-zinc-600" : "text-zinc-500"}`} />
                    )}
                    {sec.title}
                    <span className={`mono text-[9px] ${isActive && isStrictSec && !isLocked ? "text-amber-500" : isActive ? "text-indigo-400" : "text-zinc-700"}`}>
                      {secAnswered}/{sec.questions.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* section info + nav */}
          {activeSection && started && (
            <>
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-zinc-200 text-sm">{activeSection.title}</h2>
                    {isStrictSection && (
                      <span className="flex items-center gap-1 mono text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <LockIcon size={8} /> Strict
                      </span>
                    )}
                  </div>
                  <p className="mono text-[10px] text-zinc-600 mt-0.5">{activeSection.questions.length} questions</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { if (prevNonLockedIdx !== null) setActiveSectionIdx(prevNonLockedIdx); }}
                    disabled={!canGoBack}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 transition-all">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="mono text-[10px] text-zinc-600 px-1">{activeSectionIdx + 1}/{sections.length}</span>
                  <button
                    onClick={() => {
                      if (isStrictSection) { setShowSectionSubmit(true); }
                      else if (nextNavigableIdx !== null) { setActiveSectionIdx(nextNavigableIdx); }
                    }}
                    disabled={nextNavigableIdx === null && !isStrictSection}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-700 transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              {isStrictSection && (
                <div className="shrink-0 flex items-center gap-2 px-5 py-2 bg-amber-500/5 border-b border-amber-500/15">
                  <LockIcon size={11} className="text-amber-500 shrink-0" />
                  <p className="mono text-[10px] text-amber-500/80">Strict section — you cannot return after moving forward.</p>
                </div>
              )}
            </>
          )}

          {/* questions scroll */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
            {!started ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Camera size={22} className="text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400 font-medium">Start the exam to see questions</p>
                  <p className="mono text-[11px] text-zinc-700 mt-1">{totalQuestions} questions · {testData?.duration} min</p>
                </div>
                <button onClick={startExam} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-semibold text-white transition-colors">
                  Start Exam
                </button>
              </div>
            ) : (
              <>
                {activeSection?.questions.map((q, qi) => (
                  <QuestionCard key={q._id ?? qi} question={q} qIndex={qi}
                    sectionId={activeSection._id}
                    answer={answers[`${activeSection._id}_${qi}`] ?? ""}
                    onAnswer={handleAnswer} />
                ))}
                {nextNavigableIdx !== null && (
                  <button onClick={() => isStrictSection ? setShowSectionSubmit(true) : setActiveSectionIdx(nextNavigableIdx)}
                    className="w-full py-3 rounded-2xl border border-dashed border-zinc-800 text-sm text-zinc-600 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2">
                    {isStrictSection ? <><LockIcon size={13} /> Submit Section & Continue</> : <>Next: {sections[nextNavigableIdx]?.title} <ChevronRight size={14} /></>}
                  </button>
                )}
                {nextNavigableIdx === null && (
                  <button onClick={() => isStrictSection ? setShowSectionSubmit(true) : setShowSubmit(true)}
                    className="w-full py-3 rounded-2xl border border-dashed border-zinc-800 text-sm text-zinc-600 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2">
                    {isStrictSection ? <><LockIcon size={13} /> Submit Section & Finish</> : <><Send size={14} /> Finish & Submit Exam</>}
                  </button>
                )}
              </>
            )}
          </div>
        </main>

        {/* RIGHT: question palette */}
        {started && (
          <aside className="w-16 shrink-0 border-l border-zinc-800 bg-zinc-950 flex-col hidden sm:flex overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
            <div className="px-2 py-3 border-b border-zinc-800 text-center">
              <span className="mono text-[9px] text-zinc-600 uppercase tracking-widest">Nav</span>
            </div>
            <div className="flex-1 p-2 flex flex-col gap-1.5">
              {sections.map((sec, si) => {
                const isLocked    = lockedSections.has(si);
                const isStrictSec = !!(sec.strictTimer && sec.duration > 0);
                const activeIsUnsubmittedStrict = isStrictSection && !lockedSections.has(activeSectionIdx);
                const canClickFromPalette = !isLocked && !activeIsUnsubmittedStrict;
                return (
                  <div key={sec._id}>
                    {sections.length > 1 && (
                      <div className="flex items-center justify-center gap-0.5 mb-1">
                        {isStrictSec && <LockIcon size={7} className={isLocked ? "text-zinc-600" : "text-zinc-500"} />}
                        <p className="mono text-[8px] uppercase tracking-widest truncate" style={{ color: isLocked ? "#52525b" : "#3f3f46" }}>
                          {sec.title.slice(0, 3)}
                        </p>
                      </div>
                    )}
                    {sec.questions.map((_, qi) => {
                      const key        = `${sec._id}_${qi}`;
                      const isAnswered = answers[key] && answers[key] !== "";
                      return (
                        <button key={key}
                          disabled={!canClickFromPalette && si !== activeSectionIdx}
                          onClick={() => {
                            if (!canClickFromPalette && si !== activeSectionIdx) return;
                            setActiveSectionIdx(si);
                            setTimeout(() => { document.querySelector(`[data-qkey="${key}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
                          }}
                          className={`w-full h-9 rounded-lg mono text-[10px] border transition-all
                            ${isLocked ? "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50"
                              : !canClickFromPalette && si !== activeSectionIdx ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60"
                              : isAnswered ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:scale-105"
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:scale-105"}`}>
                          {qi + 1}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-500/30" /><span className="mono text-[8px] text-zinc-600">Done</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-zinc-800 border border-zinc-700" /><span className="mono text-[8px] text-zinc-600">Pending</span></div>
              <div className="flex items-center gap-1.5"><LockIcon size={8} className="text-zinc-700" /><span className="mono text-[8px] text-zinc-600">Locked</span></div>
            </div>
          </aside>
        )}
      </div>

      {/* OVERLAYS */}
      <AnimatePresence>
        {showSubmit && (
          <SubmitDialog answered={answeredCount} total={totalQuestions} submitting={submitting}
            onConfirm={() => finishExam(false)} onCancel={() => setShowSubmit(false)} />
        )}
        {showSectionSubmit && (
          <SectionSubmitDialog
            sectionName={activeSection?.title ?? ""}
            answeredInSection={(activeSection?.questions ?? []).filter((_, qi) => answers[`${activeSection._id}_${qi}`]).length}
            totalInSection={activeSection?.questions?.length ?? 0}
            isLastSection={nextNavigableIdx === null}
            onConfirm={() => advanceSection(activeSectionIdx, isStrictSection)}
            onCancel={() => setShowSectionSubmit(false)} />
        )}
      </AnimatePresence>

      {blocked && (
        <div className="fixed inset-0 bg-zinc-950/95 z-50 flex flex-col items-center justify-center gap-4">
          <FontLoader />
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Fullscreen Required</h2>
            <p className="text-sm text-zinc-400">Exiting fullscreen has been flagged.</p>
            <p className="mono text-[11px] text-zinc-600 mt-1">Exit count: {escCount} / {MAX_ESCAPES}</p>
          </div>
          <button onClick={() => { document.documentElement.requestFullscreen().catch(() => {}); setBlocked(false); }}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-semibold text-white transition-colors">
            Return to Exam
          </button>
        </div>
      )}

      {cameraBlocked && (
        <div className="fixed inset-0 bg-zinc-950/95 z-50 flex flex-col items-center justify-center gap-4">
          <FontLoader />
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Camera size={24} className="text-rose-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Camera Required</h2>
            <p className="text-sm text-zinc-400">Please allow camera access to continue.</p>
          </div>
          <button onClick={() => { setCameraBlocked(false); startExam(); }}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-semibold text-white transition-colors">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}