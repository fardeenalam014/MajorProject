const crypto        = require("crypto");
const User          = require("../models/User");
const generateToken = require("../utils/generateToken");


const axios = require("axios");

async function sendOTPEmail(email, otp) {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender:      { email: "fardeenalam0768@gmail.com", name: "AIExamGuard" },
      to:          [{ email }],
      subject:     "Your Password Reset OTP",
      htmlContent: `
        <h2>Password Reset OTP</h2>
        <p>Your OTP is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p>
        <p>Valid for 15 minutes. Do not share it with anyone.</p>
      `,
    },
    {
      headers: {
        "api-key":      process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  console.log("Brevo response:", response.status, response.data);
}

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
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────
   POST /api/auth/login
──────────────────────────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

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
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────
   GET /api/auth/me  (protected)
──────────────────────────────────────── */
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/* ────────────────────────────────────────
   POST /api/auth/forgot-password
──────────────────────────────────────── */
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({ success: false, message: "No account with that email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken  = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendOTPEmail(user.email, otp);
      console.log("✅ Email sent successfully");
    } catch (emailErr) {
      console.error("❌ Brevo error:", emailErr.response?.data || emailErr.message);
    }

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────
   PUT /api/auth/reset-password/:token
──────────────────────────────────────── */
exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.body.otp).digest("hex");
    const user   = await User.findOne({
      resetPasswordToken:  hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) { next(err); }
};