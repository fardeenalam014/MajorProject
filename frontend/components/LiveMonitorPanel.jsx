/**
 * LiveMonitorPanel.jsx  —  src/components/LiveMonitorPanel.jsx
 *
 * Added:
 *  - Per-student: Send Warning, Terminate (with confirm), Direct Chat
 *  - Broadcast: Chat to all students at once
 *  - Chat drawer (slide-in) with message history per student + broadcast
 *  - All actions emit socket events: proctor:warn, proctor:terminate, proctor:chat
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Monitor, Camera, ShieldAlert,
  Wifi, WifiOff, Users, Maximize2,
  AlertTriangle, UserX, MessageSquare,
  Send, Radio, ChevronDown, Trash2,
} from "lucide-react";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

/* ─────────────────────────────────────────────
   Single video element
───────────────────────────────────────────── */
function LiveVideo({ stream, label, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (stream) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    } else {
      ref.current.srcObject = null;
    }
  }, [stream]);

  return (
    <div className={`relative bg-zinc-950 rounded-lg overflow-hidden ${className}`}>
      {stream ? (
        <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center min-h-[80px]">
          {label === "CAM"
            ? <Camera  size={18} className="text-zinc-700" />
            : <Monitor size={18} className="text-zinc-700" />}
        </div>
      )}
      <span className="absolute bottom-1 left-1.5 mono text-[8px] text-zinc-400
        bg-black/70 px-1.5 py-0.5 rounded">
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Confirm dialog
───────────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20
            flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={14} className="text-rose-400" />
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400
              hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-xs font-medium
              text-white bg-rose-600 hover:bg-rose-500 transition-all"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Chat Drawer — per-student or broadcast
───────────────────────────────────────────── */
function ChatDrawer({ target, messages, onSend, onClose }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const isBroadcast = target === "__broadcast__";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed right-0 top-0 bottom-0 z-[70] w-80
        bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl"
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3
        border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          {isBroadcast
            ? <Radio size={13} className="text-indigo-400" />
            : <MessageSquare size={13} className="text-emerald-400" />}
          <div>
            <p className="text-xs font-semibold text-zinc-200">
              {isBroadcast ? "Broadcast to all" : target.username}
            </p>
            <p className="mono text-[9px] text-zinc-600">
              {isBroadcast ? "All students will see this" : "Private message"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg
            text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <X size={13} />
        </button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="mono text-[10px] text-zinc-700 text-center">
              {isBroadcast ? "Send a message to all students" : `Start a conversation with ${target.username}`}
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-0.5 ${m.from === "creator" ? "items-end" : "items-start"}`}>
              <div className={`px-2.5 py-1.5 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                m.from === "creator"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-zinc-800 text-zinc-300 rounded-bl-sm border border-zinc-700"
              }`}>
                {m.text}
              </div>
              <span className="mono text-[8px] text-zinc-700 px-1">
                {m.from === "creator" ? "You" : target.username} · {m.time}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="p-3 border-t border-zinc-800 shrink-0">
        {isBroadcast && (
          <p className="mono text-[9px] text-indigo-400 mb-2 flex items-center gap-1">
            <Radio size={8} /> Message sent to all active students
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isBroadcast ? "Broadcast message…" : "Type a message…"}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
              text-xs text-zinc-200 placeholder-zinc-600
              focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30
              disabled:cursor-not-allowed transition-all text-white"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Student action bar (warn / terminate / chat)
───────────────────────────────────────────── */
function StudentActions({ student, onWarn, onTerminate, onChat }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChat(student)}
        title="Chat with student"
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px]
          text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10
          border border-transparent hover:border-indigo-500/20 transition-all"
      >
        <MessageSquare size={9} />
      </button>
      <button
        onClick={() => onWarn(student)}
        title="Send warning"
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px]
          text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10
          border border-transparent hover:border-amber-500/20 transition-all"
      >
        <AlertTriangle size={9} />
      </button>
      <button
        onClick={() => onTerminate(student)}
        title="Terminate exam"
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px]
          text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10
          border border-transparent hover:border-rose-500/20 transition-all"
      >
        <UserX size={9} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   One student tile
───────────────────────────────────────────── */
function StudentTile({ student, onExpand, onWarn, onTerminate, onChat }) {
  const v     = student.violations ?? {};
  const total = (v.tabs ?? 0) + (v.face ?? 0) + (v.device ?? 0) + (v.esc ?? 0);

  const borderColor =
    total === 0 ? "border-zinc-800"
    : total <= 2 ? "border-amber-500/40"
    : "border-rose-500/50";

  const dot =
    total === 0 ? "bg-emerald-400 animate-pulse"
    : total <= 2 ? "bg-amber-400 animate-pulse"
    : "bg-rose-500 animate-pulse";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.18 }}
      className={`rounded-2xl border ${borderColor} bg-zinc-900 flex flex-col overflow-hidden`}
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
          <span className="text-xs font-medium text-zinc-200 truncate max-w-[90px]">
            {student.username}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {student.cameraStream && <Camera  size={9} className="text-emerald-400" />}
          {student.screenStream && <Monitor size={9} className="text-indigo-400"  />}
          {total > 0 && (
            <span className="flex items-center gap-0.5 mono text-[9px] text-rose-400">
              <ShieldAlert size={9} />{total}
            </span>
          )}
          <button
            onClick={() => onExpand(student.userId)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <Maximize2 size={10} />
          </button>
        </div>
      </div>

      {/* feeds */}
      <div className="grid grid-rows-2 gap-1 p-1.5 bg-black flex-1">
        <LiveVideo stream={student.cameraStream} label="CAM"    className="aspect-video" />
        <LiveVideo stream={student.screenStream} label="SCREEN" className="aspect-video" />
      </div>

      {/* action bar */}
      <div className="px-3 py-1.5 border-t border-zinc-800/60 flex items-center justify-between">
        <StudentActions
          student={student}
          onWarn={onWarn}
          onTerminate={onTerminate}
          onChat={onChat}
        />
        {total > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {[
              { k: "tabs",   label: "Tab"    },
              { k: "face",   label: "Face"   },
              { k: "device", label: "Device" },
              { k: "esc",    label: "ESC"    },
            ].filter(x => (v[x.k] ?? 0) > 0).map(x => (
              <span key={x.k}
                className="mono text-[8px] text-rose-300 bg-rose-500/10
                  border border-rose-500/20 px-1.5 py-0.5 rounded">
                {x.label}: {v[x.k]}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Expanded overlay
───────────────────────────────────────────── */
function ExpandedView({ student, onClose, onWarn, onTerminate, onChat }) {
  if (!student) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-zinc-200">{student.username}</span>
          <span className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Expanded view
          </span>
          {/* Action buttons in expanded view */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => onChat(student)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]
                text-indigo-300 bg-indigo-500/10 border border-indigo-500/20
                hover:bg-indigo-500/20 transition-all"
            >
              <MessageSquare size={10} /> Chat
            </button>
            <button
              onClick={() => onWarn(student)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]
                text-amber-300 bg-amber-500/10 border border-amber-500/20
                hover:bg-amber-500/20 transition-all"
            >
              <AlertTriangle size={10} /> Warn
            </button>
            <button
              onClick={() => onTerminate(student)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]
                text-rose-300 bg-rose-500/10 border border-rose-500/20
                hover:bg-rose-500/20 transition-all"
            >
              <UserX size={10} /> Terminate
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
        >
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <p className="mono text-[10px] text-zinc-500 uppercase tracking-widest">Camera</p>
          <LiveVideo stream={student.cameraStream} label="CAM" className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="mono text-[10px] text-zinc-500 uppercase tracking-widest">Screen</p>
          <LiveVideo stream={student.screenStream} label="SCREEN" className="flex-1" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Warn modal — lets creator type a custom warning
───────────────────────────────────────────── */
function WarnModal({ student, onSend, onClose }) {
  const [message, setMessage] = useState("");
  const presets = [
    "Please keep your eyes on the screen.",
    "Do not use any other applications.",
    "Cover your face is not allowed.",
    "Multiple faces detected in camera.",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20
            flex items-center justify-center">
            <AlertTriangle size={13} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-200">Send Warning</p>
            <p className="mono text-[9px] text-zinc-500">to {student.username}</p>
          </div>
        </div>

        {/* preset messages */}
        <div className="flex flex-col gap-1 mb-3">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => setMessage(p)}
              className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-all
                ${message === p
                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
                }`}
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Or type a custom warning…"
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
            text-xs text-zinc-200 placeholder-zinc-600 resize-none mb-3
            focus:outline-none focus:border-amber-500/50 transition-colors"
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400
              hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (message.trim()) { onSend(message.trim()); onClose(); } }}
            disabled={!message.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium
              text-white bg-amber-600 hover:bg-amber-500
              disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Send Warning
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════
   MAIN PANEL
═════════════════════════════════════════════ */
export default function LiveMonitorPanel({ test, onClose }) {
  const socketRef = useRef(null);
  const pcsRef    = useRef({});

  const [students,    setStudents]    = useState({});
  const [connected,   setConnected]   = useState(false);
  const [expandedId,  setExpandedId]  = useState(null);

  // Action states
  const [warnTarget,      setWarnTarget]      = useState(null); // student obj
  const [terminateTarget, setTerminateTarget] = useState(null); // student obj
  const [chatTarget,      setChatTarget]      = useState(null); // student obj | "__broadcast__"
  // chatMessages: { [userId | "__broadcast__"]: [{from, text, time}] }
  const [chatMessages,    setChatMessages]    = useState({});

  /* ── helpers ── */
  const removeStudent = useCallback((userId) => {
    setStudents(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    if (pcsRef.current[userId]) {
      Object.values(pcsRef.current[userId]).forEach(pc => pc.close());
      delete pcsRef.current[userId];
    }
    setExpandedId(prev => prev === userId ? null : prev);
    setChatTarget(prev => (prev && prev !== "__broadcast__" && prev.userId === userId) ? null : prev);
  }, []);

  const getOrCreatePC = useCallback((userId, streamType) => {
    const existing = pcsRef.current[userId]?.[streamType];
    if (existing && existing.signalingState !== "closed") return existing;

    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current?.emit("ice:toStudent", {
          testId: test._id, userId, streamType, candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") pc.restartIce?.();
    };

    pc.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (!stream) return;
      const key = streamType === "camera" ? "cameraStream" : "screenStream";
      setStudents(prev => {
        if (!prev[userId]) return prev;
        if (prev[userId][key] === stream) return prev;
        return { ...prev, [userId]: { ...prev[userId], [key]: stream } };
      });
    };

    if (!pcsRef.current[userId]) pcsRef.current[userId] = {};
    pcsRef.current[userId][streamType] = pc;
    return pc;
  }, [test._id]);

  /* ── Socket.io ── */
  useEffect(() => {
    const token =
      localStorage.getItem("token_creator") ??
      localStorage.getItem("token_student") ??
      localStorage.getItem("token");

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect",    () => { setConnected(true);  socket.emit("creator:join", { testId: test._id }); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", err => console.error("[Monitor] Socket connect error:", err.message));

    socket.on("room:snapshot", ({ students: snap }) => {
      const init = {};
      snap.forEach(s => {
        init[s.userId] = {
          userId: s.userId, username: s.username,
          violations: s.violations ?? {},
          cameraStream: null, screenStream: null,
        };
      });
      setStudents(init);
    });

    socket.on("student:joined", ({ userId, username }) => {
      setStudents(prev => ({
        ...prev,
        [userId]: { userId, username, cameraStream: null, screenStream: null, violations: {} },
      }));
    });

    socket.on("student:submitted", ({ userId }) => removeStudent(userId));
    socket.on("student:left",      ({ userId }) => removeStudent(userId));

    socket.on("webrtc:offer", async ({ userId, username, streamType, offer }) => {
      setStudents(prev => {
        if (prev[userId]) return prev;
        return { ...prev, [userId]: { userId, username, cameraStream: null, screenStream: null, violations: {} } };
      });

      const pc = getOrCreatePC(userId, streamType);
      if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
        try { await pc.setLocalDescription({ type: "rollback" }); } catch {}
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { testId: test._id, userId, streamType, answer });
      } catch (err) {
        console.error("[WebRTC] Answer failed:", err);
      }
    });

    socket.on("ice:fromStudent", async ({ userId, streamType, candidate }) => {
      const pc = pcsRef.current[userId]?.[streamType];
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    });

    socket.on("violation", ({ userId, violations }) => {
      setStudents(prev => {
        if (!prev[userId]) return prev;
        return { ...prev, [userId]: { ...prev[userId], violations } };
      });
    });

    // Receive chat replies from students
    socket.on("proctor:studentReply", ({ userId, message }) => {
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setChatMessages(prev => ({
        ...prev,
        [userId]: [...(prev[userId] ?? []), { from: "student", text: message, time }],
      }));
    });

    return () => {
      Object.values(pcsRef.current).forEach(streams =>
        Object.values(streams).forEach(pc => pc.close())
      );
      pcsRef.current = {};
      socket.disconnect();
      socketRef.current = null;
    };
  }, [test._id, getOrCreatePC, removeStudent]);

  /* ── Action handlers ── */
  const handleWarnSend = useCallback((student, message) => {
    socketRef.current?.emit("proctor:warn", {
      testId: test._id,
      userId: student.userId,
      message,
    });
    // log to chat history
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages(prev => ({
      ...prev,
      [student.userId]: [
        ...(prev[student.userId] ?? []),
        { from: "creator", text: `⚠️ WARNING: ${message}`, time },
      ],
    }));
  }, [test._id]);

  const handleTerminateConfirm = useCallback(() => {
    if (!terminateTarget) return;
    socketRef.current?.emit("proctor:terminate", {
      testId: test._id,
      userId: terminateTarget.userId,
    });
    removeStudent(terminateTarget.userId);
    setTerminateTarget(null);
  }, [terminateTarget, test._id, removeStudent]);

  const handleChatSend = useCallback((text) => {
    if (!chatTarget) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isBroadcast = chatTarget === "__broadcast__";

    if (isBroadcast) {
      socketRef.current?.emit("proctor:chat", {
        testId: test._id,
        userId: null, // server broadcasts to all
        message: text,
        broadcast: true,
      });
      setChatMessages(prev => ({
        ...prev,
        __broadcast__: [...(prev.__broadcast__ ?? []), { from: "creator", text, time }],
      }));
    } else {
      socketRef.current?.emit("proctor:chat", {
        testId: test._id,
        userId: chatTarget.userId,
        message: text,
        broadcast: false,
      });
      setChatMessages(prev => ({
        ...prev,
        [chatTarget.userId]: [...(prev[chatTarget.userId] ?? []), { from: "creator", text, time }],
      }));
    }
  }, [chatTarget, test._id]);

  /* ── Derived ── */
  const list         = Object.values(students);
  const flaggedCount = list.filter(s => {
    const v = s.violations ?? {};
    return ((v.tabs ?? 0) + (v.face ?? 0) + (v.device ?? 0) + (v.esc ?? 0)) >= 3;
  }).length;

  const gridCols =
    list.length <= 1 ? "grid-cols-1 max-w-md mx-auto"
    : list.length <= 4  ? "grid-cols-2"
    : list.length <= 9  ? "grid-cols-3"
    : "grid-cols-4";

  const expandedStudent = expandedId ? students[expandedId] ?? null : null;

  const chatKey = chatTarget === "__broadcast__" ? "__broadcast__" : chatTarget?.userId;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">

      {/* ── top bar ── */}
      <div className="flex items-center justify-between px-6 py-4
        bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-zinc-200">Live Monitor</p>
            <p className="mono text-[10px] text-zinc-500 mt-0.5 truncate max-w-[200px]">
              {test.title}
            </p>
          </div>
          <span className={`flex items-center gap-1.5 ml-3 mono text-[10px] px-2.5 py-1
            rounded-lg border ${connected
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-rose-400   bg-rose-500/10    border-rose-500/20"}`}>
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 mono text-[11px] text-zinc-400
            bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg">
            <Users size={11} />{list.length} live
          </span>
          {flaggedCount > 0 && (
            <span className="flex items-center gap-1.5 mono text-[11px] text-rose-400
              bg-rose-500/10 border border-rose-500/25 px-3 py-1.5 rounded-lg">
              <ShieldAlert size={11} />{flaggedCount} flagged
            </span>
          )}
          {/* Broadcast button */}
          {list.length > 0 && (
            <button
              onClick={() => setChatTarget("__broadcast__")}
              className="flex items-center gap-1.5 mono text-[11px] text-indigo-300
                bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg
                hover:bg-indigo-500/20 transition-all"
            >
              <Radio size={11} /> Broadcast
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* notice */}
      <div className="px-6 py-2 bg-zinc-900/60 border-b border-zinc-800/50 shrink-0">
        <p className="mono text-[10px] text-zinc-600 text-center">
          Streams are peer-to-peer · Nothing is recorded or stored · Feeds disappear when exam ends
        </p>
      </div>

      {/* ── grid ── */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
      >
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800
              flex items-center justify-center">
              <Camera size={24} className="text-zinc-700" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Waiting for students…</p>
              <p className="mono text-[11px] text-zinc-700 mt-1">
                Camera and screen feeds appear here when students start their exam
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className={`grid gap-4 ${gridCols}`}>
              {list.map(s => (
                <StudentTile
                  key={s.userId}
                  student={s}
                  onExpand={setExpandedId}
                  onWarn={setWarnTarget}
                  onTerminate={setTerminateTarget}
                  onChat={setChatTarget}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* ── expanded overlay ── */}
      <AnimatePresence>
        {expandedStudent && (
          <ExpandedView
            student={expandedStudent}
            onClose={() => setExpandedId(null)}
            onWarn={setWarnTarget}
            onTerminate={setTerminateTarget}
            onChat={setChatTarget}
          />
        )}
      </AnimatePresence>

      {/* ── warn modal ── */}
      <AnimatePresence>
        {warnTarget && (
          <WarnModal
            student={warnTarget}
            onSend={msg => handleWarnSend(warnTarget, msg)}
            onClose={() => setWarnTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── terminate confirm ── */}
      <AnimatePresence>
        {terminateTarget && (
          <ConfirmDialog
            message={`Terminate ${terminateTarget.username}'s exam? This will immediately end their session and cannot be undone.`}
            onConfirm={handleTerminateConfirm}
            onCancel={() => setTerminateTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── chat drawer ── */}
      <AnimatePresence>
        {chatTarget && (
          <ChatDrawer
            target={chatTarget}
            messages={chatMessages[chatKey] ?? []}
            onSend={handleChatSend}
            onClose={() => setChatTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}