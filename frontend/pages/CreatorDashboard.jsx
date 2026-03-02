import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Trash2, Copy, Eye, EyeOff, PlusCircle, Clock, Hash,
  CheckCircle2, FileText, BarChart3, Users, X, Radio,
  RefreshCw, Search, ShieldAlert, Award, Timer,
} from "lucide-react";
import Logo from "../components/Logo";
import {
  getAllTests, saveTests, getAttemptsForTest, getLiveSessions,
  getEnrollmentsForTest, getTotalMarks, getPct,
} from "../utils/Storage";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
  `}</style>
);

function StatCard({ label, value, color }) {
  const colors = {
    indigo:  "text-indigo-400  bg-indigo-500/8   border-indigo-500/15",
    amber:   "text-amber-400   bg-amber-500/8    border-amber-500/15",
    emerald: "text-emerald-400 bg-emerald-500/8  border-emerald-500/15",
    rose:    "text-rose-400    bg-rose-500/8     border-rose-500/15",
  };
  return (
    <div className={`rounded-2xl border px-6 py-5 ${colors[color]}`}>
      <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
      <p className={`text-4xl font-bold ${colors[color].split(" ")[0]}`}>{value}</p>
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

/* ════════════════════════════════════════════════
   PANEL: RESULTS & ANALYTICS
════════════════════════════════════════════════ */
function ResultsPanel({ test, onClose }) {
  /* always read fresh from storage when panel opens */
  const attempts   = getAttemptsForTest(test.id);
  const totalMarks = getTotalMarks(test);

  const scores = attempts.map(a => ({
    ...a,
    pct: getPct(a.score ?? 0, totalMarks),
  }));

  const avg      = scores.length ? Math.round(scores.reduce((s, a) => s + a.pct, 0) / scores.length) : 0;
  const highest  = scores.length ? Math.max(...scores.map(a => a.pct)) : 0;
  const passRate = scores.length ? Math.round((scores.filter(a => a.pct >= 40).length / scores.length) * 100) : 0;

  const sectionStats = test.sections?.map(sec => {
    let correct = 0, total = 0;
    attempts.forEach(a => {
      sec.questions?.forEach((q, qi) => {
        const key = `${sec.id || sec.title}_${qi}`;
        const ans = a.answers?.[key];
        if (ans !== undefined && ans !== null && ans !== "") {
          total++;
          if (String(ans) === String(q.correct ?? q.correctAnswer)) correct++;
        }
      });
    });
    return { title: sec.title, pct: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }) || [];

  /* enrolled students */
  const enrollments = getEnrollmentsForTest(test.id);

  return (
    <SlideOver onClose={onClose} title="Results & Analytics" subtitle={test.title}>
      <div className="p-6 space-y-6">
        {/* enrolled */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Enrollment</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Students joined</span>
            <span className="mono text-xl font-bold text-indigo-400">{enrollments.length}</span>
          </div>
          <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
            {enrollments.map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{e.studentUser}</span>
                <span className="mono text-[10px] text-zinc-600">
                  {e.joinedAt ? new Date(e.joinedAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
            {enrollments.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-2">No students joined yet</p>
            )}
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Attempts",  value: attempts.length, color: "text-indigo-400",  bg: "bg-indigo-500/8  border-indigo-500/15"  },
            { label: "Avg Score", value: `${avg}%`,       color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
            { label: "Highest",   value: `${highest}%`,   color: "text-amber-400",   bg: "bg-amber-500/8   border-amber-500/15"   },
            { label: "Pass Rate", value: `${passRate}%`,  color: "text-rose-400",    bg: "bg-rose-500/8    border-rose-500/15"    },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
              <p className="mono text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* score distribution */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Score Distribution</p>
          {scores.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {[
                { label: "90–100%",    check: p => p >= 90,               color: "#10b981" },
                { label: "70–89%",     check: p => p >= 70 && p < 90,     color: "#6366f1" },
                { label: "50–69%",     check: p => p >= 50 && p < 70,     color: "#f59e0b" },
                { label: "Below 50%",  check: p => p < 50,                color: "#f43f5e" },
              ].map(band => {
                const count = scores.filter(s => band.check(s.pct)).length;
                return (
                  <div key={band.label} className="flex items-center gap-3">
                    <span className="mono text-[10px] text-zinc-500 w-20 shrink-0">{band.label}</span>
                    <div className="flex-1">
                      <MiniBar pct={scores.length > 0 ? (count / scores.length) * 100 : 0} color={band.color} />
                    </div>
                    <span className="mono text-[10px] text-zinc-400 w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* section accuracy */}
        {sectionStats.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Section Accuracy</p>
            {sectionStats.map((sec, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-300">{sec.title}</span>
                  <span className="mono text-[10px] text-zinc-500">{sec.pct}%</span>
                </div>
                <MiniBar
                  pct={sec.pct}
                  color={sec.pct >= 70 ? "#10b981" : sec.pct >= 50 ? "#f59e0b" : "#f43f5e"}
                />
              </div>
            ))}
          </div>
        )}

        {/* per-student scores */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
            Student Scores ({scores.length})
          </p>
          {scores.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {scores.sort((a, b) => b.pct - a.pct).map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800/60 last:border-0">
                  <span className="mono text-[10px] text-zinc-600 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{s.studentUser || "Anonymous"}</p>
                    <div className="mt-1"><MiniBar pct={s.pct}
                      color={s.pct >= 70 ? "#10b981" : s.pct >= 40 ? "#f59e0b" : "#f43f5e"} /></div>
                  </div>
                  <span className={`mono text-[11px] font-semibold shrink-0
                    ${s.pct >= 70 ? "text-emerald-400" : s.pct >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                    {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
}

/* ════════════════════════════════════════════════
   PANEL: LIVE MONITORING
════════════════════════════════════════════════ */
function LivePanel({ test, onClose }) {
  const [sessions,     setSessions]     = useState([]);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());

  const refresh = useCallback(() => {
    const all = getLiveSessions().filter(s => s.testId === test.id);
    setSessions(all);
    setLastRefresh(new Date());
  }, [test.id]);

  useEffect(() => { refresh(); const id = setInterval(refresh, 5000); return () => clearInterval(id); }, [refresh]);

  const statusColor = s => ({
    active:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    warning:   "text-amber-400   bg-amber-500/10   border-amber-500/25",
    violation: "text-rose-400    bg-rose-500/10    border-rose-500/25",
    submitted: "text-zinc-500    bg-zinc-800       border-zinc-700",
  }[s] || "text-zinc-500 bg-zinc-800 border-zinc-700");

  const dot = s => ({
    active: "bg-emerald-400", warning: "bg-amber-400",
    violation: "bg-rose-400", submitted: "bg-zinc-600",
  }[s] || "bg-zinc-600");

  return (
    <SlideOver
      onClose={onClose}
      title="Live Monitoring"
      subtitle={test.title}
      liveIndicator
      extra={
        <button onClick={refresh}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
          <RefreshCw size={13} />
        </button>
      }
    >
      {/* summary bar */}
      <div className="grid grid-cols-4 border-b border-zinc-800 shrink-0">
        {[
          { label: "Active",    count: sessions.filter(s => s.status === "active").length,    color: "text-emerald-400" },
          { label: "Warning",   count: sessions.filter(s => s.status === "warning").length,   color: "text-amber-400"   },
          { label: "Violation", count: sessions.filter(s => s.status === "violation").length, color: "text-rose-400"    },
          { label: "Done",      count: sessions.filter(s => s.status === "submitted").length, color: "text-zinc-400"    },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 border-r border-zinc-800 last:border-0">
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="mono text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <Radio size={24} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">No active sessions</p>
            <p className="mono text-[11px] text-zinc-700">Students appear here when they start</p>
          </div>
        ) : (
          sessions.map((s, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot(s.status)} mt-0.5 shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{s.studentUser || "Student"}</p>
                    <p className="mono text-[10px] text-zinc-600">
                      {s.startedAt ? new Date(s.startedAt).toLocaleTimeString() : "—"}
                    </p>
                  </div>
                </div>
                <span className={`mono text-[9px] uppercase tracking-widest px-2 py-1
                  rounded-md border shrink-0 ${statusColor(s.status)}`}>
                  {s.status}
                </span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="mono text-[10px] text-zinc-500">Progress</span>
                  <span className="mono text-[10px] text-zinc-400">
                    {s.answeredCount ?? 0}/{s.totalQuestions ?? "?"} Q
                  </span>
                </div>
                <MiniBar
                  pct={s.totalQuestions ? ((s.answeredCount ?? 0) / s.totalQuestions) * 100 : 0}
                  color="#6366f1"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <VBadge count={s.tabSwitches  ?? 0} label="tab switches" />
                <VBadge count={s.faceWarnings ?? 0} label="face alerts"  />
                <VBadge count={s.deviceFlags  ?? 0} label="device flags" />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <p className="mono text-[10px] text-zinc-700 text-center">
          Auto-refreshes every 5s · Last: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>
    </SlideOver>
  );
}

/* ════════════════════════════════════════════════
   PANEL: STUDENT ATTEMPT HISTORY
════════════════════════════════════════════════ */
function AttemptsPanel({ test, onClose }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const attempts   = getAttemptsForTest(test.id);
  const totalMarks = getTotalMarks(test);

  const enriched = attempts.map(a => {
    const pct    = getPct(a.score ?? 0, totalMarks);
    const passed = pct >= 40;
    return {
      ...a,
      pct,
      passed,
      violations: (a.tabSwitches ?? 0) + (a.faceWarnings ?? 0) + (a.deviceFlags ?? 0),
      submittedDate: a.submittedAt ? new Date(a.submittedAt) : null,
    };
  });

  const filtered = enriched
    .filter(a => !search || (a.studentUser ?? "").toLowerCase().includes(search.toLowerCase()))
    .filter(a => filter === "all" ? true : filter === "pass" ? a.passed : !a.passed)
    .sort((a, b) => (b.submittedDate?.getTime() ?? 0) - (a.submittedDate?.getTime() ?? 0));

  /* enrolled (even if not yet attempted) */
  const enrollments = getEnrollmentsForTest(test.id);

  return (
    <SlideOver onClose={onClose} title="Student Attempt History" subtitle={test.title}>
      {/* enrolled count */}
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <span className="mono text-[10px] text-zinc-500 uppercase tracking-widest">Enrolled</span>
        <span className="mono text-sm font-bold text-indigo-400">{enrollments.length}</span>
      </div>

      {/* search + filter */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-zinc-950 border border-zinc-800
          rounded-lg px-3 py-2">
          <Search size={12} className="text-zinc-600 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student..."
            className="flex-1 bg-transparent mono text-[11px] text-zinc-300
              placeholder-zinc-700 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {["all", "pass", "fail"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg mono text-[10px] uppercase tracking-wide
                transition-all border ${filter === f
                  ? f === "pass"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                    : f === "fail"
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/25"
                      : "text-indigo-400 bg-indigo-500/10 border-indigo-500/25"
                  : "text-zinc-500 border-zinc-800 hover:border-zinc-700"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <Users size={24} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">No attempts found</p>
          </div>
        ) : (
          filtered.map((a, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700
                    flex items-center justify-center mono text-[10px] text-zinc-400 shrink-0">
                    {(a.studentUser ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{a.studentUser || "Anonymous"}</p>
                    <p className="mono text-[10px] text-zinc-600">
                      {a.submittedDate
                        ? a.submittedDate.toLocaleDateString() + " " + a.submittedDate.toLocaleTimeString()
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`mono text-xs font-bold
                    ${a.pct >= 70 ? "text-emerald-400" : a.pct >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                    {a.pct}%
                  </span>
                  <span className={`mono text-[9px] px-2 py-0.5 rounded border
                    ${a.passed
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
                    {a.passed ? "PASS" : "FAIL"}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <MiniBar
                  pct={a.pct}
                  color={a.pct >= 70 ? "#10b981" : a.pct >= 40 ? "#f59e0b" : "#f43f5e"}
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 mono text-[10px] text-zinc-600">
                  <Award size={9} />{a.score ?? 0}/{totalMarks} marks
                </div>
                {a.timeTaken != null && (
                  <div className="flex items-center gap-1 mono text-[10px] text-zinc-600">
                    <Timer size={9} />{Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s
                  </div>
                )}
                {a.violations > 0 && (
                  <div className="flex items-center gap-1 mono text-[10px] text-rose-400">
                    <ShieldAlert size={9} />{a.violations} violation{a.violations !== 1 ? "s" : ""}
                  </div>
                )}
                {a.abandoned && (
                  <span className="mono text-[9px] text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
                    abandoned
                  </span>
                )}
              </div>

              {a.violations > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <VBadge count={a.tabSwitches  ?? 0} label="tab switches" />
                  <VBadge count={a.faceWarnings ?? 0} label="face alerts"  />
                  <VBadge count={a.deviceFlags  ?? 0} label="device flags" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <p className="mono text-[10px] text-zinc-700 text-center">
          {filtered.length} of {enriched.length} submissions · {enrollments.length} enrolled
        </p>
      </div>
    </SlideOver>
  );
}

/* ════════════════════════════════════════════════
   SHARED SLIDE-OVER SHELL
════════════════════════════════════════════════ */
function SlideOver({ children, onClose, title, subtitle, liveIndicator, extra }) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm flex items-start justify-end">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-800 flex flex-col"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4
          bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            {liveIndicator && <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
            <div>
              <p className="text-sm font-semibold text-zinc-200">{title}</p>
              {subtitle && <p className="mono text-[10px] text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {extra}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
              <X size={14} />
            </button>
          </div>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN CREATOR DASHBOARD
════════════════════════════════════════════════ */
export default function CreatorDashboard() {
  const navigate = useNavigate();
  const user     = localStorage.getItem("creatorUser");

  const [tests,  setTests]  = useState([]);
  const [copied, setCopied] = useState(null);
  const [panel,  setPanel]  = useState(null); // { type, test }

  /* ─── load fresh data ─── */
  const loadAll = useCallback(() => {
    const all = getAllTests().filter(t => t.createdBy === user);
    setTests(all);
  }, [user]);

  /* poll every 5 s so live counts update without refresh */
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    loadAll();
    const id = setInterval(loadAll, 5000);
    return () => clearInterval(id);
  }, [loadAll, navigate, user]);

  const deleteTest = (id) => {
    const updated = getAllTests().filter(t => t.id !== id);
    saveTests(updated);
    loadAll();
  };

  const togglePublish = (id) => {
    const updated = getAllTests().map(t =>
      t.id === id ? { ...t, published: !t.published } : t
    );
    saveTests(updated);
    loadAll();
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const logout = () => { localStorage.removeItem("creatorUser"); navigate("/"); };

  /* aggregated stats */
  const totalTests      = tests.length;
  const activeTests     = tests.filter(t => t.published).length;
  const totalQuestions  = tests.reduce((a, b) =>
    a + (b.sections?.reduce((s, sec) => s + (sec.questions?.length || 0), 0) || 0), 0);
  const allLive         = getLiveSessions()
    .filter(s => tests.some(t => t.id === s.testId) && s.status === "active").length;

  /* per-test counts */
  const attemptCount  = id => getAttemptsForTest(id).length;
  const enrollCount   = id => getEnrollmentsForTest(id).length;
  const liveCount     = id => getLiveSessions()
    .filter(s => s.testId === id && s.status === "active").length;

  const initials = (user ?? "?").slice(0, 2).toUpperCase();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex">
      <FontLoader />

      {/* ── SLIDE-OVER PANELS ── */}
      <AnimatePresence>
        {panel?.type === "results"  && <ResultsPanel  test={panel.test} onClose={() => setPanel(null)} />}
        {panel?.type === "live"     && <LivePanel     test={panel.test} onClose={() => setPanel(null)} />}
        {panel?.type === "attempts" && <AttemptsPanel test={panel.test} onClose={() => setPanel(null)} />}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800">
          <Logo size="sm" />
        </div>
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30
              flex items-center justify-center mono text-xs text-indigo-400 font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Creator</p>
              <p className="text-sm font-medium text-zinc-200 truncate">{user}</p>
            </div>
          </div>
        </div>
        <div className="px-4 pt-4">
          <button onClick={() => navigate("/create-test")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
              font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
            <PlusCircle size={14} /> New Test
          </button>
        </div>

        {allLive > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl
            bg-rose-500/8 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
            <span className="mono text-[10px] text-rose-400">{allLive} student{allLive !== 1 ? "s" : ""} live now</span>
          </div>
        )}

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

        <div className="sticky top-0 z-10 h-14 flex items-center justify-between px-6
          bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-sm shrink-0">
          <div>
            <h1 className="font-semibold text-sm text-zinc-200">My Tests</h1>
            <p className="mono text-[10px] text-zinc-600 mt-0.5">{user}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/create-test")}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
              <PlusCircle size={13} />
            </button>
            <button onClick={logout}
              className="md:hidden text-sm text-zinc-500 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">

          {/* stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Tests"     value={totalTests}     color="indigo"  />
            <StatCard label="Published"       value={activeTests}    color="emerald" />
            <StatCard label="Total Questions" value={totalQuestions} color="amber"   />
            <StatCard label="Live Now"        value={allLive}        color="rose"    />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-300">All Tests</p>
          </div>

          {tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800
                flex items-center justify-center">
                <FileText size={20} className="text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">No tests yet</p>
              <p className="mono text-[11px] text-zinc-700">Create your first test to get started</p>
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
                  const attempts = attemptCount(t.id);
                  const enrolled = enrollCount(t.id);
                  const live     = liveCount(t.id);
                  return (
                    <motion.div key={t.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => navigate(`/create-test/${t.id}`)}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 cursor-pointer
                        hover:border-zinc-700 transition-colors flex flex-col"
                    >
                      {/* header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h2 className="font-semibold text-sm text-zinc-200 leading-snug">{t.title}</h2>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {live > 0 && (
                            <span className="flex items-center gap-1 mono text-[9px] px-2 py-1
                              rounded-md border text-rose-400 bg-rose-500/8 border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                              {live}
                            </span>
                          )}
                          <span className={`mono text-[9px] uppercase tracking-widest px-2 py-1
                            rounded-md border ${t.published
                              ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                              : "text-zinc-500  bg-zinc-800 border-zinc-700"}`}>
                            {t.published ? "Live" : "Draft"}
                          </span>
                        </div>
                      </div>

                      {/* meta */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Clock size={10} />{t.duration ?? "—"} min
                        </div>
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Hash size={10} />{qCount} Q
                        </div>
                        {/* enrolled count — updates when student joins */}
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Users size={10} />{enrolled} joined
                        </div>
                        {/* attempts count — updates when student submits */}
                        {attempts > 0 && (
                          <div className="flex items-center gap-1.5 mono text-[10px] text-indigo-400">
                            <CheckCircle2 size={10} />{attempts} submitted
                          </div>
                        )}
                      </div>

                      {/* 3 panel buttons */}
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

                      {/* bottom actions */}
                      <div className="flex gap-2 mt-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => copyId(t.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                            border transition-all
                            ${copied === t.id
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/8"
                              : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
                          {copied === t.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                          {copied === t.id ? "Copied" : "Copy ID"}
                        </button>
                        <button onClick={() => togglePublish(t.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                            border transition-all
                            ${t.published
                              ? "border-amber-500/30 text-amber-400 bg-amber-500/8 hover:bg-amber-500/15"
                              : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
                          {t.published ? <EyeOff size={12} /> : <Eye size={12} />}
                          {t.published ? "Unpublish" : "Publish"}
                        </button>
                        <button onClick={() => deleteTest(t.id)}
                          className="ml-auto w-8 flex items-center justify-center rounded-lg border
                            border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30
                            hover:bg-red-500/8 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}