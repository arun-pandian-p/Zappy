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

    const targetTables = ['waiter_calls', 'table_sessions', 'order_items', 'restaurants', 'profiles', 'user_roles'];
    const rlsPoliciesRes = await client.query(`
      SELECT tablename, policyname, permissive, roles, cmd, qual::text, with_check::text
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = ANY($1::text[])
    `, [targetTables]);

    console.log("RLS Policies for target tables:");
    rlsPoliciesRes.rows.forEach(r => {
      console.log(`\nTable: ${r.tablename}`);
      console.log(`  Name: ${r.policyname}`);
      console.log(`  Cmd: ${r.cmd}`);
      console.log(`  Roles:`, r.roles);
      console.log(`  USING: ${r.qual}`);
      console.log(`  WITH CHECK: ${r.with_check}`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
