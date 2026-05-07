const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    test:    {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Test",
      required: true,
    },
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type:    String,
      enum:    ["enrolled", "started", "submitted"],
      default: "enrolled",
    },
  },
  { timestamps: true }
);


EnrollmentSchema.index({ test: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);