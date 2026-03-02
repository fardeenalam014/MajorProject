const Test       = require("../models/Test");
const Enrollment = require("../models/Enrollment");
const Attempt    = require("../models/Attempt");

/* ────────────────────────────────────────
   GET /api/tests          — creator: own tests
──────────────────────────────────────── */
exports.getMyTests = async (req, res, next) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    /* attach enrollment + attempt counts */
    const enriched = await Promise.all(
      tests.map(async (t) => {
        const [enrollCount, attemptCount] = await Promise.all([
          Enrollment.countDocuments({ test: t._id }),
          Attempt.countDocuments({ test: t._id }),
        ]);
        return { ...t, enrollCount, attemptCount };
      })
    );

    res.json({ success: true, count: enriched.length, tests: enriched });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/tests/:id
──────────────────────────────────────── */
exports.getTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id).populate("createdBy", "username email");
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    /* students only see published tests */
    if (req.user.role === "student" && !test.published) {
      return res.status(403).json({ success: false, message: "Test is not published" });
    }

    /* creators only see their own */
    if (req.user.role === "creator" && String(test.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    /* strip correct answers for students */
    let data = test.toObject();
    if (req.user.role === "student") {
      data.sections = data.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map(({ correct, negativeMark, ...q }) => q),
      }));
    }

    res.json({ success: true, test: data });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/tests/join/:code  — student joins by code
──────────────────────────────────────── */
exports.getTestByCode = async (req, res, next) => {
  try {
    const test = await Test.findOne({ testCode: req.params.code.toUpperCase() })
      .select("-sections.questions.correct");

    if (!test)          return res.status(404).json({ success: false, message: "Test not found" });
    if (!test.published) return res.status(403).json({ success: false, message: "Test is not published" });

    res.json({ success: true, test });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   POST /api/tests          — creator creates test
──────────────────────────────────────── */
exports.createTest = async (req, res, next) => {
  try {
    const test = await Test.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, test });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   PUT /api/tests/:id
──────────────────────────────────────── */
exports.updateTest = async (req, res, next) => {
  try {
    let test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(test.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new:          true,
      runValidators: true,
    });
    res.json({ success: true, test });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   PATCH /api/tests/:id/publish
──────────────────────────────────────── */
exports.togglePublish = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(test.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    test.published = !test.published;
    await test.save();
    res.json({ success: true, published: test.published, test });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   DELETE /api/tests/:id
──────────────────────────────────────── */
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(test.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    await Promise.all([
      test.deleteOne(),
      Enrollment.deleteMany({ test: test._id }),
      Attempt.deleteMany({ test: test._id }),
    ]);

    res.json({ success: true, message: "Test deleted" });
  } catch (err) {
    next(err);
  }
};