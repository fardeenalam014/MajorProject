import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, PlusCircle, PlayCircle, Trash2, Search,
  BookOpen, Clock, CheckCircle2, Hash, ShieldAlert,
  BarChart3, Timer,
} from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import {
  getAllTests, getStudentTests, saveStudentTests,
  enrollStudent, getAttemptsForStudent, getTotalMarks, getPct,
} from "../utils/Storage";

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
  const colors = {
    indigo:  "text-indigo-400  bg-indigo-500/8   border-indigo-500/15",
    amber:   "text-amber-400   bg-amber-500/8    border-amber-500/15",
    emerald: "text-emerald-400 bg-emerald-500/8  border-emerald-500/15",
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
    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout } = useAuth();

  const user = authUser?.email || authUser?.username || localStorage.getItem("studentUser");

  const [testId,  setTestId]  = useState("");
  const [tests,   setTests]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [joinErr, setJoinErr] = useState("");

  
  const loadAndSync = useCallback(() => {
    const saved      = getStudentTests(user);
    const myAttempts = getAttemptsForStudent(user);

    const synced = saved.map(t => {
      const relevant = myAttempts
        .filter(a => a.testId === t.id)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      if (relevant.length === 0) return t;

      const latest     = relevant[0];
      const fullTest   = getAllTests().find(ft => ft.id === t.id) ?? t;
      const totalMarks = getTotalMarks(fullTest);
      const pct        = getPct(latest.score ?? 0, totalMarks);

      return {
        ...t,
        status:       "completed",
        score:        latest.score       ?? 0,
        totalMarks,
        pct,
        timeTaken:    latest.timeTaken   ?? null,
        tabSwitches:  latest.tabSwitches ?? 0,
        faceWarnings: latest.faceWarnings ?? 0,
        deviceFlags:  latest.deviceFlags  ?? 0,
        submittedAt:  latest.submittedAt  ?? null,
      };
    });

    setTests(synced);
    saveStudentTests(user, synced);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    loadAndSync();
    window.addEventListener("focus", loadAndSync);
    return () => window.removeEventListener("focus", loadAndSync);
  }, [loadAndSync, navigate, user]);

  
  const joinTest = () => {
    setJoinErr("");
    const id = testId.trim();
    if (!id) return;

    const all   = getAllTests();
    const found = all.find(t => t.id === id);

    if (!found)                          { setJoinErr("Test ID not found.");              return; }
    if (!found.published)                { setJoinErr("This test is not published yet."); return; }
    if (tests.find(t => t.id === found.id)) { setJoinErr("Already joined.");              return; }

    
    enrollStudent(found.id, user);

    const updated = [...tests, {
      ...found,
      status:     "pending",
      score:      null,
      totalMarks: null,
      pct:        null,
      joinedAt:   new Date().toISOString(),
    }];
    setTests(updated);
    saveStudentTests(user, updated);
    setTestId("");
  };

  
  const startTest = (t) => {
    localStorage.setItem("activeTestId",      t.id);
    localStorage.setItem("activeStudentUser", user);
    localStorage.setItem("currentTest",       JSON.stringify(t));
    navigate(`/exam/${t.id}`);
  };

  const deleteTest = (id) => {
    const updated = tests.filter(t => t.id !== id);
    setTests(updated);
    saveStudentTests(user, updated);
  };

  const logout = () => { authLogout(); navigate("/"); };

  const filtered = tests
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
    .filter(t => filter === "all" || t.status === filter);

  const total     = tests.length;
  const pending   = tests.filter(t => t.status === "pending").length;
  const completed = tests.filter(t => t.status === "completed").length;
  const displayName = authUser?.username || user || "Student";
  const initials  = (displayName ?? "?").slice(0, 2).toUpperCase();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex">
      <FontLoader />

      {}
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
              <p className="mono text-[10px] text-zinc-600 truncate">{authUser?.email || user}</p>
            </div>
          </div>
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

      {}
      <main className="flex-1 flex flex-col overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>

        <div className="sticky top-0 z-10 h-14 flex items-center justify-between px-6
          bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-sm shrink-0">
            <div>
            <h1 className="font-semibold text-sm text-zinc-200">My Tests</h1>
            <p className="mono text-[10px] text-zinc-600 mt-0.5">{authUser?.email || user}</p>
          </div>
          <button onClick={logout}
            className="md:hidden text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut size={14} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">

          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total"     value={total}     color="indigo"  />
            <StatCard label="Pending"   value={pending}   color="amber"   />
            <StatCard label="Completed" value={completed} color="emerald" />
          </div>

          {}
          <div className="space-y-1.5">
            <div className="flex gap-3">
              <div className={`flex-1 flex items-center gap-2 bg-zinc-900 border rounded-xl px-4
                focus-within:ring-1 transition-all
                ${joinErr
                  ? "border-rose-500/50 focus-within:ring-rose-500/20"
                  : "border-zinc-800 focus-within:border-indigo-500/50 focus-within:ring-indigo-500/20"}`}>
                <Hash size={13} className="text-zinc-600 shrink-0" />
                <input
                  value={testId}
                  onChange={e => { setTestId(e.target.value); setJoinErr(""); }}
                  onKeyDown={e => e.key === "Enter" && joinTest()}
                  placeholder="Paste Test ID to join..."
                  className="flex-1 py-3 bg-transparent mono text-sm text-zinc-300
                    placeholder:text-zinc-600 outline-none"
                />
              </div>
              <button onClick={joinTest}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                  bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shrink-0">
                <PlusCircle size={15} /> Join
              </button>
            </div>
            {joinErr && <p className="mono text-[11px] text-rose-400 pl-1">{joinErr}</p>}
          </div>

          {}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800
              rounded-xl px-4 focus-within:border-zinc-700 transition-all">
              <Search size={13} className="text-zinc-600 shrink-0" />
              <input
                placeholder="Search tests..."
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

          {}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800
                flex items-center justify-center">
                <BookOpen size={20} className="text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">No tests here</p>
              <p className="mono text-[11px] text-zinc-700">
                {search ? "Try a different search" : "Join a test with a Test ID above"}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(t => (
                  <motion.div key={t.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5
                      hover:border-zinc-700 transition-colors flex flex-col"
                  >
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

                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {t.duration && (
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Clock size={10} />{t.duration} min
                        </div>
                      )}
                      {t.status === "completed" && t.timeTaken != null && (
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Timer size={10} />{Math.floor(t.timeTaken / 60)}m {t.timeTaken % 60}s
                        </div>
                      )}
                    </div>

                    {}
                    {t.status === "completed" && (
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
                            ${(t.pct ?? 0) >= 40
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
                            {(t.pct ?? 0) >= 40 ? "PASS" : "FAIL"}
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
                          rounded-lg text-sm text-emerald-400 bg-emerald-500/8 border border-emerald-500/20">
                          <CheckCircle2 size={14} /> Submitted
                        </div>
                      )}
                      <button onClick={() => deleteTest(t.id)}
                        className="w-9 flex items-center justify-center rounded-lg border
                          border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30
                          hover:bg-red-500/8 transition-all">
                        <Trash2 size={13} />
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