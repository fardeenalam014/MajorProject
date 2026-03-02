import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FaceTracker   from "../components/FaceTracker";
import ObjectDetector from "../components/ObjectDetector";
import {
  upsertLiveSession, markSessionSubmitted, saveAttempt, getTotalMarks,
} from "../utils/Storage";

export default function ExamPage() {
  const videoRef = useRef(null);
  const navigate  = useNavigate();

  /* ── identity (set by StudentDashboard before navigating here) ── */
  const testId      = localStorage.getItem("activeTestId")      || "unknown";
  const studentUser = localStorage.getItem("activeStudentUser") || "Anonymous";
  const currentTest = (() => {
    try { return JSON.parse(localStorage.getItem("currentTest")); } catch { return null; }
  })();

  const sessionId   = useRef(`${testId}_${studentUser}_${Date.now()}`);
  const startTimeRef = useRef(null);

  /* ── violation counters (refs so closures always get fresh value) ── */
  const tabSwitchesRef  = useRef(0);
  const faceWarningsRef = useRef(0);
  const deviceFlagsRef  = useRef(0);
  const answersRef      = useRef({});       // filled by your question UI
  const scoreRef        = useRef(0);        // updated by your scoring logic

  /* ── UI state ── */
  const [started,       setStarted]       = useState(false);
  const [warning,       setWarning]       = useState("");
  const [warningCount,  setWarningCount]  = useState(0);
  const [escapeCount,   setEscapeCount]   = useState(0);
  const [blocked,       setBlocked]       = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const MAX_ESCAPES = 3;

  /* ── violation counters mirrored in state for display ── */
  const [tabCount,  setTabCount]  = useState(0);
  const [faceCount, setFaceCount] = useState(0);
  const [devCount,  setDevCount]  = useState(0);

  /* ═══════════════════════════════════
     LIVE SESSION PUSH
  ═══════════════════════════════════ */
  const pushLive = useCallback((statusOverride) => {
    const totalQuestions = currentTest?.sections?.reduce(
      (s, sec) => s + (sec.questions?.length || 0), 0
    ) || 0;

    const total = tabSwitchesRef.current + faceWarningsRef.current + deviceFlagsRef.current;
    const status = statusOverride
      ?? (total >= 5 ? "violation" : total >= 2 ? "warning" : "active");

    upsertLiveSession({
      sessionId:     sessionId.current,
      testId,
      studentUser,
      status,
      startedAt:     startTimeRef.current,
      answeredCount: Object.keys(answersRef.current).length,
      totalQuestions,
      tabSwitches:   tabSwitchesRef.current,
      faceWarnings:  faceWarningsRef.current,
      deviceFlags:   deviceFlagsRef.current,
    });
  }, [testId, studentUser, currentTest]);

  /* heartbeat every 4 s */
  useEffect(() => {
    if (!started) return;
    const id = setInterval(pushLive, 4000);
    return () => clearInterval(id);
  }, [started, pushLive]);

  /* ═══════════════════════════════════
     DETECT HANDLER
     Categorises the message string and
     increments the right counter.
  ═══════════════════════════════════ */
  const handleDetect = useCallback((msg) => {
    setWarning(msg);
    setWarningCount(c => c + 1);
    setTimeout(() => setWarning(""), 3000);

    const m = msg.toLowerCase();
    if (m.includes("tab")) {
      tabSwitchesRef.current += 1;
      setTabCount(tabSwitchesRef.current);
    } else if (m.includes("face") || m.includes("person") || m.includes("multiple")) {
      faceWarningsRef.current += 1;
      setFaceCount(faceWarningsRef.current);
    } else if (m.includes("phone") || m.includes("book") || m.includes("device") || m.includes("object")) {
      deviceFlagsRef.current += 1;
      setDevCount(deviceFlagsRef.current);
    }

    pushLive();
  }, [pushLive]);

  /* ═══════════════════════════════════
     START EXAM
  ═══════════════════════════════════ */
  const startExam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
      await document.documentElement.requestFullscreen();
      startTimeRef.current = Date.now();
      setStarted(true);
      pushLive("active");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraBlocked(true);
    }
  };

  /* ═══════════════════════════════════
     FINISH / SUBMIT EXAM
     score: pass your computed score in,
     or 0 if not yet implemented.
  ═══════════════════════════════════ */
  const finishExam = useCallback(async (score = scoreRef.current) => {
    /* stop camera */
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());

    /* exit fullscreen */
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }

    const timeTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;

    /* ── write attempt to shared store → CreatorDashboard reads this ── */
    saveAttempt({
      testId,
      studentUser,
      score,
      answers:      answersRef.current,
      submittedAt:  new Date().toISOString(),
      timeTaken,
      tabSwitches:  tabSwitchesRef.current,
      faceWarnings: faceWarningsRef.current,
      deviceFlags:  deviceFlagsRef.current,
    });

    /* ── mark live session as submitted ── */
    markSessionSubmitted(sessionId.current);

    /* ── clean up transient keys ── */
    localStorage.removeItem("activeTestId");
    localStorage.removeItem("activeStudentUser");
    localStorage.removeItem("currentTest");

    navigate("/student");   // back to StudentDashboard which will re-sync on focus
  }, [testId, studentUser, navigate]);

  /* ═══════════════════════════════════
     FULLSCREEN EXIT
  ═══════════════════════════════════ */
  useEffect(() => {
    const handle = async () => {
      if (!started) return;
      if (!document.fullscreenElement) {
        setBlocked(true);
        setEscapeCount(prev => {
          const next = prev + 1;
          handleDetect(
            next >= MAX_ESCAPES
              ? "⚠️ Multiple fullscreen exits detected!"
              : "⚠️ Do not exit fullscreen during exam!"
          );
          return next;
        });
        try { await document.documentElement.requestFullscreen(); } catch {}
      } else {
        setBlocked(false);
      }
    };
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, [started, handleDetect]);

  /* ═══════════════════════════════════
     TAB SWITCH
  ═══════════════════════════════════ */
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && started) handleDetect("⚠️ Tab switched!");
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [started, handleDetect]);

  /* ═══════════════════════════════════
     RIGHT CLICK
  ═══════════════════════════════════ */
  useEffect(() => {
    const block = e => e.preventDefault();
    window.addEventListener("contextmenu", block);
    return () => window.removeEventListener("contextmenu", block);
  }, []);

  /* ═══════════════════════════════════
     SAFETY NET — save on tab close
  ═══════════════════════════════════ */
  useEffect(() => {
    const handle = () => {
      if (!started) return;
      const timeTaken = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;
      saveAttempt({
        testId, studentUser,
        score:        scoreRef.current,
        answers:      answersRef.current,
        submittedAt:  new Date().toISOString(),
        timeTaken,
        tabSwitches:  tabSwitchesRef.current,
        faceWarnings: faceWarningsRef.current,
        deviceFlags:  deviceFlagsRef.current,
        abandoned:    true,
      });
      markSessionSubmitted(sessionId.current);
    };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [started, testId, studentUser]);

  /* ═══════════════════════════════════
     RENDER
  ═══════════════════════════════════ */
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800
      text-white flex flex-col">

      {/* HEADER */}
      <header className="flex justify-between items-center p-4 bg-slate-900 shadow-lg shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">AI Proctored Exam</h1>
          <p className="text-xs text-slate-400 font-mono">{studentUser}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-red-600/80 px-3 py-1 rounded-lg text-xs font-mono">
            Warnings: {warningCount}
          </span>
          <span className="bg-yellow-600/80 px-3 py-1 rounded-lg text-xs font-mono">
            ESC: {escapeCount}
          </span>
          {started && (
            <span className="flex items-center gap-1.5 bg-emerald-600/20 border border-emerald-500/30
              px-3 py-1 rounded-lg text-xs font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
          <button onClick={() => finishExam(0)}
            className="bg-gray-700 hover:bg-gray-800 px-4 py-1 rounded-lg text-sm transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">

        {/* CAMERA */}
        <div className="lg:col-span-2 bg-black rounded-xl relative overflow-hidden shadow-lg">
          {!started ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-center mb-2">
                <p className="text-slate-400 text-sm mb-1 font-mono">Logged in as</p>
                <p className="text-white font-semibold">{studentUser}</p>
              </div>
              <button onClick={startExam}
                className="h-14 w-64 bg-green-600 hover:bg-green-700 rounded-xl text-lg
                  font-semibold transition-colors">
                Start Exam
              </button>
              <p className="text-slate-500 text-xs font-mono">Camera + fullscreen required</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay muted playsInline
                className="w-full h-full object-cover" />

              {warning && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-red-500 px-5 py-2
                  rounded-xl font-semibold shadow-xl z-10">
                  {warning}
                </div>
              )}

              {/* live violation counters */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                {[
                  { label: "Tabs",   val: tabCount,  bg: "bg-amber-500/80"  },
                  { label: "Face",   val: faceCount, bg: "bg-rose-500/80"   },
                  { label: "Device", val: devCount,  bg: "bg-purple-500/80" },
                ].map(b => (
                  <span key={b.label}
                    className={`${b.bg} px-2 py-1 rounded-md text-[10px] font-mono`}>
                    {b.label}: {b.val}
                  </span>
                ))}
              </div>

              <FaceTracker    videoRef={videoRef} onDetect={handleDetect} />
              <ObjectDetector videoRef={videoRef} onDetect={handleDetect} />
            </>
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="bg-slate-900 rounded-xl p-6 flex flex-col gap-4 shadow-lg overflow-y-auto">
          <h2 className="text-lg font-semibold">Instructions</h2>
          <ul className="space-y-2 text-slate-300 text-sm list-disc pl-4">
            <li>Stay in fullscreen at all times</li>
            <li>Only one person allowed in view</li>
            <li>No phones or books visible</li>
            <li>Do not switch tabs</li>
            <li>3 ESC presses → flagged violation</li>
            <li>All activity is logged in real time</li>
          </ul>

          {started && (
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 space-y-2 mt-auto">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                Session
              </p>
              {[
                { label: "Tab switches", val: tabCount,  color: "text-amber-400"  },
                { label: "Face alerts",  val: faceCount, color: "text-rose-400"   },
                { label: "Device flags", val: devCount,  color: "text-purple-400" },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`font-mono font-semibold ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => finishExam(scoreRef.current)}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold
              transition-colors mt-auto">
            Submit Exam
          </button>
        </div>
      </div>

      <footer className="text-center text-slate-500 text-xs py-2 shrink-0">
        AI Powered Proctoring System · Activity is monitored and logged in real time
      </footer>

      {/* FULLSCREEN OVERLAY */}
      {blocked && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
          <h2 className="text-2xl mb-4 font-bold">⚠ Fullscreen Required</h2>
          <p className="text-center mb-2 text-slate-300">You exited fullscreen. This has been logged.</p>
          <p className="text-sm text-slate-500 mb-6 font-mono">
            Exit count: {escapeCount} / {MAX_ESCAPES}
          </p>
          <button
            onClick={() => { document.documentElement.requestFullscreen().catch(() => {}); setBlocked(false); }}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors">
            Return to Exam
          </button>
        </div>
      )}

      {/* CAMERA OVERLAY */}
      {cameraBlocked && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
          <h2 className="text-2xl mb-4 font-bold">⚠ Camera Permission Required</h2>
          <p className="text-center mb-6 text-slate-300">
            Please allow camera access to start the exam.
          </p>
          <button onClick={() => { setCameraBlocked(false); startExam(); }}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors">
            Retry Camera Access
          </button>
        </div>
      )}
    </div>
  );
}