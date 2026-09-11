import mysql from '../../../Node-microservice/node_modules/mysql2/promise.js';

async function main() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'aips_latest',
    port: 3306,
  });

  console.log('Connected to MySQL aips_latest');

  const tables = [
    'homework',
    'homework_attachments',
    'homework_subjects',
    'homework_submissions',
    'gallery_table',
    'circular_table',
    'notification',
    'notification_members',
    'attendance_student',
    'events',
    'competition_settings',
    'cutural_settings'
  ];

  for (const t of tables) {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${t}`);
      console.log(`\n=== Table: ${t} ===`);
      console.log('Columns: ' + cols.map(c => `${c.Field} (${c.Type})`).join(', '));
      const [count] = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      console.log(`Row count: ${count[0].cnt}`);
      const [sample] = await pool.query(`SELECT * FROM ${t} ORDER BY 1 DESC LIMIT 1`);
      if (sample.length > 0) {
        console.log('Sample row:', JSON.stringify(sample[0]));
      }
    } catch(e) {
      console.log(`Table ${t} error: ${e.message}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
