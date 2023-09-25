const { pool } = require("../config/db");
const csv = require("csv-parser");
const fs = require("fs");
const {
  generateUsername,
  generatePassword,
} = require("../helper/credentialGenerator");
const { sendEmail } = require("../helper/mailer");

async function importStudents(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", async (data) => {
        // Process each row of data and add it to the results array
        results.push(data);
        const {
          fullname,
          email,
          phone,
          gender,
          guardian_name,
          dob,
          city,
          pincode,
          grade,
          school_name,
          subject,
          package,
        } = data;

        const studentExist = await pool.query(
          `SELECT * FROM students WHERE email = $1 OR phone = $2`,
          [email, phone]
        );

        // console.log(student.rows);
        if (studentExist.rowCount > 0) {
          return;
        }

        const student = await pool.query(
          `INSERT INTO students (fullname, email, phone, guardian_name, dob, city, pincode, subject, package, grade, gender, school_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning *;`,
          [
            fullname,
            email,
            phone,
            guardian_name,
            new Date(),
            city,
            pincode,
            subject,
            package,
            grade,
            gender,
            school_name,
          ]
        );

        const username = await generateUsername(
          student.rows[0].fullname,
          student.rows[0].id
        );
        const password = await generatePassword(student.rows[0].dob);
        console.log(student.rows[0]);

        const credentialsExist = await pool.query(
          `SELECT * FROM student_credentials WHERE student_id = $1`,
          [student.rows[0].id]
        );

        if (credentialsExist.rowCount > 0) {
          return res.json({ message: "Already created!" });
        }

        const credentials = await pool.query(
          `INSERT INTO student_credentials (username, password, student_id) VALUES ($1, $2, $3) returning *`,
          [username, password, student.rows[0].id]
        );

        if (credentials.rowCount > 0) {
          await pool.query(
            `UPDATE students SET credentials_created = $1, is_subscribed = $2 WHERE id = $3`,
            [true, true, student.rows[0].id]
          );
          sendEmail(student.rows[0].email, username, password);
        }
      })
      .on("end", () => {
        res.json({ message: "Students imported successfully" });
        fs.unlinkSync(req.file.path);
      })
      .on("error", (error) => {
        console.error(error);
        res.status(500).json({
          message: "An error occurred while reading the uploaded file.",
        });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function createStudent(req, res) {
  const {
    fullname,
    email,
    phone,
    guardian_name,
    dob,
    city,
    pincode,
    subject,
    package,
    grade,
    gender,
    test_assigned,
  } = req.body;
  // return console.log(req.body);

  try {
    const studentExist = await pool.query(
      `SELECT * FROM students WHERE email = $1`,
      [email]
    );

    if (studentExist.rowCount > 0) {
      res
        .status(400)
        .json({ message: "Student already exist with this email" });
    }

    await pool.query(
      `INSERT INTO students (fullname, email, phone, guardian_name, dob, city, pincode, subject, package, grade, gender, test_assigned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
      [
        fullname,
        email,
        phone,
        guardian_name,
        dob,
        city,
        pincode,
        subject,
        package,
        grade,
        gender,
        test_assigned,
      ]
    );
    res.json({ message: "Student created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateStudentById(req, res) {
  const studentId = parseInt(req.params.studentId);
  const { ...data } = req.body;

  const updateColumns = Object.keys(data)
    .map((column, key) => `${column} = $${key + 1}`)
    .join(", ");

  const updateValues = Object.values(data);
  console.log({ updateColumns, updateValues });

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE students SET ${updateColumns} WHERE id = $${
        updateValues.length + 1
      } returning *;`,
      [...updateValues, studentId]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: "Student not found!" });

    if (rows[0].is_disabled === true) {
      await pool.query(
        `UPDATE student_credentials SET is_disabled = $1 WHERE student_id = $2`,
        [true, rows[0].id]
      );
    } else {
      await pool.query(
        `UPDATE student_credentials SET is_disabled = $1 WHERE student_id = $2`,
        [false, rows[0].id]
      );
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteStudentById(req, res) {
  const studentId = parseInt(req.params.studentId);
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM students WHERE id = $1`,
      [studentId]
    );
    res.json({ message: "Student delete successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getStudentById(req, res) {
  const studentId = parseInt(req.params.studentId);
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM students WHERE id = $1`,
      [studentId]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: "Student not found!" });

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getStudents(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM students;`);

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// ADMIN
async function generateCredentials(req, res) {
  const studentId = parseInt(req.params.studentId);
  try {
    const studentExist = await pool.query(
      `SELECT * FROM students WHERE id = $1`,
      [studentId]
    );
    console.log(studentExist.rows[0]);

    if (studentExist.rowCount === 0)
      return res.status(404).json({ message: "Student not exist!" });

    const { fullname, id, dob, email } = studentExist.rows[0];
    const username = await generateUsername(fullname, id);
    const password = await generatePassword(dob);

    const credentialsExist = await pool.query(
      `SELECT * FROM student_credentials WHERE student_id = $1`,
      [studentId]
    );
    if (credentialsExist.rowCount > 0) {
      return res.json({ message: "Already created!" });
    }

    const credentials = await pool.query(
      `INSERT INTO student_credentials (username, password, student_id) VALUES ($1, $2, $3) returning *`,
      [username, password, studentId]
    );

    if (credentials.rowCount > 0) {
      await pool.query(
        `UPDATE students SET credentials_created = $1, is_subscribed = $2 WHERE id = $3`,
        [true, true, studentId]
      );
      sendEmail(email, username, password);
    }

    res.json({ message: `Credentials created and sent to: ${email}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createStudent,
  updateStudentById,
  deleteStudentById,
  getStudentById,
  getStudents,
  generateCredentials,
  importStudents,
};
