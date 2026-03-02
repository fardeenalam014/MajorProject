const express     = require("express");
const router      = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  enroll, getEnrollmentsForTest, getMyEnrollments,
} = require("../controllers/enrollmentController");

router.post("/",                  protect, authorize("student"),  enroll);
router.get( "/me",                protect, authorize("student"),  getMyEnrollments);
router.get( "/test/:testId",      protect, authorize("creator"),  getEnrollmentsForTest);

module.exports = router;