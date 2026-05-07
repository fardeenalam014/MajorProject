import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Brain, Lock } from "lucide-react";
import Logo from "../components/Logo";
import "./LandingPage.css";

const FU = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--lp-bg)", width: "100%", overflowX: "hidden" }}>

      {/* NAV */}
      <motion.nav className="nav" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <Logo size="sm" />
        </button>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
          <button className="btn-primary" onClick={() => navigate("/register")}>
            Get started <ArrowUpRight size={13} />
          </button>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="hero" style={{ minHeight: "55vh", paddingTop: 120 }}>
        <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div className="hero-glow breathe" />
        <motion.div className="hero-eyebrow" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <span className="hero-eyebrow-dot" />
          <span className="mono">Who we are</span>
        </motion.div>
        <motion.h1 className="hero-title bebas" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
          ABOUT
        </motion.h1>
        <motion.h1 className="hero-title bebas shimmer-text" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
          AIEXAMGUARD
        </motion.h1>
        <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          A platform built to make online exams honest — for students who study hard and teachers who deserve accurate results.
        </motion.p>
      </section>

      {/* STORY */}
      <section style={{ padding: "clamp(60px,10vh,100px) clamp(20px,5vw,40px)", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <FU>
          <p className="section-eyebrow">Our story</p>
          <h2 className="section-title bebas" style={{ marginBottom: 24 }}>WHY WE BUILT THIS</h2>
          <p style={{ color: "var(--lp-text-muted)", lineHeight: 1.9, fontSize: "clamp(14px,1.5vw,16px)", marginBottom: 16 }}>
            Online exams were easy to cheat. Students could switch tabs, let someone else sit in front of the camera, or look up answers on their phone — and no one would know.
          </p>
          <p style={{ color: "var(--lp-text-muted)", lineHeight: 1.9, fontSize: "clamp(14px,1.5vw,16px)" }}>
            AIExamGuard fixes that. It watches the camera, locks the screen, and flags suspicious activity — all on the student's own device. No video is ever uploaded. No data leaves the browser.
          </p>
        </FU>
      </section>

      {/* 3 CARDS */}
      <section style={{ padding: "0 clamp(20px,5vw,40px) clamp(80px,10vh,120px)", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {[
            { icon: Brain,  color: "#6366f1", title: "On-Device AI",     desc: "Every AI model runs in the browser. No cloud. No uploads. No surveillance." },
            { icon: Shield, color: "#10b981", title: "Fair for Everyone", desc: "Same rules, same AI, same experience for every student — every time." },
            { icon: Lock,   color: "#f59e0b", title: "Private by Design", desc: "Student camera feeds are never stored. We log flags, not footage." },
          ].map((c, i) => (
            <FU key={i} delay={i * 0.1}>
              <div className="feature-card card-hover">
                <div className="feature-icon" style={{ background: `${c.color}15`, border: `1px solid ${c.color}25` }}>
                  <c.icon size={18} style={{ color: c.color }} />
                </div>
                <h3 className="feature-title">{c.title}</h3>
                <p className="feature-desc">{c.desc}</p>
              </div>
            </FU>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta" style={{ paddingTop: 0 }}>
        <FU>
          <div className="cta-box">
            <div className="cta-corner-glow" />
            <h2 className="cta-title bebas">READY TO TRY IT?</h2>
            <p className="cta-body">No setup. No subscription. Just fair exams from day one.</p>
            <div className="cta-actions">
              <button className="btn-primary" style={{ fontSize: 15, padding: "14px 32px" }} onClick={() => navigate("/register")}>
                Create your account
              </button>
              <button className="btn-ghost" style={{ fontSize: 15, padding: "14px 32px" }} onClick={() => navigate("/contact")}>
                Contact us
              </button>
            </div>
          </div>
        </FU>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <Logo size="sm" />
        <span className="footer-copy">© 2025 AIExamGuard · AI-Powered · Secure · Fair</span>
        <div className="footer-links">
          {[["Login", "/login"], ["Register", "/register"], ["Contact", "/contact"]].map(([label, path]) => (
            <button key={label} className="footer-link" onClick={() => navigate(path)}>{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}