const { pool } = require("../config/db");

async function createGrade(req, res) {
  try {
    const { name } = req.body;

    const gradeExist = await pool.query(`SELECT * FROM grades WHERE id = $1`, [
      name,
    ]);

    if (gradeExist.rowCount > 0) {
      return res.status(400).json({ message: `Grade ${name} already exist!` });
    }

    await pool.query(
      `INSERT INTO grades (id, name) VALUES ($1, $2) returning *`,
      [parseInt(name), `Grade ${name}`]
    );

    res.json({ message: "Grade created successfully." });
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function updateGradeById(req, res) {
  const gradeId = parseInt(req.params.gradeId);
  const { name } = req.body;
  try {
    const gradeExist = await pool.query(`SELECT * FROM grades id = $1`, [name]);

    if (gradeExist.rowCount > 0)
      return res.status(400).json({ message: "Grade already exist!" });

    await pool.query(`UPDATE grades SET name = $1 WHERE id = $2;`, [
      name,
      gradeId,
    ]);

    if (rowCount === 0)
      return res.status(404).json({ message: "Grade not found!" });

    res.json({ message: "Garde updates sucessfully" });
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function getGradeById(req, res) {
  const gradeId = parseInt(req.params.gradeId);

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM grades WHERE id = $1`,
      [gradeId]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: "Grade not found!" });

    res.json(rows[0]);
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function getGrades(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM grades;`);

    res.json(rows);
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function deleteGradeById(req, res) {
  const gradeId = req.params.gradeId;
  try {
    const { rowCount } = await pool.query(`DELETE FROM grades WHERE id = $1`, [
      gradeId,
    ]);

    if (rowCount === 0) return res.status(404).json("Grade not found!");

    res.json({ message: "Grade deleted successfully." });
  } catch (error) {
    res.json({ message: error.message });
  }
}

module.exports = {
  createGrade,
  updateGradeById,
  getGradeById,
  getGrades,
  deleteGradeById,
};
