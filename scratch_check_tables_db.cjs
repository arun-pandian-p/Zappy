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

    const tablesRes = await client.query(`
      SELECT id, restaurant_id, table_number, is_active, deleted_at, status, capacity
      FROM public.tables 
      ORDER BY restaurant_id, table_number
    `);
    console.log("All Tables in DB:", tablesRes.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
