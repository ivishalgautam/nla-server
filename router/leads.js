const router = require("express").Router();
const { createLead } = require("../controller/leads.controller");

router.post("/", createLead);

module.exports = router;
