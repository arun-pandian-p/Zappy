-- Hotel Chennai Seed Template
-- Purpose: Chettinad and coastal seafood templates

INSERT INTO categories (name, description, display_order, is_active) VALUES
('Chettinad Specials', 'Spicy authentic Chettinad dishes', 1, true),
('Seafood', 'Fresh catch from the coast', 2, true);

INSERT INTO menu_items (name, description, price, is_vegetarian, is_popular) VALUES
('Chicken Chettinad', 'Spicy chicken curry with freshly roasted spices', 220.00, false, true),
('Nethili Fry', 'Crispy fried anchovies', 180.00, false, true),
('Mutton Chukka', 'Dry roasted mutton with pepper and spices', 280.00, false, true);
