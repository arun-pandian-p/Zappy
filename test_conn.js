import pg from 'pg';
const { Client } = pg;

async function testPort(port) {
  console.log(`Testing connection on port ${port}...`);
  const client = new Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: port,
    user: 'postgres.copkzrwvpqfjpsyyyqdy',
    password: 'Zappy@4709$',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS on port ${port}!`);
    await client.end();
  } catch (err) {
    console.log(`FAILED on port ${port}:`, err.message);
  }
}

async function main() {
  await testPort(5432);
  await testPort(6543);
}

main();
