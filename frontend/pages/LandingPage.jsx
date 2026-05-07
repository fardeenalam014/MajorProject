import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap, Shield, Eye, Clock, Lock,
  CheckCircle2, Camera, Users,
  ArrowUpRight, ChevronRight, ScanFace, MonitorSmartphone,
} from "lucide-react";
import Logo from "../components/Logo";
import "./LandingPage.css";
import ThemeSwitcher from "../components/ThemeSwitcher";


const FU = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);


const ProctoringBadge = ({ icon: Icon, label, value, color, style }) => (
  <div className="proctoring-badge" style={style}>
    <Icon size={13} style={{ color }} />
    <div>
      <p className="proctoring-badge-label">{label}</p>
      <p className="proctoring-badge-value" style={{ color }}>{value}</p>
    </div>
  </div>
);


const FEATURES = [
  { icon: ScanFace,          color: "#6366f1", title: "Face Tracking",   desc: "Continuous face detection flags absence or multiple people in real time." },
  { icon: MonitorSmartphone, color: "#10b981", title: "Device Detection", desc: "On-device AI spots phones, books and prohibited items without cloud upload." },
  { icon: Shield,            color: "#f59e0b", title: "Fullscreen Lock",  desc: "Enforced fullscreen with instant re-entry prompts and violation logging." },
  { icon: Eye,               color: "#06b6d4", title: "Tab Guard",        desc: "Every tab switch is caught, logged, and triggers an immediate warning." },
  { icon: Clock,             color: "#a78bfa", title: "Section Timers",   desc: "Per-section countdowns auto-advance students — fair for everyone." },
  { icon: Lock,              color: "#f43f5e", title: "Private by Design", desc: "Zero video upload. All AI runs locally. Your data never leaves the device." },
];

const STEPS = [
  { n: "01", title: "Register",      desc: "Create your account as a student or test creator in seconds." },
  { n: "02", title: "Build or Join", desc: "Creators build sectioned tests with timers. Students enter a test ID." },
  { n: "03", title: "Exam begins",   desc: "Camera activates, fullscreen locks, AI monitoring starts automatically." },
  { n: "04", title: "Results",       desc: "Submit when done. Creators review flagged events and scores." },
];

const TICKER_WORDS = [
  "AI Proctoring", "•", "Face Detection", "•", "Tab Guard", "•",
  "Fullscreen Lock", "•", "Section Timers", "•", "Object Detection", "•",
  "On-Device AI", "•", "Zero Upload", "•", "Secure Exams", "•",
];

const STUDENT_CHECKLIST = [
  "Section-wise timed questions with live countdown",
  "Visual question map — see answered at a glance",
  "MCQ and numerical answer types supported",
  "One-click submit with instant confirmation",
];

const CREATOR_CHECKLIST = [
  "Unlimited sections with individual timers",
  "MCQ with images + numerical answer types",
  "Auto marks calculation across all sections",
  "Publish, draft, edit and delete anytime",
];


