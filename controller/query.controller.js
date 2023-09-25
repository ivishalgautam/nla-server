const { pool } = require("../config/db");
const { sendQueryEmail } = require("../helper/mailer");

async function sendQuery(req, res) {
  const studentId = parseInt(req.params.studentId);
  const testId = parseInt(req.params.testId);
  try {
    const student = await pool.query(
      `SELECT id, fullname FROM students WHERE id = $1`,
      [studentId]
    );

    const test = await pool.query(`SELECT id, name FROM tests WHERE id = $1`, [
      testId,
    ]);

    const student_id = student.rows[0].id;
    const student_name = student.rows[0].fullname;
    const test_id = test.rows[0].id;
    const test_name = test.rows[0].name;

    sendQueryEmail(student_id, student_name, test_id, test_name);

    res.json({
      message:
        "Query sent successfully and in 24 hours this test will assigned to you.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { sendQuery };
