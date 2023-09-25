const router = require("express").Router();
const Controller = require("../controller/question.controller");

router.get("/:testId", Controller.getQuestionsByTestId);

module.exports = router;
