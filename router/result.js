const {
  getStudentResults,
  createResult,
  getAnswerSheet,
} = require("../controller/result.controller");
const { verifyToken } = require("../middleware/verifyToken");

const router = require("express").Router();

router.post("/", verifyToken, createResult);
router.get("/:studentId", verifyToken, getStudentResults);
router.get("/answerSheet/:studentId/:testId", verifyToken, getAnswerSheet);

module.exports = router;
