const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'public', 'food', 'stitch_zappy_cinematic_footer_variant_a');
const publicStoreDir = path.join(__dirname, '..', 'public', 'store');
const rootStoreDir = path.join(__dirname, '..', 'store');

// Full list of 175 items
const items = [
  "Idli", "Mini Idli", "Rava Idli", "Plain Dosa", "Masala Dosa", "Onion Dosa", 
  "Rava Dosa", "Set Dosa", "Paper Dosa", "Green Gram Dosa", "Uttapam", "Adai", 
  "Vada (Medu Vada)", "Sambar Vada", "Dahi Vada", "Pongal (Ven Pongal)", 
  "Sweet Pongal (Sakkarai Pongal)", "Upma", "Khichdi", "Idiyappam", "Appam", 
  "Puttu", "Dosa with Chutney & Sambar", "Bisi Bele Bath", "Akki Roti", 
  "Neer Dosa", "Curd Rice (Thayir Sadam)", "Lemon Rice", "Tamarind Rice (Puliyodarai)", 
  "Coconut Rice", "Tomato Rice", "Vegetable Biryani", "Chicken Biryani", 
  "Mutton Biryani", "Ghee Rice", "Curd Vada with Rice", "Kara Sadam", 
  "Bisibele Bath Rice", "Sambar Rice", "Rasam Rice", "Mango Rice", 
  "Vegetable Pulao", "Coconut Milk Rice (Thengai Paal Sadam)", 
  "Curd Rice with Pomegranate", "Jeera Rice", "Kalan Sadam", "Arachuvitta Sambar", 
  "Drumstick Sambar", "Mixed Vegetable Sambar", "Onion Sambar", "Brinjal Sambar", 
  "Hotel-style Sambar", "Pumpkin Sambar", "Udupi Sambar", "Paruppu Sambar", 
  "Vatha Kuzhambu", "Tomato Rasam", "Pepper Rasam (Milagu Rasam)", "Garlic Rasam", 
  "Lemon Rasam", "Dal Rasam (Paruppu Rasam)", "Mysore Rasam", "Pineapple Rasam", 
  "Ginger Rasam", "Curry Leaves Rasam", "Rasam Vada", "Coconut Chutney", 
  "Tomato Chutney", "Coriander Chutney", "Mint Chutney", "Onion Chutney", 
  "Tamarind Chutney", "Peanut Chutney", "Ginger Chutney", "Garlic Chutney", 
  "Curry Leaves Chutney", "Pudina Coconut Chutney", "Red Chili Chutney", 
  "Carrot Chutney", "Coconut-Ginger Chutney", "Chana Dal Chutney", "Beans Poriyal", 
  "Cabbage Poriyal", "Carrot Poriyal", "Beetroot Poriyal", "Snake Gourd Poriyal", 
  "Cluster Beans Poriyal", "Avial", "Olan", "Kootu (Mixed Vegetable Kootu)", 
  "Pumpkin Kootu", "Mor Kuzhambu", "Erissery", "Thoran", "Pachadi", 
  "Vazhakkai Poriyal", "Beans Usili", "Vegetable Kurma", "Potato Masala", 
  "Chettinad Chicken Curry", "Kerala Fish Curry", "Mutton Chukka", "Egg Curry", 
  "Prawn Roast", "Chicken 65", "Chicken Chettinad", "Meen Pollichathu", 
  "Kozhi Varutharacha Curry", "Mutton Kuzhambu", "Fish Moilee", "Egg Roast", 
  "Mysore Bonda", "Onion Bajji", "Banana Bajji", "Potato Bonda", "Mirchi Bajji", 
  "Murukku", "Banana Chips", "Vadai (Paruppu Vadai)", "Masala Vada", 
  "Bonda Soup", "Sundal", "Kara Boondi", "Thattai", "Pakoda", 
  "Payasam (Paal Payasam)", "Semiya Payasam", "Ada Pradhaman", "Mysore Pak", 
  "Halwa (Kesari)", "Rava Kesari", "Boondi Laddu", "Jangiri", "Adhirasam", 
  "Pal Kova", "Sweet Pongal", "Banana Halwa", "Unniyappam", "Coconut Burfi", 
  "Rasgulla (South Indian style)", "Filter Coffee", "Masala Chai", 
  "Buttermilk (Spiced Chaas)", "Tender Coconut Water", "Sambharam", 
  "Rose Milk", "Jigarthanda", "Sukku Coffee", "Panakam", "Nannari Sherbet", 
  "South Indian Thali", "Banana Leaf Meals", "Combo Tiffin Plate", 
  "Mini Tiffin Platter", "Family Pack Dosa Combo", "Andhra Meals", 
  "Chettinad Special Thali", "Kerala Sadya", "Hotel Saravana Bhavan Special Dosa", 
  "Madurai Special Mutton Curry", "Chennai Filter Coffee Combo", 
  "South Indian Breakfast Buffet", "Special Sunday Brunch Thali", 
  "Cafe Filter Coffee & Snacks Combo", "Tiffin Center Special", 
  "Kongunadu Special Meals", "Ghee Roast Dosa Special", "Onion Rava Masala Dosa", 
  "Paneer Dosa (fusion)", "Schezwan Dosa (fusion)", "Cheese Dosa (fusion café style)", 
  "Mini Idli Sambar Bowl (café style)", "South Indian Filter Coffee Float", 
  "Madras Curry Special", "Hyderabadi-South Indian Fusion Biryani"
];

