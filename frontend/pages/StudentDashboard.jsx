import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogOut,
  PlusCircle,
  PlayCircle,
  Trash2,
  Search,
} from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("studentUser");

  const [testId, setTestId] = useState("");
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  /* ==========================
     AUTH CHECK
  ========================== */
  useEffect(() => {
    if (!user) navigate("/");
    const saved =
      JSON.parse(localStorage.getItem(`studentTests-${user}`)) || [];
    setTests(saved);
  }, []);

  /* ==========================
     JOIN TEST
  ========================== */
  const joinTest = () => {
    const allTests = JSON.parse(localStorage.getItem("tests")) || [];
    const found = allTests.find((t) => t.id === testId);

    if (!found) {
      alert("Invalid Test ID");
      return;
    }

    if (tests.find((t) => t.id === found.id)) {
      alert("Already joined");
      return;
    }

    const updated = [
      ...tests,
      { ...found, status: "pending", score: null },
    ];

    setTests(updated);
    localStorage.setItem(
      `studentTests-${user}`,
      JSON.stringify(updated)
    );

    setTestId("");
  };

  /* ==========================
     START TEST
  ========================== */
  const startTest = (test) => {
    localStorage.setItem("currentTest", JSON.stringify(test));
    navigate("/exam");
  };

  /* ==========================
     DELETE TEST
  ========================== */
  const deleteTest = (id) => {
    const updated = tests.filter((t) => t.id !== id);
    setTests(updated);
    localStorage.setItem(
      `studentTests-${user}`,
      JSON.stringify(updated)
    );
  };

  /* ==========================
     FILTER LOGIC
  ========================== */
  const filteredTests = tests
    .filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((t) =>
      filter === "all" ? true : t.status === filter
    );

  /* ==========================
     LOGOUT
  ========================== */
  const logout = () => {
    localStorage.removeItem("studentUser");
    navigate("/");
  };

  /* ==========================
     STATS
  ========================== */
  const total = tests.length;
  const completed = tests.filter((t) => t.status === "completed").length;
  const pending = tests.filter((t) => t.status === "pending").length;

  return (
    <div className="min-h-screen min-w-screen flex bg-gradient-to-br from-slate-950 to-slate-900 text-white">

      {/* ================= SIDEBAR ================= */}
      <div className="w-64 bg-slate-900 p-6 hidden md:block">
        <h1 className="text-2xl font-bold mb-10">🎓 Dashboard</h1>

        <div className="space-y-4 text-slate-400">
          <p>Welcome</p>
          <p className="text-sm break-words">{user}</p>
        </div>

        <button
          onClick={logout}
          className="mt-10 flex items-center gap-2 text-red-400"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-6 md:p-10 space-y-8">

        {/* ======= STATS ======= */}
        <div className="grid md:grid-cols-3 gap-6">
          <StatCard title="Total Tests" value={total} />
          <StatCard title="Pending" value={pending} />
          <StatCard title="Completed" value={completed} />
        </div>

        {/* ======= JOIN TEST ======= */}
        <div className="bg-slate-800 p-6 rounded-2xl flex gap-4">
          <input
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            placeholder="Enter Test ID"
            className="flex-1 p-3 rounded-lg bg-slate-700"
          />
          <button
            onClick={joinTest}
            className="bg-blue-600 px-6 rounded-lg flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Join
          </button>
        </div>

        {/* ======= SEARCH + FILTER ======= */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex items-center bg-slate-800 px-4 rounded-lg">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search test..."
              className="bg-transparent p-2 outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bg-slate-800 p-2 rounded-lg"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* ======= TEST GRID ======= */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((t) => (
            <motion.div
              key={t.id}
              whileHover={{ scale: 1.04 }}
              className="bg-slate-800 p-5 rounded-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{t.title}</h2>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    t.status === "completed"
                      ? "bg-green-600"
                      : "bg-yellow-600"
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <p className="text-sm text-slate-400">
                Duration: {t.duration} mins
              </p>

              {t.score !== null && (
                <p className="text-sm text-green-400">
                  Score: {t.score}
                </p>
              )}

              <div className="flex gap-2">
                {t.status === "pending" && (
                  <button
                    onClick={() => startTest(t)}
                    className="flex-1 bg-green-600 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={16} />
                    Start
                  </button>
                )}

                <button
                  onClick={() => deleteTest(t.id)}
                  className="bg-red-600 p-2 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================
   STAT CARD COMPONENT
========================== */
function StatCard({ title, value }) {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl text-center">
      <h3 className="text-slate-400 text-sm">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}