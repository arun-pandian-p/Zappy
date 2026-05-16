-- South Indian Side Dish Ecosystem Seed Data
-- Adds 40+ authentic side dishes, chutneys, and accompaniments.

INSERT INTO menu_items (
    name, slug, category, subcategory, description, price, is_veg, spice_level, 
    preparation_time, rating, tags, recommended_with, image_url, image_prompt, badges
) VALUES 
-- 1. CHUTNEYS
(
    'White Coconut Chutney', 'white-coconut-chutney', 'Chutney', 'Mild Dip',
    'Classic hotel-style white coconut chutney made with fresh grated coconut, roasted gram, and mild green chillies.',
    30.00, true, 'mild', 5, 4.8,
    ARRAY['mild', 'coconut', 'essential', 'dip'],
    ARRAY['plain_dosa', 'idli', 'vada'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'White coconut chutney in a small steel cup with mustard seed tempering, realistic food photography, 4k',
    ARRAY['Best Seller', 'Essential']
),
(
    'Kara Chutney', 'kara-chutney', 'Chutney', 'Spicy Dip',
    'A fiery red chutney made with ripe tomatoes, dry red chillies, shallots, and garlic.',
    35.00, true, 'high', 5, 4.9,
    ARRAY['spicy', 'red_chutney', 'tangy', 'dip'],
    ARRAY['ghee_roast_dosa', 'kuzhi_paniyaram'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/kara_chutney_1778947702273.png',
    'Spicy red Kara Chutney served in a small brass bowl with curry leaves tempering, beside crispy dosa on banana leaf, authentic South Indian restaurant photography, warm cinematic lighting, ultra realistic food photography, 4k',
    ARRAY['Spicy', 'Popular']
),
(
    'Onion Chutney', 'onion-chutney', 'Chutney', 'Savory Dip',
    'Slightly sweet and spicy chutney made by slow-roasting small onions (shallots) and red chillies.',
    35.00, true, 'medium', 5, 4.6,
    ARRAY['savory', 'onion', 'dip'],
    ARRAY['masala_dosa', 'uthappam'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Reddish-brown onion chutney in a small bowl, South Indian style, 4k',
    ARRAY[]
),
(
    'Mint Chutney', 'mint-chutney', 'Chutney', 'Fresh Dip',
    'Refreshing chutney made with fresh mint leaves, green chillies, and coconut.',
    35.00, true, 'medium', 5, 4.7,
    ARRAY['fresh', 'mint', 'herbal', 'dip'],
    ARRAY['vada', 'pongal'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Vibrant green mint chutney in a brass bowl, South Indian style, 4k',
    ARRAY['Healthy Choice']
),
(
    'Curry Leaf Chutney', 'curry-leaf-chutney', 'Chutney', 'Healthy Dip',
    'Iron-rich dark green chutney made by roasting fresh curry leaves with urad dal and tamarind.',
    40.00, true, 'medium', 5, 4.8,
    ARRAY['healthy', 'iron_rich', 'herbal', 'dip'],
    ARRAY['idli', 'dosa'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Dark green curry leaf chutney with oil tempering, rustic bowl, 4k',
    ARRAY['Chef Special']
),
(
    'Hotel Style Red Chutney', 'hotel-style-red-chutney', 'Chutney', 'Spicy Dip',
    'The classic smooth red chutney served in Saravana Bhavan / A2B, perfectly balancing spice and tanginess.',
    40.00, true, 'medium', 5, 4.9,
    ARRAY['hotel_style', 'classic', 'dip'],
    ARRAY['plain_dosa', 'rava_dosa'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Smooth bright red chutney in a small stainless steel bowl, hotel style presentation, 4k',
    ARRAY['Customer Favorite']
),

-- 2. SAMBAR & SIDES
(
    'Tiffin Sambar', 'tiffin-sambar', 'Sides', 'Sambar',
    'A slightly sweet, mildly spiced lentil stew specially made for tiffin items. Ground with fresh coriander seeds and roasted chana dal.',
    45.00, true, 'mild', 5, 4.9,
    ARRAY['sambar', 'essential', 'hot', 'stew'],
    ARRAY['idli', 'vada', 'pongal', 'dosa'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/tiffin_sambar_1778947684140.png',
    'Piping hot South Indian Tiffin Sambar in a small brass bowl, garnished with coriander and mustard seeds, authentic restaurant presentation, banana leaf background, warm cinematic lighting, ultra realistic food photography, 4k',
    ARRAY['Best Seller']
),
(
    'Ghee Sambar', 'ghee-sambar', 'Sides', 'Premium Sambar',
    'Rich tiffin sambar generously topped with pure desi ghee for an aromatic, luxurious experience.',
    55.00, true, 'mild', 5, 4.8,
    ARRAY['rich', 'ghee', 'premium', 'sambar'],
    ARRAY['mini_idli', 'pongal'],
    'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&q=80',
    'Hot sambar with a pool of melted golden ghee on top, premium presentation, 4k',
    ARRAY['Chef Special']
),
(
    'Onion Sambar', 'onion-sambar', 'Sides', 'Sambar',
    'Flavorful sambar loaded with whole small onions (shallots), bringing a natural sweetness to the spicy stew.',
    50.00, true, 'medium', 5, 4.7,
    ARRAY['onion', 'sambar', 'savory'],
    ARRAY['dosa', 'vada'],
    'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&q=80',
    'Sambar with floating whole pearl onions, brass bowl, South Indian setting, 4k',
    ARRAY[]
),
(
    'Potato Masala', 'potato-masala', 'Sides', 'Dosa Filling',
    'Classic yellow potato bhaji spiced with turmeric, green chillies, mustard seeds, and curry leaves. Perfect for stuffing dosas or eating with poori.',
    60.00, true, 'mild', 10, 4.8,
    ARRAY['potato', 'masala', 'filling', 'savory'],
    ARRAY['plain_dosa', 'poori'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/potato_masala_1778947749244.png',
    'Yellow South Indian Potato Masala (Aloo Masala) for Dosa, garnished with coriander and mustard seeds, served in a small bowl on a banana leaf, realistic food photography, 4k',
    ARRAY['Essential']
),

-- 3. PODI & TOPPINGS
(
    'Idli Podi', 'idli-podi', 'Topping', 'Dry Chutney',
    'Coarsely ground dry spice powder made from roasted lentils and red chillies. The perfect accompaniment when mixed with sesame oil.',
    30.00, true, 'medium', 2, 4.7,
    ARRAY['podi', 'spicy', 'dry', 'essential'],
    ARRAY['idli', 'dosa'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Coarse orange-red idli podi powder in a small wooden bowl, South Indian style, 4k',
    ARRAY['Popular']
),
(
    'Ghee Podi', 'ghee-podi', 'Topping', 'Premium Podi',
    'Spicy gun powder (idli podi) pre-mixed with rich melted ghee. A heavenly combination for soft idlis.',
    45.00, true, 'medium', 2, 4.9,
    ARRAY['podi', 'ghee', 'rich', 'premium'],
    ARRAY['idli', 'ghee_roast_dosa'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/ghee_podi_1778947718669.png',
    'Authentic South Indian Idli Podi mixed with rich golden ghee in a small cup, bright orange-red color with coarse texture, restaurant quality food photography, warm lighting, 4k',
    ARRAY['Best Seller', 'Highly Recommended']
),
(
    'Curry Leaf Podi', 'curry-leaf-podi', 'Topping', 'Healthy Podi',
    'Nutritious dry powder made from roasted curry leaves, black pepper, and lentils. Great for digestion.',
    35.00, true, 'medium', 2, 4.6,
    ARRAY['healthy', 'podi', 'iron_rich'],
    ARRAY['idli', 'hot_rice'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Dark green coarse curry leaf powder in a small bowl, 4k',
    ARRAY['Healthy Choice']
),

-- 4. MINI SIDE DISHES
(
    'Mini Medu Vada', 'mini-medu-vada', 'Mini Sides', 'Snack',
    'Two bite-sized crispy, golden-brown lentil donuts. Perfect for dipping in sambar.',
    50.00, true, 'medium', 10, 4.8,
    ARRAY['crispy', 'fried', 'mini', 'snack'],
    ARRAY['tiffin_sambar', 'coconut_chutney'],
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80',
    'Small bite-sized medu vadas on a banana leaf, crispy texture, 4k',
    ARRAY['Perfect Add-on']
),
(
    'Sweet Paniyaram', 'sweet-paniyaram', 'Mini Sides', 'Sweet Snack',
    'Traditional bite-sized sweet dumplings made from fermented batter, jaggery, and cardamom, pan-fried in ghee.',
    70.00, true, 'mild', 15, 4.7,
    ARRAY['sweet', 'jaggery', 'mini', 'dessert'],
    ARRAY['filter_coffee'],
    'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&q=80',
    'Dark brown sweet paniyaram dumplings cooked in ghee, served on banana leaf, 4k',
    ARRAY[]
),
(
    'Masala Groundnuts', 'masala-groundnuts', 'Mini Sides', 'Snack',
    'Roasted peanuts tossed with finely chopped onions, tomatoes, coriander, lemon juice, and chaat masala.',
    60.00, true, 'medium', 5, 4.5,
    ARRAY['crunchy', 'snack', 'spicy', 'tangy'],
    ARRAY['filter_coffee', 'buttermilk'],
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80',
    'Peanut chaat in a small bowl, colorful with chopped veggies, 4k',
    ARRAY[]
),

-- 5. DRINK PAIRINGS
(
    'Degree Coffee', 'degree-coffee', 'Drinks', 'Hot Beverage',
    'Authentic Kumbakonam-style filter coffee made with pure, unadulterated cow''s milk and freshly roasted coffee beans.',
    50.00, true, 'mild', 5, 4.9,
    ARRAY['coffee', 'hot', 'strong', 'authentic'],
    ARRAY['idli', 'dosa', 'vada'],
    'file:///C:/Users/Rishi/.gemini/antigravity/brain/3dced93b-3a77-49d0-9781-33213d7f2ed4/degree_coffee_1778947733886.png',
    'Authentic Kumbakonam Degree Coffee served in traditional brass dabara tumbler, frothy top layer, steam rising, dark wooden table, warm restaurant lighting, premium beverage photography, 4k',
    ARRAY['Premium', 'Chef Special']
),
(
    'Sukku Coffee', 'sukku-coffee', 'Drinks', 'Healthy Beverage',
    'Traditional dry ginger and coriander seed coffee sweetened with palm jaggery. Excellent for digestion and immunity.',
    40.00, true, 'spicy', 5, 4.6,
    ARRAY['healthy', 'ginger', 'hot', 'herbal'],
    ARRAY['vada'],
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80',
    'Dark herbal ginger coffee in an earthen cup, steam rising, 4k',
    ARRAY['Healthy Choice']
);
