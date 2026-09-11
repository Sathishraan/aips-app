**+import mysql from '../../../Node-microservice/node_modules/mysql2/promise.js';

async function main() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'aips_latest',
    port: 3306,
  });

  const [tables] = await pool.query(`SHOW TABLES`);
  const allTableNames = tables.map(t => Object.values(t)[0]);
  
  const keywords = ['event', 'compet', 'cult', 'sport', 'diary', 'fee', 'exam', 'time', 'circ', 'gall', 'home', 'att'];
  
  const matched = allTableNames.filter(name => keywords.some(k => name.toLowerCase().includes(k)));
  console.log('Matched tables in database:');
  console.log(matched);

  for (const t of matched) {
    const [count] = await pool.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    console.log(`${t}: ${count[0].cnt} rows`);
  }

  process.exit(0);
}

main().catch(console.error);
