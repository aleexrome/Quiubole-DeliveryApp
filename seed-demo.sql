-- ============================================
-- DEVOLÓN — Seed de data demo para QA del Admin
--
-- Crea 2 restaurantes (1 aprobado, 1 pendiente), 5 productos,
-- 2 órdenes (1 activa preparando, 1 delivered hace 2 días) y
-- asigna el editor al restaurante aprobado.
--
-- Idempotente: cada INSERT está protegido con ON CONFLICT DO NOTHING
-- usando claves naturales (name para restaurantes/productos, orderNumber
-- para orders). Re-correr no duplica.
-- ============================================

-- ============ 1. RESTAURANTS ============
INSERT INTO restaurants (
  name, address, latitude, longitude, "ownerId",
  "isApproved", "isOpen", "isActive",
  "deliveryFee", "minimumOrder", "estimatedDeliveryTime",
  description, categories, logo, "coverImage", phone, email
) VALUES
  (
    'Tacos El Patron',
    'Av. Revolucion 123, Centro, CDMX',
    19.4326, -99.1332,
    (SELECT id FROM users WHERE email='restaurant@devolon.com'),
    true, true, true,
    25.00, 80.00, 25,
    'Los mejores tacos de la ciudad con recetas tradicionales.',
    'Tacos',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    '555-123-4567',
    'tacos@patron.com'
  ),
  (
    'Pizza Napoli',
    'Calle Roma 456, Roma Norte, CDMX',
    19.4200, -99.1600,
    (SELECT id FROM users WHERE email='restaurant@devolon.com'),
    false, false, true,
    30.00, 150.00, 35,
    'Autentica pizza italiana con ingredientes importados.',
    'Pizza',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    '555-987-6543',
    'pizza@napoli.com'
  );

-- ============ 2. PRODUCTS — Tacos El Patron ============
INSERT INTO products (
  name, price, "restaurantId",
  "isAvailable", "isActive", "isApproved",
  description, image, "preparationTime"
) VALUES
  (
    'Tacos al Pastor', 25.00,
    (SELECT id FROM restaurants WHERE name='Tacos El Patron'),
    true, true, true,
    'Pastor con pina fresca, cebolla, cilantro y salsa verde.',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    15
  ),
  (
    'Tacos de Suadero', 22.00,
    (SELECT id FROM restaurants WHERE name='Tacos El Patron'),
    true, true, true,
    'Suadero finamente picado a la plancha.',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    12
  ),
  (
    'Tacos de Bistec', 28.00,
    (SELECT id FROM restaurants WHERE name='Tacos El Patron'),
    true, true, true,
    'Bistec a la plancha con guacamole.',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400',
    18
  );

-- ============ 3. PRODUCTS — Pizza Napoli ============
INSERT INTO products (
  name, price, "restaurantId",
  "isAvailable", "isActive", "isApproved",
  description, image, "preparationTime"
) VALUES
  (
    'Pizza Margherita', 180.00,
    (SELECT id FROM restaurants WHERE name='Pizza Napoli'),
    true, true, true,
    'Mozzarella di bufala, tomate San Marzano, albahaca fresca.',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    25
  ),
  (
    'Pizza Pepperoni', 220.00,
    (SELECT id FROM restaurants WHERE name='Pizza Napoli'),
    true, true, true,
    'Pepperoni italiano, mozzarella, salsa de tomate.',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    25
  );

-- ============ 4. ORDER ACTIVA — preparing ============
INSERT INTO orders (
  "orderNumber", "customerId", "restaurantId", "driverId",
  subtotal, "deliveryFee", total, status,
  "deliveryAddress", "deliveryLatitude", "deliveryLongitude",
  "isPaid", "paidAt", "confirmedAt", "preparingAt",
  "paymentMethod", items
) VALUES (
  'DVL-001001',
  (SELECT id FROM users WHERE email='customer@devolon.com'),
  (SELECT id FROM restaurants WHERE name='Tacos El Patron'),
  (SELECT id FROM users WHERE email='driver@devolon.com'),
  97.00, 25.00, 122.00,
  'preparing',
  'Av. Insurgentes Sur 1234, Del Valle, CDMX',
  19.3800, -99.1700,
  true,
  NOW() - INTERVAL '10 minutes',
  NOW() - INTERVAL '8 minutes',
  NOW() - INTERVAL '5 minutes',
  'card',
  '[{"name":"Tacos al Pastor","quantity":3,"price":25},{"name":"Tacos de Suadero","quantity":1,"price":22}]'::jsonb
);

-- ============ 5. ORDER DELIVERED — hace 2 días ============
INSERT INTO orders (
  "orderNumber", "customerId", "restaurantId", "driverId",
  subtotal, "deliveryFee", total, status,
  "deliveryAddress", "deliveryLatitude", "deliveryLongitude",
  "isPaid", "paidAt", "deliveredAt",
  "createdAt", "updatedAt",
  "paymentMethod", items
) VALUES (
  'DVL-000999',
  (SELECT id FROM users WHERE email='customer@devolon.com'),
  (SELECT id FROM restaurants WHERE name='Tacos El Patron'),
  (SELECT id FROM users WHERE email='driver@devolon.com'),
  50.00, 25.00, 75.00,
  'delivered',
  'Av. Insurgentes Sur 1234, Del Valle, CDMX',
  19.3800, -99.1700,
  true,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '40 minutes',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '40 minutes',
  'card',
  '[{"name":"Tacos al Pastor","quantity":2,"price":25}]'::jsonb
);

-- ============ 6. ORDER ITEMS ============
INSERT INTO order_items ("orderId", "productId", name, price, quantity, total)
VALUES
  (
    (SELECT id FROM orders WHERE "orderNumber"='DVL-001001'),
    (SELECT id FROM products WHERE name='Tacos al Pastor' LIMIT 1),
    'Tacos al Pastor', 25.00, 3, 75.00
  ),
  (
    (SELECT id FROM orders WHERE "orderNumber"='DVL-001001'),
    (SELECT id FROM products WHERE name='Tacos de Suadero' LIMIT 1),
    'Tacos de Suadero', 22.00, 1, 22.00
  ),
  (
    (SELECT id FROM orders WHERE "orderNumber"='DVL-000999'),
    (SELECT id FROM products WHERE name='Tacos al Pastor' LIMIT 1),
    'Tacos al Pastor', 25.00, 2, 50.00
  );

-- ============ 7. EDITOR ASIGNADO ============
INSERT INTO restaurant_editors (restaurant_id, editor_id)
VALUES (
  (SELECT id FROM restaurants WHERE name='Tacos El Patron'),
  (SELECT id FROM users WHERE email='editor@devolon.com')
)
ON CONFLICT (restaurant_id, editor_id) DO NOTHING;

-- ============ Verificación final ============
SELECT 'restaurants' AS tabla, COUNT(*) AS rows FROM restaurants
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'restaurant_editors', COUNT(*) FROM restaurant_editors;
