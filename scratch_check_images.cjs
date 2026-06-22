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
    
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'image_library'
    `);
    console.log("image_library Columns:", columnsRes.rows);

    const totalLibRes = await client.query('SELECT COUNT(*) FROM public.image_library');
    console.log("Total rows in public.image_library:", totalLibRes.rows[0].count);

    const miImagesRes = await client.query('SELECT image_url FROM public.menu_items WHERE image_url IS NOT NULL');
    console.log("Images referenced in menu_items count:", miImagesRes.rows.length);

    // Let's see active images referenced in categories or advertisements or promotions too
    const catImagesRes = await client.query('SELECT image_url FROM public.categories WHERE image_url IS NOT NULL');
    console.log("Images referenced in categories count:", catImagesRes.rows.length);

    const promoImagesRes = await client.query('SELECT image_url FROM public.enterprise_promotions WHERE image_url IS NOT NULL');
    console.log("Images referenced in enterprise_promotions count:", promoImagesRes.rows.length);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
