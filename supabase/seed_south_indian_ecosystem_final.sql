-- Zappy South Indian Ecosystem Final Seed
-- This script seeds the missing South Indian categories and items for the recommendation engine.

DO $$
DECLARE
    rest_id UUID;
    cat_chutneys_id UUID;
    cat_sides_id UUID;
    cat_addons_id UUID;
    cat_mini_sides_id UUID;
BEGIN
    -- Get the first restaurant ID (adjust if needed for multi-tenant)
    SELECT id INTO rest_id FROM restaurants LIMIT 1;

    IF rest_id IS NULL THEN
        RAISE NOTICE 'No restaurant found. Please create a restaurant first.';
        RETURN;
    END IF;

    -- 1. Create Categories
    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Chutneys', rest_id, 10, true)
    ON CONFLICT (name, restaurant_id) DO UPDATE SET is_active = true
    RETURNING id INTO cat_chutneys_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Sides', rest_id, 11, true)
    ON CONFLICT (name, restaurant_id) DO UPDATE SET is_active = true
    RETURNING id INTO cat_sides_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Add-ons', rest_id, 12, true)
    ON CONFLICT (name, restaurant_id) DO UPDATE SET is_active = true
    RETURNING id INTO cat_addons_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Mini Sides', rest_id, 13, true)
    ON CONFLICT (name, restaurant_id) DO UPDATE SET is_active = true
    RETURNING id INTO cat_mini_sides_id;

    -- 2. Seed Chutneys
    INSERT INTO menu_items (restaurant_id, category_id, name, slug, description, price, is_vegetarian, spicy_level, tags, image_url, image_prompt)
    VALUES 
    (rest_id, cat_chutneys_id, 'Coconut Chutney', 'coconut_chutney', 'Freshly grated coconut tempered with mustard seeds and curry leaves.', 20.00, true, 1, ARRAY['coconut', 'dosa-side', 'breakfast'], 'file:///C:/Users/Rishi/.gemini/antigravity/brain/221a5b8e-d357-4009-b616-487215f20025/coconut_chutney_premium_1778950533513.png', 'Coconut chutney in brass bowl with curry leaves tempering beside crispy dosa on banana leaf, authentic South Indian restaurant photography, warm cinematic lighting, ultra realistic'),
    (rest_id, cat_chutneys_id, 'Tomato Chutney', 'tomato_chutney', 'Tangy and spicy tomato-based chutney with a hint of garlic.', 20.00, true, 2, ARRAY['tomato', 'tangy', 'dosa-side'], 'file:///C:/Users/Rishi/.gemini/antigravity/brain/221a5b8e-d357-4009-b616-487215f20025/tomato_chutney_premium_1778950553205.png', 'Vibrant orange-red Tomato chutney in a traditional brass bowl, tempered with mustard seeds and curry leaves, on a banana leaf, authentic South Indian restaurant photography'),
    (rest_id, cat_chutneys_id, 'Kara Chutney', 'kara_chutney', 'Extra spicy red chutney made with red chillies and shallots.', 25.00, true, 3, ARRAY['spicy', 'kara', 'red-chutney'], 'file:///C:/Users/Rishi/.gemini/antigravity/brain/221a5b8e-d357-4009-b616-487215f20025/kara_chutney_premium_1778950857441.png', 'Spicy red Kara Chutney served in a small brass bowl with curry leaves tempering, beside crispy dosa on banana leaf, authentic South Indian restaurant photography'),
    (rest_id, cat_chutneys_id, 'Onion Chutney', 'onion_chutney', 'Sweet and savory caramelized onion chutney.', 25.00, true, 1, ARRAY['onion', 'savory'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Reddish-brown onion chutney in a small bowl, South Indian style'),
    (rest_id, cat_chutneys_id, 'Peanut Chutney', 'peanut_chutney', 'Creamy and nutty chutney made from roasted peanuts.', 25.00, true, 1, ARRAY['peanut', 'nutty', 'creamy'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Creamy peanut chutney in a small bowl, South Indian style'),
    (rest_id, cat_chutneys_id, 'Mint Chutney', 'mint_chutney', 'Refreshing green chutney with mint and coriander.', 20.00, true, 2, ARRAY['mint', 'fresh', 'green'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Vibrant green mint chutney in a brass bowl, South Indian style'),
    (rest_id, cat_chutneys_id, 'Garlic Chutney', 'garlic_chutney', 'Intense garlic flavor with a spicy red chili base.', 25.00, true, 3, ARRAY['garlic', 'spicy'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Garlic red chutney in a small bowl'),
    (rest_id, cat_chutneys_id, 'Curry Leaf Chutney', 'curry_leaf_chutney', 'Aromatic and healthy chutney made from fresh curry leaves.', 20.00, true, 1, ARRAY['curry-leaf', 'healthy'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Dark green curry leaf chutney'),
    (rest_id, cat_chutneys_id, 'Coriander Chutney', 'coriander_chutney', 'Fresh coriander leaves blended with green chillies and coconut.', 20.00, true, 2, ARRAY['coriander', 'fresh'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Fresh green coriander chutney'),
    (rest_id, cat_chutneys_id, 'Beetroot Chutney', 'beetroot_chutney', 'Vibrant pink chutney with the sweetness of beetroot and spice of chillies.', 30.00, true, 1, ARRAY['beetroot', 'pink', 'healthy'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Vibrant pink beetroot chutney'),
    (rest_id, cat_chutneys_id, 'Green Chilli Chutney', 'green_chilli_chutney', 'Hot and fiery chutney for spice lovers.', 20.00, true, 3, ARRAY['spicy', 'green-chilli'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Fiery green chilli chutney'),
    (rest_id, cat_chutneys_id, 'Hotel Style Red Chutney', 'hotel_style_red_chutney', 'Smooth and creamy red chutney typical of South Indian hotels.', 25.00, true, 2, ARRAY['hotel-style', 'classic'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Smooth hotel style red chutney');

    -- 3. Seed Sides
    INSERT INTO menu_items (restaurant_id, category_id, name, slug, description, price, is_vegetarian, spicy_level, tags, image_url, image_prompt)
    VALUES 
    (rest_id, cat_sides_id, 'Tiffin Sambar', 'tiffin_sambar', 'Aromatic lentil stew made with fresh sambar powder.', 30.00, true, 1, ARRAY['sambar', 'essential'], 'file:///C:/Users/Rishi/.gemini/antigravity/brain/221a5b8e-d357-4009-b616-487215f20025/tiffin_sambar_premium_1778950775250.png', 'Hot Tiffin Sambar in a brass bowl with floating drumstick and shallots, South Indian restaurant photography'),
    (rest_id, cat_sides_id, 'Mini Sambar Bowl', 'mini_sambar_bowl', 'Smaller portion of our delicious tiffin sambar.', 25.00, true, 1, ARRAY['sambar', 'mini'], 'file:///C:/Users/Rishi/.gemini/antigravity/brain/221a5b8e-d357-4009-b616-487215f20025/tiffin_sambar_premium_1778950775250.png', 'Mini sambar bowl'),
    (rest_id, cat_sides_id, 'Onion Sambar', 'onion_sambar', 'Sambar enriched with the sweetness of small onions (shallots).', 35.00, true, 1, ARRAY['sambar', 'onion'], 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80', 'Onion sambar with whole shallots'),
    (rest_id, cat_sides_id, 'Drumstick Sambar', 'drumstick_sambar', 'Traditional sambar with tender drumsticks.', 40.00, true, 1, ARRAY['sambar', 'drumstick'], 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80', 'Drumstick sambar');,
    (rest_id, cat_sides_id, 'Rasam Cup', 'rasam_cup', 'Spicy and tangy tomato-pepper soup.', 25.00, true, 2, ARRAY['rasam', 'tangy', 'soup'], 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=500&q=80', 'Clear rasam in a steel tumbler'),
    (rest_id, cat_sides_id, 'Potato Masala', 'potato_masala', 'Classic yellow potato filling for dosa.', 30.00, true, 1, ARRAY['potato', 'masala'], 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', 'Yellow potato masala'),
    (rest_id, cat_sides_id, 'Vegetable Kurma', 'vegetable_kurma', 'Mixed vegetables in a creamy coconut gravy.', 40.00, true, 1, ARRAY['kurma', 'creamy', 'veg'], 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', 'White vegetable kurma'),
    (rest_id, cat_sides_id, 'White Kurma', 'white_kurma', 'Rich and mild white gravy with coconut and cashews.', 45.00, true, 1, ARRAY['kurma', 'white', 'mild'], 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', 'Rich white kurma');

    -- 4. Seed Add-ons
    INSERT INTO menu_items (restaurant_id, category_id, name, slug, description, price, is_vegetarian, spicy_level, tags, image_url, image_prompt)
    VALUES 
    (rest_id, cat_addons_id, 'Ghee Podi', 'ghee_podi', 'Spicy gun powder mixed with pure desi ghee.', 20.00, true, 2, ARRAY['podi', 'ghee', 'spicy'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Ghee podi in a small bowl'),
    (rest_id, cat_addons_id, 'Milagai Podi', 'milagai_podi', 'Traditional spicy lentil powder.', 20.00, true, 3, ARRAY['podi', 'spicy'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Spicy milagai podi'),
    (rest_id, cat_addons_id, 'Curry Leaf Podi', 'curry_leaf_podi', 'Healthy and aromatic curry leaf powder.', 25.00, true, 2, ARRAY['podi', 'curry-leaf'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Curry leaf podi'),
    (rest_id, cat_addons_id, 'Garlic Podi', 'garlic_podi', 'Gun powder with a strong garlic kick.', 25.00, true, 3, ARRAY['podi', 'garlic', 'spicy'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Garlic podi'),
    (rest_id, cat_addons_id, 'Gun Powder', 'gun_powder', 'The classic fiery lentil and chili powder.', 20.00, true, 3, ARRAY['podi', 'spicy', 'gun-powder'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Fiery gun powder'),
    (rest_id, cat_addons_id, 'Extra Ghee', 'extra_ghee', 'A generous drizzle of pure melted ghee.', 15.00, true, 0, ARRAY['ghee', 'rich'], 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80', 'Melted ghee in a small spoon'),
    (rest_id, cat_addons_id, 'Extra Chutney', 'extra_chutney', 'An extra serving of our house-made chutney.', 15.00, true, 1, ARRAY['chutney', 'addon'], 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&q=80', 'Extra chutney cup'),
    (rest_id, cat_addons_id, 'Extra Sambar', 'extra_sambar', 'An extra bowl of piping hot sambar.', 20.00, true, 1, ARRAY['sambar', 'addon'], 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80', 'Extra sambar bowl');

    -- 5. Seed Mini Sides
    INSERT INTO menu_items (restaurant_id, category_id, name, slug, description, price, is_vegetarian, spicy_level, tags, image_url, image_prompt)
    VALUES 
    (rest_id, cat_mini_sides_id, 'Mini Idli', 'mini_idli', '14 bite-sized button idlis served with sambar.', 45.00, true, 1, ARRAY['idli', 'mini', 'steamed'], 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500&q=80', 'Mini button idlis in sambar'),
    (rest_id, cat_mini_sides_id, 'Mini Medu Vada', 'mini_medu_vada', 'Small crispy lentil donuts.', 35.00, true, 2, ARRAY['vada', 'mini', 'crispy'], 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', 'Mini medu vada'),
    (rest_id, cat_mini_sides_id, 'Kuzhi Paniyaram', 'kuzhi_paniyaram', 'Crispy and fluffy pan-fried dumplings.', 70.00, true, 1, ARRAY['paniyaram', 'crispy'], 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', 'Golden brown paniyaram'),
    (rest_id, cat_mini_sides_id, 'Sweet Paniyaram', 'sweet_paniyaram', 'Sweet dumplings made with jaggery and cardamom.', 75.00, true, 0, ARRAY['paniyaram', 'sweet'], 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=500&q=80', 'Dark brown sweet paniyaram'),
    (rest_id, cat_mini_sides_id, 'Mini Pongal', 'mini_pongal', 'A small portion of our ghee-rich ven pongal.', 50.00, true, 1, ARRAY['pongal', 'mini'], 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', 'Mini pongal portion'),
    (rest_id, cat_mini_sides_id, 'Mini Uthappam', 'mini_uthappam', 'Small thick pancakes topped with onions and carrots.', 60.00, true, 1, ARRAY['uthappam', 'mini'], 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', 'Mini onion uthappam');

END $$;
