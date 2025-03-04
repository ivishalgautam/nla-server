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
      return res.status(404).json({ message: "Student not found!" });
    }

    if (credentials.rows[0].is_disabled) {
      return res.status(400).json({ message: "Student not found!" });
    }

    if (credentials.rows[0].password !== password) {
      return res.status(400).json({ message: "Wrong credentials!" });
    }

    const isDisabled = await pool.query(
      `SELECT is_disabled FROM students WHERE id = $1`,
      [credentials.rows[0].student_id]
    );

    if (isDisabled.rows[0].is_disabled === true) {
      return res
        .status(400)
        .json({ message: "Your subscription might have expired!" });
    }

    const student = await pool.query(
      `SELECT s.id as id, s.fullname, g.name AS grade, s.package, s.email, s.phone, s.city, s.pincode, s.is_disabled 
        FROM students AS s 
        JOIN grades AS g ON g.id = s.grade 
        WHERE s.id = $1;`,
      [credentials.rows[0].student_id]
    );

    const jwtToken = jwtGenerator({
      id: student.rows[0].id,
      fullname: student.rows[0].fullname,
      email: student.rows[0].email,
      phone: student.rows[0].phone,
      is_disabled: student.rows[0].is_disabled,
    });

    res.json({
      student: student.rows[0],
      access_token: jwtToken,
      credentials: { username, password },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function adminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const admin = await pool.query("SELECT * FROM admin WHERE email = $1", [
      email,
    ]);

    if (admin.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    if (admin.rows[0].password !== password) {
      return res.status(401).json({ message: "Wrong credentials!" });
    }

    const jwtToken = jwtGenerator({
      id: admin.rows[0].id,
      email: admin.rows[0].email,
      role: admin.rows[0].role,
    });

    return res
      .status(200)
      .json({
        id: admin.rows[0].id,
        email: admin.rows[0].email,
        role: admin.rows[0].role,
        name: admin.rows[0].name,
        access_token: jwtToken,
      });
  } catch (error) {
    console.error("Database Query Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function validateStudent(req, res) {
  try {
    // console.log("verified");
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { login, adminLogin, validateStudent };
