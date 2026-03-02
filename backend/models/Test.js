const mongoose = require("mongoose");

/* ── Question sub-schema ── */
const QuestionSchema = new mongoose.Schema(
  {
    type: {
      type:    String,
      enum:    ["mcq", "numerical"],
      default: "mcq",
    },
    text:    { type: String, required: [true, "Question text is required"] },
    image:   { type: String, default: null }, // URL or base64
    options: [{ type: String }],              // MCQ only
    correct: { type: String, required: true },// correct option text OR numerical answer
    marks:   { type: Number, default: 1 },
    negativeMark: { type: Number, default: 0 },
  },
  { _id: true }
);

/* ── Section sub-schema ── */
const SectionSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    duration:    { type: Number, default: 0 }, // seconds; 0 = no individual timer
    questions:   [QuestionSchema],
  },
  { _id: true }
);

/* ── Test schema ── */
const TestSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, "Test title is required"],
      trim:     true,
    },
    description: { type: String, default: "" },
    createdBy:   {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    duration:   { type: Number, default: 60 }, // total minutes
    sections:   [SectionSchema],
    published:  { type: Boolean, default: false },
    /* short shareable code students enter */
    testCode:   {
      type:   String,
      unique: true,
      index:  true,
    },
    settings: {
      shuffleQuestions: { type: Boolean, default: false },
      shuffleOptions:   { type: Boolean, default: false },
      allowReview:      { type: Boolean, default: true  },
      maxAttempts:      { type: Number,  default: 1     },
      passPercentage:   { type: Number,  default: 40    },
    },
  },
  { timestamps: true }
);

/* ── Auto-generate a short test code on creation ── */
TestSchema.pre("save", async function (next) {
  if (this.isNew && !this.testCode) {
    // 8-char uppercase alphanumeric
    this.testCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

/* ── Virtual: total marks ── */
TestSchema.virtual("totalMarks").get(function () {
  return this.sections.reduce(
    (sum, sec) => sum + sec.questions.reduce((q, qu) => q + (qu.marks || 1), 0),
    0
  );
});

TestSchema.set("toJSON", { virtuals: true });
TestSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Test", TestSchema);