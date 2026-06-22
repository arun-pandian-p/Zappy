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

    const usersRes = await client.query(`
      SELECT u.id, u.email, r.role, r.restaurant_id
      FROM auth.users u
      LEFT JOIN public.user_roles r ON u.id = r.user_id
    `);
    console.log("Users and Roles:", usersRes.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
