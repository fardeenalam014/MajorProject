import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogOut,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  BarChart3,
  PlusCircle,
} from "lucide-react";

/* ===============================
   CREATOR DASHBOARD
================================= */
export default function CreatorDashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("creatorUser");

  const [tests, setTests] = useState([]);

  /* ===============================
     AUTH CHECK
  =============================== */
  useEffect(() => {
    if (!user) navigate("/");
    loadTests();
  }, []);

  const loadTests = () => {
    const saved = JSON.parse(localStorage.getItem("tests")) || [];
    const myTests = saved.filter((t) => t.createdBy === user);
    setTests(myTests);
  };

  /* ===============================
     DELETE TEST
  =============================== */
  const deleteTest = (id) => {
    const all = JSON.parse(localStorage.getItem("tests")) || [];
    const updated = all.filter((t) => t.id !== id);

    localStorage.setItem("tests", JSON.stringify(updated));
    loadTests();
  };

  /* ===============================
     TOGGLE PUBLISH
  =============================== */
  const togglePublish = (id) => {
    const all = JSON.parse(localStorage.getItem("tests")) || [];

    const updated = all.map((t) =>
      t.id === id ? { ...t, published: !t.published } : t
    );

    localStorage.setItem("tests", JSON.stringify(updated));
    loadTests();
  };

  /* ===============================
     COPY TEST ID
  =============================== */
  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    alert("Test ID Copied!");
  };

  /* ===============================
     ANALYTICS
  =============================== */
  const totalTests = tests.length;
  const activeTests = tests.filter((t) => t.published).length;
  const totalQuestions = tests.reduce(
    (a, b) => a + (b.questions?.length || 0),
    0
  );

  const logout = () => {
    localStorage.removeItem("creatorUser");
    navigate("/");
  };

  return (
    <div className="min-h-screen min-w-screen flex bg-gradient-to-br from-slate-950 to-slate-900 text-white">

      {/* ================= SIDEBAR ================= */}
      <div className="w-64 bg-slate-900 p-6 hidden md:block">
        <h1 className="text-2xl font-bold mb-10">🧑‍🏫 Creator</h1>

        <button
          onClick={() => navigate("/create-test")}
          className="bg-purple-600 w-full py-2 rounded-lg mb-6 flex items-center justify-center gap-2"
        >
          <PlusCircle size={18} />
          Create Test
        </button>

        <button
          onClick={logout}
          className="text-red-400 mt-10 flex items-center gap-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-6 md:p-10 space-y-8">

        {/* ===== Analytics ===== */}
        <div className="grid md:grid-cols-3 gap-6">
          <Stat title="Total Tests" value={totalTests} />
          <Stat title="Active Tests" value={activeTests} />
          <Stat title="Total Questions" value={totalQuestions} />
        </div>

        {/* ===== Test List ===== */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((t) => (
            <motion.div
              key={t.id}
              whileHover={{ scale: 1.04 }}
              onClick={() => navigate(`/create-test/${t.id}`)}
              className="bg-slate-800 p-5 rounded-2xl space-y-4 shadow-lg"
            >
              <div className="flex justify-between">
                <h2 className="font-semibold">{t.title}</h2>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    t.published
                      ? "bg-green-600"
                      : "bg-gray-600"
                  }`}
                >
                  {t.published ? "Published" : "Draft"}
                </span>
              </div>

              <p className="text-sm text-slate-400">
                ID: {t.id}
              </p>

              <p className="text-sm">
                Duration: {t.duration} mins
              </p>

              <p className="text-sm">
                Questions: {t.questions?.length || 0}
              </p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyId(t.id);
                  }}
                  className="bg-blue-600 p-2 rounded"
                >
                  <Copy size={14} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePublish(t.id);
                  }}
                  className="bg-yellow-600 p-2 rounded"
                >
                  {t.published ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTest(t.id);
                  }}
                  className="bg-red-600 p-2 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STAT COMPONENT
================================= */
function Stat({ title, value }) {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl text-center">
      <h3 className="text-slate-400 text-sm">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}