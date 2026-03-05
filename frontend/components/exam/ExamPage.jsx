// src/pages/ExamPage.jsx
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io }                     from "socket.io-client";
import { AnimatePresence }        from "framer-motion";
import {
  Clock, Camera, ShieldAlert, Loader2, Send,
  AlertTriangle, Hash, ChevronLeft, ChevronRight,
  Lock as LockIcon,
} from "lucide-react";

import { useAuth }             from "../context/AuthContext";
import { testAPI, attemptAPI } from "../utils/api";

import FontLoader      from "../components/exam/FontLoader";
import ResultScreen    from "../components/exam/ResultScreen";
import ExamSidebar     from "../components/exam/ExamSidebar";
import SectionTabs     from "../components/exam/SectionTabs";
import QuestionCard    from "../components/exam/QuestionCard";
import QuestionPalette from "../components/exam/QuestionPalette";
import { SubmitDialog, SectionSubmitDialog } from "../components/exam/ExamDialogs";
import { SOCKET_URL, RTC_CONFIG, MAX_ESCAPES, fmt } from "../components/exam/examUtils";

/* ─────────────────────────────────────────────────────────── */

export default function ExamPage() {
  const { id: testId } = useParams();
  const navigate        = useNavigate();
  const { user }        = useAuth();

  /* ── refs ── */
  const cameraVideoRef  = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef       = useRef(null);
  const cameraPCRef     = useRef(null);
  const screenPCRef     = useRef(null);
  const startTimeRef    = useRef(null);
  const answersRef      = useRef({});
  const totalTimerRef   = useRef(null);
  const sectionTimerRef = useRef(null);
  const finishCalledRef = useRef(false);
  const tabRef  = useRef(0);
  const faceRef = useRef(0);
  const devRef  = useRef(0);
  const escRef  = useRef(0);

  /* ── state ── */
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
  const [screenSharing,     setScreenSharing]     = useState(false);
  const [lockedSections,    setLockedSections]    = useState(new Set());
  const [showSectionSubmit, setShowSectionSubmit] = useState(false);

  /* ── derived ── */
  const sections      = testData?.sections ?? [];
  const activeSection = sections[activeSectionIdx] ?? null;

  const totalQuestions = useMemo(
    () => sections.reduce((a, s) => a + s.questions.length, 0),
    [sections],
  );
  const answeredCount = useMemo(
    () => Object.values(answers).filter(v => v !== "" && v != null).length,
    [answers],
  );

  /* ════════════════════════════════════════
     LOAD TEST
  ════════════════════════════════════════ */
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

  /* ════════════════════════════════════════
     FINISH / SUBMIT
  ════════════════════════════════════════ */
  const finishExam = useCallback(async (autoSubmit = false) => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    setSubmitting(true);
    clearInterval(totalTimerRef.current);
    clearInterval(sectionTimerRef.current);
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraPCRef.current?.close();
    screenPCRef.current?.close();
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
    const timeTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    socketRef.current?.emit("student:submitted", { testId });
    socketRef.current?.disconnect();
    const { data } = await attemptAPI.submit({
      testId,
      answers:    answersRef.current,
      timeTaken,
      violations: {
        tabSwitches:     tabRef.current,
        faceWarnings:    faceRef.current,
        deviceFlags:     devRef.current,
        fullscreenExits: escRef.current,
      },
      abandoned: autoSubmit && Object.keys(answersRef.current).length === 0,
    });
    setSubmitting(false);
    setShowSubmit(false);
    if (data?.attempt) { setResult({ ...data.attempt, timeTaken }); }
    else               { navigate("/student-dashboard"); }
  }, [testId, navigate]);

  /* ════════════════════════════════════════
     ADVANCE SECTION  (strict-aware)
  ════════════════════════════════════════ */
  const advanceSection = useCallback((fromIdx, lockIt = false) => {
    const newLocked = lockIt
      ? new Set([...lockedSections, fromIdx])
      : lockedSections;
    if (lockIt) setLockedSections(newLocked);

    // Find next navigable section:
    //  1. non-locked non-strict sections after fromIdx
    //  2. non-locked non-strict sections before fromIdx
    //  3. any unlocked section (including strict)
    //  4. null → auto-submit
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
        if (i !== fromIdx && !locked.has(i)) return i;
      }
      return null;
    };

    const next = findNextNavigable(newLocked);
    if (next !== null) { setActiveSectionIdx(next); }
    else               { setShowSubmit(true); }
    setShowSectionSubmit(false);
  }, [sections, lockedSections]);

  /* ════════════════════════════════════════
     TIMERS
  ════════════════════════════════════════ */
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

  /* ════════════════════════════════════════
     ANSWER HANDLER
  ════════════════════════════════════════ */
  const handleAnswer = useCallback((key, value) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value };
      answersRef.current = next;
      return next;
    });
  }, []);

  /* ════════════════════════════════════════
     VIOLATION HANDLER
  ════════════════════════════════════════ */
  const handleDetect = useCallback((msg) => {
    setWarning(msg);
    setWarningCount(c => c + 1);
    setTimeout(() => setWarning(""), 3000);
    const m = msg.toLowerCase();
    if      (m.includes("tab"))                                                    { tabRef.current++;  setTabCount(tabRef.current);   }
    else if (m.includes("face") || m.includes("person") || m.includes("multiple")) { faceRef.current++; setFaceCount(faceRef.current); }
    else if (m.includes("phone") || m.includes("book") || m.includes("device"))    { devRef.current++;  setDevCount(devRef.current);   }
    else if (m.includes("fullscreen") || m.includes("esc"))                         { escRef.current++;  setEscCount(escRef.current);   }
    socketRef.current?.emit("violation", { testId, message: msg });
  }, [testId]);

  /* ════════════════════════════════════════
     WEBRTC
  ════════════════════════════════════════ */
  const createPC = useCallback((streamType) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socketRef.current?.emit("ice:toCreator", { testId, streamType, candidate });
    };
    return pc;
  }, [testId]);

  const startCameraFeed = useCallback(async (stream) => {
    const pc = createPC("camera");
    cameraPCRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("webrtc:offer", { testId, streamType: "camera", offer });
  }, [createPC, testId]);

  const startScreenFeed = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
      screenStreamRef.current = stream;
      setScreenSharing(true);
      const pc = createPC("screen");
      screenPCRef.current = pc;
      stream.getTracks().forEach(t => {
        pc.addTrack(t, stream);
        t.onended = () => { screenPCRef.current?.close(); setScreenSharing(false); };
      });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("webrtc:offer", { testId, streamType: "screen", offer });
    } catch (e) { console.warn("[Screen share]", e.message); }
  }, [createPC, testId]);

  /* ════════════════════════════════════════
     SOCKET
  ════════════════════════════════════════ */
  const connectSocket = useCallback(() => {
    const token  = localStorage.getItem("token_student")
                ?? localStorage.getItem("token_creator")
                ?? localStorage.getItem("token");
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("student:join", { testId, username: user.username }));
    socket.on("webrtc:answer", async ({ streamType, answer }) => {
      const pc = streamType === "screen" ? screenPCRef.current : cameraPCRef.current;
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on("ice:fromCreator", async ({ streamType, candidate }) => {
      const pc = streamType === "screen" ? screenPCRef.current : cameraPCRef.current;
      if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {} }
    });
  }, [testId, user]);

  /* ════════════════════════════════════════
     START EXAM
  ════════════════════════════════════════ */
  const startExam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
      await document.documentElement.requestFullscreen();
      connectSocket();
      setTimeout(() => { startCameraFeed(stream); startScreenFeed(); }, 800);
      startTimeRef.current = Date.now();
      setStarted(true);
    } catch (err) {
      console.error("Start error:", err);
      setCameraBlocked(true);
    }
  };

  /* ════════════════════════════════════════
     GUARDS (fullscreen / tab / contextmenu / beforeunload)
  ════════════════════════════════════════ */
  useEffect(() => {
    const handle = async () => {
      if (!started) return;
      if (!document.fullscreenElement) {
        setBlocked(true);
        escRef.current++; setEscCount(escRef.current);
        handleDetect(escRef.current >= MAX_ESCAPES
          ? "⚠️ Multiple fullscreen exits detected!"
          : "⚠️ Do not exit fullscreen!");
        try { await document.documentElement.requestFullscreen(); } catch {}
      } else { setBlocked(false); }
    };
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, [started, handleDetect]);

  useEffect(() => {
    const h = () => { if (document.hidden && started) handleDetect("⚠️ Tab switched!"); };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [started, handleDetect]);

  useEffect(() => {
    const b = e => e.preventDefault();
    window.addEventListener("contextmenu", b);
    return () => window.removeEventListener("contextmenu", b);
  }, []);

  useEffect(() => {
    const h = () => {
      if (!started) return;
      socketRef.current?.emit("student:submitted", { testId });
      const timeTaken = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
      navigator.sendBeacon(
        `${SOCKET_URL}/api/attempts`,
        new Blob([JSON.stringify({
          testId, timeTaken, abandoned: true,
          answers: answersRef.current,
          violations: {
            tabSwitches: tabRef.current, faceWarnings: faceRef.current,
            deviceFlags: devRef.current, fullscreenExits: escRef.current,
          },
        })], { type: "application/json" }),
      );
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [started, testId]);

  /* cleanup on unmount */
  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraPCRef.current?.close();
    screenPCRef.current?.close();
    socketRef.current?.disconnect();
    clearInterval(totalTimerRef.current);
    clearInterval(sectionTimerRef.current);
  }, []);

  /* ════════════════════════════════════════
     EARLY RETURNS
  ════════════════════════════════════════ */
  if (loading) return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center">
      <FontLoader />
      <Loader2 size={24} className="text-indigo-400 animate-spin" />
    </div>
  );

  if (result) return (
    <ResultScreen result={result} onDone={() => navigate("/student-dashboard")} />
  );

  /* ── render-time derived values ── */
  const totalWarnings   = tabCount + faceCount + devCount;
  const isLowTime       = totalSecs > 0 && totalSecs < 300;
  const isStrictSection = !!(activeSection?.strictTimer && activeSection?.duration > 0);

  // Active section is strict and NOT yet submitted → blocks all other tab navigation
  const activeIsUnsubmittedStrict = isStrictSection && !lockedSections.has(activeSectionIdx);

  // Nearest non-locked section scanning backward (for back arrow)
  const prevNonLockedIdx = (() => {
    for (let i = activeSectionIdx - 1; i >= 0; i--) {
      if (!lockedSections.has(i)) return i;
    }
    return null;
  })();
  const canGoBack = prevNonLockedIdx !== null && !activeIsUnsubmittedStrict;

  // Nearest non-locked section scanning forward (for forward arrow + bottom button)
  const nextNavigableIdx = (() => {
    for (let i = activeSectionIdx + 1; i < sections.length; i++) {
      if (!lockedSections.has(i)) return i;
    }
    return null;
  })();

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none"
    >
      <FontLoader />

      {/* ════ HEADER ════ */}
      <header className="h-14 shrink-0 flex items-center justify-between px-5 bg-zinc-950 border-b border-zinc-800">

        {/* left: title */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
              {testData?.title}
            </p>
            <p className="mono text-[10px] text-zinc-600">{user?.username ?? user?.email}</p>
          </div>
          {started && (
            <span className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10
              border border-emerald-500/20 px-2.5 py-1 rounded-lg mono text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE
            </span>
          )}
        </div>

        {/* center: timers */}
        {started && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border mono text-sm font-bold transition-all
              ${isLowTime
                ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
                : "bg-zinc-900    border-zinc-800    text-zinc-200"}`}>
              <Clock size={12} className={isLowTime ? "text-rose-400" : "text-zinc-500"} />
              {fmt(totalSecs)}
            </div>
            {sectionSecs > 0 && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border mono text-xs transition-all
                ${isStrictSection
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                  : "bg-zinc-900     border-zinc-800    text-zinc-400"}`}>
                {isStrictSection && <LockIcon size={9} />}
                <span className="mono text-[9px] uppercase tracking-widest text-zinc-600">SEC</span>
                {fmt(sectionSecs)}
              </div>
            )}
          </div>
        )}

        {/* right: count + warnings + submit */}
        <div className="flex items-center gap-2 shrink-0">
          {started && (
            <>
              <div className="hidden sm:flex items-center gap-1 mono text-[10px] text-zinc-500
                bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                <Hash size={10} />{answeredCount}/{totalQuestions}
              </div>
              {totalWarnings > 0 && (
                <div className="flex items-center gap-1 mono text-[10px] text-rose-400
                  bg-rose-500/8 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                  <ShieldAlert size={10} /> {totalWarnings}
                </div>
              )}
              <button
                onClick={() => setShowSubmit(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                  bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
              >
                <Send size={13} /> Submit
              </button>
            </>
          )}
        </div>
      </header>

      {/* ════ BODY ════ */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: camera sidebar */}
        <ExamSidebar
          started={started}
          cameraVideoRef={cameraVideoRef}
          screenSharing={screenSharing}
          warning={warning}
          warningCount={warningCount}
          tabCount={tabCount}
          faceCount={faceCount}
          devCount={devCount}
          escCount={escCount}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          onStart={startExam}
          onDetect={handleDetect}
        />

        {/* CENTER */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* scrollable section tabs */}
          <SectionTabs
            sections={sections}
            activeSectionIdx={activeSectionIdx}
            lockedSections={lockedSections}
            isStrictSection={isStrictSection}
            answers={answers}
            onSelect={setActiveSectionIdx}
          />

          {/* section info bar + nav arrows */}
          {activeSection && started && (
            <>
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-zinc-200 text-sm">{activeSection.title}</h2>
                    {isStrictSection && (
                      <span className="flex items-center gap-1 mono text-[9px] text-amber-400
                        bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <LockIcon size={8} /> Strict
                      </span>
                    )}
                  </div>
                  <p className="mono text-[10px] text-zinc-600 mt-0.5">
                    {activeSection.questions.length} questions
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { if (prevNonLockedIdx !== null) setActiveSectionIdx(prevNonLockedIdx); }}
                    disabled={!canGoBack}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800
                      text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed
                      hover:border-zinc-700 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="mono text-[10px] text-zinc-600 px-1">
                    {activeSectionIdx + 1}/{sections.length}
                  </span>
                  <button
                    onClick={() => {
                      if (isStrictSection) { setShowSectionSubmit(true); }
                      else if (nextNavigableIdx !== null) { setActiveSectionIdx(nextNavigableIdx); }
                    }}
                    disabled={nextNavigableIdx === null && !isStrictSection}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800
                      text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed
                      hover:border-zinc-700 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* strict warning banner */}
              {isStrictSection && (
                <div className="shrink-0 flex items-center gap-2 px-5 py-2 bg-amber-500/5 border-b border-amber-500/15">
                  <LockIcon size={11} className="text-amber-500 shrink-0" />
                  <p className="mono text-[10px] text-amber-500/80">
                    Strict section — you cannot return after moving forward.
                  </p>
                </div>
              )}
            </>
          )}

          {/* questions scroll area */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-4"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
          >
            {!started ? (
              /* pre-start placeholder */
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Camera size={22} className="text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400 font-medium">Start the exam to see questions</p>
                  <p className="mono text-[11px] text-zinc-700 mt-1">
                    {totalQuestions} questions · {testData?.duration} min
                  </p>
                </div>
                <button
                  onClick={startExam}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500
                    hover:bg-indigo-400 font-semibold text-white transition-colors"
                >
                  Start Exam
                </button>
              </div>
            ) : (
              <>
                {activeSection?.questions.map((q, qi) => (
                  <QuestionCard
                    key={q._id ?? qi}
                    question={q}
                    qIndex={qi}
                    sectionId={activeSection._id}
                    answer={answers[`${activeSection._id}_${qi}`] ?? ""}
                    onAnswer={handleAnswer}
                  />
                ))}

                {/* next section button */}
                {nextNavigableIdx !== null && (
                  <button
                    onClick={() => isStrictSection
                      ? setShowSectionSubmit(true)
                      : setActiveSectionIdx(nextNavigableIdx)}
                    className="w-full py-3 rounded-2xl border border-dashed border-zinc-800
                      text-sm text-zinc-600 hover:border-indigo-500/30 hover:text-indigo-400
                      hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2"
                  >
                    {isStrictSection
                      ? <><LockIcon size={13} /> Submit Section & Continue</>
                      : <>Next: {sections[nextNavigableIdx]?.title} <ChevronRight size={14} /></>}
                  </button>
                )}

                {/* finish / submit section button (last navigable section) */}
                {nextNavigableIdx === null && (
                  <button
                    onClick={() => isStrictSection
                      ? setShowSectionSubmit(true)
                      : setShowSubmit(true)}
                    className="w-full py-3 rounded-2xl border border-dashed border-zinc-800
                      text-sm text-zinc-600 hover:border-indigo-500/30 hover:text-indigo-400
                      hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2"
                  >
                    {isStrictSection
                      ? <><LockIcon size={13} /> Submit Section & Finish</>
                      : <><Send size={14} /> Finish & Submit Exam</>}
                  </button>
                )}
              </>
            )}
          </div>
        </main>

        {/* RIGHT: question palette */}
        {started && (
          <QuestionPalette
            sections={sections}
            activeSectionIdx={activeSectionIdx}
            lockedSections={lockedSections}
            isStrictSection={isStrictSection}
            answers={answers}
            onJump={({ sectionIdx, qKey }) => {
              setActiveSectionIdx(sectionIdx);
              setTimeout(() => {
                document.querySelector(`[data-qkey="${qKey}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 50);
            }}
          />
        )}
      </div>

      {/* ════ OVERLAYS ════ */}
      <AnimatePresence>
        {showSubmit && (
          <SubmitDialog
            answered={answeredCount}
            total={totalQuestions}
            submitting={submitting}
            onConfirm={() => finishExam(false)}
            onCancel={() => setShowSubmit(false)}
          />
        )}
        {showSectionSubmit && (
          <SectionSubmitDialog
            sectionName={activeSection?.title ?? ""}
            answeredInSection={
              (activeSection?.questions ?? [])
                .filter((_, qi) => answers[`${activeSection._id}_${qi}`]).length
            }
            totalInSection={activeSection?.questions?.length ?? 0}
            isLastSection={nextNavigableIdx === null}
            onConfirm={() => advanceSection(activeSectionIdx, isStrictSection)}
            onCancel={() => setShowSectionSubmit(false)}
          />
        )}
      </AnimatePresence>

      {/* fullscreen-required overlay */}
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
          <button
            onClick={() => { document.documentElement.requestFullscreen().catch(() => {}); setBlocked(false); }}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-semibold text-white transition-colors"
          >
            Return to Exam
          </button>
        </div>
      )}

      {/* camera-blocked overlay */}
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
          <button
            onClick={() => { setCameraBlocked(false); startExam(); }}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-semibold text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
