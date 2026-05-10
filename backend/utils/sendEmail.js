const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,   // your Brevo login email
    pass: process.env.BREVO_PASS,   // Brevo SMTP password (not your login password)
  },
});

module.exports = async function sendEmail({ to, subject, html }) {
  const info = await transporter.sendMail({
    from: '"AIExamGuard" <your@email.com>',
    to,
    subject,
    html,
  });
  console.log("✅ Email sent:", info.response);
};