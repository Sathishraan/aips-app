import axios from '../../../Node-microservice/node_modules/axios/index.js';
import mysql from '../../../Node-microservice/node_modules/mysql2/promise.js';

const PHP_URLS = [
  'http://192.168.29.118/aips',
  'https://tigerservers.in/aips'
];

async function testBackend() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'aips_latest',
    port: 3306,
  });

  const [logins] = await pool.query('SELECT user_id, user_name, password, user_type, mapId FROM login LIMIT 10');
  console.log('Sample logins from DB:');
  console.log(logins);

  for (const phpUrl of PHP_URLS) {
    console.log(`\n========================================`);
    console.log(`Testing Backend: ${phpUrl}`);
    console.log(`========================================`);

    try {
      const res = await axios.get(`${phpUrl}/api/login`, { timeout: 3000 }).catch(e => e.response || e);
      console.log(`Endpoint health check (${phpUrl}/api/login): Status = ${res.status || res.code || res.message}`);
    } catch (e) {
      console.log(`Failed to reach ${phpUrl}: ${e.message}`);
    }
  }

  process.exit(0);
}

testBackend().catch(console.error);
