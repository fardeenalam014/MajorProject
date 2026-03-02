import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, PlusCircle, PlayCircle,
  Trash2, Search, BookOpen,
  Clock, CheckCircle2, AlertCircle, Hash,
} from "lucide-react";
import Logo from "../components/Logo";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
  `}</style>
);

function StatCard({ label, value, color }) {
  const colors = {
    indigo:  "text-indigo-400 bg-indigo-500/8  border-indigo-500/15",
    amber:   "text-amber-400  bg-amber-500/8   border-amber-500/15",
    emerald: "text-emerald-400 bg-emerald-500/8 border-emerald-500/15",
  };
  return (
    <div className={`rounded-2xl border px-6 py-5 ${colors[color]}`}>
      <p className="mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
      <p className={`text-4xl font-bold ${colors[color].split(" ")[0]}`}>{value}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user     = localStorage.getItem("studentUser");

  const [testId, setTestId] = useState("");
  const [tests, setTests]   = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) navigate("/");
    const saved = JSON.parse(localStorage.getItem(`studentTests-${user}`)) || [];
    setTests(saved);
  }, []);

  const joinTest = () => {
    const all   = JSON.parse(localStorage.getItem("tests")) || [];
    const found = all.find(t => t.id === testId);
    if (!found)                          { alert("Invalid Test ID"); return; }
    if (tests.find(t => t.id === found.id)) { alert("Already joined");  return; }
    const updated = [...tests, { ...found, status: "pending", score: null }];
    setTests(updated);
    localStorage.setItem(`studentTests-${user}`, JSON.stringify(updated));
    setTestId("");
  };

  const startTest  = (t) => { localStorage.setItem("currentTest", JSON.stringify(t)); navigate(`/exam/${t.id}`); };
  const deleteTest = (id) => {
    const updated = tests.filter(t => t.id !== id);
    setTests(updated);
    localStorage.setItem(`studentTests-${user}`, JSON.stringify(updated));
  };
  const logout = () => { localStorage.removeItem("studentUser"); navigate("/"); };

  const filtered = tests
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
    .filter(t => filter === "all" || t.status === filter);

  const total     = tests.length;
  const pending   = tests.filter(t => t.status === "pending").length;
  const completed = tests.filter(t => t.status === "completed").length;
  const initials  = (user ?? "?").slice(0, 2).toUpperCase();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex">
      <FontLoader />

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-800 bg-zinc-950">

        {/* logo */}
        <div className="px-5 py-4 border-b border-zinc-800">
          <Logo size="sm" />
        </div>

        {/* user */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30
              flex items-center justify-center mono text-xs text-indigo-400 font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Signed in as</p>
              <p className="text-sm font-medium text-zinc-200 truncate">{user}</p>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* logout */}
        <div className="px-4 pb-5">
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500
              hover:text-red-400 hover:bg-red-500/8 transition-all">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>

        {/* top bar */}
        <div className="sticky top-0 z-10 h-14 flex items-center justify-between px-6
          bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-sm shrink-0">
          <div>
            <h1 className="font-semibold text-sm text-zinc-200">My Tests</h1>
            <p className="mono text-[10px] text-zinc-600 mt-0.5">{user}</p>
          </div>
          <button onClick={logout}
            className="md:hidden flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut size={14} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">

          {/* stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total"     value={total}     color="indigo"  />
            <StatCard label="Pending"   value={pending}   color="amber"   />
            <StatCard label="Completed" value={completed} color="emerald" />
          </div>

          {/* join */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800
              rounded-xl px-4 focus-within:border-indigo-500/50 focus-within:ring-1
              focus-within:ring-indigo-500/20 transition-all">
              <Hash size={13} className="text-zinc-600 shrink-0" />
              <input
                value={testId}
                onChange={e => setTestId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && joinTest()}
                placeholder="Paste Test ID to join..."
                className="flex-1 py-3 bg-transparent mono text-sm text-zinc-300
                  placeholder:text-zinc-600 outline-none"
              />
            </div>
            <button onClick={joinTest}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shrink-0">
              <PlusCircle size={15} />
              Join
            </button>
          </div>

          {/* search + filter */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800
              rounded-xl px-4 focus-within:border-zinc-700 transition-all">
              <Search size={13} className="text-zinc-600 shrink-0" />
              <input
                placeholder="Search..."
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
                    ${filter === f
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                    }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* test grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800
                flex items-center justify-center">
                <BookOpen size={20} className="text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">No tests here</p>
              <p className="mono text-[11px] text-zinc-700">
                {search ? "Try a different search" : "Join one with a Test ID above"}
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
                    exit={{ opacity: 0, scale: .97 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: .18 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5
                      hover:border-zinc-700 transition-colors"
                  >
                    {/* card header */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <h2 className="font-semibold text-sm text-zinc-200 leading-snug">{t.title}</h2>
                      <span className={`mono text-[9px] uppercase tracking-widest px-2 py-1
                        rounded-md border shrink-0
                        ${t.status === "completed"
                          ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                          : "text-amber-400 bg-amber-500/8 border-amber-500/20"
                        }`}>
                        {t.status}
                      </span>
                    </div>

                    {/* meta */}
                    <div className="flex items-center gap-4 mb-4">
                      {t.duration && (
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Clock size={10} />
                          {t.duration} min
                        </div>
                      )}
                      {t.score !== null && t.score !== undefined && (
                        <div className="flex items-center gap-1.5 mono text-[10px] text-emerald-400">
                          <CheckCircle2 size={10} />
                          Score: {t.score}
                        </div>
                      )}
                    </div>

                    {/* actions */}
                    <div className="flex gap-2">
                      {t.status === "pending" && (
                        <button onClick={() => startTest(t)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                            text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white
                            transition-colors">
                          <PlayCircle size={14} />
                          Start
                        </button>
                      )}
                      {t.status === "completed" && (
                        <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                          text-sm text-emerald-400 bg-emerald-500/8 border border-emerald-500/20">
                          <CheckCircle2 size={14} />
                          Done
                        </div>
                      )}
                      <button onClick={() => deleteTest(t.id)}
                        className="w-9 flex items-center justify-center rounded-lg border border-zinc-800
                          text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/8
                          transition-all">
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