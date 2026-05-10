// src/components/InvitePanel.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Send, Users, X, Copy, CheckCircle2,
  Upload, ChevronDown, Loader2, AlertCircle,
} from "lucide-react";

const TABS = ["individual", "bulk"];

export default function InvitePanel({ tests = [], onClose }) {
  const [tab,      setTab]      = useState("individual");
  const [testId,   setTestId]   = useState(tests[0]?._id || "");
  const [emails,   setEmails]   = useState("");
  const [bulk,     setBulk]     = useState("");
  const [status,   setStatus]   = useState(null); // null | sending | done | error
  const [copied,   setCopied]   = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const selectedTest = tests.find(t => t._id === testId);

  const emailList = tab === "individual"
    ? emails.split(/[,\s\n]+/).map(e => e.trim()).filter(Boolean)
    : bulk.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);

  const isValid = testId && emailList.length > 0;

async function handleSend() {
  if (!isValid) { setStatus("error"); return; }
  setStatus("sending");
    
  const res = await fetch(`${import.meta.env.VITE_API_URL}/invites/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token_creator")}`,
    },
    body: JSON.stringify({ testId, emails: emailList }),
  });

  const data = await res.json();
  if (data.success) {
    setStatus("done");
    setTimeout(() => { setStatus(null); setEmails(""); setBulk(""); }, 3000);
  } else {
    setStatus("error");
  }
}

  function copyTestCode() {
    if (!selectedTest?.testCode) return;
    navigator.clipboard.writeText(selectedTest.testCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split("\n").map(l => l.trim()).filter(Boolean);
      // support CSV with header row "email" or just raw emails
      const parsed = lines
        .filter(l => l.includes("@"))
        .map(l => l.split(",")[0].replace(/"/g, "").trim());
      setBulk(prev => [...new Set([...prev.split("\n"), ...parsed])].filter(Boolean).join("\n"));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 w-64 shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25
            flex items-center justify-center">
            <Mail size={13} className="text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-200">Invite Students</p>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>

        {/* Test selector */}
        <div className="space-y-1.5">
          <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Select Test
          </label>
          <div className="relative">
            <button
              onClick={() => setDropOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5
                bg-zinc-900 border border-zinc-800 rounded-xl text-left
                hover:border-zinc-700 transition-colors"
            >
              <span className="text-xs text-zinc-300 truncate">
                {selectedTest ? selectedTest.title : "Choose a test…"}
              </span>
              <ChevronDown size={12} className={`text-zinc-600 shrink-0 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-20
                    bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
                >
                  {tests.length === 0
                    ? <p className="text-xs text-zinc-600 text-center py-3">No tests yet</p>
                    : tests.map(t => (
                      <button key={t._id}
                        onClick={() => { setTestId(t._id); setDropOpen(false); }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5
                          text-left text-xs transition-colors hover:bg-zinc-800
                          ${t._id === testId ? "text-indigo-400" : "text-zinc-400"}`}
                      >
                        <span className="truncate">{t.title}</span>
                        {t.published
                          ? <span className="mono text-[9px] text-emerald-400 shrink-0">Live</span>
                          : <span className="mono text-[9px] text-zinc-600 shrink-0">Draft</span>}
                      </button>
                    ))
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Test code copy */}
        {selectedTest?.testCode && (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5
            bg-zinc-900 border border-zinc-800 rounded-xl">
            <div>
              <p className="mono text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Test Code</p>
              <p className="mono text-sm font-bold text-indigo-400">{selectedTest.testCode}</p>
            </div>
            <button onClick={copyTestCode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all
                ${copied
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/8"
                  : "text-zinc-500 border-zinc-700 hover:border-zinc-600 hover:text-zinc-300"}`}>
              {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg mono text-[10px] uppercase tracking-wide
                transition-all font-medium
                ${tab === t
                  ? "bg-indigo-500 text-white"
                  : "text-zinc-500 hover:text-zinc-300"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Individual */}
        {tab === "individual" && (
          <div className="space-y-1.5">
            <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Email Addresses
            </label>
            <textarea
              value={emails}
              onChange={e => setEmails(e.target.value)}
              placeholder={"student1@email.com\nstudent2@email.com\nor comma separated"}
              rows={5}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5
                text-xs text-zinc-300 placeholder-zinc-700 outline-none resize-none
                focus:border-indigo-500/50 transition-colors font-mono"
            />
            {emails && (
              <p className="mono text-[10px] text-zinc-600">
                {emailList.length} address{emailList.length !== 1 ? "es" : ""}
              </p>
            )}
          </div>
        )}

        {/* Bulk / CSV */}
        {tab === "bulk" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Paste Emails
              </label>
              <textarea
                value={bulk}
                onChange={e => setBulk(e.target.value)}
                placeholder={"One email per line or CSV\nstudent1@email.com\nstudent2@email.com"}
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5
                  text-xs text-zinc-300 placeholder-zinc-700 outline-none resize-none
                  focus:border-indigo-500/50 transition-colors font-mono"
              />
            </div>

            {/* CSV upload */}
            <div>
              <label className="mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-1.5">
                Or upload CSV
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-2.5
                border border-dashed border-zinc-800 rounded-xl cursor-pointer
                text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors text-xs">
                <Upload size={12} />
                <span>Upload .csv file</span>
                <input type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
              </label>
            </div>

            {bulk && (
              <p className="mono text-[10px] text-zinc-600">
                {emailList.length} address{emailList.length !== 1 ? "es" : ""}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/8
            border border-rose-500/20 rounded-xl">
            <AlertCircle size={12} className="text-rose-400 shrink-0" />
            <p className="text-xs text-rose-400">
              {!testId ? "Select a test first" : "Add at least one email"}
            </p>
          </div>
        )}

        {/* Success */}
        {status === "done" && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/8
            border border-emerald-500/20 rounded-xl">
            <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400">Invites sent successfully!</p>
          </div>
        )}
      </div>

      {/* Send button */}
      <div className="px-4 pb-4 pt-3 border-t border-zinc-800 shrink-0">
        <button
          onClick={handleSend}
          disabled={status === "sending" || status === "done"}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            text-sm font-semibold transition-all
            ${status === "done"
              ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 cursor-default"
              : status === "sending"
                ? "bg-indigo-500/70 text-white cursor-wait"
                : isValid
                  ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
        >
          {status === "sending" ? (
            <><Loader2 size={14} className="animate-spin" /> Sending…</>
          ) : status === "done" ? (
            <><CheckCircle2 size={14} /> Sent!</>
          ) : (
            <><Send size={14} /> Send {emailList.length > 0 ? `(${emailList.length})` : ""} Invites</>
          )}
        </button>
        <p className="mono text-[9px] text-zinc-700 text-center mt-2">
          Students receive the test code via email
        </p>
      </div>
    </div>
  );
}