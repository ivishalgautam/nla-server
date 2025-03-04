const { pool } = require("../config/db");

// ✅ Create Admin
async function createAdmin(req, res) {
  try {
    const { name, email, password, logo } = req.body;
    const role = "admin";

    const newAdmin = await pool.query(
      `INSERT INTO admin (name, email, password, logo, role) VALUES ($1, $2, $3, $4, $5) returning *`,
      [name, email, password, logo, role]
    );

    res.json({
      message: "Admin created successfully",
      admin: newAdmin.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get All Admins
async function getAdmins(req, res) {
  try {
    const admins = await pool.query(
      `SELECT * FROM admin WHERE role != 'superAdmin'`
    );
    res.json(admins.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get Admin By ID
async function getAdminById(req, res) {
  try {
    const { id } = req.params;
    const admin = await pool.query(`SELECT * FROM admin WHERE id = $1`, [id]);

    if (admin.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Update Admin
async function updateAdmin(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, logo } = req.body;

    const updatedAdmin = await pool.query(
      `UPDATE admin SET name = $1, email = $2, password = $3, logo = $4 WHERE id = $5 returning *`,
      [name, email, password, logo, id]
    );

    if (updatedAdmin.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({
      message: "Admin updated successfully",
      admin: updatedAdmin.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Delete Admin
async function deleteAdmin(req, res) {
  try {
    const { id } = req.params;
    const deletedAdmin = await pool.query(
      `DELETE FROM admin WHERE id = $1 returning *`,
      [id]
    );

    if (deletedAdmin.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
// --- Temp Defalt Database Update
async function DBUpdate(req, res) {
  try {
    // Start a transaction
    await pool.query("BEGIN");

    // Create ENUM Types
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
          CREATE TYPE role_enum AS ENUM ('admin', 'superAdmin');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_type_enum') THEN
          CREATE TYPE test_type_enum AS ENUM ('practice', 'competitive', 'olympiad', 'eligibility');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_type_enum') THEN
          CREATE TYPE subject_type_enum AS ENUM ('abacus', 'vedic');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_type_enum') THEN
          CREATE TYPE package_type_enum AS ENUM ('dashboard', 'olympiad', 'polympiad', 'eligibility');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
          CREATE TYPE gender_enum AS ENUM ('male', 'female');
        END IF;
      END $$;
    `);

    // Check if 'name' column exists
    const checkColumn = await pool.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'admin' AND column_name = 'name';
`);

    if (checkColumn.rows.length === 0) {
      // Add the column with a default value
      await pool.query(`
    ALTER TABLE admin ADD COLUMN name VARCHAR(100) DEFAULT 'Default Admin' NOT NULL;
  `);
      console.log("Added 'name' column to admin table.");
    } else {
      // Ensure no NULL values exist
      await pool.query(`
    UPDATE admin SET name = 'Default Admin' WHERE name IS NULL;
  `);
      console.log("Updated NULL values in 'name' column.");
    }

    // Create Admin Table (if it doesn't exist)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        logo VARCHAR(255),
        role role_enum NOT NULL DEFAULT 'superAdmin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ✅ Ensure Missing Columns in `admin` Table
    const adminColumns = [
      { column: "name", type: "VARCHAR(100) NOT NULL" },
      { column: "email", type: "VARCHAR(100) NOT NULL UNIQUE" },
      { column: "password", type: "VARCHAR(255) NOT NULL" },
      { column: "logo", type: "VARCHAR(255)" },
      { column: "role", type: "role_enum NOT NULL DEFAULT 'superAdmin'" },
      { column: "created_at", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
    ];

    for (const col of adminColumns) {
      const checkColumn = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'admin' AND column_name = $1`,
        [col.column]
      );

      if (checkColumn.rows.length === 0) {
        await pool.query(
          `ALTER TABLE admin ADD COLUMN ${col.column} ${col.type};`
        );
        console.log(`Added ${col.column} column to admin table`);
      }
    }

    // Insert Default Admin
    await pool.query(`
      INSERT INTO admin (name, email, password, role)
      VALUES ('Vishal', 'vishal@gmail.com', '1234', 'superAdmin')
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
    `);

    // Add admin_id Column to Existing Tables (if not exists)
    const tables = [
      "grades",
      "tests",
      "questions",
      "students",
      "student_credentials",
      "student_results",
      "leads",
    ];

    for (const table of tables) {
      // Check if the admin_id column already exists
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'admin_id';
      `;
      const result = await pool.query(checkQuery, [table]);

      // If the column does not exist, add it
      if (result.rows.length === 0) {
        await pool.query(`
          ALTER TABLE ${table} 
          ADD COLUMN admin_id INT NOT NULL DEFAULT 1;
        `);
        console.log(`Added admin_id column to ${table}`);
      } else {
        console.log(`admin_id column already exists in ${table}`);
      }
    }

    // Commit the transaction
    await pool.query("COMMIT");

    res.json({ message: "Database updated successfully" });
  } catch (error) {
    // Rollback the transaction in case of error
    await pool.query("ROLLBACK");
    console.error("Error updating database:", error.message);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  DBUpdate,
};
