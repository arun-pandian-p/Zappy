-- Zappy Menu Items Seed Data
-- This script contains 20 authentic, unique South Indian restaurant menu items.
-- Ensure you replace 'RESTAURANT_ID_HERE' with your actual tenant/restaurant UUID if applicable.

INSERT INTO menu_items (
    name, slug, category, subcategory, description, price, is_veg, spice_level, 
    preparation_time, rating, tags, recommended_with, image_url, image_prompt, badges
) VALUES 
-- 1. DOSA VARIETIES
(
    'Mysore Masala Dosa', 'mysore-masala-dosa', 'Dosa', 'Special Dosa',
    'Crispy golden dosa smeared with a spicy fiery red garlic-red chilli paste, folded over a savory potato masala. Served with fresh coconut chutney and piping hot sambar.',
    140.00, true, 'high', 15, 4.8,
    ARRAY['spicy', 'dosa', 'crispy', 'breakfast', 'bestseller'],
    ARRAY['coconut_chutney', 'filter_coffee'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/mysore_masala_dosa_1778946646232.png',
    'Authentic Mysore Masala Dosa served on banana leaf with coconut chutney and sambar, crispy golden texture, red garlic paste spread inside, cinematic restaurant lighting, premium food photography, shallow depth of field, ultra realistic, 4k',
    ARRAY['Best Seller', 'Chef Special']
),
(
    'Rava Onion Dosa', 'rava-onion-dosa', 'Dosa', 'Rava Dosa',
    'Extra crispy, lacy semolina crepe generously studded with chopped onions, green chillies, and crushed black pepper. A light and crunchy delicacy.',
    120.00, true, 'medium', 12, 4.6,
    ARRAY['crispy', 'rava', 'onion', 'dosa', 'breakfast'],
    ARRAY['tomato_chutney', 'sambar'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/rava_onion_dosa_1778946662287.png',
    'Crispy Rava Onion Dosa served on a banana leaf, South Indian restaurant presentation, golden brown texture with visible onion pieces and cumin seeds, warm lighting, premium food photography, shallow depth of field, 4k',
    ARRAY['Customer Favorite']
),
(
    'Paneer Cheese Dosa', 'paneer-cheese-dosa', 'Dosa', 'Fusion Dosa',
    'A delightful fusion of South Indian and North Indian flavors. Crispy dosa filled with spiced grated paneer and melted mozzarella cheese.',
    170.00, true, 'medium', 15, 4.7,
    ARRAY['cheese', 'paneer', 'fusion', 'kids', 'dosa'],
    ARRAY['tomato_chutney', 'garlic_kara_chutney'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/paneer_cheese_dosa_1778946676690.png',
    'Delicious Paneer Cheese Dosa folded on a banana leaf, melted cheese and spiced paneer filling visible, served with chutneys, cinematic restaurant lighting, warm and inviting food styling, ultra realistic, 4k',
    ARRAY['Trending']
),
(
    'Podi Roast Dosa', 'podi-roast-dosa', 'Dosa', 'Special Dosa',
    'A classic thin and crispy dosa generously coated with spicy, aromatic gun powder (Idli Podi) and roasted with pure desi ghee.',
    130.00, true, 'high', 10, 4.9,
    ARRAY['spicy', 'podi', 'ghee', 'dosa'],
    ARRAY['coconut_chutney'],
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80',
    'Crispy golden Podi Roast Dosa sprinkled with red spicy gunpowder and ghee, served on banana leaf, premium restaurant photography, 4k',
    ARRAY['Chef Special']
),
(
    'Mushroom Pepper Dosa', 'mushroom-pepper-dosa', 'Dosa', 'Fusion Dosa',
    'A savory dosa stuffed with a peppery, intensely flavored mushroom Chettinad-style masala. Earthy, spicy, and deeply satisfying.',
    160.00, true, 'high', 18, 4.5,
    ARRAY['mushroom', 'pepper', 'spicy', 'dosa'],
    ARRAY['mint_chutney'],
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80',
    'Mushroom Pepper Dosa folded with visible dark brown pepper mushroom filling, banana leaf, warm restaurant lighting, 4k',
    ARRAY[]
),

-- 2. CHUTNEY VARIETIES
(
    'Beetroot Chutney', 'beetroot-chutney', 'Chutney', 'Special Chutney',
    'A vibrant, healthy, and lightly sweet-spicy chutney made from roasted beetroots, coconut, and tempered with mustard seeds.',
    40.00, true, 'mild', 5, 4.4,
    ARRAY['healthy', 'chutney', 'sweet_and_spicy', 'vegan'],
    ARRAY['idli', 'dosa'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/beetroot_chutney_1778946694289.png',
    'Vibrant pink Beetroot Chutney in a traditional brass bowl with mustard seed and curry leaf tempering, South Indian restaurant presentation, realistic food photography, warm lighting, detailed texture, 4k',
    ARRAY['Healthy Choice']
),
(
    'Garlic Kara Chutney', 'garlic-kara-chutney', 'Chutney', 'Spicy Chutney',
    'An intensely spicy and garlicky red chutney made with dried red chillies, garlic pods, and a touch of tamarind.',
    45.00, true, 'high', 5, 4.8,
    ARRAY['spicy', 'garlic', 'chutney', 'dip'],
    ARRAY['kuzhi_paniyaram', 'idli'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/garlic_kara_chutney_1778946708513.png',
    'Spicy red Garlic Kara Chutney in a small brass bowl, tempered with mustard seeds and curry leaves, rustic wooden table background, South Indian restaurant presentation, premium food styling, 4k',
    ARRAY['Trending']
),
(
    'Peanut Chutney', 'peanut-chutney', 'Chutney', 'Special Chutney',
    'A creamy, nutty, and mildly spiced accompaniment made from roasted peanuts, green chillies, and tamarind.',
    40.00, true, 'medium', 5, 4.5,
    ARRAY['nutty', 'chutney', 'creamy', 'dip'],
    ARRAY['rava_dosa', 'paniyaram'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Creamy Peanut Chutney in a small white ceramic bowl with tempering, South Indian restaurant presentation, premium food styling, 4k',
    ARRAY[]
),

-- 3. BREAKFAST / TIFFIN
(
    'Kuzhi Paniyaram', 'kuzhi-paniyaram', 'Breakfast', 'Tiffin',
    'Crispy on the outside, fluffy on the inside. These fermented rice and lentil dumplings are pan-fried in a special cast-iron pan with tempering.',
    90.00, true, 'medium', 15, 4.7,
    ARRAY['crispy', 'dumpling', 'breakfast', 'snack'],
    ARRAY['garlic_kara_chutney'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/kuzhi_paniyaram_1778946726030.png',
    'Golden brown crispy Kuzhi Paniyaram served on a banana leaf with tomato and coconut chutney, steaming hot, South Indian breakfast, cinematic restaurant lighting, premium food photography, 4k',
    ARRAY['Customer Favorite']
),
(
    'Kanchipuram Idli', 'kanchipuram-idli', 'Breakfast', 'Idli',
    'A heritage recipe from Kanchipuram. Spiced idlis steamed in mandharai leaves, flavored with dry ginger, cumin, pepper, and pure ghee.',
    80.00, true, 'medium', 15, 4.8,
    ARRAY['steamed', 'healthy', 'spiced', 'heritage'],
    ARRAY['sambar', 'coconut_chutney'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/kanchipuram_idli_1778946740443.png',
    'Authentic Kanchipuram Idli steamed in a banana leaf cup, spiced with black pepper and cumin, served with sambar, rustic traditional setting, premium food photography, warm lighting, 4k',
    ARRAY['Chef Special']
),
(
    'Mini Idli Sambar', 'mini-idli-sambar', 'Breakfast', 'Idli',
    'A comforting bowl of 14 bite-sized, feather-light mini idlis completely submerged in piping hot, flavorful tiffin sambar, topped with ghee.',
    110.00, true, 'mild', 10, 4.9,
    ARRAY['comfort_food', 'idli', 'sambar', 'ghee'],
    ARRAY['filter_coffee'],
    'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&q=80',
    'Mini button idlis submerged in a bowl of rich red sambar, floating ghee on top, South Indian restaurant presentation, 4k',
    ARRAY['Best Seller']
),
(
    'Adai Avial', 'adai-avial', 'Breakfast', 'Special Tiffin',
    'A protein-rich, savory multi-lentil pancake (Adai) served with Avial, a thick coconut-based mixed vegetable stew. A traditional Kerala/Tamil Nadu delicacy.',
    140.00, true, 'medium', 20, 4.6,
    ARRAY['protein', 'healthy', 'traditional', 'stew'],
    ARRAY['jaggery'],
    'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&q=80',
    'Thick Adai lentil pancake served with creamy mixed vegetable Avial, South Indian traditional food photography, 4k',
    ARRAY['Healthy Choice']
),

-- 4. MAIN COURSE
(
    'Paneer Chettinad', 'paneer-chettinad', 'Main Course', 'Vegetarian Gravy',
    'Soft paneer cubes simmered in a deeply aromatic, freshly ground Chettinad spice paste made with star anise, stone flower, and roasted coconut.',
    220.00, true, 'high', 25, 4.7,
    ARRAY['spicy', 'paneer', 'gravy', 'chettinad'],
    ARRAY['paratha', 'ghee_rice'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/paneer_chettinad_1778946755697.png',
    'Spicy Paneer Chettinad curry in a traditional clay pot, rich dark brown gravy with fresh coriander garnish, South Indian spices, served with parotta, warm restaurant lighting, premium food photography, 4k',
    ARRAY['Trending']
),
(
    'Kara Kuzhambu', 'kara-kuzhambu', 'Main Course', 'South Indian Curry',
    'A fiery and tangy tamarind-based village-style curry cooked with whole garlic pods, shallots, and sun-dried turkey berries (sundakkai).',
    180.00, true, 'high', 20, 4.5,
    ARRAY['tangy', 'spicy', 'curry', 'traditional'],
    ARRAY['steamed_rice', 'papad'],
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80',
    'Traditional tangy Kara Kuzhambu in an earthen pot, South Indian tamarind and garlic curry, rich red color with oil floating on top, served with steamed rice, cinematic restaurant lighting, 4k',
    ARRAY['Chef Special']
),
(
    'Mushroom Curry', 'mushroom-curry', 'Main Course', 'Vegetarian Gravy',
    'Fresh button mushrooms cooked in a rich, coconut and cashew-based gravy infused with coastal South Indian spices.',
    200.00, true, 'medium', 20, 4.6,
    ARRAY['mushroom', 'curry', 'creamy', 'south_indian'],
    ARRAY['paratha', 'jeera_rice'],
    'https://images.unsplash.com/photo-1548943487-a2e4d43b4850?auto=format&fit=crop&q=80',
    'Rich creamy Mushroom curry in a copper bowl, garnished with cilantro, South Indian style, restaurant photography, 4k',
    ARRAY[]
),

-- 5. DRINKS
(
    'Rose Milk', 'rose-milk', 'Drinks', 'Cold Beverage',
    'A refreshing, vibrantly pink chilled milk beverage infused with aromatic rose syrup. A quintessential summer cooler.',
    70.00, true, 'mild', 5, 4.8,
    ARRAY['cold', 'sweet', 'refreshing', 'milk'],
    ARRAY[],
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80',
    'Chilled vibrant pink Rose Milk in a tall glass, condensation on the glass, garnished with edible rose petals, dark moody background, premium beverage photography, cinematic lighting, 4k',
    ARRAY['Customer Favorite']
),
(
    'Jigarthanda', 'jigarthanda', 'Drinks', 'Dessert Drink',
    'The pride of Madurai. A rich, layered dessert drink made with milk, almond gum (badam pisin), nannari syrup, and topped with special ice cream.',
    120.00, true, 'mild', 10, 4.9,
    ARRAY['cold', 'sweet', 'rich', 'dessert', 'madurai'],
    ARRAY[],
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80',
    'Authentic Madurai Jigarthanda dessert drink in a traditional glass, layers of almond gum, nannari syrup, milk, topped with ice cream, condensation, warm restaurant lighting, premium food photography, 4k',
    ARRAY['Chef Special', 'Trending']
),
(
    'Nannari Sarbath', 'nannari-sarbath', 'Drinks', 'Cold Beverage',
    'A traditional South Indian herbal cooler made from the roots of the Indian Sarsaparilla (Nannari) plant, mixed with fresh lime juice and chilled water.',
    60.00, true, 'mild', 5, 4.5,
    ARRAY['cold', 'herbal', 'refreshing', 'summer'],
    ARRAY[],
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80',
    'Nannari Sarbath in a tall glass with ice cubes and lemon wedges, golden amber color, summer drink photography, 4k',
    ARRAY[]
),

-- 6. DESSERTS
(
    'Elaneer Payasam', 'elaneer-payasam', 'Dessert', 'Payasam',
    'A divine, creamy pudding made with pure tender coconut water, tender coconut pulp, and reduced milk. Served chilled.',
    140.00, true, 'mild', 10, 4.9,
    ARRAY['sweet', 'creamy', 'coconut', 'chilled', 'dessert'],
    ARRAY[],
    'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&q=80',
    'Creamy Elaneer Payasam (Tender Coconut Kheer) served in a halved coconut shell, garnished with roasted cashews and saffron, South Indian dessert, premium food styling, cinematic lighting, 4k',
    ARRAY['Best Seller', 'Chef Special']
),
(
    'Badam Halwa', 'badam-halwa', 'Dessert', 'Halwa',
    'A luxurious, melt-in-the-mouth sweet made entirely from blanched almonds, pure desi ghee, and saffron strands.',
    180.00, true, 'mild', 5, 4.7,
    ARRAY['sweet', 'rich', 'almond', 'ghee', 'dessert'],
    ARRAY[],
    'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&q=80',
    'Rich golden Badam Halwa garnished with saffron and almonds in a small silver bowl, premium Indian sweets photography, 4k',
    ARRAY['Premium']
);

-- COMBOS 
INSERT INTO menu_items (
    name, slug, category, subcategory, description, price, is_veg, spice_level, 
    preparation_time, rating, tags, recommended_with, image_url, image_prompt, badges
) VALUES 
(
    'South Indian Mini Tiffin', 'south-indian-mini-tiffin', 'Combos', 'Breakfast Combo',
    'The ultimate breakfast experience: 1 Mini Masala Dosa, 1 Fluffy Idli, 1 Medu Vada, a sweet (Kesari), and a cup of aromatic Filter Coffee.',
    220.00, true, 'medium', 20, 4.9,
    ARRAY['combo', 'breakfast', 'value', 'assorted'],
    ARRAY[],
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80',
    'South Indian Mini Tiffin platter on a banana leaf, containing mini dosa, idli, vada, kesari, and a small steel tumbler of filter coffee, premium restaurant food photography, 4k',
    ARRAY['Best Value', 'Customer Favorite']
);
