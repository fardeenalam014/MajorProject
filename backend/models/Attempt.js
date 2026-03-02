const mongoose = require("mongoose");

const AttemptSchema = new mongoose.Schema(
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
    /* answers map: key = "<sectionId>_<questionIndex>", value = student answer */
    answers: {
      type: Map,
      of:   String,
      default: {},
    },
    score:      { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed:     { type: Boolean, default: false },
    timeTaken:  { type: Number, default: 0 }, // seconds

    /* Proctoring violation counters */
    violations: {
      tabSwitches:  { type: Number, default: 0 },
      faceWarnings: { type: Number, default: 0 },
      deviceFlags:  { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
    },

    submittedAt: { type: Date, default: Date.now },
    abandoned:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* One attempt per student per test (can be relaxed for multi-attempt tests) */
AttemptSchema.index({ test: 1, student: 1 });

module.exports = mongoose.model("Attempt", AttemptSchema);