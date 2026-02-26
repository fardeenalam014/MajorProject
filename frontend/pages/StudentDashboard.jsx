import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [testId, setTestId] = useState("");
  const [joinedTests, setJoinedTests] = useState([]);

  const user = localStorage.getItem("studentUser");

  /* ===============================
     LOAD USER TESTS
  =============================== */
  useEffect(() => {
    if (!user) navigate("/");

    const saved =
      JSON.parse(localStorage.getItem(`studentTests-${user}`)) || [];

    setJoinedTests(saved);
  }, []);

  /* ===============================
     JOIN TEST
  =============================== */
  const joinTest = () => {
    const tests = JSON.parse(localStorage.getItem("tests")) || [];

    const found = tests.find((t) => t.id === testId);

    if (!found) {
      alert("Invalid Test ID");
      return;
    }

    const updated = [...joinedTests, found];

    setJoinedTests(updated);
    localStorage.setItem(`studentTests-${user}`, JSON.stringify(updated));

    setTestId("");
  };

  /* ===============================
     START TEST
  =============================== */
  const startTest = (test) => {
    localStorage.setItem("currentTest", JSON.stringify(test));
    navigate("/exam");
  };

  /* ===============================
     LOGOUT
  =============================== */
  const logout = () => {
    localStorage.removeItem("studentUser");
    navigate("/");
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">🎓 Student Dashboard</h1>

        <button
          onClick={logout}
          className="bg-red-600 px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* JOIN TEST */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 p-6 rounded-2xl mb-8 flex gap-4"
      >
        <input
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          placeholder="Enter Test ID"
          className="flex-1 p-3 rounded-lg bg-slate-700"
        />

        <button
          onClick={joinTest}
          className="bg-blue-600 px-6 rounded-lg"
        >
          Join
        </button>
      </motion.div>

      {/* TEST LIST */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {joinedTests.map((t, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.04 }}
            className="bg-slate-800 p-5 rounded-2xl shadow-xl space-y-3"
          >
            <h2 className="font-semibold">{t.title}</h2>

            <p className="text-sm text-slate-400">
              Duration: {t.duration} mins
            </p>

            <button
              onClick={() => startTest(t)}
              className="w-full bg-green-600 py-2 rounded-lg"
            >
              Start Exam
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
