
const jwt = require("jsonwebtoken");

const rooms = {};

module.exports = (io) => {


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


    socket.on("creator:join", ({ testId }) => {
      if (!rooms[testId]) rooms[testId] = { creatorSocketId: null, students: {} };
      rooms[testId].creatorSocketId = socket.id;
      socket.join(testId);
      socket.testId = testId;


      const snap = Object.values(rooms[testId].students).map(s => ({
        userId: s.userId, username: s.username, violations: s.violations,
      }));
      socket.emit("room:snapshot", { students: snap });
    });


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


    socket.on("webrtc:offer", ({ testId, streamType, offer }) => {
      getCreator(io, testId)?.emit("webrtc:offer", {
        userId:   socket.userId,
        username: rooms[testId]?.students[socket.userId]?.username,
        streamType, offer,
      });
    });


    socket.on("webrtc:answer", ({ testId, userId, streamType, answer }) => {
      getStudent(io, testId, userId)?.emit("webrtc:answer", { streamType, answer });
    });


    socket.on("ice:toCreator", ({ testId, streamType, candidate }) => {
      getCreator(io, testId)?.emit("ice:fromStudent", {
        userId: socket.userId, streamType, candidate,
      });
    });

    socket.on("ice:toStudent", ({ testId, userId, streamType, candidate }) => {
      getStudent(io, testId, userId)?.emit("ice:fromCreator", { streamType, candidate });
    });


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


    socket.on("student:submitted", ({ testId }) => {
      const student = rooms[testId]?.students[socket.userId];
      if (!student) return;
      getCreator(io, testId)?.emit("student:submitted", {
        userId: socket.userId, username: student.username,
      });
      delete rooms[testId].students[socket.userId];
      cleanRoom(testId);
    });

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