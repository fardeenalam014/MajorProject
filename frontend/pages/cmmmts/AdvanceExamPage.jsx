import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FaceTracker from "../components/FaceTracker";
import ObjectDetector from "../components/ObjectDetector";
import Logo from "../components/Logo";
import {
  ShieldAlert, Camera, CheckCircle2,
  ChevronLeft, ChevronRight, Zap,
  AlertTriangle, Activity, Eye,
  BookOpen, Hash, SendHorizonal,
  Circle, Wifi, Clock, LogOut,
} from "lucide-react";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
    @keyframes slide-in {
      from { opacity: 0; transform: translateX(10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .slide-in { animation: slide-in .22s ease both; }
    .fade-in  { animation: fade-in  .3s  ease both; }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
  `}</style>
);

const OPT_LABELS = ["A", "B", "C", "D", "E", "F"];

function safeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (typeof value.text  === "string") return value.text;
    if (typeof value.label === "string") return value.label;
    if (typeof value.value === "string") return value.value;
    if (typeof value.name  === "string") return value.name;
    return JSON.stringify(value);
  }
  return String(value);
}

/* ── Section countdown timer ── */
function SectionTimer({ seconds, onExpire }) {
  const [rem, setRem] = useState(seconds);
  useEffect(() => {
    if (rem <= 0) { onExpire?.(); return; }
    const t = setInterval(() => setRem(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [rem]);
  const m = String(Math.floor(rem / 60)).padStart(2, "0");
  const s = String(rem % 60).padStart(2, "0");
  const urgent = rem < 60;
  return (
    <span className={`mono text-[10px] flex items-center gap-1
      ${urgent ? "text-red-400 animate-pulse" : "text-zinc-500"}`}>
      <Clock size={9} />{m}:{s}
    </span>
  );
}

export default function AdvanceExamPage() {
  const { testId } = useParams();
  const navigate   = useNavigate();

  const videoRef        = useRef(null);
  const displayVideoRef = useRef(null);

  const [test, setTest]                 = useState(null);
  const [started, setStarted]           = useState(false);
  const [warning, setWarning]           = useState("");
  const [warningCount, setWarningCount] = useState(0);
  const [animKey, setAnimKey]           = useState(0);

  // Section-wise navigation
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [currentQ, setCurrentQ]                 = useState(0);
  const [answers, setAnswers]                   = useState({});  // key: `${sIdx}-${qIdx}`

  const goToQ = useCallback((idxOrUpdater) => {
    setCurrentQ(idxOrUpdater);
    setAnimKey(k => k + 1);
  }, []);

  const goToSection = useCallback((si) => {
    setActiveSectionIdx(si);
    setCurrentQ(0);
    setAnimKey(k => k + 1);
  }, []);

  /* ── load test ── */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("tests")) || [];
      const found = saved.find(t => String(t.id) === String(testId));
      if (!found) { alert("Test not found!"); navigate("/student-dashboard"); }
      else setTest(found);
    } catch { navigate("/student-dashboard"); }
  }, [testId, navigate]);

  /* ── detection handler ── */
  const handleDetect = useCallback((msg) => {
    setWarning(msg);
    setWarningCount(c => c + 1);
    setTimeout(() => setWarning(""), 3000);
  }, []);

  /* ── sync display video ── */
  useEffect(() => {
    if (started && displayVideoRef.current && videoRef.current?.srcObject)
      displayVideoRef.current.srcObject = videoRef.current.srcObject;
  }, [started]);

  /* ── start exam ── */
  const startExam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      if (displayVideoRef.current) displayVideoRef.current.srcObject = stream;
      try { await document.documentElement.requestFullscreen(); } catch (_) {}
      setStarted(true);
    } catch { alert("Camera permission required!"); }
  };

  const handleAnswer = (val) =>
    setAnswers(prev => ({ ...prev, [`${activeSectionIdx}-${currentQ}`]: val }));

  const submitExam = () => {
    alert("Exam Submitted Successfully!");
    navigate("/student-dashboard");
  };

  if (!test) return null;

  const sections      = test?.sections ?? [];
  const activeSection = sections[activeSectionIdx] ?? { questions: [], name: "Section" };
  const questions     = activeSection.questions ?? [];
  const question      = questions[currentQ] ?? {};
  const totalQ        = questions.length;
  const currentAns    = answers[`${activeSectionIdx}-${currentQ}`];
  const progress      = totalQ <= 1 ? 100 : (currentQ / (totalQ - 1)) * 100;

  const qText    = safeText(question?.text ?? question?.question ?? question?.title ?? "");
  const qType    = question?.type ?? "mcq";
  const qOptions = Array.isArray(question?.options) ? question.options : [];

  const sectionAnswered = (si) =>
    (sections[si]?.questions ?? []).filter((_, qi) => answers[`${si}-${qi}`] !== undefined).length;

  const totalAnswered = sections.reduce((a, _, si) => a + sectionAnswered(si), 0);
  const totalAll      = sections.reduce((a, s) => a + (s.questions?.length ?? 0), 0);

  const isLastSection = activeSectionIdx === sections.length - 1;
  const isLastQ       = currentQ === totalQ - 1;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      <FontLoader />

      {/* Always-mounted hidden video + trackers (MediaPipe stable) */}
      <video ref={videoRef} autoPlay muted playsInline
        style={{ position:"fixed", top:0, left:0, width:1, height:1, opacity:0, pointerEvents:"none", zIndex:-1 }} />
      <FaceTracker videoRef={videoRef} onDetect={handleDetect} />
      <ObjectDetector videoRef={videoRef} onDetect={handleDetect} />

      {/* ── HEADER ── */}
      <header className="h-14 shrink-0 flex items-center justify-between px-5
        bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <BookOpen size={13} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-200 leading-none">{test.title}</p>
            <p className="mono text-[9px] text-zinc-600 mt-0.5 uppercase tracking-widest">
              Secure Exam Mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {started && (
            <span className="mono text-[10px] text-zinc-500 hidden sm:block">
              {totalAnswered}/{totalAll} answered
            </span>
          )}
          <div className={`flex items-center gap-1.5 mono text-[11px] px-3 py-1
            rounded-full border transition-all
            ${warningCount > 0
              ? "bg-red-500/10 text-red-400 border-red-500/25"
              : "bg-zinc-900 text-zinc-500 border-zinc-800"}`}>
            <ShieldAlert size={11} />
            {warningCount} warning{warningCount !== 1 ? "s" : ""}
          </div>
          {started && (
            <button onClick={submitExam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                text-zinc-500 hover:text-red-400 border border-zinc-800
                hover:border-red-500/30 hover:bg-red-500/8 transition-all">
              <LogOut size={12} />
              <span className="hidden sm:block">Exit</span>
            </button>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: question area ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {!started ? (
            /* START SCREEN */
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 fade-in">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20
                flex items-center justify-center">
                <Zap size={28} className="text-indigo-400" />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">{test.title}</h2>
                <p className="mono text-xs text-zinc-500 tracking-widest uppercase">
                  AI-Proctored · Camera Required · Fullscreen
                </p>
              </div>

              <div className="flex gap-6">
                {[
                  { label: "Questions", value: totalAll },
                  { label: "Sections",  value: sections.length },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="mono text-3xl font-semibold text-indigo-400">{s.value}</div>
                    <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 max-w-xs w-full">
                {[
                  "Camera access will be enabled",
                  "Exam opens in full-screen mode",
                  "Your face must remain visible",
                  "Suspicious activity is auto-flagged",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <button onClick={startExam}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold
                  bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
                <Zap size={15} />
                Begin Examination
              </button>
            </div>

          ) : (
            /* EXAM SCREEN */
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* section tabs */}
              <div className="shrink-0 flex items-center gap-1.5 px-5 py-3 border-b border-zinc-800
                overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {sections.map((s, si) => {
                  const answered = sectionAnswered(si);
                  const total    = s.questions?.length ?? 0;
                  const isActive = si === activeSectionIdx;
                  return (
                    <button key={si} onClick={() => goToSection(si)}
                      className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl
                        text-sm font-medium border transition-all
                        ${isActive
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                        }`}>
                      {s.name}
                      <span className={`mono text-[9px] px-1.5 py-0.5 rounded border
                        ${answered === total && total > 0
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-zinc-600 bg-zinc-800 border-zinc-700"
                        }`}>
                        {answered}/{total}
                      </span>
                      {isActive && s.time && (
                        <SectionTimer
                          seconds={Number(s.time) * 60}
                          onExpire={() => {
                            handleDetect(`Time's up for ${s.name}!`);
                            if (si < sections.length - 1) goToSection(si + 1);
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* progress bar */}
              <div className="shrink-0 flex items-center gap-3 px-5 py-2.5
                border-b border-zinc-800/60">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }} />
                </div>
                <span className="mono text-[10px] text-zinc-500 whitespace-nowrap">
                  {currentQ + 1} / {totalQ}
                </span>
              </div>

              {/* question card */}
              <div className="flex-1 overflow-y-auto p-5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
                <div key={animKey}
                  className="slide-in bg-zinc-900 border border-zinc-800 rounded-2xl p-6
                    space-y-5 max-w-3xl">

                  {/* type badge + marks */}
                  <div className="flex items-center gap-2">
                    {qType === "mcq"
                      ? <><Circle size={9} className="text-indigo-400" /><span className="mono text-[10px] text-indigo-400 uppercase tracking-widest">Multiple Choice</span></>
                      : <><Hash   size={9} className="text-amber-400"  /><span className="mono text-[10px] text-amber-400 uppercase tracking-widest">Numerical</span></>
                    }
                    {question?.marks && (
                      <span className="ml-auto mono text-[10px] text-zinc-600">
                        {question.marks} pts
                      </span>
                    )}
                  </div>

                  {/* question image */}
                  {question?.image && (
                    <img src={question.image} alt="question"
                      className="h-40 rounded-xl object-cover border border-zinc-800" />
                  )}

                  {/* question text */}
                  <p className="text-base font-medium text-zinc-200 leading-relaxed">
                    {qText || <span className="text-zinc-600 italic">No question text</span>}
                  </p>

                  {/* MCQ options */}
                  {qType === "mcq" && (
                    <div className="flex flex-col gap-2.5">
                      {qOptions.map((opt, i) => {
                        const label = safeText(opt);
                        const sel   = currentAns === label;
                        return (
                          <button key={i} onClick={() => handleAnswer(label)}
                            className={`flex items-center gap-4 w-full text-left px-4 py-3.5
                              rounded-xl border text-sm transition-all
                              ${sel
                                ? "bg-indigo-500/10 border-indigo-500/50 text-zinc-100"
                                : "bg-zinc-800/40 border-zinc-700/40 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
                              }`}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center
                              mono text-[11px] font-semibold shrink-0 transition-all
                              ${sel ? "bg-indigo-500 text-white" : "bg-zinc-700 text-zinc-400"}`}>
                              {sel ? <CheckCircle2 size={13} /> : OPT_LABELS[i]}
                            </div>
                            <span className="flex-1">{label}</span>
                            {typeof opt === "object" && opt?.image && (
                              <img src={opt.image} alt=""
                                className="h-12 rounded-lg object-cover ml-2 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* numerical */}
                  {qType === "numerical" && (
                    <div className="flex flex-col gap-1.5 max-w-xs">
                      <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
                        Your Answer
                      </label>
                      <input type="number"
                        value={currentAns ?? ""}
                        onChange={e => handleAnswer(e.target.value)}
                        placeholder="0"
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3
                          mono text-xl text-indigo-400 outline-none
                          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15
                          transition-all placeholder:text-zinc-700" />
                    </div>
                  )}
                </div>
              </div>

              {/* nav bar */}
              <div className="shrink-0 flex items-center justify-between px-5 py-3
                border-t border-zinc-800 bg-zinc-950">

                {/* dot map */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {questions.map((_, i) => {
                    const hasAns = answers[`${activeSectionIdx}-${i}`] !== undefined;
                    const isCur  = i === currentQ;
                    return (
                      <button key={i} onClick={() => goToQ(i)} title={`Q${i + 1}`}
                        className={`rounded-full transition-all duration-150
                          ${isCur
                            ? "w-3 h-3 bg-indigo-400 scale-125"
                            : hasAns
                            ? "w-2 h-2 bg-emerald-500 hover:scale-125"
                            : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500 hover:scale-125"
                          }`}
                        style={isCur ? { boxShadow:"0 0 6px rgba(99,102,241,.6)" } : {}}
                      />
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button disabled={currentQ === 0}
                    onClick={() => goToQ(q => q - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                      border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700
                      disabled:opacity-30 disabled:pointer-events-none transition-all">
                    <ChevronLeft size={15} /> Prev
                  </button>

                  {isLastSection && isLastQ ? (
                    <button onClick={submitExam}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
                        bg-emerald-500/10 border border-emerald-500/30 text-emerald-400
                        hover:bg-emerald-500/20 transition-all">
                      <SendHorizonal size={14} /> Submit
                    </button>
                  ) : isLastQ && !isLastSection ? (
                    <button onClick={() => goToSection(activeSectionIdx + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold
                        bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
                      Next Section <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button onClick={() => goToQ(q => q + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold
                        bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
                      Next <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: proctor panel ── */}
        {started && (
          <div className="w-60 shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-950">

            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2 mono text-[10px] text-zinc-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Proctor
              </div>
              <div className="flex items-center gap-1.5 mono text-[10px] text-emerald-400">
                <Wifi size={10} /> Live
              </div>
            </div>

            {/* camera */}
            <div className="relative h-40 bg-black overflow-hidden shrink-0">
              <video ref={displayVideoRef} autoPlay muted playsInline
                className="w-full h-full object-cover" />
              {warning && (
                <div className="absolute inset-x-2 bottom-2 flex items-start gap-1.5 p-2
                  rounded-lg bg-red-950/90 border border-red-500/30 mono text-[10px]
                  text-red-300 leading-relaxed">
                  <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                  {warning}
                </div>
              )}
              <span className="absolute top-2 right-2 mono text-[9px] text-red-400
                border border-red-500/30 bg-zinc-950/70 rounded px-1.5 py-0.5 uppercase">
                ● REC
              </span>
            </div>

            {/* status rows */}
            <div className="mx-3 mt-3 rounded-xl border border-zinc-800 overflow-hidden shrink-0">
              {[
                { icon: <Camera size={10} />,      label: "Camera",   value: "Online",              cls: "text-emerald-400" },
                { icon: <ShieldAlert size={10} />,  label: "Warnings", value: `${warningCount}`,    cls: warningCount === 0 ? "text-emerald-400" : warningCount < 3 ? "text-amber-400" : "text-red-400" },
                { icon: <Activity size={10} />,    label: "Answered", value: `${totalAnswered}/${totalAll}`, cls: "text-zinc-300" },
                { icon: <Eye size={10} />,         label: "Status",   value: "Active",              cls: "text-indigo-400" },
              ].map((row, i, arr) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2.5
                  ${i < arr.length - 1 ? "border-b border-zinc-800/70" : ""}`}>
                  <div className="flex items-center gap-2 mono text-[10px] text-zinc-500 uppercase tracking-wider">
                    {row.icon} {row.label}
                  </div>
                  <span className={`mono text-[10px] ${row.cls}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* question map for current section */}
            <div className="flex-1 overflow-y-auto px-3 mt-3 pb-3"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
              <p className="mono text-[9px] text-zinc-600 uppercase tracking-widest mb-2">
                {activeSection.name}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, i) => {
                  const hasAns = answers[`${activeSectionIdx}-${i}`] !== undefined;
                  return (
                    <button key={i} onClick={() => goToQ(i)}
                      className={`h-8 rounded-lg mono text-[10px] border transition-all hover:scale-105
                        ${i === currentQ
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                          : hasAns
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                        }`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}