const { Client } = require('pg');

const password = 'Zappy@4709$';
const projectRef = 'copkzrwvpqfjpsyyyqdy';
const dbUser = 'postgres';

async function run() {
  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: dbUser,
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Check if extension pgcrypto is available
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Update password for admin123@gmail.com and zappyscan@gmail.com to Zappy@123
    const updateRes1 = await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('Zappy@123', gen_salt('bf')) 
      WHERE email = 'admin123@gmail.com'
    `);
    console.log("Updated admin123:", updateRes1.rowCount);

    const updateRes2 = await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('Zappy@123', gen_salt('bf')) 
      WHERE email = 'zappyscan@gmail.com'
    `);
    console.log("Updated zappyscan:", updateRes2.rowCount);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
