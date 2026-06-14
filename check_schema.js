import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const client = new Client({ connectionString: envConfig.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'restaurants'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
