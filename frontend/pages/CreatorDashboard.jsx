import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Trash2, Copy, Eye, EyeOff, PlusCircle, Clock, Hash,
  CheckCircle2, FileText, BarChart3, Users, X,
  Search, ShieldAlert, Award, Timer, Loader2, Radio,
} from "lucide-react";
import Logo             from "../components/Logo";
import LiveMonitorPanel from "../components/LiveMonitorPanel";
import { useAuth }       from "../context/AuthContext";
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

function StatCard({ label, value, color }) {
  const c = {
    indigo:  "text-indigo-400  bg-indigo-500/8   border-indigo-500/15",
    amber:   "text-amber-400   bg-amber-500/8    border-amber-500/15",
    emerald: "text-emerald-400 bg-emerald-500/8  border-emerald-500/15",
    rose:    "text-rose-400    bg-rose-500/8     border-rose-500/15",
  };
  return (
    <div className={`rounded-2xl border px-6 py-5 ${c[color]}`}>
      <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
      <p className={`text-4xl font-bold ${c[color].split(" ")[0]}`}>{value}</p>
    </div>
  );
}

function MiniBar({ pct, color = "#6366f1" }) {
  return (
    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

function VBadge({ count, label }) {
  const color = count === 0
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : count <= 2
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-rose-400 bg-rose-500/10 border-rose-500/20";
  return (
    <span className={`mono text-[9px] px-2 py-0.5 rounded border ${color}`}>
      {count} {label}
    </span>
  );
}

function SlideOver({ children, onClose, title, subtitle, extra }) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm flex items-start justify-end">
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-800 flex flex-col"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4
          bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div>
            <p className="text-sm font-semibold text-zinc-200">{title}</p>
            {subtitle && <p className="mono text-[10px] text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            {extra}

            <button onClick={onClose}
              className="w-14 flex items-center justify-center rounded-lg
                text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition-all">
              <X size={14}  />
            </button>
          </div>
        </div>
        {children}
      </motion.div>
    </div>
  );
}


function ResultsPanel({ test, onClose }) {
  const [data,       setData]       = useState(null);
  const [enrollData, setEnrollData] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      attemptAPI.forTest(test._id),
      enrollmentAPI.forTest(test._id),
    ]).then(([{ data: aData }, { data: eData }]) => {
      setData(aData);
      setEnrollData(eData);
      setLoading(false);
    });
  }, [test._id]);

  const attempts    = data?.attempts    ?? [];
  const analytics   = data?.analytics   ?? {};
  const enrollments = enrollData?.enrollments ?? [];

  return (
    <SlideOver onClose={onClose} title="Results & Analytics" subtitle={test.title}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
              Enrolled ({enrollments.length})
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {enrollments.length === 0
                ? <p className="text-xs text-zinc-600 text-center py-3">No students joined yet</p>
                : enrollments.map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{e.student?.username ?? "—"}</span>
                    <span className="mono text-[10px] text-zinc-600">
                      {new Date(e.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Attempts",  value: analytics.total      ?? 0,    col: "text-indigo-400",  bg: "bg-indigo-500/8  border-indigo-500/15"  },
              { label: "Avg Score", value: `${analytics.avg     ?? 0}%`, col: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
              { label: "Highest",   value: `${analytics.highest ?? 0}%`, col: "text-amber-400",   bg: "bg-amber-500/8   border-amber-500/15"   },
              { label: "Pass Rate", value: `${analytics.passRate ?? 0}%`, col: "text-rose-400",   bg: "bg-rose-500/8    border-rose-500/15"    },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                <p className="mono text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.col}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
              Score Distribution
            </p>
            {attempts.length === 0
              ? <p className="text-xs text-zinc-600 text-center py-4">No submissions yet</p>
              : [
                  { label: "90–100%",   check: p => p >= 90,           color: "#10b981" },
                  { label: "70–89%",    check: p => p >= 70 && p < 90, color: "#6366f1" },
                  { label: "50–69%",    check: p => p >= 50 && p < 70, color: "#f59e0b" },
                  { label: "Below 50%", check: p => p < 50,            color: "#f43f5e" },
                ].map(band => {
                  const cnt = attempts.filter(a => band.check(a.percentage ?? 0)).length;
                  return (
                    <div key={band.label} className="flex items-center gap-3 mb-2">
                      <span className="mono text-[10px] text-zinc-500 w-20 shrink-0">{band.label}</span>
                      <div className="flex-1">
                        <MiniBar pct={attempts.length ? (cnt / attempts.length) * 100 : 0} color={band.color} />
                      </div>
                      <span className="mono text-[10px] text-zinc-400 w-4 text-right">{cnt}</span>
                    </div>
                  );
                })
            }
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
              Student Scores ({attempts.length})
            </p>
            {attempts.length === 0
              ? <p className="text-xs text-zinc-600 text-center py-4">No submissions yet</p>
              : [...attempts].sort((a, b) => b.percentage - a.percentage).map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2
                  border-b border-zinc-800/60 last:border-0">
                  <span className="mono text-[10px] text-zinc-600 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{a.student?.username ?? "—"}</p>
                    <div className="mt-1">
                      <MiniBar pct={a.percentage}
                        color={a.percentage >= 70 ? "#10b981" : a.percentage >= 40 ? "#f59e0b" : "#f43f5e"} />
                    </div>
                  </div>
                  <span className={`mono text-[11px] font-bold shrink-0
                    ${a.percentage >= 70 ? "text-emerald-400"
                      : a.percentage >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                    {a.percentage}%
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </SlideOver>
  );
}


function AttemptsPanel({ test, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    Promise.all([
      attemptAPI.forTest(test._id),
      enrollmentAPI.forTest(test._id),
    ]).then(([{ data: aData }, { data: eData }]) => {
      setData({ attempts: aData?.attempts ?? [], enrollments: eData?.enrollments ?? [] });
      setLoading(false);
    });
  }, [test._id]);

  const attempts    = data?.attempts    ?? [];
  const enrollments = data?.enrollments ?? [];

  const filtered = attempts
    .filter(a => !search || (a.student?.username ?? "").toLowerCase().includes(search.toLowerCase()))
    .filter(a => filter === "all" ? true : filter === "pass" ? a.passed : !a.passed)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return (
    <SlideOver onClose={onClose} title="Student Attempt History" subtitle={test.title}>
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <span className="mono text-[10px] text-zinc-500 uppercase tracking-widest">Enrolled</span>
        <span className="mono text-sm font-bold text-indigo-400">{enrollments.length}</span>
      </div>

      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
          <Search size={12} className="text-zinc-600 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student…"
            className="flex-1 bg-transparent mono text-[11px] text-zinc-300 placeholder-zinc-700 outline-none" />
        </div>
        <div className="flex gap-1">
          {["all", "pass", "fail"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg mono text-[10px] uppercase tracking-wide
                transition-all border
                ${filter === f
                  ? f === "pass" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                    : f === "fail" ? "text-rose-400 bg-rose-500/10 border-rose-500/25"
                    : "text-indigo-400 bg-indigo-500/10 border-indigo-500/25"
                  : "text-zinc-500 border-zinc-800 hover:border-zinc-700"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="text-indigo-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <Users size={24} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">No attempts found</p>
          </div>
        ) : (
          filtered.map((a, i) => {
            const v = (a.violations?.tabSwitches ?? 0)
                    + (a.violations?.faceWarnings ?? 0)
                    + (a.violations?.deviceFlags  ?? 0);
            return (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700
                      flex items-center justify-center mono text-[10px] text-zinc-400 shrink-0">
                      {(a.student?.username ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{a.student?.username ?? "—"}</p>
                      <p className="mono text-[10px] text-zinc-600">
                        {new Date(a.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`mono text-xs font-bold
                      ${a.percentage >= 70 ? "text-emerald-400"
                        : a.percentage >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                      {a.percentage}%
                    </span>
                    <span className={`mono text-[9px] px-2 py-0.5 rounded border
                      ${a.passed
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-rose-400   bg-rose-500/10    border-rose-500/20"}`}>
                      {a.passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <MiniBar pct={a.percentage}
                    color={a.percentage >= 70 ? "#10b981" : a.percentage >= 40 ? "#f59e0b" : "#f43f5e"} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 mono text-[10px] text-zinc-600">
                    <Award size={9} />{a.score}/{a.totalMarks} marks
                  </span>
                  {a.timeTaken != null && (
                    <span className="flex items-center gap-1 mono text-[10px] text-zinc-600">
                      <Timer size={9} />{Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s
                    </span>
                  )}
                  {v > 0 && (
                    <span className="flex items-center gap-1 mono text-[10px] text-rose-400">
                      <ShieldAlert size={9} />{v} violation{v !== 1 ? "s" : ""}
                    </span>
                  )}
                  {a.abandoned && (
                    <span className="mono text-[9px] text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
                      abandoned
                    </span>
                  )}
                </div>
                {v > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <VBadge count={a.violations?.tabSwitches  ?? 0} label="tab switches" />
                    <VBadge count={a.violations?.faceWarnings ?? 0} label="face alerts"  />
                    <VBadge count={a.violations?.deviceFlags  ?? 0} label="device flags" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <p className="mono text-[10px] text-zinc-700 text-center">
          {filtered.length} of {attempts.length} submissions · {enrollments.length} enrolled
        </p>
      </div>
    </SlideOver>
  );
}


export default function CreatorDashboard() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();

  const [tests,    setTests]    = useState([]);
  const [copied,   setCopied]   = useState(null);
  const [panel,    setPanel]    = useState(null);
  const [pageLoad, setPageLoad] = useState(true);

  const loadTests = useCallback(async () => {
    const { data } = await testAPI.getMyTests();
    if (data) setTests(data.tests ?? []);
    setPageLoad(false);
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadTests();
    const id = setInterval(loadTests, 10000);
    return () => clearInterval(id);
  }, [loadTests, navigate, user]);

  const deleteTest    = async (id) => { await testAPI.delete(id);        loadTests(); };
  const togglePublish = async (id) => { await testAPI.togglePublish(id); loadTests(); };
  const copyCode      = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };
  const handleLogout = () => { logout(); navigate("/login"); };

  const totalTests     = tests.length;
  const publishedTests = tests.filter(t => t.published).length;
  const totalQuestions = tests.reduce((a, t) =>
    a + (t.sections?.reduce((s, sec) => s + (sec.questions?.length || 0), 0) || 0), 0);

  const initials = (user?.username ?? "?").slice(0, 2).toUpperCase();

  if (pageLoad) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <FontLoader />
        <Loader2 size={24} className="text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="h-screen min-w-screen bg-zinc-950 text-zinc-100 flex overflow-hidden">
      {}
      <FontLoader />

      {}
      <AnimatePresence>
        {panel?.type === "results"  && <ResultsPanel  test={panel.test} onClose={() => setPanel(null)} />}
        {panel?.type === "attempts" && <AttemptsPanel test={panel.test} onClose={() => setPanel(null)} />}
      </AnimatePresence>
      {panel?.type === "live" && (
        <LiveMonitorPanel test={panel.test} onClose={() => setPanel(null)} />
      )}

      {}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-800
        bg-zinc-950 h-full">
        {}
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0">
          <Logo size="sm" />
        </div>

        {}
        <div className="px-4 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30
              flex items-center justify-center mono text-xs text-indigo-400 font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Creator</p>
              <p className="text-sm font-medium text-zinc-200 truncate">{user?.username}</p>
              <p className="mono text-[10px] text-zinc-600 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {}
        <div className="px-4 pt-4 shrink-0">
          <button onClick={() => navigate("/create-test")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
              font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
            <PlusCircle size={14} /> New Test
          </button>
        </div>

        {}
        <div className="flex-1 min-h-0" />

        {}
        <div className="px-4 pb-5 shrink-0 border-t border-zinc-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 mt-3 rounded-lg text-sm
              text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {}
        <div className="h-14 shrink-0 flex items-center justify-between px-6
          bg-zinc-950/95  backdrop-blur-sm mt-3">
          <div>
            <h1 className="font-semibold text-sm text-zinc-200">Creator Dashboard</h1>
            
          </div>
          <button onClick={() => navigate("/create-test")}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
              font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
            <PlusCircle size={13} />
          </button>
          <ThemeSwitcher />
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-6 space-y-6"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
          <div className="max-w-5xl mx-auto space-y-6">

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Tests"     value={totalTests}     color="indigo"  />
              <StatCard label="Published"       value={publishedTests} color="emerald" />
              <StatCard label="Total Questions" value={totalQuestions} color="amber"   />
            </div>

            {tests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800
                  flex items-center justify-center">
                  <FileText size={20} className="text-zinc-700" />
                </div>
                <p className="text-sm text-zinc-500">No tests yet</p>
                <button onClick={() => navigate("/create-test")}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                    bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
                  <PlusCircle size={13} /> Create Test
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tests.map(t => {
                    const qCount   = t.sections?.reduce((s, sec) => s + (sec.questions?.length || 0), 0) || 0;
                    const enrolled = t.enrollCount  ?? 0;
                    const attempts = t.attemptCount ?? 0;

                    return (
                      <motion.div key={t._id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => navigate(`/create-test/${t._id}`)}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5
                          cursor-pointer hover:border-zinc-700 transition-colors flex flex-col"
                      >
                        {}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h2 className="font-semibold text-sm text-zinc-200 leading-snug line-clamp-2">
                            {t.title}
                          </h2>
                          <span className={`mono text-[9px] uppercase tracking-widest px-2 py-1
                            rounded-md border shrink-0
                            ${t.published
                              ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                              : "text-zinc-500    bg-zinc-800      border-zinc-700"}`}>
                            {t.published ? "Live" : "Draft"}
                          </span>
                        </div>

                        {}
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                            <Clock size={10} />{t.duration ?? "—"} min
                          </span>
                          <span className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                            <Hash size={10} />{qCount} Q
                          </span>
                          <span className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                            <Users size={10} />{enrolled} joined
                          </span>
                          {attempts > 0 && (
                            <span className="flex items-center gap-1.5 mono text-[10px] text-indigo-400">
                              <CheckCircle2 size={10} />{attempts} submitted
                            </span>
                          )}
                          {t.testCode && (
                            <span className="mono text-[10px] text-zinc-600 bg-zinc-800
                              px-1.5 py-0.5 rounded border border-zinc-700">
                              {t.testCode}
                            </span>
                          )}
                        </div>

                        {}
                        <div className="grid grid-cols-3 gap-1.5 mb-3"
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => setPanel({ type: "results", test: t })}
                            className="flex items-center justify-center gap-1 py-2 rounded-lg
                              border border-zinc-800 text-zinc-500 hover:text-indigo-400
                              hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
                            <BarChart3 size={11} />
                            <span className="mono text-[10px]">Results</span>
                          </button>
                          <button onClick={() => setPanel({ type: "live", test: t })}
                            className="flex items-center justify-center gap-1 py-2 rounded-lg
                              border border-zinc-800 text-zinc-500 hover:text-rose-400
                              hover:border-rose-500/30 hover:bg-rose-500/5 transition-all">
                            <Radio size={11} />
                            <span className="mono text-[10px]">Live</span>
                          </button>
                          <button onClick={() => setPanel({ type: "attempts", test: t })}
                            className="flex items-center justify-center gap-1 py-2 rounded-lg
                              border border-zinc-800 text-zinc-500 hover:text-emerald-400
                              hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                            <Users size={11} />
                            <span className="mono text-[10px]">Students</span>
                          </button>
                        </div>

                        {}
                        <div className="flex gap-2 mt-auto" onClick={e => e.stopPropagation()}>
                          <button onClick={() => copyCode(t.testCode)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                              border transition-all
                              ${copied === t.testCode
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/8"
                                : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
                            {copied === t.testCode ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                            {copied === t.testCode ? "Copied!" : "Copy Code"}
                          </button>
                          <button onClick={() => togglePublish(t._id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                              border transition-all
                              ${t.published
                                ? "border-amber-500/30 text-amber-400 bg-amber-500/8"
                                : "border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}>
                            {t.published ? <EyeOff size={12} /> : <Eye size={12} />}
                            {t.published ? "Unpublish" : "Publish"}
                          </button>
                          <button onClick={() => deleteTest(t._id)}
                            className="ml-auto w-16 h-16 flex items-center justify-center rounded-lg
                              border border-zinc-800 text-zinc-600 hover:text-red-400
                              hover:border-red-500/30 hover:bg-red-500/8 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}