export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--lp-bg)", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>

      {}
      <motion.nav
        className="nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="sm" />
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate("/about")}>About</button>
          <button className="btn-ghost" onClick={() => navigate("/contact")}>Contact</button>
          <button className="btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
          <button className="btn-primary" onClick={() => navigate("/register")}>
            Get started <ArrowUpRight size={13} />
          </button>
          <ThemeSwitcher />
        </div>
      </motion.nav>

      {}
      <section className="hero">
        <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div className="hero-glow breathe" />

        {}
        <motion.div
          className="hero-eyebrow"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <span className="hero-eyebrow-dot" />
          <span className="mono">AI-Powered Proctoring Platform</span>
        </motion.div>

        {}
        <motion.h1
          className="hero-title bebas"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          GUARD YOUR
        </motion.h1>
        <motion.h1
          className="hero-title bebas shimmer-text"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          EXAMS
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
        >
          Real-time AI proctoring — face detection, tab guard, object detection —
          running entirely on-device. No cloud, no compromise.
        </motion.p>

        <motion.div
          className="hero-ctas"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <button className="btn-primary" onClick={() => navigate("/register")}>
            Start free <ChevronRight size={15} />
          </button>
          <button className="btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
        </motion.div>

        {}
        <motion.div
          className="hero-image-wrap float-img"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-image-glow" />
          <div className="hero-image-frame">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1100&h=520&fit=crop&crop=center&q=80"
              alt="Students in exam"
            />
            <div className="hero-image-overlay" />
            <div className="scan-line" />
          </div>

          <ProctoringBadge icon={ScanFace} label="Face status"  value="Detected ✓"  color="#10b981" style={{ top: 20, left: 20 }} />
          <ProctoringBadge icon={Shield}   label="Fullscreen"   value="Enforced"     color="#6366f1" style={{ top: 20, right: 20 }} />
          <ProctoringBadge icon={Eye}      label="Tab activity" value="0 switches"   color="#06b6d4" style={{ bottom: 20, left: 20 }} />
          <ProctoringBadge icon={Camera}   label="Camera"       value="Live ● REC"   color="#f43f5e" style={{ bottom: 20, right: 20 }} />
        </motion.div>
      </section>

      {}
      <div className="ticker-strip">
        <div className="ticker-track ticker">
          {[...TICKER_WORDS, ...TICKER_WORDS].map((w, i) => (
            <span key={i} className={`ticker-word${w === "•" ? " dot" : ""}`}>{w}</span>
          ))}
        </div>
      </div>

      {}
      <section className="section-split">
        <div className="split-grid">
          <FU>
            <div className="split-image-wrap">
              <div className="split-image-frame">
                <img
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=700&h=520&fit=crop&crop=center&q=80"
                  alt="Student taking exam on laptop"
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(135deg, var(--indigo-dim) 0%, transparent 60%)",
                }} />
              </div>

              <div className="split-overlay-card bottom-right">
                <p className="split-overlay-title">Section Progress</p>
                {["Physics", "Chemistry", "Math"].map((s, i) => (
                  <div className="progress-row" key={s}>
                    <span className="progress-label mono">{s}</span>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${[85, 60, 40][i]}%` }} />
                    </div>
                    <span className="progress-pct mono">{[85, 60, 40][i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </FU>

          <FU delay={0.15}>
            <span className="split-eyebrow mono" style={{ color: "var(--indigo)" }}>For Students</span>
            <h2 className="split-heading bebas">FOCUS ON<br />THE EXAM</h2>
            <p className="split-body">
              Clean, distraction-free interface. Navigate questions freely within each section,
              track your answers visually, and submit with confidence. The AI handles security —
              you handle the answers.
            </p>
            <div className="checklist">
              {STUDENT_CHECKLIST.map((item, i) => (
                <div className="checklist-item" key={i}>
                  <CheckCircle2 size={15} style={{ color: "var(--emerald)", marginTop: 2, flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => navigate("/register")}>
              Register as Student <ArrowUpRight size={14} />
            </button>
          </FU>
        </div>
      </section>

      {}
      <section className="section-split" style={{ paddingTop: 0 }}>
        <div className="split-grid reversed">
          <FU delay={0.15}>
            <span className="split-eyebrow mono" style={{ color: "var(--indigo)" }}>For Creators</span>
            <h2 className="split-heading bebas">BUILD TESTS<br />IN MINUTES</h2>
            <p className="split-body">
              A three-panel editor that gets out of your way. Add sections, set timers,
              write MCQ or numerical questions, attach images, and marks auto-calculate.
              Publish with one click.
            </p>
            <div className="checklist">
              {CREATOR_CHECKLIST.map((item, i) => (
                <div className="checklist-item" key={i}>
                  <CheckCircle2 size={15} style={{ color: "var(--indigo)", marginTop: 2, flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button className="btn-ghost" onClick={() => navigate("/register")}>
              Start creating <ArrowUpRight size={14} />
            </button>
          </FU>

          <FU>
            <div className="split-image-wrap">
              <div className="split-image-frame">
                <img
                  src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=700&h=520&fit=crop&crop=center&q=80"
                  alt="Person creating content on laptop"
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(225deg, var(--indigo-dim) 0%, transparent 60%)",
                }} />
              </div>

              <div className="split-overlay-card top-left">
                <p className="split-overlay-title mono">Test Builder</p>
                {[
                  { label: "Sections",     value: "3",   color: "#a78bfa" },
                  { label: "Questions",    value: "45",  color: "#6366f1" },
                  { label: "Total Marks",  value: "180", color: "#10b981" },
                ].map(row => (
                  <div className="builder-row" key={row.label}>
                    <span className="builder-row-label mono">{row.label}</span>
                    <span className="builder-row-value mono" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </FU>
        </div>
      </section>

      {}
      <section className="section-features">
        <div className="section-features-inner">
          <FU>
            <div className="section-header">
              <p className="section-eyebrow">Under the hood</p>
              <h2 className="section-title bebas">BUILT FOR INTEGRITY</h2>
            </div>
          </FU>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <FU key={i} delay={i * 0.06}>
                <div className="feature-card card-hover">
                  <div className="feature-icon" style={{
                    background: `${f.color}15`,
                    border: `1px solid ${f.color}25`,
                  }}>
                    <f.icon size={18} style={{ color: f.color }} />
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </FU>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="section-how">
        <FU>
          <div style={{ marginBottom: 60 }}>
            <p className="section-eyebrow">The process</p>
            <h2 className="section-title bebas">HOW IT WORKS</h2>
          </div>
        </FU>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <FU key={i} delay={i * 0.08}>
              <div className={`step${i === 0 ? " active" : ""}`}>
                <span className="step-number bebas">{s.n}</span>
                <h3 className="step-title bebas">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            </FU>
          ))}
        </div>
      </section>

      {}
      <FU>
        <div className="image-strip">
          <img
            src="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1400&h=400&fit=crop&crop=center&q=80"
            alt="Exam hall"
          />
          <div className="image-strip-overlay" />
          <div className="image-strip-content">
            <p className="image-strip-eyebrow">Trusted in classrooms worldwide</p>
            <h2 className="image-strip-title bebas">50,000+ EXAMS SECURED</h2>
          </div>
        </div>
      </FU>

      {}
      <section className="section-cta">
        <FU>
          <div className="cta-box">
            <div className="cta-corner-glow" />
            <div className="cta-icon">
              <Zap size={22} style={{ color: "var(--indigo)" }} />
            </div>
            <h2 className="cta-title bebas">READY TO RUN<br />SECURE EXAMS?</h2>
            <p className="cta-body">
              Join educators and students who rely on AIExamGuard for fair,
              AI-powered assessments — no setup, no subscriptions.
            </p>
            <div className="cta-actions">
              <button className="btn-primary" style={{ fontSize: 15, padding: "14px 32px" }}
                onClick={() => navigate("/register")}>
                <Users size={16} /> Create your account
              </button>
              <button className="btn-ghost" style={{ fontSize: 15, padding: "14px 32px" }}
                onClick={() => navigate("/login")}>
                Sign in
              </button>
            </div>
          </div>
        </FU>
      </section>

      {}
      <footer className="footer">
        <Logo size="sm" />
        <span className="footer-copy">© 2025 AIExamGuard · AI-Powered · Secure · Fair</span>
        <div className="footer-links">
          {[["Login", "/login"], ["Register", "/register"]].map(([label, path]) => (
            <button key={label} className="footer-link" onClick={() => navigate(path)}>
              {label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}