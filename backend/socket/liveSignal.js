/**
 * socket/liveSignal.js
 * Pure in-memory WebRTC signalling relay.
 * Nothing is written to MongoDB — ever.
 * All data lives in RAM and disappears when sessions end.
 *
 * Flow:
 *  Student  → student:join     → joins room by testId
 *  Student  → webrtc:offer     → sends camera or screen offer
 *  Server   → relays offer     → to creator
 *  Creator  → webrtc:answer    → sends answer back to student
 *  Both     → ice:to*          → relay ICE candidates
 *  Student  → violation        → relay to creator (no DB write)
 */

const jwt = require("jsonwebtoken");

/*
 * rooms[testId] = {
 *   creatorSocketId: string | null,
 *   students: {
 *     [userId]: { socketId, username, violations:{tabs,face,device,esc} }
 *   }
 * }
 */
const rooms = {};

module.exports = (io) => {

  /* ── JWT auth for every socket connection ── */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded   = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId   = String(decoded.id);
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {

    /* ════════════════════════════════════
       CREATOR opens live monitor
    ════════════════════════════════════ */
    socket.on("creator:join", ({ testId }) => {
      if (!rooms[testId]) rooms[testId] = { creatorSocketId: null, students: {} };
      rooms[testId].creatorSocketId = socket.id;
      socket.join(testId);
      socket.testId = testId;

      /* Send snapshot of already-connected students */
      const snap = Object.values(rooms[testId].students).map(s => ({
        userId: s.userId, username: s.username, violations: s.violations,
      }));
      socket.emit("room:snapshot", { students: snap });
    });

    /* ════════════════════════════════════
       STUDENT starts exam
    ════════════════════════════════════ */
    socket.on("student:join", ({ testId, username }) => {
      if (!rooms[testId]) rooms[testId] = { creatorSocketId: null, students: {} };
      rooms[testId].students[socket.userId] = {
        userId: socket.userId, socketId: socket.id,
        username, violations: { tabs: 0, face: 0, device: 0, esc: 0 },
      };
      socket.join(testId);
      socket.testId   = testId;
      socket.username = username;

      getCreator(io, testId)?.emit("student:joined", {
        userId: socket.userId, username,
      });
    });

    /* ════════════════════════════════════
       WebRTC offer  student → creator
       streamType: "camera" | "screen"
    ════════════════════════════════════ */
    socket.on("webrtc:offer", ({ testId, streamType, offer }) => {
      getCreator(io, testId)?.emit("webrtc:offer", {
        userId:   socket.userId,
        username: rooms[testId]?.students[socket.userId]?.username,
        streamType, offer,
      });
    });

    /* ════════════════════════════════════
       WebRTC answer  creator → student
    ════════════════════════════════════ */
    socket.on("webrtc:answer", ({ testId, userId, streamType, answer }) => {
      getStudent(io, testId, userId)?.emit("webrtc:answer", { streamType, answer });
    });

    /* ════════════════════════════════════
       ICE candidates — both directions
    ════════════════════════════════════ */
    socket.on("ice:toCreator", ({ testId, streamType, candidate }) => {
      getCreator(io, testId)?.emit("ice:fromStudent", {
        userId: socket.userId, streamType, candidate,
      });
    });

    socket.on("ice:toStudent", ({ testId, userId, streamType, candidate }) => {
      getStudent(io, testId, userId)?.emit("ice:fromCreator", { streamType, candidate });
    });

    /* ════════════════════════════════════
       VIOLATION relay — no DB write at all
    ════════════════════════════════════ */
    socket.on("violation", ({ testId, type, message }) => {
      const student = rooms[testId]?.students[socket.userId];
      if (!student) return;

      if (type === "tab")        student.violations.tabs++;
      if (type === "face")       student.violations.face++;
      if (type === "device")     student.violations.device++;
      if (type === "fullscreen") student.violations.esc++;

      getCreator(io, testId)?.emit("violation", {
        userId: socket.userId, username: student.username,
        type, message, violations: student.violations, at: Date.now(),
      });
    });

    /* ════════════════════════════════════
       STUDENT submits exam
    ════════════════════════════════════ */
    socket.on("student:submitted", ({ testId }) => {
      const student = rooms[testId]?.students[socket.userId];
      if (!student) return;
      getCreator(io, testId)?.emit("student:submitted", {
        userId: socket.userId, username: student.username,
      });
      delete rooms[testId].students[socket.userId];
      cleanRoom(testId);
    });

    /* ════════════════════════════════════
       DISCONNECT — clean up RAM only
    ════════════════════════════════════ */
    socket.on("disconnect", () => {
      const testId = socket.testId;
      if (!testId || !rooms[testId]) return;
      const room = rooms[testId];

      if (room.creatorSocketId === socket.id) room.creatorSocketId = null;

      const student = room.students[socket.userId];
      if (student) {
        getCreator(io, testId)?.emit("student:left", {
          userId: socket.userId, username: student.username,
        });
        delete room.students[socket.userId];
      }

      cleanRoom(testId);
    });
  });

  /* ── Helpers ── */
  const getCreator  = (io, testId) => {
    const id = rooms[testId]?.creatorSocketId;
    return id ? io.sockets.sockets.get(id) : null;
  };
  const getStudent  = (io, testId, userId) => {
    const id = rooms[testId]?.students[userId]?.socketId;
    return id ? io.sockets.sockets.get(id) : null;
  };
  const cleanRoom   = (testId) => {
    const r = rooms[testId];
    if (r && !r.creatorSocketId && Object.keys(r.students).length === 0)
      delete rooms[testId];
  };
};