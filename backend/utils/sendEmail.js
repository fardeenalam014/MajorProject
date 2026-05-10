<<<<<<< HEAD
require("node:dns/promises").setDefaultResultOrder("ipv4first");
require("dotenv").config();
const nodemailer = require("nodemailer");



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
=======
const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "✅ loaded" : "❌ MISSING");

module.exports = async function sendEmail({ to, subject, html }) {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { email: "fardeenalam0768@gmail.com", name: "AIExamGuard" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
    console.log("✅ Email sent to:", to);
>>>>>>> newUiBranch
  } catch (err) {
    console.error("❌ Email error:", err.message);
    throw err;
  }
};