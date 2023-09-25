const { pool } = require("../config/db");

async function createQuestion(req, res) {
  const { data, testId } = req.body;
  // console.log(req.body);

  try {
    await pool.query("DELETE FROM questions WHERE test_id = $1", [testId]);

    const questionRows = [];
    data.forEach(async (item) => {
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === "object") {
          const { rows } = await pool.query(
            `INSERT INTO questions (question, answer, test_id) VALUES ($1, $2, $3)`,
            [Object.values(value), item["answer"], parseInt(testId)]
          );
          questionRows.push(rows[0]);
        }
      }
    });

    res.json({ message: "Questions added successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateQuestionById(req, res) {
  const questionId = parseInt(req.params.questionId);
  const { ...data } = req.body;

  const updateColumns = Object.keys(data)
    .map((column, key) => `${column} = $${key + 1}`)
    .join(", ");
  const updateValues = Object.values(data);

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE questions SET ${updateColumns} WHERE id = $${
        updateValues + 1
      } returning *`,
      [...updateValues, questionId]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: "Question not found!" });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function deleteQuestionById(req, res) {
  const questionId = parseInt(req.params.questionId);

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM questions WHERE id = $1`,
      [questionId]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: "Question not found!" });

    res.json({ message: "Question deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getQuestionsByTestId(req, res) {
  const testId = parseInt(req.params.testId);
  const { studentId } = req.body;

  try {
    const testDisabled = await pool.query(`SELECT * FROM tests WHERE id = $1`, [
      testId,
    ]);
    if (!testDisabled.rows[0].is_published) {
      return res.json([]);
    }
    const { rows } = await pool.query(
      `SELECT * FROM questions WHERE test_id = $1`,
      [testId]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getQuestions(req, res) {
  try {
    const { rows, rowCount } = await pool.query(`SELECT * FROM questions`);

    if (rowCount === 0)
      return res.status(404).json({ message: "Question not found!" });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createQuestion,
  updateQuestionById,
  deleteQuestionById,
  getQuestionsByTestId,
  getQuestions,
};
