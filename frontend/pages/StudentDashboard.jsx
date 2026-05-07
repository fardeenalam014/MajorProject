import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, PlusCircle, PlayCircle, Trash2, Search,
  BookOpen, Clock, CheckCircle2, Hash, ShieldAlert,
  BarChart3, Timer, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { testAPI, enrollmentAPI, attemptAPI } from "../utils/api";
import ThemeSwitcher from "../components/ThemeSwitcher";




const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
  `}</style>
);

function StatCard({ label, value, color, loading }) {
  const colors = {
    indigo:  "text-indigo-400  bg-indigo-500/8   border-indigo-500/15",
    amber:   "text-amber-400   bg-amber-500/8    border-amber-500/15",
    emerald: "text-emerald-400 bg-emerald-500/8  border-emerald-500/15",
  };
  return (
    <div className={`rounded-2xl border px-6 py-5 ${colors[color]}`}>
      <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
      {loading
        ? <div className="h-9 w-12 bg-zinc-800 rounded-lg animate-pulse" />
        : <p className={`text-4xl font-bold ${colors[color].split(" ")[0]}`}>{value}</p>
      }
    </div>
  );
}

function MiniBar({ pct, color = "#6366f1" }) {
  return (
    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

/* ─── merge enrollment + latest attempt into a display object ─── */
const mergeTestData = (enrollment, attempts) => {
  const test = enrollment.test ?? {};

  // find latest attempt for this test
  const relevant = (attempts ?? [])
    .filter(a => {
      const aTestId = a.test?._id ?? a.test ?? "";
      const eTestId = test._id ?? "";
      return String(aTestId) === String(eTestId);
    })
    .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0));

  const latest = relevant[0] ?? null;

  // total marks from test sections
  const totalMarks = (test.sections ?? []).reduce(
    (sum, sec) => sum + (sec.questions ?? []).reduce((q, qu) => q + (qu.marks ?? 1), 0),
    0
  );

  const score    = latest?.score ?? null;
  const pct      = totalMarks > 0 && score !== null
    ? Math.round((score / totalMarks) * 100)
    : null;

  return {
    enrollmentId: enrollment._id,
    id:           test._id,
    title:        test.title        ?? "Untitled",
    duration:     test.duration     ?? 0,
    testCode:     test.testCode     ?? "",
    sections:     test.sections     ?? [],
    status:       latest ? "completed" : "pending",
    score,
    totalMarks,
    pct,
    timeTaken:    latest?.timeTaken    ?? null,
    tabSwitches:  latest?.tabSwitches  ?? 0,
    faceWarnings: latest?.faceWarnings ?? 0,
    deviceFlags:  latest?.deviceFlags  ?? 0,
    submittedAt:  latest?.submittedAt  ?? null,
    passPercentage: test.settings?.passPercentage ?? 40,
  };
};

/* ════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════ */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout } = useAuth();

  const [testCode,  setTestCode]  = useState("");
  const [tests,     setTests]     = useState([]);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const [joinErr,   setJoinErr]   = useState("");

  const [loading,   setLoading]   = useState(true);
  const [joining,   setJoining]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast,     setToast]     = useState(null); // { type, msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* ─── fetch enrollments + attempts, then merge ─── */
  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: enData }, { data: atData }] = await Promise.all([
      enrollmentAPI.myEnrollments(),
      attemptAPI.myAttempts(),
    ]);

    const enrollments = enData?.enrollments ?? [];
    const attempts    = atData?.attempts    ?? [];

    const merged = enrollments.map(e => mergeTestData(e, attempts));
    setTests(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, [loadData]);

  /* ─── join by test code ─── */
  const joinTest = async () => {
    setJoinErr("");
    const code = testCode.trim().toUpperCase();
    if (!code) return;

    setJoining(true);

    // 1. look up the test
    const { data: testData, error: testErr } = await testAPI.getByCode(code);
    if (testErr || !testData?.test) {
      setJoinErr(testErr ?? "Test not found.");
      setJoining(false);
      return;
    }

    const found = testData.test;

    // 2. already enrolled?
    if (tests.find(t => String(t.id) === String(found._id))) {
      setJoinErr("You've already joined this test.");
      setJoining(false);
      return;
    }

    // 3. enroll
    const { error: enrollErr } = await enrollmentAPI.enroll(found._id);
    if (enrollErr) {
      setJoinErr(enrollErr);
      setJoining(false);
      return;
    }

    setTestCode("");
    showToast("success", `Joined "${found.title}"!`);
    await loadData(); // refresh from server
    setJoining(false);
  };

  /* ─── start exam — store minimal info then navigate ─── */
  const startTest = (t) => {
    localStorage.setItem("activeTestId",      t.id);
    localStorage.setItem("activeStudentUser", authUser?.email ?? authUser?.username ?? "");
    localStorage.setItem("currentTest",       JSON.stringify({ ...t, id: t.id, _id: t.id }));
    navigate(`/exam/${t.id}`);
  };

  /* ─── unenroll (delete from student's list) ─── */
  const unenrollTest = async (enrollmentId, testTitle) => {
    if (!window.confirm(`Remove "${testTitle}" from your list?`)) return;
    setDeletingId(enrollmentId);

    // optimistic update
    setTests(prev => prev.filter(t => t.enrollmentId !== enrollmentId));


    setDeletingId(null);
    showToast("success", "Removed from your list.");
  };

  const logout = () => { authLogout(); navigate("/"); };

  const filtered = tests
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
    .filter(t => filter === "all" || t.status === filter);

  const total     = tests.length;
  const pending   = tests.filter(t => t.status === "pending").length;
  const completed = tests.filter(t => t.status === "completed").length;
  const displayName = authUser?.username ?? authUser?.email ?? "Student";
  const initials    = displayName.slice(0, 2).toUpperCase();

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex">
      <FontLoader />
      

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
              px-4 py-3 rounded-xl border shadow-xl text-sm font-medium
              ${toast.type === "success"
                ? "bg-emerald-950 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950 border-rose-500/30 text-rose-300"}`}
          >
            {toast.type === "success"
              ? <CheckCircle2 size={15} />
              : <AlertCircle  size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-800 bg-zinc-950">
        <div className="px-5 py-4 border-b border-zinc-800"><Logo size="sm" /></div>
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30
              flex items-center justify-center mono text-xs text-indigo-400 font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Student</p>
              <p className="text-sm font-medium text-zinc-200 truncate">{displayName}</p>
              <p className="mono text-[10px] text-zinc-600 truncate">{authUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-1">
          <button onClick={loadData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500
              hover:text-zinc-200 hover:bg-zinc-900 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="flex-1" />
        <div className="px-4 pb-5">
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500
              hover:text-red-400 hover:bg-red-500/8 transition-all">
            <LogOut size={14} /> Sign out
          </button>
          
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>

        {/* topbar */}
        <div className="sticky top-3 z-10 h-14 flex items-center justify-between px-6
          bg-zinc-950/95   backdrop-blur-sm shrink-0">
          <div>
            <h1 className="font-semibold text-sm text-zinc-200">Student Dashboard</h1>
            
          </div>
          <button onClick={logout}
            className="md:hidden text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut size={14} />
          </button>
          <ThemeSwitcher />
        </div>

        <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">

          {/* stat cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total"     value={total}     color="indigo"  loading={loading} />
            <StatCard label="Pending"   value={pending}   color="amber"   loading={loading} />
            <StatCard label="Completed" value={completed} color="emerald" loading={loading} />
          </div>

          {/* join by code */}
          <div className="space-y-1.5">
            <div className="flex gap-3">
              <div className={`flex-1 flex items-center gap-2 bg-zinc-900 border rounded-xl px-4
                focus-within:ring-1 transition-all
                ${joinErr
                  ? "border-rose-500/50 focus-within:ring-rose-500/20"
                  : "border-zinc-800 focus-within:border-indigo-500/50 focus-within:ring-indigo-500/20"}`}>
                <Hash size={13} className="text-zinc-600 shrink-0" />
                <input
                  value={testCode}
                  onChange={e => { setTestCode(e.target.value.toUpperCase()); setJoinErr(""); }}
                  onKeyDown={e => e.key === "Enter" && joinTest()}
                  placeholder="Enter Test Code to join…"
                  className="flex-1 py-3 bg-transparent mono text-sm text-zinc-300
                    placeholder:text-zinc-600 outline-none tracking-widest"
                />
              </div>
              <button onClick={joinTest} disabled={joining}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                  bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed
                  text-white transition-colors shrink-0">
                {joining ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
                {joining ? "Joining…" : "Join"}
              </button>
            </div>
            {joinErr && (
              <p className="mono text-[11px] text-rose-400 pl-1 flex items-center gap-1">
                <AlertCircle size={11} /> {joinErr}
              </p>
            )}
          </div>

          {/* search + filter */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800
              rounded-xl px-4 focus-within:border-zinc-700 transition-all">
              <Search size={13} className="text-zinc-600 shrink-0" />
              <input
                placeholder="Search tests…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 py-2.5 bg-transparent text-sm text-zinc-300
                  placeholder:text-zinc-600 outline-none"
              />
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {["all", "pending", "completed"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg mono text-[10px] uppercase tracking-widest
                    transition-all duration-150
                    ${filter === f ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── loading skeleton ── */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  <div className="h-10 bg-zinc-800 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          )}

          {/* ── empty state ── */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800
                flex items-center justify-center">
                <BookOpen size={20} className="text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">No tests here</p>
              <p className="mono text-[11px] text-zinc-700">
                {search ? "Try a different search" : "Join a test with a Test Code above"}
              </p>
            </div>
          )}

          {/* ── test cards ── */}
          {!loading && filtered.length > 0 && (
            <AnimatePresence mode="popLayout">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(t => (
                  <motion.div key={t.enrollmentId ?? t.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5
                      hover:border-zinc-700 transition-colors flex flex-col"
                  >
                    {/* header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h2 className="font-semibold text-sm text-zinc-200 leading-snug">{t.title}</h2>
                      <span className={`mono text-[9px] uppercase tracking-widest px-2 py-1
                        rounded-md border shrink-0
                        ${t.status === "completed"
                          ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                          : "text-amber-400   bg-amber-500/8   border-amber-500/20"}`}>
                        {t.status}
                      </span>
                    </div>

                    {/* meta */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {t.duration > 0 && (
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Clock size={10} />{t.duration} min
                        </div>
                      )}
                      {t.testCode && (
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-600">
                          <Hash size={10} />{t.testCode}
                        </div>
                      )}
                      {t.status === "completed" && t.timeTaken != null && (
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Timer size={10} />
                          {Math.floor(t.timeTaken / 60)}m {t.timeTaken % 60}s
                        </div>
                      )}
                    </div>

                    {/* result block */}
                    {t.status === "completed" && t.score !== null && (
                      <div className="mb-4 rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 size={11} className="text-zinc-500" />
                            <span className="mono text-[10px] text-zinc-500">Score</span>
                          </div>
                          <span className={`mono text-sm font-bold
                            ${t.pct >= 70 ? "text-emerald-400"
                              : t.pct >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                            {t.score}/{t.totalMarks}
                            <span className="text-[10px] text-zinc-500 ml-1">({t.pct}%)</span>
                          </span>
                        </div>
                        <MiniBar
                          pct={t.pct ?? 0}
                          color={t.pct >= 70 ? "#10b981" : t.pct >= 40 ? "#f59e0b" : "#f43f5e"}
                        />
                        <div className="flex items-center justify-between pt-0.5">
                          <span className={`mono text-[9px] px-2 py-0.5 rounded border
                            ${(t.pct ?? 0) >= t.passPercentage
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
                            {(t.pct ?? 0) >= t.passPercentage ? "PASS" : "FAIL"}
                          </span>
                          {(t.tabSwitches + t.faceWarnings + t.deviceFlags) > 0 && (
                            <div className="flex items-center gap-1 mono text-[10px] text-rose-400">
                              <ShieldAlert size={10} />
                              {t.tabSwitches + t.faceWarnings + t.deviceFlags} violations
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* actions */}
                    <div className="flex gap-2 mt-auto">
                      {t.status === "pending" && (
                        <button onClick={() => startTest(t)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                            text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white
                            transition-colors">
                          <PlayCircle size={14} /> Start Exam
                        </button>
                      )}
                      {t.status === "completed" && (
                        <div className="flex-1 flex items-center justify-center gap-2 py-2.5
                          rounded-lg text-sm text-emerald-400 bg-emerald-500/8
                          border border-emerald-500/20">
                          <CheckCircle2 size={14} /> Submitted
                        </div>
                      )}
                      <button
                        onClick={() => unenrollTest(t.enrollmentId, t.title)}
                        disabled={deletingId === t.enrollmentId}
                        className="w-9 flex items-center justify-center rounded-lg border
                          border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30
                          hover:bg-red-500/8 transition-all disabled:opacity-40">
                        {deletingId === t.enrollmentId
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}