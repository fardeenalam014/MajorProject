/**
 * socket/liveSignal.js
 *
 * Handles all WebRTC signaling and live proctoring events.
 * Called from server.js as: require("./socket/liveSignal")(io)
 *
 * Fixes:
 *  - Offers queued if creator hasn't joined yet, flushed on creator:join
 *  - student:join updates socketId on reconnect
 *  - Disconnect cleanup correctly sweeps all rooms
 */

const jwt = require("jsonwebtoken");

/**
 * rooms[testId] = {
 *   creatorSocketId: string | null,
 *   students: { [userId]: { socketId, userId, username, violations } },
 *   pendingOffers: [ { userId, username, streamType, offer } ]
 * }
 */
const rooms = {};

function getRoom(testId) {
  if (!rooms[testId]) {
    rooms[testId] = { creatorSocketId: null, students: {}, pendingOffers: [] };
  }
  return rooms[testId];
}

module.exports = function liveSignal(io) {

  /* ── Auth middleware ── */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    /* ══════════════════════════════════════════
       CREATOR joins to watch a test
    ══════════════════════════════════════════ */
    socket.on("creator:join", ({ testId }) => {
      const room = getRoom(testId);
      room.creatorSocketId = socket.id;
      socket.join(`room:${testId}`);

      // Send snapshot of students already in the room
      const snap = Object.values(room.students).map(s => ({
        userId:     s.userId,
        username:   s.username,
        violations: s.violations,
      }));
      socket.emit("room:snapshot", { students: snap });

      // Flush offers that arrived before the creator joined
      if (room.pendingOffers.length > 0) {
        console.log(`[Socket] Flushing ${room.pendingOffers.length} pending offer(s) to creator for test ${testId}`);
        room.pendingOffers.forEach(payload => socket.emit("webrtc:offer", payload));
        room.pendingOffers = [];
      }

      console.log(`[Socket] Creator joined room: ${testId}`);
    });

    /* ══════════════════════════════════════════
       STUDENT joins the exam room
    ══════════════════════════════════════════ */
    socket.on("student:join", ({ testId, userId, username }) => {
      const room = getRoom(testId);
      // Preserve existing violations if student reconnects
      room.students[userId] = {
        ...(room.students[userId] ?? {}),
        socketId:   socket.id,
        userId,
        username,
        violations: room.students[userId]?.violations ?? {},
      };
      socket.join(`room:${testId}`);

      if (room.creatorSocketId) {
        io.to(room.creatorSocketId).emit("student:joined", { userId, username });
      }

      console.log(`[Socket] Student joined: ${username} (${userId}) in test ${testId}`);
    });

    /* ══════════════════════════════════════════
       WebRTC OFFER  student → creator
    ══════════════════════════════════════════ */
    socket.on("webrtc:offer", ({ testId, userId, username, streamType, offer }) => {
      const room    = getRoom(testId);
      const payload = { userId, username, streamType, offer };

      if (room.creatorSocketId) {
        io.to(room.creatorSocketId).emit("webrtc:offer", payload);
      } else {
        // Creator not in room yet — queue so it's sent when creator joins
        console.log(`[Socket] Queuing offer from ${userId} (no creator yet in ${testId})`);
        room.pendingOffers.push(payload);
      }
    });

    /* ══════════════════════════════════════════
       WebRTC ANSWER  creator → student
    ══════════════════════════════════════════ */
    socket.on("webrtc:answer", ({ testId, userId, streamType, answer }) => {
      const room    = getRoom(testId);
      const student = room.students[userId];
      if (!student) return;
      io.to(student.socketId).emit("webrtc:answer", { streamType, answer });
    });

    /* ══════════════════════════════════════════
       ICE CANDIDATE  student → creator
    ══════════════════════════════════════════ */
    socket.on("ice:fromStudent", ({ testId, userId, streamType, candidate }) => {
      const room = getRoom(testId);
      if (!room.creatorSocketId) return;
      io.to(room.creatorSocketId).emit("ice:fromStudent", { userId, streamType, candidate });
    });

    /* ══════════════════════════════════════════
       ICE CANDIDATE  creator → student
    ══════════════════════════════════════════ */
    socket.on("ice:toStudent", ({ testId, userId, streamType, candidate }) => {
      const room    = getRoom(testId);
      const student = room.students[userId];
      if (!student) return;
      io.to(student.socketId).emit("ice:toStudent", { streamType, candidate });
    });

    /* ══════════════════════════════════════════
       VIOLATION  student → creator
    ══════════════════════════════════════════ */
    socket.on("violation", ({ testId, userId, violations }) => {
      const room = getRoom(testId);
      if (room.students[userId]) room.students[userId].violations = violations;
      if (room.creatorSocketId) {
        io.to(room.creatorSocketId).emit("violation", { userId, violations });
      }
    });

    /* ══════════════════════════════════════════
       STUDENT submits exam
    ══════════════════════════════════════════ */
    socket.on("student:submitted", ({ testId, userId }) => {
      const room = getRoom(testId);
      delete room.students[userId];
      if (room.creatorSocketId) {
        io.to(room.creatorSocketId).emit("student:submitted", { userId });
      }
    });

    /* ══════════════════════════════════════════
   PROCTOR: warn a student
══════════════════════════════════════════ */
socket.on("proctor:warn", ({ testId, userId, message }) => {
  const room    = getRoom(testId);
  const student = room.students[userId];
  if (!student) return;
  io.to(student.socketId).emit("proctor:warn", { message });
});

/* ══════════════════════════════════════════
   PROCTOR: chat — single student or broadcast
══════════════════════════════════════════ */
socket.on("proctor:chat", ({ testId, userId, message, broadcast }) => {
  const room = getRoom(testId);
  if (broadcast) {
    // Send to every student currently in the room
    Object.values(room.students).forEach(student => {
      io.to(student.socketId).emit("proctor:chat", { message });
    });
  } else {
    const student = room.students[userId];
    if (!student) return;
    io.to(student.socketId).emit("proctor:chat", { message });
  }
});

/* ══════════════════════════════════════════
   PROCTOR: terminate a student
══════════════════════════════════════════ */
socket.on("proctor:terminate", ({ testId, userId }) => {
  const room    = getRoom(testId);
  const student = room.students[userId];
  if (!student) return;
  io.to(student.socketId).emit("proctor:terminate");
  // Remove from room immediately
  delete room.students[userId];
  if (room.creatorSocketId) {
    io.to(room.creatorSocketId).emit("student:submitted", { userId });
  }
});

    /* ══════════════════════════════════════════
       DISCONNECT — clean up whichever role left
    ══════════════════════════════════════════ */
    socket.on("disconnect", () => {
      for (const [testId, room] of Object.entries(rooms)) {
        // Check if this was a student
        for (const [userId, student] of Object.entries(room.students)) {
          if (student.socketId === socket.id) {
            delete room.students[userId];
            if (room.creatorSocketId) {
              io.to(room.creatorSocketId).emit("student:left", { userId });
            }
            console.log(`[Socket] Student left: ${userId} from test ${testId}`);
          }
        }
        // Check if this was the creator
        if (room.creatorSocketId === socket.id) {
          room.creatorSocketId = null;
          console.log(`[Socket] Creator left room: ${testId}`);
        }
      }
    });
  });
};
