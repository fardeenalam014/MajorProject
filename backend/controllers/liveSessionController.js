const LiveSession = require("../models/LiveSession");
const Test        = require("../models/Test");

/* ────────────────────────────────────────
   POST /api/live/start    — student starts exam
──────────────────────────────────────── */
exports.startSession = async (req, res, next) => {
  try {
    const { testId, sessionId, totalQuestions } = req.body;

    const session = await LiveSession.findOneAndUpdate(
      { sessionId },
      {
        test:      testId,
        student:   req.user._id,
        sessionId,
        status:    "active",
        startedAt: new Date(),
        lastHeartbeat: new Date(),
        "progress.totalQuestions": totalQuestions ?? 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   PATCH /api/live/heartbeat   — push every 4 s
──────────────────────────────────────── */
exports.heartbeat = async (req, res, next) => {
  try {
    const {
      sessionId,
      answeredCount = 0,
      violations    = {},
    } = req.body;

    const total = (violations.tabSwitches     ?? 0)
                + (violations.faceWarnings    ?? 0)
                + (violations.deviceFlags     ?? 0)
                + (violations.fullscreenExits ?? 0);

    const status = total >= 5 ? "violation"
                 : total >= 2 ? "warning"
                 : "active";

    const session = await LiveSession.findOneAndUpdate(
      { sessionId, student: req.user._id },
      {
        status,
        lastHeartbeat: new Date(),
        "progress.answeredCount": answeredCount,
        "violations.tabSwitches":     violations.tabSwitches     ?? 0,
        "violations.faceWarnings":    violations.faceWarnings    ?? 0,
        "violations.deviceFlags":     violations.deviceFlags     ?? 0,
        "violations.fullscreenExits": violations.fullscreenExits ?? 0,
      },
      { new: true }
    );

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   PATCH /api/live/end    — student submits / leaves
──────────────────────────────────────── */
exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    await LiveSession.findOneAndUpdate(
      { sessionId, student: req.user._id },
      { status: "submitted" }
    );

    res.json({ success: true, message: "Session ended" });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/live/test/:testId   — creator monitors
──────────────────────────────────────── */
exports.getSessionsForTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(test.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    const sessions = await LiveSession.find({ test: req.params.testId })
      .populate("student", "username email")
      .sort({ startedAt: -1 });

    const summary = {
      active:    sessions.filter(s => s.status === "active").length,
      warning:   sessions.filter(s => s.status === "warning").length,
      violation: sessions.filter(s => s.status === "violation").length,
      submitted: sessions.filter(s => s.status === "submitted").length,
    };

    res.json({ success: true, summary, sessions });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/live/my-tests   — creator: live count across all tests
──────────────────────────────────────── */
exports.getLiveCountForCreator = async (req, res, next) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id }).select("_id");
    const testIds = tests.map(t => t._id);

    const count = await LiveSession.countDocuments({
      test:   { $in: testIds },
      status: "active",
    });

    res.json({ success: true, liveCount: count });
  } catch (err) {
    next(err);
  }
};