const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  family: 4,              // ← force IPv4
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
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
    from: '"AIExamGuard" <fardeenalam0768@gmail.com>',
    to,
    subject,
    html,
  });
  console.log("✅ Email sent:", info.response);
};