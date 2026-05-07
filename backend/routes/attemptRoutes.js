const express     = require("express");
const router      = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  submitAttempt, getAttemptsForTest,
  getMyAttempts, getMyAttemptForTest,
} = require("../controllers/attemptController");

router.post("/",              protect, authorize("student"), submitAttempt);
router.get( "/me",            protect, authorize("student"), getMyAttempts);
router.get( "/me/:testId",    protect, authorize("student"), getMyAttemptForTest);
router.get( "/test/:testId",  protect, authorize("creator"), getAttemptsForTest);

module.exports = router;