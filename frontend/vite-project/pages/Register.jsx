import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, GraduationCap } from "lucide-react";

/*
  Modern creative Register page
  ✨ Card style role selector (instead of plain buttons)
  ✨ Animated selection
  ✨ Separate localStorage for students & creators
  ✨ Clean, premium UI
*/

export default function Register() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    const key = mode === "student" ? "students" : "creators";
    const users = JSON.parse(localStorage.getItem(key)) || [];

    if (users.find((u) => u.email === email)) {
      alert("Email already exists");
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem(key, JSON.stringify(users));

    alert("Registered successfully!");
    navigate("/");
  };

  return (
    <div className="min-h-screen  min-w-screen  bg-gradient-to-br from-slate-950 via-indigo-950 to-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-slate-700"
      >
        {/* ============================
            TITLE
        ============================ */}
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Create Your Account
        </h1>

        {/* ============================
            CREATIVE ROLE SELECTOR
        ============================ */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {/* Student Card */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            onClick={() => setMode("student")}
            className={`cursor-pointer p-6 rounded-2xl border transition-all shadow-lg ${
              mode === "student"
                ? "bg-blue-600/20 border-blue-500"
                : "bg-slate-800/70 border-slate-700 hover:border-blue-400"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <GraduationCap size={40} />
              <h3 className="font-semibold text-lg">Student</h3>
              <p className="text-xs text-slate-400">
                Attempt tests, track scores, AI‑proctored exams
              </p>
            </div>
          </motion.div>

          {/* Creator Card */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            onClick={() => setMode("creator")}
            className={`cursor-pointer p-6 rounded-2xl border transition-all shadow-lg ${
              mode === "creator"
                ? "bg-purple-600/20 border-purple-500"
                : "bg-slate-800/70 border-slate-700 hover:border-purple-400"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <User size={40} />
              <h3 className="font-semibold text-lg">Test Creator</h3>
              <p className="text-xs text-slate-400">
                Build tests, sections, timers, marks & questions
              </p>
            </div>
          </motion.div>
        </div>

        {/* ============================
            FORM
        ============================ */}
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <input
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <motion.button
            whileTap={{ scale: 0.96 }}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              mode === "student"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            Register as {mode === "student" ? "Student" : "Creator"}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Already registered?{' '}
          <span
            onClick={() => navigate("/")}
            className="text-indigo-400 cursor-pointer hover:underline"
          >
            Login here
          </span>
        </p>
      </motion.div>
    </div>
  );
}
