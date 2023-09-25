const { sendQuery } = require("../controller/query.controller");

const router = require("express").Router();

router.post("/:studentId/:testId", sendQuery);

module.exports = router;
