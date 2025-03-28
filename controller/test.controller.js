const { pool } = require("../config/db");
const moment = require("moment-timezone");

async function createTest(req, res) {
  try {
    const {
      name,
      grade,
      test_type,
      subject,
      start_time,
      end_time,
      duration,
      instructions,
    } = req.body;

    // Convert to Indian Standard Time (IST)
    const startDateIST = moment(start_time).tz("Asia/Kolkata");
    const endDateIST = moment(end_time).tz("Asia/Kolkata");

    console.log({
      startDateIST: startDateIST.format(),
      endDateIST: endDateIST.format(),
    });

    const amount =
      test_type === "dashboard"
        ? 300
        : test_type === "olympiad"
        ? 500
        : test_type === "polympiad"
        ? 700
        : 0;

    await pool.query(
      `INSERT INTO tests (name, grade, test_type, subject, start_time, end_time, duration, instructions, amount, admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        name,
        parseInt(grade),
        test_type,
        subject,
        startDateIST.format(),
        endDateIST.format(),
        duration,
        instructions,
        amount,
        req.user.id,
      ]
    );
    res.json({ message: "Test created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateTestById(req, res) {
  const testId = parseInt(req.params.testId);
  const {
    name,
    grade,
    test_type,
    subject,
    start_time,
    end_time,
    duration,
    instructions,
    is_published,
  } = req.body;

  // const sDate = new Date(start_time).setHours(9, 0, 0, 0);
  // const eDate = new Date(end_time).setHours(21, 0, 0, 0);

  // Convert to Indian Standard Time (IST)
  // Convert to Indian Standard Time (IST)
  const startDateIST = moment(start_time).tz("Asia/Kolkata");
  const endDateIST = moment(end_time).tz("Asia/Kolkata");

  try {
    const { rowCount } = await pool.query(
      `UPDATE tests SET name = $1, grade = $2, test_type = $3, subject = $4, start_time = $5, end_time = $6, duration = $7, instructions = $8, is_published = $9 WHERE id = $10`,
      [
        name,
        parseInt(grade),
        test_type,
        subject,
        startDateIST.format(),
        endDateIST.format(),
        duration,
        instructions,
        is_published,
        testId,
      ]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: "Test not found!" });

    res.json({ message: "Updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getTestById(req, res) {
  const testId = parseInt(req.params.testId);

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM tests WHERE id = $1`,
      [testId]
    );

    if (rowCount === 0) return res.status(404).json("Test not found!");

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getTestInstructionsById(req, res) {
  const testId = parseInt(req.params.testId);

  try {
    const testDisabled = await pool.query(`SELECT * FROM tests WHERE id = $1`, [
      testId,
    ]);
    if (!testDisabled.rows[0].is_published) {
      return res.json([]);
    }

    const { rows, rowCount } = await pool.query(
      `SELECT id, instructions, duration FROM tests WHERE id = $1`,
      [testId]
    );

    if (rowCount === 0) return res.status(404).json("Test not found!");

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getStudentTestsByCategory(req, res) {
  const studentId = parseInt(req.params.studentId);
  try {
    const student = await pool.query(`SELECT * FROM students WHERE id = $1`, [
      studentId,
    ]);

    if (student.rowCount === 0)
      return res.status(404).json({ message: "Student not exist!" });

    if (student.rows[0].is_disabled === true) {
      return res.json([]);
    }

    const package = student.rows[0].package;
    const subject = student.rows[0].subject;
    const grade = student.rows[0].grade;

    if (!student.rows[0].payment_received) {
      const eligibilityTests = await pool.query(
        `SELECT t.*, q.total_questions
        FROM tests AS t
        JOIN (
            SELECT test_id, COUNT(*) AS total_questions
            FROM questions
            GROUP BY test_id
        ) AS q
        ON t.id = q.test_id
        WHERE t.is_published = true AND t.test_type = 'eligibility' AND subject = $1 LIMIT 1;`,
        [subject]
      );
      return res.json(eligibilityTests.rows);
    }

    const allTests = await pool.query(
      `SELECT t.*, q.total_questions
        FROM tests AS t
        JOIN (
            SELECT test_id, COUNT(*) AS total_questions
            FROM questions
            GROUP BY test_id
        ) AS q
        ON t.id = q.test_id
        WHERE t.is_published = true AND subject = $1;`,
      [subject]
    );

    let tests;
    if (package === "dashboard") {
      let practiceTests = allTests.rows
        .filter((item) => item.test_type === "practice")
        .filter((item) => item.grade === grade);
      tests = practiceTests;
    } else if (package === "olympiad") {
      const studentTests = student?.rows[0]?.test_assigned?.map((item) =>
        parseInt(item)
      );
      const testAlreadyTaken = await pool.query(
        `SELECT * FROM student_results WHERE student_id = $1 AND test_id = ANY($2);`,
        [student?.rows[0]?.id, studentTests]
      );
      const testTakenIds = testAlreadyTaken?.rows?.map((i) => i.test_id);
      // console.log(studentTests);
      if (testAlreadyTaken?.rowCount > 0) {
        tests = allTests.rows
          .filter((item) =>
            studentTests
              .filter((i) => !testTakenIds.includes(i))
              .includes(item.id)
          )
          .filter((item) => item.grade === grade);
      } else {
        tests = allTests.rows
          .filter((item) => studentTests.includes(item.id))
          .filter((item) => item.grade === grade);
      }
    } else if (package === "polympiad") {
      const studentTests = student.rows[0].test_assigned.map((item) =>
        parseInt(item)
      );
      const testAlreadyTaken = await pool.query(
        `SELECT * FROM student_results WHERE student_id = $1 AND test_id = ANY($2);`,
        [student?.rows[0]?.id, studentTests]
      );
      const testTakenIds = testAlreadyTaken?.rows?.map((i) => i.test_id);
      if (testAlreadyTaken.rowCount > 0) {
        tests = allTests.rows
          .filter(
            (item) =>
              item.test_type === "practice" ||
              studentTests
                .filter((i) => !testTakenIds?.includes(i))
                .includes(item.id)
          )
          .filter((item) => item.grade == grade);
      } else {
        tests = allTests.rows
          .filter(
            (item) =>
              item.test_type === "practice" || studentTests.includes(item.id)
          )
          .filter((item) => item.grade == grade);
      }
    } else if (package === "eligibility") {
      tests = [
        allTests.rows
          .filter((item) => item.test_type === "eligibility")
          .filter((item) => item.grade == grade)[0],
      ];
    }

    res.json(tests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getTests(req, res) {
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM tests WHERE is_published = true`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getFilteredTests(req, res) {
  const { grade, subject } = req.query;
  console.log(req.query);
  try {
    if (grade && subject) {
      const tests = await pool.query(
        `SELECT * FROM tests WHERE grade = $1 AND subject = $2 AND test_type = 'olympiad';`,
        [grade ?? "", subject ?? ""]
      );
      // const tests = await pool.query(
      //   `SELECT * FROM tests WHERE subject = $1 AND test_type = 'olympiad';`,
      //   [subject ?? ""]
      // );
      return res.json(tests.rows);
    } else {
      return res.json([]);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteTestById(req, res) {
  const testId = parseInt(req.params.testId);

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM tests WHERE id = $1`,
      [testId]
    );

    if (rowCount === 0) return res.status(404).json("Test not found!");

    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getUpcomingTests(req, res) {
  const studentId = parseInt(req.params.studentId);
  const { test_assigned } = req.body;
  try {
    const student = await pool.query(
      `SELECT test_assigned, grade, subject FROM students WHERE id = $1`,
      [studentId]
    );

    const studentSubject = student.rows[0].subject;
    const studentGrade = student.rows[0].grade;
    const assignedToStudent = student.rows[0].test_assigned.map((i) =>
      parseInt(i)
    );

    console.log(student.rows);

    console.log(assignedToStudent);
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM tests WHERE test_type = 'olympiad' AND subject = $1 AND grade = $2;`,
      [studentSubject, studentGrade]
    );
    const testsToSend = rows.filter(
      (test) => !assignedToStudent.includes(test.id)
    );

    res.json(testsToSend);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// admin
async function getAdminTests(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT 
        t.*, 
        COUNT(q.id) AS total_questions, 
        g.name AS grade_name 
      FROM 
        tests AS t
      LEFT JOIN 
        questions AS q ON t.id = q.test_id 
      LEFT JOIN 
        grades AS g ON g.id = t.grade
      WHERE 
        t.admin_id = $1
      GROUP BY
        t.id,
        g.name
      ORDER BY 
        t.id DESC;`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createTest,
  updateTestById,
  getTestById,
  getTests,
  getAdminTests,
  deleteTestById,
  getStudentTestsByCategory,
  getTestInstructionsById,
  getUpcomingTests,
  getFilteredTests,
};
