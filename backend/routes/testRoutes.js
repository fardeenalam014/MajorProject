const express     = require("express");
const router      = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { testRules, validate } = require("../middleware/validators");
const {
  getMyTests, getTest, getTestByCode,
  createTest, updateTest, togglePublish, deleteTest,
} = require("../controllers/testController");

/* Public for authenticated users */
router.get("/join/:code", protect, getTestByCode);

/* Creator only */
router.get(   "/",    protect, authorize("creator"), getMyTests);
router.post(  "/",    protect, authorize("creator"), testRules, validate, createTest);
router.get(   "/:id", protect, getTest);                          // creator + student
router.put(   "/:id", protect, authorize("creator"), updateTest);
router.patch( "/:id/publish", protect, authorize("creator"), togglePublish);
router.delete("/:id", protect, authorize("creator"), deleteTest);

module.exports = router;