/**
 * LiveMonitorPanel.jsx  —  src/components/LiveMonitorPanel.jsx
 *
 * Creator opens this panel to watch all students in real time.
 * Each student sends two WebRTC streams: camera + screen share.
 * Nothing is stored. Streams exist only in RAM while the exam runs.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Monitor, Camera, ShieldAlert,
  Wifi, WifiOff, Users, Maximize2,
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

/* ─────────────────────────────────────────────
   Single video element — attaches stream when ready
───────────────────────────────────────────── */
function LiveVideo({ stream, label, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className={`relative bg-zinc-950 rounded-lg overflow-hidden ${className}`}>
      {stream ? (
        <video ref={ref} autoPlay playsInline muted
          className="w-full h-full object-cover" />
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
   One student tile  — camera + screen + badges
───────────────────────────────────────────── */
function StudentTile({ student, onExpand }) {
  const v = student.violations ?? {};
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
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
          <span className="text-xs font-medium text-zinc-200 truncate max-w-[110px]">
            {student.username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {student.cameraStream && <Camera  size={10} className="text-emerald-400" />}
          {student.screenStream && <Monitor size={10} className="text-indigo-400"  />}
          {total > 0 && (
            <span className="flex items-center gap-0.5 mono text-[9px] text-rose-400">
              <ShieldAlert size={9} />{total}
            </span>
          )}
          <button onClick={() => onExpand(student)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors ml-1">
            <Maximize2 size={11} />
          </button>
        </div>
      </div>

      {/* feeds */}
      <div className="grid grid-rows-2 gap-1 p-1.5 bg-black flex-1">
        <LiveVideo stream={student.cameraStream} label="CAM"    className="aspect-video" />
        <LiveVideo stream={student.screenStream} label="SCREEN" className="aspect-video" />
      </div>

      {/* violation pills */}
      {total > 0 && (
        <div className="px-3 py-2 border-t border-zinc-800/60 flex flex-wrap gap-1">
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
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Expanded overlay — full-screen view of one student
───────────────────────────────────────────── */
function ExpandedView({ student, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-zinc-200">{student.username}</span>
          <span className="mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Expanded view
          </span>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
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
    </div>
  );
}

/* ═════════════════════════════════════════════
   MAIN PANEL
═════════════════════════════════════════════ */
export default function LiveMonitorPanel({ test, onClose }) {
  const socketRef = useRef(null);
  /* pcs[userId][streamType] = RTCPeerConnection */
  const pcsRef    = useRef({});

  const [students,   setStudents]   = useState({});
  const [connected,  setConnected]  = useState(false);
  const [expanded,   setExpanded]   = useState(null);

  /* ── create a peer connection for one student stream ── */
  const createPC = useCallback((userId, streamType) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current?.emit("ice:toStudent", {
          testId: test._id, userId, streamType, candidate,
        });
      }
    };

    /* stream arrives here — attach to student state */
    pc.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (!stream) return;
      setStudents(prev => ({
        ...prev,
        [userId]: {
          ...(prev[userId] ?? {}),
          [streamType === "camera" ? "cameraStream" : "screenStream"]: stream,
        },
      }));
    };

    if (!pcsRef.current[userId]) pcsRef.current[userId] = {};
    pcsRef.current[userId][streamType] = pc;
    return pc;
  }, [test._id]);

  /* ── Socket.io connection ── */
  useEffect(() => {
    const token  = localStorage.getItem("token");
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("creator:join", { testId: test._id });
    });
    socket.on("disconnect", () => setConnected(false));

    /* Already-connected students snapshot */
    socket.on("room:snapshot", ({ students: snap }) => {
      const init = {};
      snap.forEach(s => {
        init[s.userId] = { userId: s.userId, username: s.username, violations: s.violations };
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

    /* ── WebRTC offer from student ── */
    socket.on("webrtc:offer", async ({ userId, username, streamType, offer }) => {
      /* ensure student entry exists */
      setStudents(prev => ({
        ...prev,
        [userId]: prev[userId] ?? { userId, username, cameraStream: null, screenStream: null, violations: {} },
      }));

      const pc = createPC(userId, streamType);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { testId: test._id, userId, streamType, answer });
    });

    /* ── ICE from student ── */
    socket.on("ice:fromStudent", async ({ userId, streamType, candidate }) => {
      const pc = pcsRef.current[userId]?.[streamType];
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    });

    /* ── Violation relay ── */
    socket.on("violation", ({ userId, violations }) => {
      setStudents(prev => ({
        ...prev,
        [userId]: { ...(prev[userId] ?? {}), violations },
      }));
    });

    return () => {
      Object.values(pcsRef.current)
        .forEach(streams => Object.values(streams).forEach(pc => pc.close()));
      socket.disconnect();
    };
  }, [test._id, createPC]);

  const removeStudent = (userId) => {
    setStudents(prev => { const n = { ...prev }; delete n[userId]; return n; });
    if (pcsRef.current[userId]) {
      Object.values(pcsRef.current[userId]).forEach(pc => pc.close());
      delete pcsRef.current[userId];
    }
    setExpanded(prev => prev?.userId === userId ? null : prev);
  };

  const list         = Object.values(students);
  const flaggedCount = list.filter(s => {
    const v = s.violations ?? {};
    return ((v.tabs ?? 0) + (v.face ?? 0) + (v.device ?? 0) + (v.esc ?? 0)) >= 3;
  }).length;

  const gridCols =
    list.length <= 1 ? "grid-cols-1 max-w-md mx-auto"
    : list.length <= 4 ? "grid-cols-2"
    : list.length <= 9 ? "grid-cols-3"
    : "grid-cols-4";

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

        <div className="flex items-center gap-3">
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
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
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
      <div className="flex-1 overflow-y-auto p-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
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
                <StudentTile key={s.userId} student={s} onExpand={setExpanded} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* expanded overlay */}
      <AnimatePresence>
        {expanded && (
          <ExpandedView student={expanded} onClose={() => setExpanded(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}