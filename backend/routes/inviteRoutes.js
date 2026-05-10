const express    = require("express");
const router     = express.Router();
const sendEmail  = require("../utils/sendEmail");
const Test       = require("../models/Test");
const { protect } = require("../middleware/auth");

router.post("/send", protect, async (req, res) => {
  try {

    const { testId, emails } = req.body;
    const test = await Test.findById(testId);

    
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    const results = await Promise.allSettled(
      emails.map(email =>
        sendEmail({
          to: email,
          subject: `You're invited to take: ${test.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#6366f1">AIExamGuard</h2>
              <p>You have been invited to take the exam:</p>
              <h3>${test.title}</h3>
              <p>Use this code to join:</p>
              <div style="background:#18181b;color:#6366f1;font-size:32px;
                font-weight:bold;text-align:center;padding:20px;
                border-radius:12px;letter-spacing:4px">
                ${test.testCode}
              </div>
              <p style="color:#71717a;font-size:12px;margin-top:24px">
                Go to the platform, log in as a student, and enter this code to enroll.
              </p>
            </div>
          `,
        })
      )
    );

    const sent   = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    res.json({ success: true, sent, failed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;