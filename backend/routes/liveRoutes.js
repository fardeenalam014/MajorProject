const express     = require("express");
const router      = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  startSession, heartbeat, endSession,
  getSessionsForTest, getLiveCountForCreator,
} = require("../controllers/liveSessionController");

/* Student */
router.post(  "/start",      protect, authorize("student"), startSession);
router.patch( "/heartbeat",  protect, authorize("student"), heartbeat);
router.patch( "/end",        protect, authorize("student"), endSession);

/* Creator */
router.get(   "/my-tests",       protect, authorize("creator"), getLiveCountForCreator);
router.get(   "/test/:testId",   protect, authorize("creator"), getSessionsForTest);

module.exports = router;