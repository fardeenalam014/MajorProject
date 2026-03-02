const { body, validationResult } = require("express-validator");

/* ── Run validation rules and return errors if any ── */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array(),
    });
  }
  next();
};

/* ── Auth rules ── */
exports.registerRules = [
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
  body("email")
    .trim()
    .isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["creator", "student"]).withMessage("Role must be creator or student"),
];

exports.loginRules = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

/* ── Test rules ── */
exports.testRules = [
  body("title").trim().notEmpty().withMessage("Test title is required"),
  body("duration")
    .optional()
    .isNumeric().withMessage("Duration must be a number"),
  body("sections")
    .optional()
    .isArray().withMessage("Sections must be an array"),
];