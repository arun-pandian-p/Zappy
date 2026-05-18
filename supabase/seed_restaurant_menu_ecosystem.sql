-- Zappy Indian Restaurant Menu Ecosystem Seed
-- Generates a fully realistic 10-category, 100-item authentic Indian restaurant menu.
-- Includes robust Addon Groups, Addon Options, Variant Groups, Variant Options, and AI recommendation structures.

DO $$
DECLARE
    rest_id UUID;
    
    -- Category IDs
    cat_bf_id UUID;
    cat_mc_id UUID;
    cat_by_id UUID;
    cat_pz_id UUID;
    cat_st_id UUID;
    cat_sp_id UUID;
    cat_ch_id UUID;
    cat_ds_id UUID;
    cat_bv_id UUID;
    cat_sf_id UUID;
    
    -- Addon Group IDs
    ag_chutneys_id UUID;
    ag_sambar_id UUID;
    ag_ghee_id UUID;
    ag_eggs_id UUID;
    ag_biryani_sides_id UUID;
    ag_extra_meat_id UUID;
    ag_fries_id UUID;
    ag_extra_cheese_id UUID;
    ag_chaat_sides_id UUID;
    
    -- Menu Item temporary holders for variants
    mi_idli_id UUID;
    mi_dosa_id UUID;
    mi_biryani_id UUID;
    mi_pizza_id UUID;
    mi_noodles_id UUID;
    mi_burger_id UUID;
    mi_puri_id UUID;
    
    -- Variant Group IDs
    vg_idli_qty_id UUID;
    vg_dosa_type_id UUID;
    vg_biryani_portion_id UUID;
    vg_pizza_size_id UUID;
    vg_noodles_spice_id UUID;
    
