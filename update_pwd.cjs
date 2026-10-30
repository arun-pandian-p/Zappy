const { Client } = require('pg');

const client = new Client({
  host: 'db.yqdblmkqlnhtbztpfuwm.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'aRUNOLIVER2030@',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const validHash = '$2a$10$jLy9fW43qHb76txa8Yuh9OE/clYKw0.FQE7vfg.MOg7FcRyLZq1DO';
  console.log('Target hash length:', validHash.length);
  const res = await client.query('UPDATE auth.users SET encrypted_password = $1 WHERE email = $2 RETURNING email, encrypted_password;', [validHash, 'admin@zappy.com']);
  console.log('Result:', res.rows);
  await client.end();
}

main().catch(console.error);

