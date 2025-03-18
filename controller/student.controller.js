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

    const adminId = req.user.id;
    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", async (data) => {
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
          classs,
        } = data;

        const formattedDOB = dob.split("/").reverse().join("-");

        const studentExist = await pool.query(
          `SELECT * FROM students WHERE email = $1 OR phone = $2 AND admin_id = $3`,
          [email, phone, adminId]
        );

        if (studentExist.rowCount > 0) {
          return;
        }
        const student = await pool.query(
          `INSERT INTO students 
          (fullname, email, phone, guardian_name, dob, city, pincode, subject, package, grade, gender, school_name, class, expiration_date, admin_id) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, (CURRENT_DATE + INTERVAL '1 year')::DATE, $14) returning *;`,
          [
            fullname,
            email,
            phone,
            guardian_name,
            formattedDOB,
            city,
            pincode,
            subject,
            package,
            grade,
            gender,
            school_name,
            classs,
            adminId,
          ]
        );

        const username = await generateUsername(
          student.rows[0].fullname,
          student.rows[0].id
        );
        const password = await generatePassword(student.rows[0].dob);

        const credentialsExist = await pool.query(
          `SELECT * FROM student_credentials WHERE student_id = $1 AND admin_id = $2`,
          [student.rows[0].id, adminId]
        );

        if (credentialsExist.rowCount > 0) {
          return;
        }

        const credentials = await pool.query(
          `INSERT INTO student_credentials (username, password, student_id, admin_id) 
          VALUES ($1, $2, $3, $4) returning *`,
          [username, password, student.rows[0].id, adminId]
        );

        if (credentials.rowCount > 0) {
          await pool.query(
            `UPDATE students SET credentials_created = $1, is_subscribed = $2 WHERE id = $3 AND admin_id = $4`,
            [true, true, student.rows[0].id, adminId]
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
        res.status(500).json({ message: "Error reading the uploaded file." });
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
    school_name,
    classs,
  } = req.body;

  try {
    const studentExist = await pool.query(
      `SELECT * FROM students WHERE email = $1`,
      [email]
    );

    if (studentExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "Student already exist with this email" });
    }

    const phoneExist = await pool.query(
      `SELECT * FROM students WHERE phone = $1`,
      [phone]
    );

    if (phoneExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "Student already exist with this phone" });
    }

    const superAdmins = await pool.query(
      `SELECT * FROM admin WHERE role = 'superAdmin'`
    );

    const currentDate = new Date();
    const expirationDate = new Date();
    expirationDate.setFullYear(currentDate.getFullYear() + 1);
    const formattedExpirationDate = expirationDate.toISOString().split("T")[0];
    const adminId = req.user?.id || superAdmins.rows[0].id;

    await pool.query(
      `INSERT INTO students (fullname, email, phone, guardian_name, dob, city, pincode, subject, package, grade, gender, test_assigned, school_name, class, admin_id, expiration_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, (CURRENT_DATE + INTERVAL '1 year')::DATE);`,
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
        school_name,
        classs,
        adminId,
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
    .map(
      (column, key) => `${column === "classs" ? "class" : column} = $${key + 1}`
    )
    .join(", ");

  const updateValues = Object.values(data);
  // console.log({ updateColumns, updateValues });

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
    const studentExist = await pool.query(
      `SELECT * FROM students WHERE id = $1`,
      [studentId]
    );

    await pool.query(`DELETE FROM leads WHERE email = $1`, [
      studentExist.rows[0].email,
    ]);

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
      `SELECT 
      s.*, 
      COALESCE(g.name, '') AS grade_name 
    FROM students AS s 
    LEFT JOIN grades AS g ON g.id = s.grade 
    WHERE s.id = $1;`,
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

async function getStudentByIdForAdmin(req, res) {
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
    const { rows } = await pool.query(
      `SELECT * FROM students WHERE admin_id = $1 ORDER BY id DESC;`,
      [req.user.id]
    );

    // const page =
    //   req.query.page && Number(req.query.page) > 0 ? Number(req.query.page) : 1;

    // const per_page =
    //   req.query.per_page && Number(req.query.per_page) > 0
    //     ? Number(req.query.per_page)
    //     : 10;

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// ADMIN
async function generateCredentials(req, res) {
  const studentId = parseInt(req.params.studentId);
  const adminId = req.user.id;

  try {
    const studentExist = await pool.query(
      `SELECT * FROM students WHERE id = $1 AND admin_id = $2`,
      [studentId, adminId]
    );

    if (studentExist.rowCount === 0) {
      return res.status(404).json({
        message: "Student not found or does not belong to this admin!",
      });
    }

    const { fullname, id, dob, email } = studentExist.rows[0];
    const username = await generateUsername(fullname, id);
    const password = await generatePassword(dob);

    const credentialsExist = await pool.query(
      `SELECT * FROM student_credentials WHERE student_id = $1 AND admin_id = $2`,
      [studentId, adminId]
    );

    if (credentialsExist.rowCount > 0) {
      await pool.query(
        `UPDATE student_credentials SET username = $1, password = $2 WHERE student_id = $3 AND admin_id = $4 returning *`,
        [username, password, studentId, adminId]
      );
      sendEmail(email, username, password);

      return res.json({ message: `Credentials created and sent to: ${email}` });
    }

    const credentials = await pool.query(
      `INSERT INTO student_credentials (username, password, student_id, admin_id) VALUES ($1, $2, $3, $4) returning *`,
      [username, password, studentId, adminId]
    );

    if (credentials.rowCount > 0) {
      await pool.query(
        `UPDATE students SET credentials_created = $1, is_subscribed = $2 WHERE id = $3 AND admin_id = $4`,
        [true, true, studentId, adminId]
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
  getStudentByIdForAdmin,
  getStudents,
  generateCredentials,
  importStudents,
};