BEGIN
    -- 1. Locate or create active restaurant
    SELECT id INTO rest_id FROM restaurants ORDER BY created_at ASC LIMIT 1;
    
    IF rest_id IS NULL THEN
        INSERT INTO restaurants (name, slug, description, primary_color, secondary_color, is_active)
        VALUES ('Zappy Indian Spice', 'zappy-indian-spice', 'Authentic premium Indian dining and street food delicacies.', '#008c4a', '#EAB308', true)
        RETURNING id INTO rest_id;
    END IF;
    
    -- 2. Clean up existing menu data for this restaurant to avoid duplicate keys/orphans
    DELETE FROM menu_items WHERE restaurant_id = rest_id;
    DELETE FROM categories WHERE restaurant_id = rest_id;
    DELETE FROM addon_groups WHERE restaurant_id = rest_id;

    -- 3. Create Addon Groups
    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Accompaniment Chutneys', 0, 3, 1)
    RETURNING id INTO ag_chutneys_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_chutneys_id, 'Extra Coconut Chutney', 15.00, true, 1),
    (ag_chutneys_id, 'Extra Tomato Chutney', 15.00, true, 2),
    (ag_chutneys_id, 'Extra Mint Chutney', 15.00, true, 3);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Sambar Delights', 0, 1, 2)
    RETURNING id INTO ag_sambar_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_sambar_id, 'Extra Piping Hot Sambar', 20.00, true, 1),
    (ag_sambar_id, 'Medu Vada (1 pc)', 35.00, true, 2);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Rich Desi Ghee Drizzle', 0, 1, 3)
    RETURNING id INTO ag_ghee_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_ghee_id, 'Pure Cow Ghee Splash', 25.00, true, 1);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Egg & Salan Addons', 0, 2, 4)
    RETURNING id INTO ag_eggs_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_eggs_id, 'Boiled Egg (1 pc)', 15.00, true, 1),
    (ag_eggs_id, 'Extra Mirchi Ka Salan', 30.00, true, 2);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Biryani Enhancers', 0, 2, 5)
    RETURNING id INTO ag_biryani_sides_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_biryani_sides_id, 'Extra Creamy Cucumber Raita', 20.00, true, 1),
    (ag_biryani_sides_id, 'Spicy Brinjal Curry', 35.00, true, 2);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Extra Portion Meat', 0, 1, 6)
    RETURNING id INTO ag_extra_meat_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_extra_meat_id, 'Extra Chicken Pieces (2 pcs)', 70.00, true, 1),
    (ag_extra_meat_id, 'Extra Mutton Chunks (2 pcs)', 110.00, true, 2);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Snacks & Fries Sides', 0, 2, 7)
    RETURNING id INTO ag_fries_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_fries_id, 'Masala Fries Small', 60.00, true, 1),
    (ag_fries_id, 'Garlic Mayonnaise Dip', 20.00, true, 2);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Extra Cheese Top-ups', 0, 1, 8)
    RETURNING id INTO ag_extra_cheese_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_extra_cheese_id, 'Extra Mozzarella Layer', 50.00, true, 1);

    INSERT INTO addon_groups (restaurant_id, name, min_select, max_select, display_order)
    VALUES (rest_id, 'Street Food Dips', 0, 3, 9)
    RETURNING id INTO ag_chaat_sides_id;

    INSERT INTO addon_options (addon_group_id, name, price, is_available, display_order) VALUES
    (ag_chaat_sides_id, 'Sweet Tamarind Chutney', 10.00, true, 1),
    (ag_chaat_sides_id, 'Fiery Spicy Mint Water', 10.00, true, 2),
    (ag_chaat_sides_id, 'Nylon Sev Sprinkle', 10.00, true, 3);


    -- 4. Create 10 categories
    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Breakfast', rest_id, 1, true) RETURNING id INTO cat_bf_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Main Course', rest_id, 2, true) RETURNING id INTO cat_mc_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Biryani', rest_id, 3, true) RETURNING id INTO cat_by_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Pizza', rest_id, 4, true) RETURNING id INTO cat_pz_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Starters', rest_id, 5, true) RETURNING id INTO cat_st_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Soups', rest_id, 6, true) RETURNING id INTO cat_sp_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Chinese', rest_id, 7, true) RETURNING id INTO cat_ch_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Desserts', rest_id, 8, true) RETURNING id INTO cat_ds_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Beverages', rest_id, 9, true) RETURNING id INTO cat_bv_id;

    INSERT INTO categories (name, restaurant_id, display_order, is_active)
    VALUES ('Street Food', rest_id, 10, true) RETURNING id INTO cat_sf_id;


    -- 5. Seed 10 dishes per category (100 total)
    
    -- ==========================================
    -- BREAKFAST CATEGORY (1-10)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_bf_id, 'Medu Vada Combo', 'Crispy golden fried lentil donuts with a soft, fluffy center. Served with hot sambar and coconut chutney.', 70.00, true, 2, 10, true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ARRAY['breakfast', 'vada', 'classic'], ARRAY[ag_chutneys_id::text, ag_sambar_id::text])
    RETURNING id INTO mi_idli_id;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_bf_id, 'Masala Dosa Classic', 'Thin, crispy golden rice crepe stuffed with spiced mashed potato bhaji. Served with sambar and house chutneys.', 110.00, true, 1, 12, true, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80', ARRAY['breakfast', 'dosa', 'popular'], ARRAY[ag_chutneys_id::text, ag_ghee_id::text, ag_sambar_id::text])
    RETURNING id INTO mi_dosa_id;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_bf_id, 'Idli Sambar Dipped', 'Two super-soft, pillowy steamed rice cakes dipped in piping hot aromatic tiffin sambar with a drizzle of ghee.', 80.00, true, 1, 8, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['breakfast', 'idli', 'healthy'], ARRAY[ag_chutneys_id::text, ag_ghee_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_bf_id, 'Ghee Podi Roast Dosa', 'Crispy golden dosa smeared with aromatic spicy karam podi (gunpowder) and rich desi cow ghee.', 130.00, true, 2, 10, false, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80', ARRAY['breakfast', 'dosa', 'spicy'], ARRAY[ag_chutneys_id::text, ag_ghee_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_bf_id, 'Lacy Rava Dosa', 'Lacy, ultra-crispy semolina crepe tempered with black pepper, cumin, ginger, and green chillies.', 120.00, true, 2, 15, false, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80', ARRAY['breakfast', 'dosa', 'crispy'], ARRAY[ag_chutneys_id::text, ag_sambar_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_bf_id, 'Golden Onion Uthappam', 'Thick, soft rice pancake topped with fresh chopped onions, green chillies, and fresh coriander.', 110.00, true, 1, 12, false, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ARRAY['breakfast', 'uthappam'], ARRAY[ag_chutneys_id::text, ag_sambar_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_bf_id, 'Delhi Poori Bhaji', 'Two fluffy, deep-fried whole wheat puffed breads served with mild potato masala and spicy pickle.', 90.00, true, 1, 10, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['breakfast', 'poori', 'classic'], ARRAY[ag_ghee_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bf_id, 'Stuffed Paneer Paratha', 'Flaky whole wheat bread stuffed with seasoned grated paneer, fresh herbs, and served with yogurt and butter.', 100.00, true, 1, 15, false, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&q=80', ARRAY['breakfast', 'paratha']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bf_id, 'Punjabi Aloo Paratha', 'Classic Punjabi griddled bread stuffed with spiced potato mash, served with rich butter and tangy mango pickle.', 80.00, true, 1, 12, true, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&q=80', ARRAY['breakfast', 'paratha', 'classic']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bf_id, 'Royal Chole Bhature', 'Huge, fluffy fried leavened bread served with rich, spicy chickpeas curry (chole), onions, and green chilies.', 140.00, true, 2, 14, true, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&q=80', ARRAY['breakfast', 'heavy', 'bestseller']);


    -- ==========================================
    -- MAIN COURSE CATEGORY (11-20)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Paneer Butter Masala', 'Succulent cubes of cottage cheese simmered in a rich, velvety tomato and cashew nut gravy finished with cream.', 260.00, true, 1, 15, true, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', ARRAY['main-course', 'paneer', 'creamy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_mc_id, 'Tandoori Butter Chicken', 'Tandoori grilled chicken chunks cooked in a rich, buttery, creamy tomato sauce with aromatic fenugreek leaves.', 320.00, false, 1, 18, true, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', ARRAY['main-course', 'chicken', 'bestseller'], ARRAY[ag_extra_meat_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Slow Cooked Dal Makhani', 'Slow-cooked black lentils simmered overnight with cream, butter, and tomatoes for that signature smoky richness.', 210.00, true, 1, 20, true, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80', ARRAY['main-course', 'dal', 'creamy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Stir Fried Kadhai Paneer', 'Paneer chunks stir-fried with bell peppers, onions, and freshly ground kadhai spices in a tangy tomato gravy.', 240.00, true, 2, 15, false, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', ARRAY['main-course', 'paneer', 'spicy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Chicken Tikka Masala', 'Smoky, clay-oven roasted chicken tikkas tossed in a thick, spicy, and tangy onion-tomato masala gravy.', 310.00, false, 2, 15, false, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', ARRAY['main-course', 'chicken', 'roasted']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_mc_id, 'Kashmiri Mutton Rogan Josh', 'A classic Kashmiri lamb delicacy cooked with a rich blend of traditional warm spices and yogurt.', 390.00, false, 2, 22, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', ARRAY['main-course', 'mutton', 'royal'], ARRAY[ag_extra_meat_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Royal Malai Kofta', 'Crispy fried cottage cheese and potato dumplings stuffed with dry fruits, simmered in a mild, sweetish white gravy.', 250.00, true, 1, 18, false, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', ARRAY['main-course', 'kofta', 'creamy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Bhindi Do Pyaza', 'Fresh okra stir-fried with plenty of onions, double-tossed with tangy, dry aromatic spices.', 180.00, true, 1, 12, false, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', ARRAY['main-course', 'okra', 'veg']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Ghee Garlic Dal Tadka', 'Creamy yellow lentils tempered with ghee, cumin seeds, garlic, dried red chillies, and fresh coriander.', 160.00, true, 1, 10, true, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80', ARRAY['main-course', 'dal', 'homestyle']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_mc_id, 'Aloo Gobi Adraki', 'Homestyle dry potato and cauliflower dish cooked with a dominant flavor of julienned fresh ginger and green chilies.', 170.00, true, 1, 12, false, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', ARRAY['main-course', 'aloo-gobi', 'veg']);


    -- ==========================================
    -- BIRYANI CATEGORY (21-30)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Hyderabadi Dum Biryani', 'Fragrant basmati rice layered with juicy, marinated chicken cooked on dum with saffron, ghee, and fresh mint.', 280.00, false, 2, 20, true, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'chicken', 'bestseller'], ARRAY[ag_eggs_id::text, ag_biryani_sides_id::text, ag_extra_meat_id::text])
    RETURNING id INTO mi_biryani_id;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Veg Dum Biryani Feast', 'Slow-cooked seasonal vegetables tossed in exotic handpicked spices, layered with long-grain basmati rice.', 220.00, true, 2, 18, true, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'veg', 'classic'], ARRAY[ag_biryani_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Paneer Tikka Dum Biryani', 'Charcoal-grilled paneer tikkas layered with aromatic basmati rice, caramelised onions, and saffron milk.', 250.00, true, 2, 18, false, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'paneer', 'tasty'], ARRAY[ag_biryani_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Egg Masala Dum Biryani', 'Boiled and pan-fried eggs cooked in a spicy masala gravy, layered with fragrant saffron rice and fried onions.', 200.00, false, 2, 15, false, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'egg'], ARRAY[ag_eggs_id::text, ag_biryani_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Special Mutton Dum Biryani', 'Melt-in-your-mouth tender mutton pieces marinated in spices and slow-cooked with basmati rice for maximum flavor.', 380.00, false, 2, 22, true, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'mutton', 'royal'], ARRAY[ag_biryani_sides_id::text, ag_extra_meat_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Kolkata Chicken Biryani', 'Subtly spiced fragrant rice cooked with succulent chicken, egg, and the signature soft, spiced slow-cooked potato.', 290.00, false, 1, 20, false, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'chicken', 'kolkata'], ARRAY[ag_eggs_id::text, ag_biryani_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Lucknowi Awadhi Mutton', 'A royal delicacy featuring rich, cardamon-infused mutton cooked in pure yakhni stock, layered with fine basmati.', 390.00, false, 1, 25, false, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'mutton', 'awadhi'], ARRAY[ag_biryani_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_by_id, 'Malabar Prawns Biryani', 'Fragrant short-grain Khyma rice cooked with spicy, tangy stir-fried prawns, finished with fried cashews.', 340.00, false, 2, 20, false, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'prawns', 'south']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_by_id, 'Aromatic Ghee Jeera Rice', 'Long grain basmati rice tossed in pure cow ghee and plenty of aromatic roasted cumin seeds.', 130.00, true, 0, 8, true, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80', ARRAY['rice', 'jeera', 'simple']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_by_id, 'Fiery Chicken 65 Biryani', 'Spicy and crunchy deep-fried Chicken 65 tossed in yogurt, layered with flavorful biryani rice.', 290.00, false, 3, 18, true, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', ARRAY['biryani', 'chicken', 'spicy'], ARRAY[ag_eggs_id::text, ag_biryani_sides_id::text]);


    -- ==========================================
    -- PIZZA CATEGORY (31-40)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Tandoori Chicken Pizza', 'Spicy clay-oven roasted chicken tikkas, onions, capsicum, and fresh coriander on a buttery tandoori-spiced sauce.', 340.00, false, 2, 15, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'chicken', 'fusion'], ARRAY[ag_extra_cheese_id::text])
    RETURNING id INTO mi_pizza_id;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Tandoori Paneer Pizza', 'Cubes of marinated paneer tikka, red bell peppers, onions, and jalapeños over creamy cheese and tandoori spread.', 310.00, true, 2, 15, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'paneer', 'classic'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Margherita Classic Pizza', 'Simply elegant featuring house-made rich tomato sauce, plenty of gooey mozzarella cheese, and fresh torn basil leaves.', 240.00, true, 0, 12, false, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'classic', 'veg'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Butter Chicken Pizza', 'Pulled juicy butter chicken, red onions, fresh coriander, and melted mozzarella over a sweet-and-smoky butter chicken base.', 360.00, false, 1, 16, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'chicken', 'bestseller'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Veggie Paradise Pizza', 'A colorful garden of baby corn, sweet corn, black olives, onions, capsicum, red paprika, and extra cheese.', 280.00, true, 1, 15, false, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'veg', 'loaded'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Spicy Triple Tango', 'Hot red paprika, golden sweet corn, and spicy jalapeños over a fiery chili-garlic tomato spread.', 290.00, true, 2, 14, false, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'spicy', 'corn'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Double Cheese Margherita', 'Loaded with double the quantity of pure liquid mozzarella cheese over our signature herb-spiced tomato base.', 280.00, true, 0, 12, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'cheese', 'heavy'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Keema Garlic Crust', 'Spiced minced mutton keema, garlic flakes, red onions, and mozzarella on a thick, garlic-infused golden crust.', 380.00, false, 2, 18, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'mutton', 'keema'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Tandoori Mushroom Delight', 'Smoky clay-oven roasted mushrooms, sweet onions, and capsicum with mozzarella cheese on a tandoori base.', 290.00, true, 1, 14, false, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'mushroom', 'veg'], ARRAY[ag_extra_cheese_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_pz_id, 'Supreme Chicken Meat Feast', 'The ultimate carnivore dream with chicken tikka, spicy chicken sausage, sliced salami, and minced keema.', 410.00, false, 2, 16, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', ARRAY['pizza', 'heavy', 'meat'], ARRAY[ag_extra_cheese_id::text]);


    -- ==========================================
    -- STARTERS CATEGORY (41-50)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Crispy Chicken 65', 'Juicy deep-fried chicken cubes tossed in a spicy, fiery yogurt and curry leaves marinade. Absolute bestseller.', 180.00, false, 3, 10, true, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80', ARRAY['starter', 'chicken', 'bestseller']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Paneer Tikka Charcoal', 'Chunks of cottage cheese marinated in spiced yogurt and grilled to a smoky golden in the clay oven.', 210.00, true, 1, 12, true, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', ARRAY['starter', 'paneer', 'classic']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Hara Bhara Kabab Duo', 'Crispy fried patties made of fresh spinach, green peas, potatoes, and mild aromatic spices, stuffed with cashews.', 150.00, true, 1, 10, false, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', ARRAY['starter', 'kabab', 'spinach']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Tandoori Chicken Claypot', 'Half bone-in chicken marinated in house tandoori masala and roasted to charcoal perfection in the clay oven.', 230.00, false, 2, 16, true, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80', ARRAY['starter', 'chicken', 'claypot']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Crispy Fish Koliwada', 'Crispy batter-fried fish fillets seasoned with Mumbai-style chili paste, carom seeds, and hot spices.', 280.00, false, 2, 12, false, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80', ARRAY['starter', 'fish', 'fried']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Mutton Seekh Kabab', 'Minced spiced lamb skewers grilled in the clay oven, served with green chutney and onion rings.', 320.00, false, 2, 15, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', ARRAY['starter', 'mutton', 'seekh']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Delhi Dahi Ke Kabab', 'Delicate, melt-in-your-mouth patties made of hung yogurt, paneer, and green cardamon, golden fried.', 180.00, true, 1, 12, false, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', ARRAY['starter', 'yogurt', 'soft']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Crispy Corn Pepper Salt', 'Deep fried sweet corn kernels tossed with finely chopped garlic, spring onions, and freshly ground black pepper.', 160.00, true, 1, 10, false, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80', ARRAY['starter', 'corn', 'chinese']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Chilli Garlic Crispy Potatoes', 'Crispy fried baby potatoes tossed in a sticky, sweet-and-spicy chili-garlic paste.', 140.00, true, 2, 10, false, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80', ARRAY['starter', 'potatoes', 'garlic']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_st_id, 'Chicken Seekh Kabab', 'Skewered minced chicken seasoned with herbs, mint, and garam spices, roasted over charcoal.', 240.00, false, 2, 14, false, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80', ARRAY['starter', 'chicken', 'kabab']);


    -- ==========================================
    -- SOUPS CATEGORY (51-60)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Rasam Tangy Souplet', 'A warm, thin, tangy South Indian soup prepared using sweet tamarind, tomato, black pepper, and cumin.', 60.00, true, 2, 8, true, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80', ARRAY['soup', 'rasam', 'digestive']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Velvety Tomato Soup', 'Rich and velvety fresh tomato soup finished with fresh cream, served with crispy buttered croutons.', 90.00, true, 0, 10, true, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'tomato', 'creamy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Spicy Veg Manchow Soup', 'Hot and spicy Chinese vegetable soup flavored with soy sauce, loaded with fresh garlic, ginger, and crispy noodles.', 110.00, true, 2, 10, false, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'manchow', 'chinese']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Hot & Sour Chicken Soup', 'Thick, fiery, and tangy soup loaded with shredded chicken, bamboo shoots, and mushrooms.', 130.00, false, 2, 12, true, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'chicken', 'chinese']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Creamy Sweet Corn Veg', 'Comforting, creamy, and mildly sweet soup loaded with fresh sweet corn kernels and minced vegetables.', 110.00, true, 0, 10, false, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'sweetcorn', 'mild']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Zesty Lemon Coriander', 'Light and refreshing clear vegetable soup spiked with fresh lemon juice and plenty of chopped coriander leaves.', 100.00, true, 1, 10, false, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'lemon', 'healthy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Comforting Chicken Broth', 'A comforting clear chicken soup simmered with fresh herbs, ginger, black pepper, and chicken strips.', 120.00, false, 1, 12, false, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'broth', 'healthy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Creamy Sweet Corn Chicken', 'A soothing sweet corn soup whipped with soft egg whites and delicious shredded chicken.', 130.00, false, 0, 10, false, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'chicken', 'sweetcorn']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Fiery Tom Yum Veg', 'A fragrant Thai hot-and-sour soup simmered with lemongrass, galangal, kaffir lime leaves, and mushrooms.', 120.00, true, 3, 12, false, 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&q=80', ARRAY['soup', 'thai', 'spicy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sp_id, 'Garlic Shorba Lentil', 'A rich, slow-simmered spiced yellow lentil soup tempered with cumin, garlic, and a hint of fresh lemon juice.', 100.00, true, 1, 10, false, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80', ARRAY['soup', 'lentil', 'homestyle']);


    -- ==========================================
    -- CHINESE CATEGORY (61-70)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_ch_id, 'Veg Hakka Noodles', 'Wok-tossed thin noodles cooked with crunchy cabbage, bell peppers, carrots, spring onions, and light soy sauce.', 160.00, true, 1, 12, true, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', ARRAY['chinese', 'noodles', 'classic'], ARRAY[ag_fries_id::text])
    RETURNING id INTO mi_noodles_id;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Gobi Manchurian Dry', 'Crispy batter-fried cauliflower florets tossed in a sweet, spicy, and tangy Indo-Chinese Manchurian sauce.', 150.00, true, 2, 10, true, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', ARRAY['chinese', 'gobi', 'bestseller']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Classic Veg Fried Rice', 'Aromatic wok-tossed jasmine rice with finely chopped seasonal vegetables, spring onions, and a splash of soy.', 150.00, true, 1, 10, false, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80', ARRAY['chinese', 'rice', 'veg']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Schezwan Chicken Noodles', 'Fiery noodles tossed in our house-made spicy, pungent Schezwan chili sauce with tender chicken strips.', 190.00, false, 3, 14, false, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', ARRAY['chinese', 'noodles', 'chicken']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Chilli Chicken Gravy', 'Tender batter-fried chicken chunks simmered in a dark soy and chili sauce with bell peppers and green chillies.', 210.00, false, 2, 15, true, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', ARRAY['chinese', 'chicken', 'gravy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Schezwan Veg Fried Rice', 'Spicy, wok-fried rice tossed with chopped veggies in a fiery Schezwan chili paste, very popular.', 160.00, true, 3, 12, false, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80', ARRAY['chinese', 'rice', 'schezwan']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Paneer Chilli Dry Sauté', 'Cubes of crispy cottage cheese tossed with capsicum, onion, ginger, garlic, and hot green chillies in soy sauce.', 180.00, true, 2, 12, false, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', ARRAY['chinese', 'paneer', 'spicy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Wok Egg Fried Rice', 'Fluffy wok-tossed rice stir-fried with scrambled eggs, fresh seasonal veggies, soy sauce, and white pepper.', 160.00, false, 1, 10, false, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80', ARRAY['chinese', 'rice', 'egg']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Veg Spring Rolls Crisp', 'Four golden, crispy fried wrapper sheets stuffed with seasoned julienned stir-fried vegetables, served with sweet-chili dip.', 130.00, true, 1, 10, false, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', ARRAY['chinese', 'snack', 'springroll']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ch_id, 'Chicken Manchurian Gravy', 'Juicy fried chicken balls cooked in a rich, velvety dark brown ginger-garlic Manchurian gravy.', 220.00, false, 2, 15, false, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', ARRAY['chinese', 'chicken', 'manchurian']);


    -- ==========================================
    -- DESSERTS CATEGORY (71-80)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Gulab Jamun Premium', 'Two classic warm milk solid dumplings fried golden brown, steeped in cardamom-scented sweet sugar syrup.', 70.00, true, 0, 5, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['dessert', 'sweet', 'classic']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Kesar Rasmalai Duo', 'Two soft, spongy cottage cheese discs soaked in cardamon, saffron, and pistachio-rich reduced milk.', 90.00, true, 0, 5, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['dessert', 'rasmalai', 'popular']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Royal Rose Falooda', 'Rich, chilled milk layered with sweet rose syrup, basil seeds (sabza), vermicelli, topped with vanilla ice cream and nuts.', 140.00, true, 0, 10, true, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80', ARRAY['dessert', 'falooda', 'creamy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Sizzling Hot Brownie', 'A warm, fudgy eggless chocolate brownie served on a piping hot iron plate, topped with vanilla scoop and hot chocolate fudge.', 180.00, true, 0, 12, true, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80', ARRAY['dessert', 'brownie', 'hot']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Malai Kulfi Stick', 'Traditional dense and creamy Indian ice cream enriched with saffron, cardamon, and roasted pistachios on a stick.', 80.00, true, 0, 5, false, 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=600&q=80', ARRAY['dessert', 'kulfi', 'pistachio']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Desi Moong Dal Halwa', 'A rich, classic winter dessert made from yellow split lentils, cooked slowly with plenty of pure ghee, sugar, and dry fruits.', 110.00, true, 0, 10, false, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['dessert', 'halwa', 'ghee']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Ghee Gajar Halwa', 'Slow-cooked fresh grated red carrots simmered with rich milk, khoya, pure ghee, and studded with toasted cashew nuts.', 100.00, true, 0, 10, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['dessert', 'halwa', 'carrot']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Double Vanilla Fudge', 'Two premium scoops of velvety, smooth vanilla bean ice cream finished with a drizzle of rich chocolate syrup.', 70.00, true, 0, 5, false, 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=600&q=80', ARRAY['dessert', 'icecream', 'simple']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Kesar Pista Delight', 'Two scoops of aromatic saffron ice cream loaded with crunchy toasted slivered pistachios and almonds.', 90.00, true, 0, 5, false, 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=600&q=80', ARRAY['dessert', 'icecream', 'premium']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_ds_id, 'Sweet Paniyaram Jaggery', 'Seven sweet dumplings made of fermented rice batter, pure organic dark jaggery, cardamom, and coconut bites.', 80.00, true, 0, 10, false, 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=600&q=80', ARRAY['dessert', 'paniyaram', 'south']);


    -- ==========================================
    -- BEVERAGES CATEGORY (81-90)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Filter Coffee Brass', 'Strong, authentic decoction brewed with chicory, mixed with frothed hot milk, served in a traditional brass tumbler.', 40.00, true, 0, 5, true, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80', ARRAY['drink', 'coffee', 'bestseller']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Kadak Masala Chai', 'Strong milk tea slow-brewed with fresh crushed ginger, green cardamon, cinnamon, and black pepper.', 40.00, true, 1, 6, true, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80', ARRAY['drink', 'tea', 'classic']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Creamy Mango Lassi', 'Thick, luscious yogurt-based sweet drink blended with fresh sweet Alphonso mango pulp and saffron cardamom.', 90.00, true, 0, 5, true, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80', ARRAY['drink', 'lassi', 'mango']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Punjab Sweet Lassi', 'A giant glass of whipped sweet yogurt drink topped with a thick layer of malai cream and slivered nuts.', 80.00, true, 0, 5, false, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80', ARRAY['drink', 'lassi', 'creamy']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Fresh Lime Soda Mint', 'Tangy and refreshing lemon soda served sweet, salted, or mixed according to your preference.', 60.00, true, 0, 4, false, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80', ARRAY['drink', 'lime', 'cold']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Cooling Masala Chaas', 'Refreshing, cold, and thin buttermilk churned with fresh ginger, green chillies, coriander, and roasted cumin.', 50.00, true, 1, 5, false, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80', ARRAY['drink', 'buttermilk', 'cooling']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Coca Cola Chilled Can', 'A chilled 330ml can of original refreshing fizzy Coca Cola.', 60.00, true, 0, 2, false, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80', ARRAY['drink', 'soda', 'coke']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Diet Coke Sugarfree', 'A chilled 330ml can of zero sugar, zero calorie Diet Coke.', 60.00, true, 0, 2, false, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80', ARRAY['drink', 'soda', 'dietcoke']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Sprite Lime Can', 'A chilled 330ml can of refreshing lemon-lime Sprite.', 60.00, true, 0, 2, false, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80', ARRAY['drink', 'soda', 'sprite']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_bv_id, 'Ice Blended Cold Coffee', 'Rich, chilled milk blended with espresso, vanilla ice cream, and chocolate syrup, topped with coco dust.', 110.00, true, 0, 5, false, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80', ARRAY['drink', 'coffee', 'creamy']);


    -- ==========================================
    -- STREET FOOD CATEGORY (91-100)
    -- ==========================================
    
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_sf_id, 'Pani Puri Bomb Shells', 'Ten crispy puffed puris served with sweet tamarind chutney, spicy mint water, and spiced potato-chickpea mash.', 70.00, true, 2, 8, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['street-food', 'panipuri', 'popular'], ARRAY[ag_chaat_sides_id::text])
    RETURNING id INTO mi_puri_id;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_sf_id, 'Crispy Samosa Plate', 'Two crispy triangular pastry crusts stuffed with spiced potatoes and peas, served with sweet and green chutneys.', 50.00, true, 1, 8, true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ARRAY['street-food', 'samosa', 'classic'], ARRAY[ag_chaat_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_sf_id, 'Delectable Samosa Chaat', 'Crushed hot samosas smothered with spicy white peas curry (ragda), whipped yogurt, sweet-tangy chutneys, onions, and sev.', 90.00, true, 2, 10, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['street-food', 'chaat', 'spicy'], ARRAY[ag_chaat_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sf_id, 'Mumbai Butter Pav Bhaji', 'Spicy, buttery mashed vegetable curry cooked on a flat tawa, served with two soft butter-toasted pav breads.', 130.00, true, 2, 12, true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ARRAY['street-food', 'pavbhaji', 'bestseller']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sf_id, 'Classic Mumbai Vada Pav', 'The classic Mumbai street burger featuring a spicy fried potato dumpling in a soft bun smeared with hot dry garlic chutney.', 60.00, true, 2, 6, true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ARRAY['street-food', 'vadapav', 'classic']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_sf_id, 'Tangy Sev Bhel Puri', 'Crunchy puffed rice tossed with fresh chopped onions, tomatoes, raw mango, spiced potato, sweet tamarind, and spicy mint chutneys.', 70.00, true, 1, 8, false, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['street-food', 'bhelpuri', 'light'], ARRAY[ag_chaat_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_sf_id, 'Dahi Puri Chat Bomb', 'Ten puffed crisp puris filled with potatoes, sprouts, flooded with sweet yogurt, tangy chutneys, and fine sev.', 90.00, true, 1, 8, false, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['street-food', 'dahipuri', 'creamy'], ARRAY[ag_chaat_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags, addon_group_ids)
    VALUES
    (rest_id, cat_sf_id, 'Punjabi Aloo Tikki Chaat', 'Two crispy griddled potato patties covered with warm chickpea chole curry, yogurt, sweet-spicy chutneys, and onions.', 90.00, true, 2, 10, false, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80', ARRAY['street-food', 'alootikki', 'hot'], ARRAY[ag_chaat_sides_id::text]);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sf_id, 'Paneer Bread Pakoda Tri', 'Two golden-fried spiced gram flour battered bread triangles stuffed with spiced paneer slice and mint chutney.', 80.00, true, 1, 10, false, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ARRAY['street-food', 'pakoda', 'fried']);

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, spicy_level, prep_time_minutes, is_popular, image_url, tags)
    VALUES
    (rest_id, cat_sf_id, 'Cheese Loaded Pav Bhaji', 'Our rich Mumbai-style pav bhaji smothered with a giant handful of grated processed cheddar cheese.', 150.00, true, 2, 12, false, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', ARRAY['street-food', 'pavbhaji', 'cheese']);


    -- ==========================================
    -- 6. CREATE VARIANT GROUPS & OPTIONS
    -- ==========================================

    -- A. Idli Quantity Options
    INSERT INTO variant_groups (menu_item_id, name, is_required, min_select, max_select, display_order)
    VALUES (mi_idli_id, 'Choose Portion Size', true, 1, 1, 1)
    RETURNING id INTO vg_idli_qty_id;

    INSERT INTO variant_options (variant_group_id, name, price_modifier, is_available, display_order) VALUES
    (vg_idli_qty_id, 'Regular (2 Pcs)', 0.00, true, 1),
    (vg_idli_qty_id, 'Super Family (4 Pcs)', 55.00, true, 2);

    -- B. Dosa Ghee Roast Options
    INSERT INTO variant_groups (menu_item_id, name, is_required, min_select, max_select, display_order)
    VALUES (mi_dosa_id, 'Select Crepe Crispy Style', true, 1, 1, 1)
    RETURNING id INTO vg_dosa_type_id;

    INSERT INTO variant_options (variant_group_id, name, price_modifier, is_available, display_order) VALUES
    (vg_dosa_type_id, 'Standard Crispy Masala Dosa', 0.00, true, 1),
    (vg_dosa_type_id, 'Butter Smothered Dosa', 25.00, true, 2),
    (vg_dosa_type_id, 'Paper Thin Ghee Roast', 45.00, true, 3);

    -- C. Biryani Portions
    INSERT INTO variant_groups (menu_item_id, name, is_required, min_select, max_select, display_order)
    VALUES (mi_biryani_id, 'Select Portion Weight', true, 1, 1, 1)
    RETURNING id INTO vg_biryani_portion_id;

    INSERT INTO variant_options (variant_group_id, name, price_modifier, is_available, display_order) VALUES
    (vg_biryani_portion_id, 'Single Hunger Saver (Serves 1)', 0.00, true, 1),
    (vg_biryani_portion_id, 'Mega Double Share Pack (Serves 2)', 190.00, true, 2);

    -- D. Pizza Crust Sizes
    INSERT INTO variant_groups (menu_item_id, name, is_required, min_select, max_select, display_order)
    VALUES (mi_pizza_id, 'Choose Pizza Crust & Size', true, 1, 1, 1)
    RETURNING id INTO vg_pizza_size_id;

    INSERT INTO variant_options (variant_group_id, name, price_modifier, is_available, display_order) VALUES
    (vg_pizza_size_id, 'Sleek Personal Size (7 inches)', 0.00, true, 1),
    (vg_pizza_size_id, 'Premium Classic Medium (10 inches)', 140.00, true, 2),
    (vg_pizza_size_id, 'Giant Family Treat (12 inches)', 260.00, true, 3);

    -- E. Noodles Spiciness
    INSERT INTO variant_groups (menu_item_id, name, is_required, min_select, max_select, display_order)
    VALUES (mi_noodles_id, 'Select Spice Dial Level', true, 1, 1, 1)
    RETURNING id INTO vg_noodles_spice_id;

    INSERT INTO variant_options (variant_group_id, name, price_modifier, is_available, display_order) VALUES
    (vg_noodles_spice_id, 'Mild Child-friendly', 0.00, true, 1),
    (vg_noodles_spice_id, 'Classic Authentic Medium', 0.00, true, 2),
    (vg_noodles_spice_id, 'Fiery Desi Schezwan Spicy', 15.00, true, 3);

    RAISE NOTICE 'Seed successful: 10 Indian Categories and 100 deep-relationship dishes initialized for Restaurant: %', rest_id;
END $$;
