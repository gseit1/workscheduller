const mysql = require('mysql2/promise');
require('dotenv').config();

async function addHourlyRateHistory() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'job_analytics'
    });

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_hourly_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        hourly_rate DECIMAL(10,2) NOT NULL,
        effective_from DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        INDEX idx_user_effective (user_id, effective_from)
      )
    `);

    // Backfill: ensure each user has at least one entry reflecting current rate
    const [users] = await connection.query('SELECT id, hourly_rate, DATE(created_at) as created_date FROM user');
    for (const u of users) {
      const [rows] = await connection.query(
        'SELECT COUNT(*) as cnt FROM user_hourly_rates WHERE user_id = ?',
        [u.id]
      );
      if (rows[0].cnt === 0) {
        await connection.query(
          'INSERT INTO user_hourly_rates (user_id, hourly_rate, effective_from) VALUES (?, ?, ?)',
          [u.id, u.hourly_rate || 15.0, u.created_date || '1970-01-01']
        );
      }
    }

    console.log('user_hourly_rates table ensured and backfilled.');
  } catch (err) {
    console.error('Error adding hourly rate history:', err);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  addHourlyRateHistory();
}

module.exports = addHourlyRateHistory;
