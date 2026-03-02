require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

/* ── Connect to MongoDB ── */
// connectDB();

const app = express();

/* ═══════════════════════════════════════
   GLOBAL MIDDLEWARE
═══════════════════════════════════════ */
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));       // parse JSON bodies (10 mb for image payloads)
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
  });
});

// /* ═══════════════════════════════════════
//    ROUTES
// ═══════════════════════════════════════ */
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/tests",       require("./routes/testRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/attempts",    require("./routes/attemptRoutes"));
app.use("/api/live",        require("./routes/liveRoutes"));

/* ═══════════════════════════════════════
   404 — unmatched routes
═══════════════════════════════════════ */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

/* ═══════════════════════════════════════
   GLOBAL ERROR HANDLER
═══════════════════════════════════════ */
app.use(errorHandler);

/* ═══════════════════════════════════════
   START
═══════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;