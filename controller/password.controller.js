const { pool } = require("../config/db");
const { sendResetPasswordMail } = require("../helper/mailer");

async function sendResetPasswordAndLink(req, res) {
  const { email } = req.body;
  console.log(email);
  try {
    const userExist = await pool.query(
      `SELECT * FROM students WHERE credentials_created = true AND email = $1`,
      [email]
    );

    if (userExist.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "User not exist with this email!" });
    }

    sendResetPasswordMail(
      userExist.rows[0].email,
      `http://localhost:3000/reset-password/password/${userExist.rows[0].id}`
    );
    res.json({ message: "We have sent a reset password link to your email" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updatePassword(req, res) {
  const studentId = parseInt(req.params.studentId);
  const { password } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE student_credentials SET password = $1 WHERE student_id = $2`,
      [password, studentId]
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { sendResetPasswordAndLink, updatePassword };
