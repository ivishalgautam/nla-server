const { pool } = require("../config/db");
const {
  generateUsername,
  generatePassword,
} = require("../helper/credentialGenerator");
const { sendEmail } = require("../helper/mailer");

async function createLead(req, res) {
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

  try {
    const leadExist = await pool.query(`SELECT * FROM leads WHERE email = $1`, [
      email,
    ]);

    const studentExist = await pool.query(
      `SELECT * FROM students WHERE email = $1`,
      [email]
    );

    if (leadExist.rowCount > 0 || studentExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "Student already exist with this email" });
    }

    // create lead
    const lead = await pool.query(
      `INSERT INTO leads (fullname, email, phone, guardian_name, dob, city, pincode, subject, package, grade, gender, test_assigned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
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

    // create student
    const student = await pool.query(
      `INSERT INTO students (fullname, email, phone, guardian_name, dob, city, pincode, subject, package, grade, gender, test_assigned, credentials_created) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning *;`,
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
        true,
      ]
    );

    // const { fullname, id, dob, email } = student.rows[0];
    const username = await generateUsername(
      student.rows[0].fullname,
      student.rows[0].id
    );
    const password = await generatePassword(student.rows[0].dob);

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

    res.json({
      message: `Registered successfully and your credentials sent to: ${student.rows[0].email}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteLeadById(req, res) {
  const leadId = parseInt(req.params.leadId);
  try {
    const { rowCount } = await pool.query(`DELETE FROM leads WHERE id = $1`, [
      leadId,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "Lead not exist!" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getLeadById(req, res) {
  const leadId = parseInt(req.params.leadId);
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM leads WHERE id = $1`,
      [leadId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Lead not exist!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllLeads(req, res) {
  try {
    const { rows, rowCount } = await pool.query(`SELECT * FROM leads;`);

    if (rowCount === 0) {
      return res.json({ message: "Leads not found!" });
    }

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { createLead, deleteLeadById, getLeadById, getAllLeads };
