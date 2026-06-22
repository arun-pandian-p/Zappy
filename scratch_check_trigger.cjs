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

    const triggerFuncRes = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'protect_delete'
    `);
    if (triggerFuncRes.rows.length > 0) {
      console.log("protect_delete function body:\n", triggerFuncRes.rows[0].prosrc);
    } else {
      console.log("protect_delete function not found");
    }

    const triggersRes = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'tables'
    `);
    console.log("Triggers on tables:", triggersRes.rows);

    // Let's also fetch any functions used by triggers on 'tables'
    const functionsRes = await client.query(`
      SELECT tgname, proname, prosrc
      FROM pg_trigger
      JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
      WHERE tgrelid = 'tables'::regclass
    `);
    console.log("Trigger functions on tables:", functionsRes.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
