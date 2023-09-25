const router = require("express").Router();
const Controller = require("../controller/grade.controller");

router.get("/", Controller.getGrades);

module.exports = router;
