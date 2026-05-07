import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Mail, User, MessageSquare, Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
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

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "var(--lp-card)", border: "1px solid var(--lp-border-card)",
  borderRadius: 12, padding: "13px 16px",
  fontSize: 14, color: "var(--lp-text)",
  outline: "none", fontFamily: "inherit",
  transition: "border-color .2s",
};

export default function ContactPage() {
  const navigate = useNavigate();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

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
      <section className="hero" style={{ minHeight: "50vh", paddingTop: 120 }}>
        <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div className="hero-glow breathe" />
        <motion.div className="hero-eyebrow" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <span className="hero-eyebrow-dot" />
          <span className="mono">We read every message</span>
        </motion.div>
        <motion.h1 className="hero-title bebas" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
          GET IN
        </motion.h1>
        <motion.h1 className="hero-title bebas shimmer-text" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
          TOUCH
        </motion.h1>
        <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          Got a question or found a bug? Drop us a message and we'll reply within 24 hours.
        </motion.p>
      </section>

      {/* FORM */}
      <section style={{ padding: "clamp(60px,10vh,100px) clamp(20px,5vw,40px)", maxWidth: 560, margin: "0 auto" }}>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "clamp(40px,6vw,64px) 32px", background: "var(--lp-card)", border: "1px solid rgba(16,185,129,.25)", borderRadius: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={26} color="#10b981" />
              </div>
              <h2 className="bebas" style={{ fontSize: 32, color: "var(--lp-text-title)", margin: "0 0 10px" }}>Message Sent!</h2>
              <p style={{ color: "var(--lp-text-muted)", lineHeight: 1.75, marginBottom: 28, fontSize: 14 }}>
                Thanks <strong style={{ color: "var(--lp-text)" }}>{name}</strong> — we'll reply to <strong style={{ color: "var(--indigo)" }}>{email}</strong> within 24 hours.
              </p>
              <button className="btn-ghost" onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); }}>
                Send another
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FU>
                <h2 className="bebas" style={{ fontSize: "clamp(28px,4vw,40px)", color: "var(--lp-text-title)", marginBottom: 8 }}>SEND A MESSAGE</h2>
                <p style={{ color: "var(--lp-text-muted)", marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
                  Whether you're a student, teacher, or just curious — we'd love to hear from you.
                </p>
              </FU>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* NAME */}
                <FU delay={0.05}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="mono" style={{ fontSize: 10, color: "var(--lp-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Name</label>
                    <div style={{ position: "relative" }}>
                      <User size={13} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--lp-text-dim)", pointerEvents: "none" }} />
                      <input
                        type="text" placeholder="John Doe" required value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 38 }}
                        onFocus={e => e.target.style.borderColor = "var(--indigo)"}
                        onBlur={e => e.target.style.borderColor = "var(--lp-border-card)"}
                      />
                    </div>
                  </div>
                </FU>

                {/* EMAIL */}
                <FU delay={0.08}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="mono" style={{ fontSize: 10, color: "var(--lp-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={13} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--lp-text-dim)", pointerEvents: "none" }} />
                      <input
                        type="email" placeholder="you@example.com" required value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 38 }}
                        onFocus={e => e.target.style.borderColor = "var(--indigo)"}
                        onBlur={e => e.target.style.borderColor = "var(--lp-border-card)"}
                      />
                    </div>
                  </div>
                </FU>

                {/* MESSAGE */}
                <FU delay={0.11}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="mono" style={{ fontSize: 10, color: "var(--lp-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Message</label>
                    <div style={{ position: "relative" }}>
                      <MessageSquare size={13} style={{ position: "absolute", left: 14, top: 14, color: "var(--lp-text-dim)", pointerEvents: "none" }} />
                      <textarea
                        placeholder="What's on your mind?" required rows={5} value={message}
                        onChange={e => setMessage(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 38, resize: "vertical", minHeight: 120, lineHeight: 1.7 }}
                        onFocus={e => e.target.style.borderColor = "var(--indigo)"}
                        onBlur={e => e.target.style.borderColor = "var(--lp-border-card)"}
                      />
                    </div>
                  </div>
                </FU>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f43f5e", fontSize: 13 }}>
                    <AlertCircle size={13} /> {error}
                  </div>
                )}

                <FU delay={0.14}>
                  <button type="submit" disabled={sending} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: 14, opacity: sending ? 0.7 : 1 }}>
                    {sending
                      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
                      : <><Send size={14} /> Send Message</>}
                  </button>
                </FU>

              </form>

              {/* EMAIL DIRECT */}
              <FU delay={0.18}>
                <p className="mono" style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "var(--lp-text-dim)" }}>
                  Or email us directly at{" "}
                  <a href="mailto:support@aiexamguard.com" style={{ color: "var(--indigo)", textDecoration: "none" }}>
                    support@aiexamguard.com
                  </a>
                </p>
              </FU>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <Logo size="sm" />
        <span className="footer-copy">© 2025 AIExamGuard · AI-Powered · Secure · Fair</span>
        <div className="footer-links">
          {[["Login", "/login"], ["Register", "/register"], ["About", "/about"]].map(([label, path]) => (
            <button key={label} className="footer-link" onClick={() => navigate(path)}>{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}