import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  // Enable multiple statements
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true
  });
  
  // Get all migration SQL files in order
  const migrationsDir = path.resolve('drizzle/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  // Also check the root drizzle dir for the latest migration
  const rootFiles = fs.readdirSync('drizzle')
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  const allFiles = [
    ...files.map(f => path.join(migrationsDir, f)),
    ...rootFiles.map(f => path.join('drizzle', f))
  ];
  
  console.log(`Found ${allFiles.length} migration files to apply`);
  
  let applied = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);
    let sql = fs.readFileSync(filePath, 'utf8');
    
    // Remove the statement-breakpoint comments
    sql = sql.replace(/--> statement-breakpoint/g, '');
    
    try {
      await conn.query(sql);
      applied++;
      process.stdout.write('.');
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('Duplicate')) {
        skipped++;
        process.stdout.write('s');
      } else {
        console.error(`\nError in ${fileName}: ${e.message.substring(0, 100)}`);
        errors++;
      }
    }
  }
  
  console.log(`\n\nDone! Applied: ${applied}, Skipped: ${skipped}, Errors: ${errors}`);
  
  // Verify
  const [dbTables] = await conn.execute('SHOW TABLES');
  console.log(`Total tables in database now: ${dbTables.length}`);
  
  await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
