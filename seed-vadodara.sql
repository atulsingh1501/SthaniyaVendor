-- Clear existing data (optional, only if you want a fresh start)
-- TRUNCATE stores, products CASCADE;

-- Insert sample stores into Vadodara using explicit UUIDs so we can easily attach products later
INSERT INTO stores (id, created_at, name, location_text, category, phone, latitude, longitude, rating) 
VALUES 
('11111111-1111-1111-1111-111111111111', NOW(), 'Reliance Fresh', 'Alkapuri, Vadodara', 'Grocery', '+919876543210', 22.3060, 73.1700, '4.2'),
('22222222-2222-2222-2222-222222222222', NOW(), 'Apollo Pharmacy', 'Akota, Vadodara', 'Pharmacy', '+919876543211', 22.3100, 73.1650, '4.8'),
('33333333-3333-3333-3333-333333333333', NOW(), 'Pantaloons Clothing', 'Sayajigunj, Vadodara', 'Clothing', '+919876543212', 22.3125, 73.1850, '4.0'),
('44444444-4444-4444-4444-444444444444', NOW(), 'Croma Electronics', 'Fatehgunj, Vadodara', 'Electronics', '+919876543213', 22.3200, 73.1900, '4.5'),
('55555555-5555-5555-5555-555555555555', NOW(), 'D-Mart', 'Waghodia Road, Vadodara', 'Grocery', '+919876543214', 22.2965, 73.2201, '4.6'),
('66666666-6666-6666-6666-666666666666', NOW(), 'Titan Eye+', 'Gotri, Vadodara', 'Accessories', '+919876543215', 22.3000, 73.2350, '4.3');

-- Insert products linked to these stores (Assuming 'products' table has 'store_id' as a foreign key)
INSERT INTO products (id, created_at, store_id, name, price, category, is_in_stock) 
VALUES 
-- Grocery App
(gen_random_uuid(), NOW(), '11111111-1111-1111-1111-111111111111', 'Fresh Apples (1kg)', 120.00, 'Fruits', true),
(gen_random_uuid(), NOW(), '11111111-1111-1111-1111-111111111111', 'Milk (1L)', 65.00, 'Dairy', true),
(gen_random_uuid(), NOW(), '11111111-1111-1111-1111-111111111111', 'Atta (5kg)', 240.00, 'Pantry', false),
(gen_random_uuid(), NOW(), '11111111-1111-1111-1111-111111111111', 'Maggi Noodles', 24.00, 'Snacks', true),
(gen_random_uuid(), NOW(), '11111111-1111-1111-1111-111111111111', 'Tata Salt (1kg)', 28.00, 'Pantry', true),

-- Pharmacy
(gen_random_uuid(), NOW(), '22222222-2222-2222-2222-222222222222', 'Paracetamol 500mg', 15.50, 'Tablets', true),
(gen_random_uuid(), NOW(), '22222222-2222-2222-2222-222222222222', 'Cough Syrup', 95.00, 'Syrup', true),
(gen_random_uuid(), NOW(), '22222222-2222-2222-2222-222222222222', 'First Aid Kit', 250.00, 'Medical', true),
(gen_random_uuid(), NOW(), '22222222-2222-2222-2222-222222222222', 'Vitamin C Supplements', 110.00, 'Vitamins', false),

-- Clothing
(gen_random_uuid(), NOW(), '33333333-3333-3333-3333-333333333333', 'Men Casual Shirt', 899.00, 'Menswear', true),
(gen_random_uuid(), NOW(), '33333333-3333-3333-3333-333333333333', 'Denim Jeans', 1499.00, 'Menswear', true),
(gen_random_uuid(), NOW(), '33333333-3333-3333-3333-333333333333', 'Women Summer Dress', 1299.00, 'Womenswear', true),
(gen_random_uuid(), NOW(), '33333333-3333-3333-3333-333333333333', 'Sports Shoes', 2499.00, 'Footwear', false),

-- Electronics
(gen_random_uuid(), NOW(), '44444444-4444-4444-4444-444444444444', 'Samsung 43" Smart TV', 32000.00, 'Television', true),
(gen_random_uuid(), NOW(), '44444444-4444-4444-4444-444444444444', 'Boat Smartwatch', 1599.00, 'Wearables', true),
(gen_random_uuid(), NOW(), '44444444-4444-4444-4444-444444444444', 'JBL Bluetooth Earbuds', 2100.00, 'Audio', true),
(gen_random_uuid(), NOW(), '44444444-4444-4444-4444-444444444444', 'Playstation 5', 49999.00, 'Gaming', false);