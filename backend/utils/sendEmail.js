require("node:dns/promises").setDefaultResultOrder("ipv4first");
require("dotenv").config();
const nodemailer = require("nodemailer");



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,          // ← forces IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

module.exports = async function sendEmail({ to, subject, html }) {
  console.log("📤 Attempting to send to:", to);
  try {
    const info = await transporter.sendMail({
      from: `"AIExamGuard" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Email error:", err.message);
    throw err;
  }
};