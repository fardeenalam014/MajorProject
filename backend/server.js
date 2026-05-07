require("node:dns/promises").setDefaultResultOrder("ipv4first");
require("node:dns/promises").setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
connectDB();
const app = express();
app.use(cors({
  origin:      [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AIExamGuard API is running",
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/tests",       require("./routes/testRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/attempts",    require("./routes/attemptRoutes"));
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler);
const http   = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin:      [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
});

require("./socket/liveSignal")(io);   // ← your socket file name

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
module.exports = app;