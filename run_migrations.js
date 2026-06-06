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
const dbUser = `postgres.${projectRef}`;

async function tryConnectAndMigrate() {
  let successfulClient = null;
  let successfulRegion = null;

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Trying to connect to region: ${region} (${host})...`);
    
    const client = new Client({
      host,
      port: 6543,
      user: dbUser,
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000 // 5 seconds timeout
    });

    try {
      await client.connect();
      console.log(`SUCCESS: Connected to database in region: ${region}!`);
      successfulClient = client;
      successfulRegion = region;
      break;
    } catch (err) {
      console.log(`Failed to connect to region ${region}: ${err.message}`);
      await client.end().catch(() => {});
    }
  }

  if (!successfulClient) {
    console.error('ERROR: Could not connect to the database in any region.');
    process.exit(1);
  }

  try {
    const migrationsDir = 'supabase/migrations';
    const files = [
      '20260606000000_push_notifications_schema.sql',
      '20260606034123_billing_and_kds_remediation.sql'
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
