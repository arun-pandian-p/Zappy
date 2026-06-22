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

    await client.query(`
      ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_restaurant_id_table_number_key;
      DROP INDEX IF EXISTS tables_restaurant_id_table_number_key;
      CREATE UNIQUE INDEX IF NOT EXISTS tables_restaurant_id_table_number_active_idx 
      ON public.tables (restaurant_id, table_number) 
      WHERE (is_active = true);
    `);
    console.log("Tables unique index updated for soft delete support.");

    const constRes = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'tables'::regclass
    `);
    console.log("Constraints:", constRes.rows);


  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
