const Attempt        = require("../models/Attempt");
const Test           = require("../models/Test");
const Enrollment     = require("../models/Enrollment");
const calculateScore = require("../utils/calculateScore");

/* ────────────────────────────────────────
   POST /api/attempts     — student submits
──────────────────────────────────────── */
exports.submitAttempt = async (req, res, next) => {
  try {
    const {
      testId,
      answers    = {},
      timeTaken  = 0,
      violations = {},
      abandoned  = false,
    } = req.body;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    /* calculate score */
    const { score, totalMarks, percentage, passed } = calculateScore(
      test.sections,
      answers,
      test.settings?.passPercentage ?? 40
    );

    const attempt = await Attempt.create({
      test:       testId,
      student:    req.user._id,
      answers:    new Map(Object.entries(answers)),
      score,
      totalMarks,
      percentage,
      passed,
      timeTaken,
      violations: {
        tabSwitches:     violations.tabSwitches     ?? 0,
        faceWarnings:    violations.faceWarnings    ?? 0,
        deviceFlags:     violations.deviceFlags     ?? 0,
        fullscreenExits: violations.fullscreenExits ?? 0,
      },
      abandoned,
    });

    /* mark enrollment as submitted */
    await Enrollment.findOneAndUpdate(
      { test: testId, student: req.user._id },
      { status: "submitted" }
    );

    res.status(201).json({
      success: true,
      attempt: {
        _id:        attempt._id,
        score,
        totalMarks,
        percentage,
        passed,
        timeTaken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/attempts/test/:testId
   Creator — all attempts for a test (analytics)
──────────────────────────────────────── */
exports.getAttemptsForTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(test.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    const attempts = await Attempt.find({ test: req.params.testId })
      .populate("student", "username email")
      .sort({ submittedAt: -1 });

    /* aggregate analytics */
    const scores      = attempts.map(a => a.percentage);
    const avg         = scores.length ? Math.round(scores.reduce((s, p) => s + p, 0) / scores.length) : 0;
    const highest     = scores.length ? Math.max(...scores) : 0;
    const lowest      = scores.length ? Math.min(...scores) : 0;
    const passCount   = attempts.filter(a => a.passed).length;
    const passRate    = scores.length ? Math.round((passCount / scores.length) * 100) : 0;

    res.json({
      success: true,
      analytics: { total: attempts.length, avg, highest, lowest, passRate },
      attempts,
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/attempts/me   — student's own history
──────────────────────────────────────── */
exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id })
      .populate("test", "title duration")
      .sort({ submittedAt: -1 })
      .select("-answers"); // don't send full answer map to student

    res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/attempts/me/:testId  — student result for one test
──────────────────────────────────────── */
exports.getMyAttemptForTest = async (req, res, next) => {
  try {
    const attempt = await Attempt.findOne({
      test:    req.params.testId,
      student: req.user._id,
    }).populate("test", "title");

    if (!attempt) return res.status(404).json({ success: false, message: "No attempt found" });

    res.json({ success: true, attempt });
  } catch (err) {
    next(err);
  }
};