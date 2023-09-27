const router = require("express").Router();
const { pool } = require("../config/db");
const Controller = require("../controller/test.controller");
const { verifyToken } = require("../middleware/verifyToken");
const cron = require("node-cron");

async function publishTest() {
  try {
    const { rows } = await pool.query(
      "UPDATE tests SET is_published = true WHERE start_time <= NOW()"
    );
    console.log("Test published successfully");
  } catch (error) {
    console.error("Error deleting expired tests:", error);
  }
}

async function disableTest() {
  try {
    const { rows } = await pool.query(
      "UPDATE tests SET is_published = false WHERE end_time <= NOW()"
    );
    console.log("Test disabled successfully");
  } catch (error) {
    console.error("Error deleting expired tests:", error);
  }
}

cron.schedule("0 * * * *", publishTest);
cron.schedule("0 * * * *", disableTest);

// user
router.get("/", Controller.getTests);
router.get("/filter", Controller.getFilteredTests);
router.get(
  "/instructions/:testId",
  verifyToken,
  Controller.getTestInstructionsById
);
router.get("/:studentId", verifyToken, Controller.getStudentTestsByCategory);
router.get("/upcoming/:studentId", verifyToken, Controller.getUpcomingTests);

module.exports = router;
