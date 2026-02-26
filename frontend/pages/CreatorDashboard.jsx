import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function CreatorDashboard() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);

  const user = localStorage.getItem("creatorUser");

  /* ===============================
     LOAD TESTS
  =============================== */
  useEffect(() => {
    if (!user) navigate("/");

    const saved = JSON.parse(localStorage.getItem("tests")) || [];
    setTests(saved);
  }, []);

  /* ===============================
     CREATE NEW TEST
  =============================== */
  const createTest = () => {
    navigate("/create-test"); // your TestCreator page
  };

  /* ===============================
     DELETE TEST
  =============================== */
  const deleteTest = (id) => {
    const updated = tests.filter((t) => t.id !== id);

    setTests(updated);
    localStorage.setItem("tests", JSON.stringify(updated));
  };

  /* ===============================
     LOGOUT
  =============================== */
  const logout = () => {
    localStorage.removeItem("creatorUser");
    navigate("/");
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">🧑‍🏫 Creator Dashboard</h1>

        <button
          onClick={logout}
          className="bg-red-600 px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* CREATE BUTTON */}
      <button
        onClick={createTest}
        className="mb-8 bg-purple-600 px-6 py-3 rounded-xl"
      >
        + Create Test
      </button>

      {/* TESTS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((t) => (
          <motion.div
            key={t.id}
            whileHover={{ scale: 1.04 }}
            className="bg-slate-800 p-5 rounded-2xl shadow-xl space-y-3"
          >
            <h2 className="font-semibold">{t.title}</h2>

            <p className="text-sm text-slate-400">
              ID: <span className="text-indigo-400">{t.id}</span>
            </p>

            <p className="text-sm text-slate-400">
              Duration: {t.duration} mins
            </p>

            <button
              onClick={() => deleteTest(t.id)}
              className="w-full bg-red-600 py-2 rounded-lg"
            >
              Delete
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
