const Test       = require("../models/Test");
const Enrollment = require("../models/Enrollment");
const Attempt    = require("../models/Attempt");
const cloudinary = require("../config/cloudinary");

/* ────────────────────────────────────────
   CLOUDINARY HELPERS
──────────────────────────────────────── */

/** Extract Cloudinary public_id from a secure_url */
const getPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  // e.g. "https://res.cloudinary.com/demo/image/upload/v1234567890/tests/abc.jpg"
  // → "tests/abc"
  const parts = url.split("/upload/");
  if (!parts[1]) return null;
  const withoutVersion = parts[1].replace(/^v\d+\//, ""); // strip version
  return withoutVersion.replace(/\.[^.]+$/, "");          // strip extension
};

/** Collect every image public_id from a test document */
const collectPublicIds = (test) => {
  const ids = [];
  for (const sec of test.sections ?? []) {
    for (const q of sec.questions ?? []) {
      if (q.image) ids.push(getPublicId(q.image));
      for (const o of q.options ?? []) {
        if (o.image) ids.push(getPublicId(o.image));
      }
    }
  }
  return ids.filter(Boolean);
};

/** Collect image public_ids that exist in oldTest but are gone/replaced in newBody */
const collectOrphanedIds = (oldTest, newBody) => {
  const oldIds  = new Set(collectPublicIds(oldTest));
  const newIds  = new Set(collectPublicIds(newBody));          // newBody mirrors DB shape
  return [...oldIds].filter(id => !newIds.has(id));
};

/** Delete an array of Cloudinary public_ids (no-op if empty) */
const deleteFromCloudinary = async (publicIds) => {
  if (!publicIds.length) return;
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (err) {
    // Log but don't crash the request — image cleanup is best-effort
    console.error("[Cloudinary] delete_resources error:", err.message);
  }
};

/* ────────────────────────────────────────
   GET /api/tests          — creator: own tests
──────────────────────────────────────── */
exports.getMyTests = async (req, res, next) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

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

    if (req.user.role === "student" && !test.published) {
      return res.status(403).json({ success: false, message: "Test is not published" });
    }

    if (req.user.role === "creator" && String(test.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

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

    if (!test)           return res.status(404).json({ success: false, message: "Test not found" });
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
   — also deletes Cloudinary images that were
     removed or replaced during the update
──────────────────────────────────────── */
exports.updateTest = async (req, res, next) => {
  try {
    const existing = await Test.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(existing.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    // Find images that existed before but are absent from the incoming payload
    const orphanedIds = collectOrphanedIds(existing.toObject(), req.body);

    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new:           true,
      runValidators: true,
    });

    // Clean up removed/replaced images from Cloudinary (non-blocking)
    deleteFromCloudinary(orphanedIds);

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
   — also deletes ALL Cloudinary images for the test
──────────────────────────────────────── */
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });
    if (String(test.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your test" });
    }

    // Collect all image public_ids before deleting the document
    const allImageIds = collectPublicIds(test.toObject());

    await Promise.all([
      test.deleteOne(),
      Enrollment.deleteMany({ test: test._id }),
      Attempt.deleteMany({ test: test._id }),
    ]);

    // Clean up all images from Cloudinary (non-blocking)
    deleteFromCloudinary(allImageIds);

    res.json({ success: true, message: "Test deleted" });
  } catch (err) {
    next(err);
  }
};