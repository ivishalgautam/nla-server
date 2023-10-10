const cron = require("node-cron");
const router = require("express").Router();
const {
  updatePassword,
  sendResetPasswordAndLink,
} = require("../controller/password.controller");
const Controller = require("../controller/student.controller");
const { pool } = require("../config/db");

router.post("/", Controller.createStudent);
router.get("/:studentId", Controller.getStudentById);
router.put("/:studentId", Controller.updateStudentById);
router.post("/send-reset-mail", sendResetPasswordAndLink);
router.post("/reset-password/:studentId", updatePassword);
// router.put("/update-password/:studentId", sendResetPasswordAndLink);

function diableExpiredStudents() {
  const currentDate = new Date();

  // Assuming 'students' is your table name and 'expiration_date' is a date column
  const query = `UPDATE students SET is_disabled = true WHERE expiration_date < $1 returning *`;

  pool.query(query, [currentDate], (error, results) => {
    if (error) {
      console.error("Error updating students:", error);
    } else {
      console.log("Updated students:", results.rows[0].fullname);
    }
  });
}

// Schedule the function to run at a specific time (e.g., every day at midnight)
cron.schedule("0 0 * * *", () => {
  console.log("Running updateStudents...");
  diableExpiredStudents();
});
// cron.schedule("*/10 * * * * *", () => {
//   console.log("Running updateStudents...");
//   diableExpiredStudents();
// });

module.exports = router;
