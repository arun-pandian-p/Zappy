-- Hotel Madurai Seed Template
-- Purpose: Specific street food and regional specialty templates

INSERT INTO categories (name, description, display_order, is_active) VALUES
('Madurai Specials', 'Authentic Madurai street food', 1, true),
('Beverages', 'Cold and hot drinks', 2, true);

INSERT INTO menu_items (name, description, price, is_vegetarian, is_popular) VALUES
('Jigarthanda', 'Famous Madurai cold dessert drink', 90.00, true, true),
('Kothu Parotta', 'Minced parotta with spices and salna', 140.00, false, true),
('Kari Dosa', 'Thick dosa topped with minced mutton', 180.00, false, true);
