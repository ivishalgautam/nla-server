const { pool } = require("../config/db");

async function getDashboardDetails(req, res) {
  try {
    const totalStudents = await pool.query(
      `SELECT 
           COUNT(*) as total_students,
           COUNT(CASE WHEN s.subject = 'abacus' THEN 1 ELSE NULL END) as abacus_students,
           COUNT(CASE WHEN s.subject = 'vedic' THEN 1 ELSE NULL END) as vedic_students,
           COUNT(CASE WHEN s.is_subscribed = 'true' THEN 1 ELSE NULL END) as subscribed_students,
           COUNT(CASE WHEN s.package = 'dashboard' THEN 1 ELSE NULL END) as dashboard_students,
           COUNT(CASE WHEN s.package = 'olympiad' THEN 1 ELSE NULL END) as olympiad_students,
           COUNT(CASE WHEN s.package = 'polympiad' THEN 1 ELSE NULL END) as polympiad_students
         FROM students as s;`
    );
    res.json(totalStudents.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
module.exports = { getDashboardDetails };
