const { pool } = require("../config/db");
const jwtGenerator = require("../utils/jwtGenerator");

async function login(req, res) {
  const { username, password } = req.body;

  try {
    const credentials = await pool.query(
      `SELECT * FROM student_credentials WHERE username = $1`,
      [username]
    );

    if (credentials.rowCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (credentials.rows[0].is_disabled) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (credentials.rows[0].password !== password) {
      return res.status(400).json({ message: "Wrong credentials!" });
    }

    const student = await pool.query(
      `SELECT id, fullname, grade, package, email FROM students WHERE id = $1`,
      [credentials.rows[0].student_id]
    );

    const jwtToken = jwtGenerator({
      id: student.rows[0].id,
      fullname: student.rows[0].fullname,
      email: student.rows[0].email,
      phone: student.rows[0].phone,
    });

    res.json({ student: student.rows[0], access_token: jwtToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function adminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const admin = await pool.query(`SELECT * FROM admin WHERE email = $1`, [
      email,
    ]);

    console.log(admin.rows);

    if (admin.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.rows[0].password !== password) {
      return res.json({ message: "Wrong credentials!" });
    }

    const jwtToken = jwtGenerator({
      id: admin.rows[0].id,
      email: admin.rows[0].email,
    });

    res.json({ email: admin.rows[0].email, access_token: jwtToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function validateStudent(req, res) {
  try {
    console.log(req.user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { login, adminLogin, validateStudent };