// Helper to convert item name to slug (e.g. "Mini Idli" -> "mini_idli")
function getSlug(name) {
  return name.toLowerCase()
    .replace(/\(.*?\)/g, '') // remove parenthetical remarks
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// 1x1 transparent PNG base64
const placeholderPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

async function run() {
  console.log("Starting asset reorganization...");
  
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory does not exist: ${srcDir}`);
    process.exit(1);
  }

  // Create store directories
  if (!fs.existsSync(publicStoreDir)) {
    fs.mkdirSync(publicStoreDir, { recursive: true });
  }
  if (!fs.existsSync(rootStoreDir)) {
    fs.mkdirSync(rootStoreDir, { recursive: true });
  }

  // Read subfolders in source directory
  const folders = fs.readdirSync(srcDir);
  const folderMapping = {};

  for (const folder of folders) {
    const fullPath = path.join(srcDir, folder);
    if (!fs.statSync(fullPath).isDirectory()) continue;

    // Determine simplified clean name
    let cleanName = folder;
    
    // Clean up typical prefixes
    cleanName = cleanName.replace(/^(cinematic_food_photography_of_|high_end_food_photography_of_|high_end_photography_of_|professional_food_photography_of_|premium_food_photography_of_a_|ultra_realistic_authentic_south_indian_|cinematic_lifestyle_photography_of_)/, '');
    
    // Clean up typical suffixes
    cleanName = cleanName.replace(/(_premium_restaurant_plating|_healthy_green_colored|_extra_crispy_lacy_and_golden_brown|_a_rich_golden_brown|_two_crispy_medu_vadas_completely|_a_traditional|_steamed_semolina_cakes_with_visible|_two_soft_fluffy|_soft_lentil_vadas_soaked_in_thick_creamy|_a_stack_of_three_soft_spongy_and_fluffy_small|_an|_golden|_spicy_creamy_rice_dish_with|_spiced|_fluffy_white_rice_mixed_with|_soft_white_rice_mixed|_mildly_spiced_rice_cooked_in_pure|_vibrant_yellow_turmeric_flavored|_three_crispy_deep_fried_lentil|_bite_sized_soft_white|_rich_spiced_basmati_rice_with|_crispy_golden_rice_crepe_topped|_an_extra_thin_large_and_perfectly|_tangy_dark_colored|_spicy_red_rice_cooked_with|_a_savory_semolina_porridge_cooked_with|_thick_soft_rice_pancakes_topped_with|_aromatic_long_grain_basmati|_a_savory_creamy_rice_and_moong_dal|_caf_style_premium|_fusion_premium_restaurant|_special_premium)$/, '');

    // User's specific overrides:
    // Pesarattu/Green Gram Dosa -> green_gram_dosa
    if (cleanName.includes('pesarattu') || cleanName.includes('green_gram_dosa')) {
      cleanName = 'green_gram_dosa';
    }

    const renamedPath = path.join(srcDir, cleanName);
    
    if (fullPath !== renamedPath) {
      if (fs.existsSync(renamedPath)) {
        // Folder already exists, merge or skip rename
        console.log(`Folder ${cleanName} already exists, skipping rename...`);
      } else {
        console.log(`Renaming: ${folder} -> ${cleanName}`);
        fs.renameSync(fullPath, renamedPath);
      }
    }
    
    folderMapping[cleanName] = renamedPath;
  }

  // Now process all 175 items
  console.log("\nProcessing all 175 items...");
  const mappingJson = {};

  items.forEach((item, index) => {
    const idx = index + 1;
    let slug = getSlug(item);
    
    // Override for green gram dosa / pesarattu
    if (slug === 'green_gram_dosa' || slug === 'pesarattu') {
      slug = 'green_gram_dosa';
    }
    
    const targetPngName = `${slug}.png`;
    const targetPublicPath = path.join(publicStoreDir, targetPngName);
    const targetRootPath = path.join(rootStoreDir, targetPngName);
    
    // Find matching folder
    let matchFound = false;
    let matchedFolder = slug;

    // Check directly
    if (folderMapping[slug] && fs.existsSync(path.join(srcDir, slug, 'screen.png'))) {
      matchFound = true;
    } else {
      // Look for a close match in folder keys
      const keys = Object.keys(folderMapping);
      const match = keys.find(k => k === slug || k.replace(/_/g, '') === slug.replace(/_/g, '') || slug.includes(k) || k.includes(slug));
      if (match && fs.existsSync(path.join(srcDir, match, 'screen.png'))) {
        matchFound = true;
        matchedFolder = match;
      }
    }

    if (matchFound) {
      const sourceImage = path.join(srcDir, matchedFolder, 'screen.png');
      console.log(`[Item ${idx}] MATCH FOUND for "${item}": copying screen.png to ${targetPngName}`);
      fs.copyFileSync(sourceImage, targetPublicPath);
      fs.copyFileSync(sourceImage, targetRootPath);
    } else {
      console.log(`[Item ${idx}] NO MATCH for "${item}": generating placeholder ${targetPngName}`);
      fs.writeFileSync(targetPublicPath, placeholderPng);
      fs.writeFileSync(targetRootPath, placeholderPng);
    }

    mappingJson[idx] = {
      name: item,
      slug: slug,
      filename: targetPngName,
      has_real_image: matchFound
    };
  });

  // Write mapping JSON
  fs.writeFileSync(
    path.join(publicStoreDir, 'items_mapping.json'),
    JSON.stringify(mappingJson, null, 2)
  );

  console.log("\nReorganization complete! 175 images successfully created/copied in both public/store/ and store/.");
}

run().catch(err => {
  console.error("Error running script:", err);
  process.exit(1);
});
