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
  } catch (err) {
    console.error("❌ Email error:", err.message);
    throw err;
  }
};