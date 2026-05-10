const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function sendEmail({ to, subject, html }) {
  const { error } = await resend.emails.send({
    from: "AIExamGuard <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("❌ Email error:", error);
    throw new Error(error.message);
  }

  console.log("✅ Email sent to:", to);
};