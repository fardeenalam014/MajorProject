/* ── Fix: Node.js v22+ on Windows doesn't use system DNS for SRV lookups ── */
require("node:dns/promises").setDefaultResultOrder("ipv4first");
require("node:dns/promises").setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

require("dotenv").config();
const express      = require("express");
const http         = require("http");
const { Server }   = require("socket.io");
const cors         = require("cors");
const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

/* ── Connect to MongoDB ── */
connectDB();

const app    = express();
const server = http.createServer(app);   // wrap express in http.Server for Socket.io

/* ═══════════════════════════════════════
   SOCKET.IO  — WebRTC signalling relay
   Nothing stored in DB. Pure in-memory.
═══════════════════════════════════════ */
const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || "http://localhost:5173",
    methods:     ["GET", "POST"],
    credentials: true,
  },
  /* increase limits for WebRTC signalling payloads */
  maxHttpBufferSize: 1e7,
});

/* Mount the signalling logic */
require("./socket/liveSignal")(io);

/* ═══════════════════════════════════════
   EXPRESS MIDDLEWARE
═══════════════════════════════════════ */
app.use(cors({
  origin:      [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ═══════════════════════════════════════
   HEALTH CHECK
═══════════════════════════════════════ */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AIExamGuard API is running",
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
    sockets: io.engine.clientsCount,
  });
});

/* ═══════════════════════════════════════
   REST ROUTES
   Note: /api/live is REMOVED — live
   monitoring is now handled by Socket.io
═══════════════════════════════════════ */
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/tests",       require("./routes/testRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/attempts",    require("./routes/attemptRoutes"));

/* ═══════════════════════════════════════
   404 handler
═══════════════════════════════════════ */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

/* ═══════════════════════════════════════
   GLOBAL ERROR HANDLER
═══════════════════════════════════════ */
app.use(errorHandler);

/* ═══════════════════════════════════════
   START — use server.listen not app.listen
=══════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🔌  Socket.io ready for WebRTC signalling`);
});

module.exports = { app, server, io };