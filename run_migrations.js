import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const regions = [
  'ap-south-1',     // Mumbai
  'ap-southeast-1', // Singapore
  'us-east-1',      // N. Virginia
  'us-east-2',      // Ohio
  'us-west-1',      // N. California
  'us-west-2',      // Oregon
  'eu-west-1',      // Ireland
  'eu-west-2',      // London
  'eu-central-1',   // Frankfurt
  'ap-northeast-1', // Tokyo
  'ap-southeast-2', // Sydney
];

const password = 'Zappy@4709$';
const projectRef = 'copkzrwvpqfjpsyyyqdy';
const dbUser = 'postgres';

async function tryConnectAndMigrate() {
  console.log(`Connecting directly to db.${projectRef}.supabase.co...`);
  const successfulClient = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: dbUser,
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await successfulClient.connect();
    console.log('SUCCESS: Connected to database directly!');
  } catch (err) {
    console.error('ERROR: Could not connect to the database directly:', err.message);
    process.exit(1);
  }

  try {
    const migrationsDir = 'supabase/migrations';
    const files = [
      '20260605010000_ai_menu_enrichment_schema.sql',
      '20260605020000_fix_review_rls_for_customers.sql'
    ];

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Reading migration file: ${file}...`);
      if (!fs.existsSync(filePath)) {
        console.error(`Migration file not found: ${filePath}`);
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Executing SQL from ${file}...`);
      await successfulClient.query(sql);
      console.log(`Migration ${file} completed successfully!`);
    }

    console.log('ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Migration execution failed:', err);
  } finally {
    await successfulClient.end();
    console.log('Database connection closed.');
  }
}

tryConnectAndMigrate();
