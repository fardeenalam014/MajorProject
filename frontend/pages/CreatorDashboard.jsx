import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  PlusCircle,
  BookOpen,
  Clock,
  Hash,
  CheckCircle2,
  FileText,
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

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const user     = localStorage.getItem("creatorUser");

  const [tests, setTests] = useState([]);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!user) navigate("/");
    loadTests();
  }, []);

  const loadTests = () => {
    const saved   = JSON.parse(localStorage.getItem("tests")) || [];
    const myTests = saved.filter(t => t.createdBy === user);
    setTests(myTests);
  };

  const deleteTest = (id) => {
    const all     = JSON.parse(localStorage.getItem("tests")) || [];
    const updated = all.filter(t => t.id !== id);
    localStorage.setItem("tests", JSON.stringify(updated));
    loadTests();
  };

  const togglePublish = (id) => {
    const all     = JSON.parse(localStorage.getItem("tests")) || [];
    const updated = all.map(t => t.id === id ? { ...t, published: !t.published } : t);
    localStorage.setItem("tests", JSON.stringify(updated));
    loadTests();
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const logout = () => { localStorage.removeItem("creatorUser"); navigate("/"); };

  const totalTests     = tests.length;
  const activeTests    = tests.filter(t => t.published).length;
  const totalQuestions = tests.reduce((a, b) =>
    a + (b.sections ? b.sections.reduce((s, sec) => s + (sec.questions?.length || 0), 0) : 0), 0);

  const initials = (user ?? "?").slice(0, 2).toUpperCase();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex">
      <FontLoader />

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-800 bg-zinc-950">

        {/* logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800">
          {/* <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <BookOpen size={13} className="text-white" />
          </div> */}
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
              <p className="text-xs text-zinc-500">Creator</p>
              <p className="text-sm font-medium text-zinc-200 truncate">{user}</p>
            </div>
          </div>
        </div>

        {/* create button */}
        <div className="px-4 pt-4">
          <button onClick={() => navigate("/create-test")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
              font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
            <PlusCircle size={14} />
            New Test
          </button>
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
          <div className="flex items-center gap-2">
            {/* mobile: create + logout */}
            <button onClick={() => navigate("/create-test")}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
              <PlusCircle size={13} />
            </button>
            <button onClick={logout}
              className="md:hidden flex items-center gap-1.5 text-sm text-zinc-500
                hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">

          {/* stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Tests"     value={totalTests}     color="indigo"  />
            <StatCard label="Published"       value={activeTests}    color="emerald" />
            <StatCard label="Total Questions" value={totalQuestions} color="amber"   />
          </div>

          {/* section header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-300">All Tests</p>
            <button onClick={() => navigate("/create-test")}
              className="md:hidden flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
                font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
              <PlusCircle size={13} /> New
            </button>
          </div>

          {/* test grid */}
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
                  const qCount = t.sections
                    ? t.sections.reduce((s, sec) => s + (sec.questions?.length || 0), 0)
                    : 0;
                  return (
                    <motion.div key={t.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: .97 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: .18 }}
                      onClick={() => navigate(`/create-test/${t.id}`)}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 cursor-pointer
                        hover:border-zinc-700 transition-colors"
                    >
                      {/* header */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <h2 className="font-semibold text-sm text-zinc-200 leading-snug">{t.title}</h2>
                        <span className={`mono text-[9px] uppercase tracking-widest px-2 py-1
                          rounded-md border shrink-0
                          ${t.published
                            ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                            : "text-zinc-500  bg-zinc-800       border-zinc-700"
                          }`}>
                          {t.published ? "Live" : "Draft"}
                        </span>
                      </div>

                      {/* meta */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Clock size={10} />
                          {t.duration ?? "—"} min
                        </div>
                        <div className="flex items-center gap-1.5 mono text-[10px] text-zinc-500">
                          <Hash size={10} />
                          {qCount} Q
                        </div>
                        <div className="mono text-[10px] text-zinc-600 truncate">
                          {t.id}
                        </div>
                      </div>

                      {/* actions */}
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>

                        {/* copy ID */}
                        <button onClick={() => copyId(t.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                            border transition-all
                            ${copied === t.id
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/8"
                              : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            }`}>
                          {copied === t.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                          {copied === t.id ? "Copied" : "Copy ID"}
                        </button>

                        {/* publish toggle */}
                        <button onClick={() => togglePublish(t.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
                            border transition-all
                            ${t.published
                              ? "border-amber-500/30 text-amber-400 bg-amber-500/8 hover:bg-amber-500/15"
                              : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            }`}>
                          {t.published ? <EyeOff size={12} /> : <Eye size={12} />}
                          {t.published ? "Unpublish" : "Publish"}
                        </button>

                        {/* delete */}
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