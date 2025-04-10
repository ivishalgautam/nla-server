const { pool } = require("../config/db");
const { calculateGrade } = require("../helper/grade");

async function createResult(req, res) {
  const { student_id, test_id, user_answers, time_taken } = req.body;
  console.log(req.body);
  try {
    const result = await pool.query(
      `INSERT INTO student_results (student_id, test_id, user_answers, time_taken)
       VALUES ($1, $2, $3, $4) returning *`,
      [student_id, test_id, user_answers, time_taken]
    );
    // console.log(result.rows);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getResults(req, res) {
  const whereConditions = ["t.admin_id = $1"];
  const queryParams = [req.user.id];
  let whereClause = "";

  const type = req.query.type ? req.query.type : null;
  if (type) {
    whereConditions.push(`t.test_type = $${whereConditions.length + 1}`);
    queryParams.push(type);
  }

  const q = req.query.q ? req.query.q : null;
  if (q) {
    whereConditions.push(`s.fullname ILIKE $${whereConditions.length + 1}`);
    queryParams.push(`%${q}%`);
  }

  if (whereConditions.length > 0) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  // Add limit and offset parameters
  queryParams.push(limit, offset);

  console.log({ whereConditions, queryParams });

  try {
    const { rows, rowCount } = await pool.query(
      `
      WITH distinct_students AS (
          SELECT DISTINCT ON (s.id)
              sr.id,
              sr.user_answers,
              sr.time_taken,
              s.id AS student_id,
              s.fullname,
              s.school_name,
              g.name AS class,
              t.test_type,
              t.created_at AS held_on,
              COALESCE(json_agg(qs.answer ORDER BY qs.created_at), '[]') as right_answers
          FROM 
              student_results sr
          JOIN 
              students s ON sr.student_id = s.id
          JOIN 
              tests t ON sr.test_id = t.id 
          JOIN 
              grades g ON s.grade = g.id
          JOIN
            questions as qs on qs.test_id = t.id
          ${whereClause}
          GROUP BY sr.id, s.id, g.name, t.id
          ORDER BY 
              s.id DESC
      )
      SELECT 
          * ,
          (SELECT COUNT(*) FROM distinct_students) AS total
      FROM 
          distinct_students
      LIMIT $${queryParams.length - 1} 
      OFFSET $${queryParams.length}
      `,
      queryParams
    );

    const updatedResults = rows.map((item) => {
      let studentPoints = 0;
      let studentAttempted = 0;
      let totalPoints = item.right_answers?.length;
      let totalQuestions = item.right_answers?.length;

      if (item.user_answers && item.right_answers) {
        item.user_answers.forEach((answer, index) => {
          if (answer !== null) studentAttempted += 1;
          if (answer == item.right_answers[index]) {
            studentPoints += 1;
          }
        });
      }

      const { user_answers, right_answers, ...rest } = item;
      return {
        ...rest,
        student_points: studentPoints,
        grade: calculateGrade(studentPoints, totalPoints, totalQuestions),
      };
    });

    res.json({ results: updatedResults, total: rows?.[0]?.total ?? 0 });
  } catch (error) {
    console.log(error);
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
            s.school_name,
            g.name as class,
            t.id as test_id, 
            t.name as test_name,
            t.test_type,
            t.subject,
            t.start_time as held_on,
            COALESCE(json_agg(qs.answer ORDER BY qs.created_at), '[]') as right_answers
        FROM
            student_results as sr
        JOIN
            students as s ON sr.student_id = s.id
        JOIN
            tests as t on sr.test_id = t.id
        JOIN
            questions as qs on qs.test_id = t.id
        JOIN grades as g on s.grade = g.id    
        WHERE
          sr.student_id = $1 AND sr.admin_id = $2
        GROUP BY
          sr.id, s.id, g.name, t.id
        ORDER BY created_at DESC
        ;`,
      [studentId, req.user.id]
    );

    const updatedResults = rows.map((item) => {
      let studentPoints = 0;
      let studentAttempted = 0;
      let totalPoints = item.right_answers?.length;
      let totalQuestions = item.right_answers?.length;

      if (item.user_answers && item.right_answers) {
        item.user_answers.forEach((answer, index) => {
          if (answer !== null) studentAttempted += 1;
          if (answer == item.right_answers[index]) {
            studentPoints += 1;
          }
        });
      }
      return {
        ...item,
        student_points: studentPoints,
        student_attempted: studentAttempted,
        total_points: totalPoints,
        total_questions: totalQuestions,
        grade: calculateGrade(studentPoints, totalPoints, totalQuestions),
      };
    });

    res.json(updatedResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
async function getStudentResultsStu(req, res) {
  const studentId = parseInt(req.params.studentId);
  try {
    const { rows } = await pool.query(
      `
      SELECT 
            sr.*, 
            s.id as student_id, 
            s.fullname,
            s.school_name,
            g.name as class,
            t.id as test_id, 
            t.name as test_name,
            t.test_type,
            t.subject,
            t.start_time as held_on,
            COALESCE(json_agg(qs.answer ORDER BY qs.created_at), '[]') as right_answers
        FROM
            student_results as sr
        JOIN
            students as s ON sr.student_id = s.id
        JOIN
            tests as t on sr.test_id = t.id
        JOIN
            questions as qs on qs.test_id = t.id
        JOIN grades as g on s.grade = g.id    
        WHERE
          sr.student_id = $1
        GROUP BY
          sr.id, s.id, g.name, t.id
        ORDER BY created_at DESC
        ;`,
      [studentId]
    );

    const updatedResults = rows.map((item) => {
      let studentPoints = 0;
      let studentAttempted = 0;
      let totalPoints = item.right_answers?.length;
      let totalQuestions = item.right_answers?.length;

      if (item.user_answers && item.right_answers) {
        item.user_answers.forEach((answer, index) => {
          if (answer !== null) studentAttempted += 1;
          if (answer == item.right_answers[index]) {
            studentPoints += 1;
          }
        });
      }
      return {
        ...item,
        student_points: studentPoints,
        student_attempted: studentAttempted,
        total_points: totalPoints,
        total_questions: totalQuestions,
        grade: calculateGrade(studentPoints, totalPoints, totalQuestions),
      };
    });

    res.json(updatedResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAnswerSheet(req, res) {
  const { studentId, testId } = req.params;
  const { t } = req.query;

  try {
    let studentAnswers;
    if (studentId && testId && t) {
      const answers = await pool.query(
        "SELECT * FROM student_results WHERE student_id = $1 AND test_id = $2 AND admin_id = $3;",
        [studentId, testId, req.user.id]
      );

      const matchingRows = answers.rows.filter((row) => {
        const createdAt = new Date(row.created_at);
        const tDate = new Date(t);
        return createdAt.getTime() === tDate.getTime();
      });

      studentAnswers =
        matchingRows.length > 0 ? matchingRows[0].user_answers : null;
    }

    const questions = await pool.query(
      `SELECT * FROM questions WHERE test_id = $1 AND admin_id = $2 ORDER BY id ASC;`,
      [testId, req.user.id]
    );

    res.json({ questions: questions.rows, studentAnswers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
async function getAnswerSheetStu(req, res) {
  const { studentId, testId } = req.params;
  const { t } = req.query;

  try {
    let studentAnswers;
    if (studentId && testId && t) {
      const answers = await pool.query(
        "SELECT * FROM student_results WHERE student_id = $1 AND test_id = $2;",
        [studentId, testId]
      );

      const matchingRows = answers.rows.filter((row) => {
        const createdAt = new Date(row.created_at);
        const tDate = new Date(t);
        return createdAt.getTime() === tDate.getTime();
      });

      studentAnswers =
        matchingRows.length > 0 ? matchingRows[0].user_answers : null;
    }

    const questions = await pool.query(
      "SELECT * FROM questions WHERE test_id = $1 ORDER BY id ASC;",
      [testId]
    );

    res.json({ questions: questions.rows, studentAnswers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createResult,
  getResults,
  getStudentResults,
  getStudentResultsStu,
  getAnswerSheet,
  getAnswerSheetStu,
};
