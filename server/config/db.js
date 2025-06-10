require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

(async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✔️  MySQL connected:', `${conn.config.host}:${conn.config.port} -> ${conn.config.database}`);
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection test failed:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;
