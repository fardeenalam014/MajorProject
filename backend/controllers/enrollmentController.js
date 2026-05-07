const Enrollment = require("../models/Enrollment");
const Test       = require("../models/Test");

/* ────────────────────────────────────────
   POST /api/enrollments        — student joins
──────────────────────────────────────── */

exports.enroll = async (req, res, next) => {
  try {
    const { testId } = req.body;

    const test = await Test.findById(testId);
    if (!test)           return res.status(404).json({ success: false, message: "Test not found" });
    if (!test.published) return res.status(403).json({ success: false, message: "Test is not published" });

    // Check duplicate BEFORE upserting so we can return the right status
    const existing = await Enrollment.findOne({ test: testId, student: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: "You have already joined this test." });
    }

    const enrollment = await Enrollment.create({
      test:    testId,
      student: req.user._id,
    });

    res.status(201).json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/enrollments/test/:testId
   Creator sees all enrolled students
──────────────────────────────────────── */
exports.getEnrollmentsForTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(test.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    const enrollments = await Enrollment.find({ test: req.params.testId })
      .populate("student", "username email")
      .sort({ joinedAt: -1 });

    res.json({ success: true, count: enrollments.length, enrollments });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/enrollments/me   — student's joined tests
──────────────────────────────────────── */

exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate("test", "title duration testCode published sections settings") 
      .sort({ joinedAt: -1 });

    res.json({ success: true, count: enrollments.length, enrollments });
  } catch (err) {
    next(err);
  }
};