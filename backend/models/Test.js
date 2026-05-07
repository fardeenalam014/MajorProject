const mongoose = require("mongoose");


const QuestionSchema = new mongoose.Schema(
  {
    type: {
      type:    String,
      enum:    ["mcq", "numerical"],
      default: "mcq",
    },
    text:    { type: String, required: [true, "Question text is required"] },
    image:   { type: String, default: null }, 
    options: [
  {
    text:  { type: String, default: "" },
    image: { type: String, default: null }, 
  }
],         
    correct: { type: String, required: true },
    marks:   { type: Number, default: 1 },
    negativeMark: { type: Number, default: 0 },
  },
  { _id: true }
);


const SectionSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    duration:    { type: Number, default: 0 }, 
    strictTimer: { type: Boolean, default: false },
    questions:   [QuestionSchema],
  },
  { _id: true }
);


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
    duration:   { type: Number, default: 60 }, 
    sections:   [SectionSchema],
    published:  { type: Boolean, default: false },
   
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


TestSchema.pre("save", async function (next) {
  if (this.isNew && !this.testCode) {
    // 8-char uppercase alphanumeric
    this.testCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});


TestSchema.virtual("totalMarks").get(function () {
  return this.sections.reduce(
    (sum, sec) => sum + sec.questions.reduce((q, qu) => q + (qu.marks || 1), 0),
    0
  );
});

TestSchema.set("toJSON", { virtuals: true });
TestSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Test", TestSchema);