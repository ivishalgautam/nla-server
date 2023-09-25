const {
  getStudentResults,
  createResult,
} = require("../controller/result.controller");
const { verifyToken } = require("../middleware/verifyToken");

const router = require("express").Router();

router.post("/", verifyToken, createResult);
router.get("/:studentId", verifyToken, getStudentResults);

module.exports = router;
