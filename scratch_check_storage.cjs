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
    
    const bucketsRes = await client.query('SELECT * FROM storage.buckets');
    console.log("Buckets:", bucketsRes.rows);

    const objectsCount = await client.query('SELECT bucket_id, COUNT(*) FROM storage.objects GROUP BY bucket_id');
    console.log("Objects counts:", objectsCount.rows);

    const sampleObjects = await client.query('SELECT id, bucket_id, name, metadata FROM storage.objects LIMIT 10');
    console.log("Sample objects:", sampleObjects.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
