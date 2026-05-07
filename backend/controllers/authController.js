const User          = require("../models/User");
const generateToken = require("../utils/generateToken");

/* ────────────────────────────────────────
   POST /api/auth/register
──────────────────────────────────────── */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const user = await User.create({ username, email, password, role });

    res.status(201).json({
      success: true,
      token:   generateToken(user._id),
      user: {
        _id:      user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   POST /api/auth/login
──────────────────────────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      token:   generateToken(user._id),
      user: {
        _id:      user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────
   GET /api/auth/me   (protected)
──────────────────────────────────────── */
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};