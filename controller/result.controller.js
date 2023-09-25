const { pool } = require("../config/db");

async function createResult(req, res) {
  const {
    student_id,
    test_id,
    student_points,
    total_points,
    student_attempted,
    total_questions,
    grade,
  } = req.body;
  console.log(req.body);
  try {
    const result = await pool.query(
      `INSERT INTO student_results (student_id, test_id, student_points, total_points, student_attempted, total_questions, grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [
        student_id,
        test_id,
        student_points,
        total_points,
        student_attempted,
        total_questions,
        grade,
      ]
    );
    // console.log(result.rows);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getResults(req, res) {
  try {
    const { rows, rowCount } = await pool.query(`
      SELECT 
            sr.*, 
            s.id as student_id, 
            s.fullname, 
            t.id as test_id, 
            t.name as test_name
        FROM 
            student_results sr
        JOIN 
            students s ON sr.student_id = s.id
        JOIN 
            tests t on sr.test_id = t.id`);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getStudentResults(req, res) {
  const studentId = parseInt(req.params.studentId);
  try {
    const { rows } = await pool.query(
      `
      SELECT 
            sr.*, 
            s.id as student_id, 
            s.fullname, 
            t.id as test_id, 
            t.name as test_name,
            t.test_type
        FROM
            student_results as sr
        JOIN
            students as s ON sr.student_id = s.id
        JOIN
            tests as t on sr.test_id = t.id
        WHERE
            sr.student_id = $1
            ORDER BY created_at ASC;`,
      [studentId]
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { createResult, getResults, getStudentResults };
