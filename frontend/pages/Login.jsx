import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap, ShieldCheck,
  Eye, EyeOff, CheckCircle2,
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

const FEATURES = {
  student: [
    "AI-proctored with live camera monitoring",
    "Fullscreen protection & tab switch detection",
    "Section-wise timed questions",
    "Instant auto-flagging of violations",
  ],
  creator: [
    "MCQ and numerical question types",
    "Section timers and per-question marks",
    "Image support for questions and options",
    "Publish, draft and manage tests easily",
  ],
};

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole]         = useState("student");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    const key   = role === "student" ? "students" : "creators";
    const users = JSON.parse(localStorage.getItem(key)) || [];
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) { alert("Invalid credentials"); return; }
    localStorage.setItem("userRole",  role);
    localStorage.setItem("userEmail", email);
    if (role === "student") {
      localStorage.setItem("studentUser", email);
      navigate("/student-dashboard");
    } else {
      localStorage.setItem("creatorUser", email);
      navigate("/creator-dashboard");
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen min-w-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <FontLoader />

      {/* subtle grid bg */}
      <div className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(99,102,241,.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden
        border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 fade-up">

        {/* ── LEFT: info panel ── */}
        <div className="hidden md:flex flex-col justify-between p-10
          bg-zinc-950 border-r border-zinc-800">

          {/* Logo */}
          <Logo size="md" />

          {/* headline */}
          <div className="my-8">
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .2 }}
            >
              <p className="mono text-[10px] text-indigo-400 uppercase tracking-widest mb-3">
                {role === "student" ? "Student Portal" : "Creator Panel"}
              </p>
              <h2 className="text-2xl font-bold text-zinc-100 leading-snug mb-4">
                {role === "student"
                  ? "Attempt exams with confidence"
                  : "Build and publish tests effortlessly"
                }
              </h2>
              <div className="flex flex-col gap-2.5">
                {FEATURES[role].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* footer note */}
          <p className="mono text-[10px] text-zinc-700 tracking-widest">
            AI-POWERED · SECURE · FAIR
          </p>
        </div>

        {/* ── RIGHT: form ── */}
        <div className="flex flex-col p-8 sm:p-10">

          {/* mobile logo */}
          <div className="mb-8 md:hidden">
            <Logo size="sm" />
          </div>

          <div className="mb-7">
            <h1 className="text-xl font-bold text-zinc-100">Welcome back</h1>
            <p className="text-sm text-zinc-500 mt-1">Sign in to your account</p>
          </div>

          {/* role selector */}
          <div className="flex gap-2 mb-7">
            {[
              { key: "student", label: "Student", icon: GraduationCap },
              { key: "creator", label: "Creator", icon: ShieldCheck },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setRole(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  text-sm font-semibold border transition-all
                  ${role === key
                    ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                    : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3 flex-1">

            <div className="flex flex-col gap-1.5">
              <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3
                  text-sm text-zinc-200 placeholder:text-zinc-600 outline-none
                  focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15
                  transition-all"
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-11
                    text-sm text-zinc-200 placeholder:text-zinc-600 outline-none
                    focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15
                    transition-all"
                />
                <button type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600
                    hover:text-zinc-400 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit"
              className="w-full mt-2 py-3 rounded-xl text-sm font-semibold
                bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
              Sign In
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-zinc-600">
            Don't have an account?{" "}
            <Link to="/register"
              className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}