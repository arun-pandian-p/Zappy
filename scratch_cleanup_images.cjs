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

    // 1. Get all referenced images from tables
    const menuItems = await client.query('SELECT image_url FROM public.menu_items WHERE image_url IS NOT NULL');
    const categories = await client.query('SELECT image_url FROM public.categories WHERE image_url IS NOT NULL');
    const promotions = await client.query('SELECT image_url FROM public.enterprise_promotions WHERE image_url IS NOT NULL');
    
    const restCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants'
    `);
    const colNames = restCols.rows.map(r => r.column_name);
    
    let restImages = [];
    const possibleCols = ['logo_url', 'banner_url', 'image_url', 'cover_image'];
    const activeRestCols = possibleCols.filter(c => colNames.includes(c));
    if (activeRestCols.length > 0) {
      const restRes = await client.query(`SELECT ${activeRestCols.join(', ')} FROM public.restaurants`);
      for (const row of restRes.rows) {
        for (const col of activeRestCols) {
          if (row[col]) restImages.push(row[col]);
        }
      }
    }

    const referencedUrls = new Set();
    menuItems.rows.forEach(r => referencedUrls.add(r.image_url));
    categories.rows.forEach(r => referencedUrls.add(r.image_url));
    promotions.rows.forEach(r => referencedUrls.add(r.image_url));
    restImages.forEach(url => referencedUrls.add(url));

    console.log("Referenced image URLs:", Array.from(referencedUrls));

    // 2. Query storage.objects and check references
    const objectsRes = await client.query('SELECT id, bucket_id, name FROM storage.objects');
    const objectsToDelete = [];
    for (const obj of objectsRes.rows) {
      let isReferenced = false;
      for (const refUrl of referencedUrls) {
        if (refUrl.includes(obj.name) || refUrl.includes(encodeURIComponent(obj.name))) {
          isReferenced = true;
          break;
        }
      }
      if (!isReferenced) {
        objectsToDelete.push(obj.id);
      }
    }

    console.log(`Found ${objectsToDelete.length} storage objects to delete out of ${objectsRes.rows.length}`);
    if (objectsToDelete.length > 0) {
      await client.query("SET storage.allow_delete_query = 'true'");
      const deleteObjRes = await client.query('DELETE FROM storage.objects WHERE id = ANY($1::uuid[])', [objectsToDelete]);
      console.log(`Deleted ${deleteObjRes.rowCount} rows from storage.objects`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
