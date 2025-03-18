const {
  getStudentResultsStu,
  createResult,
  getAnswerSheetStu,
} = require("../controller/result.controller");
const { verifyToken } = require("../middleware/verifyToken");

const router = require("express").Router();

router.post("/", verifyToken, createResult);
router.get("/:studentId", verifyToken, getStudentResultsStu);
router.get("/answerSheet/:studentId/:testId", verifyToken, getAnswerSheetStu);

module.exports = router;
