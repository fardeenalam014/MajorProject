import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap, ShieldCheck,
  Eye, EyeOff, CheckCircle2, User,
} from "lucide-react";
import Logo from "../components/Logo";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    body { font-family: 'DM Sans', sans-serif; }
    .mono { font-family: 'DM Mono', monospace; }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fade-up .35s ease both; }
  `}</style>
);

export default function Register() {
  const navigate = useNavigate();

  const [mode, setMode]         = useState("student");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    const key   = mode === "student" ? "students" : "creators";
    const users = JSON.parse(localStorage.getItem(key)) || [];
    if (users.find(u => u.email === email)) { alert("Email already exists"); return; }
    users.push({ name, email, password });
    localStorage.setItem(key, JSON.stringify(users));
    alert("Registered successfully!");
    navigate("/");
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 gap-6">
      <FontLoader />

      {/* grid bg */}
      <div className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(99,102,241,.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* logo — outside the box */}
      <div className="relative fade-up">
        <Logo size="md" />
      </div>

      {/* card */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800
        rounded-2xl shadow-2xl shadow-black/50 p-8 fade-up"
        style={{ animationDelay: ".08s" }}>

        <div className="mb-5">
          <p className="text-4xl font-bold text-zinc-100">Create your account</p>
          <p className="text-sm text-zinc-500 mt-1">Join AIExamGuard today</p>
        </div>

        {/* role selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { key: "student", label: "Student",      icon: GraduationCap, desc: "Attempt AI-proctored exams" },
            { key: "creator", label: "Test Creator",  icon: ShieldCheck,   desc: "Build and publish tests"    },
          ].map(({ key, label, icon: Icon, desc }) => (
            <motion.button
              key={key}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: .98 }}
              onClick={() => setMode(key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center
                transition-all duration-150
                ${mode === key
                  ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
            >
              <Icon size={22} />
              <span className="text-sm font-semibold">{label}</span>
              <span className="mono text-[9px] text-zinc-600 leading-relaxed">{desc}</span>
            </motion.button>
          ))}
        </div>

        {/* form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-3">

          <div className="flex flex-col gap-1.5">
            <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Full Name
            </label>
            <div className="relative">
              <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="John Doe"
                required
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-3
                  text-sm text-zinc-200 placeholder:text-zinc-600 outline-none
                  focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3
                text-sm text-zinc-200 placeholder:text-zinc-600 outline-none
                focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                required
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-11
                  text-sm text-zinc-200 placeholder:text-zinc-600 outline-none
                  focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
              <button type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600
                  hover:text-zinc-400 transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: .98 }}
            className="w-full mt-2 py-3 rounded-xl text-sm font-semibold
              bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
            Register as {mode === "student" ? "Student" : "Creator"}
          </motion.button>
        </form>

        <p className="text-sm text-center mt-6 text-zinc-600">
          Already have an account?{" "}
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}