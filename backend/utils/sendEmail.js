console.log("BREVO_USER:", process.env.BREVO_USER);
console.log("BREVO_PASS:", process.env.BREVO_PASS ? "loaded" : "MISSING");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Brevo SMTP failed:", error.message);
  } else {
    console.log("✅ Brevo SMTP ready");
  }
});

module.exports = async function sendEmail({ to, subject, html }) {
  const info = await transporter.sendMail({
    from: '"AIExamGuard" <your_brevo_email@gmail.com>',
    to,
    subject,
    html,
  });
  console.log("✅ Email sent:", info.response);
};