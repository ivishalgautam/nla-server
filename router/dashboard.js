const router = require("express").Router();
const { getDashboardDetails } = require("../controller/dashboard.controller");

router.get("/", getDashboardDetails);

module.exports = router;
