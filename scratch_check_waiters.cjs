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

    // Check waiters table columns
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'waiters'
    `);
    console.log("Waiters columns:", columnsRes.rows);

    // Check if RLS is enabled on waiters
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'waiters'
    `);
    if (rlsRes.rows.length > 0) {
      console.log("Waiters RLS status (relrowsecurity):", rlsRes.rows[0].relrowsecurity);
    } else {
      console.log("Waiters table not found");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
