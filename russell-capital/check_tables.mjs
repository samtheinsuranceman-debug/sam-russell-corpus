import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/russell-capital/.env' });

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const schema = fs.readFileSync('/home/ubuntu/russell-capital/drizzle/schema.ts', 'utf8');
  const tableNames = [...schema.matchAll(/mysqlTable\(["']([^"']+)["']/g)].map(m => m[1]);
  console.log('Total tables in schema:', tableNames.length);
  
  const [dbTables] = await conn.execute('SHOW TABLES');
  const dbTableNames = dbTables.map(r => Object.values(r)[0]);
  console.log('Total tables in database:', dbTableNames.length);
  
  const missing = tableNames.filter(t => dbTableNames.indexOf(t) === -1);
  console.log('\nMissing tables (' + missing.length + '):');
  missing.forEach(t => console.log('  -', t));
  await conn.end();
}
run().catch(e => { console.error(e); process.exit(1); });
