require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
});

pool
  .connect()
  .then((client) => {
    console.log("✅ PostgreSQL Connected Successfully!");
    client.release(); // Release connection back to the pool
  })
  .catch((err) =>
    console.error("❌ PostgreSQL Connection Failed:", err.message)
  );

module.exports = { pool };
