const mongoose = require("mongoose");

const LiveSessionSchema = new mongoose.Schema(
  {
    test: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Test",
      required: true,
    },
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    sessionId:  { type: String, required: true, unique: true },
    status: {
      type:    String,
      enum:    ["active", "warning", "violation", "submitted"],
      default: "active",
    },
    startedAt:     { type: Date, default: Date.now },
    lastHeartbeat: { type: Date, default: Date.now },

    progress: {
      answeredCount:   { type: Number, default: 0 },
      totalQuestions:  { type: Number, default: 0 },
    },

    violations: {
      tabSwitches:     { type: Number, default: 0 },
      faceWarnings:    { type: Number, default: 0 },
      deviceFlags:     { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

/* Auto-expire submitted/stale sessions after 24 hours */
LiveSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("LiveSession", LiveSessionSchema);