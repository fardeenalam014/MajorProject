import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* =================================================
     LOGIN HANDLER
  ================================================= */
  const handleLogin = (e) => {
    e.preventDefault();

    const key = role === "student" ? "students" : "creators";
    const users = JSON.parse(localStorage.getItem(key)) || [];

    const found = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!found) {
      alert("Invalid credentials");
      return;
    }

    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", email);

    if (role === "student") {
  localStorage.setItem("studentUser", email);
  navigate("/student-dashboard");
} else {
  localStorage.setItem("creatorUser", email);
  navigate("/creator-dashboard");
}

  };

  /* =================================================
     UI
  ================================================= */
  return (
    <div className="min-h-screen  min-w-screen  flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-950 to-black text-white p-6">

      {/* MAIN GLASS CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl grid md:grid-cols-2 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden"
      >

        {/* =========================================
            LEFT SIDE — INFO PANEL
        ========================================= */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-indigo-600/40 to-purple-700/40">

          {role === "student" ? (
            <>
              <h1 className="text-4xl font-bold mb-4">
                Student Exam Portal
              </h1>

              <p className="text-slate-200 leading-relaxed">
                Attempt AI-proctored exams securely with fullscreen protection,
                camera monitoring and anti-cheat detection.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li>✔ Live camera detection</li>
                <li>✔ Tab switching blocked</li>
                <li>✔ Auto warnings</li>
                <li>✔ Fair exams</li>
              </ul>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-4">
                Test Creator Panel
              </h1>

              <p className="text-slate-200 leading-relaxed">
                Design sections, add unlimited questions, images, timers and
                marks with an intuitive editor.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li>✔ MCQ + Numerical</li>
                <li>✔ Section timers</li>
                <li>✔ Smart navigation</li>
                <li>✔ Auto marks</li>
              </ul>
            </>
          )}
        </div>

        {/* =========================================
            RIGHT SIDE — LOGIN FORM
        ========================================= */}
        <div className="p-10">

          <h2 className="text-3xl font-bold text-center mb-8">
            Welcome Back
          </h2>

          {/* ROLE SELECTION */}
          <div className="grid grid-cols-2 gap-4 mb-8">

            {/* Student Card */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setRole("student")}
              className={`p-5 rounded-2xl border transition flex flex-col items-center gap-2 ${
                role === "student"
                  ? "bg-indigo-600 border-indigo-500"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <GraduationCap size={28} />
              <span className="text-sm font-semibold">Student</span>
            </motion.button>

            {/* Creator Card */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setRole("creator")}
              className={`p-5 rounded-2xl border transition flex flex-col items-center gap-2 ${
                role === "creator"
                  ? "bg-purple-600 border-purple-500"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <ShieldCheck size={28} />
              <span className="text-sm font-semibold">Creator</span>
            </motion.button>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              required
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              required
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-xl font-semibold hover:opacity-90 transition">
              Login
            </button>
          </form>

          {/* REGISTER LINK */}
          <p className="text-sm text-center mt-6 text-slate-400">
            Don’t have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
