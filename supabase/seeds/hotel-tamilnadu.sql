-- Hotel Tamilnadu Seed Template
-- Purpose: Authentic South Indian data (Idli, Dosa, Meals)

INSERT INTO categories (name, description, display_order, is_active) VALUES
('Breakfast', 'Traditional South Indian Breakfast Items', 1, true),
('Meals', 'Authentic Thali Meals', 2, true);

INSERT INTO menu_items (name, description, price, is_vegetarian, is_popular) VALUES
('Idli', 'Soft steamed rice cakes', 40.00, true, true),
('Masala Dosa', 'Crispy crepe with potato filling', 70.00, true, true),
('South Indian Meals', 'Unlimited rice with sambar, rasam, kootu, poriyal', 120.00, true, true);
