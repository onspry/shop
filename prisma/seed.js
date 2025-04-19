import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding products...');

    // Insert products
    await prisma.$executeRaw`
      INSERT INTO "Product" (id, slug, category, name, description, features, specifications, "is_accessory", "created_at", "updated_at")
      VALUES
      -- Keyboard product
      (
        '550e8400-e29b-41d4-a716-446655440000',
        'thypoono',
        'KEYBOARD',
        'Thypoono',
        'Ergonomic split keyboard with 46 keys featuring Kailh Choc hot-swappable sockets. Perfect for programmers and writers who value comfort and customization.',
        ARRAY['Split ergonomic design', '46 keys layout', 'Hot-swappable Kailh Choc sockets', 'USB-C connection', 'Compact and portable', 'Fully programmable', 'Low profile design'],
        '{"Layout": "46 keys split", "Switches": "Kailh Choc hot-swappable", "Connection": "USB-C", "Dimensions": "290 x 120 x 15 mm per half", "Weight": "400g total", "OS": "Windows, macOS, Linux"}'::jsonb,
        false,
        NOW(),
        NOW()
      ),
      -- Switch product
      (
        '550e8400-e29b-41d4-a716-446655440001',
        'kailh-choc-v2-switches',
        'SWITCH',
        'Kailh Choc V2 Switches',
        'Premium low profile mechanical switches for mechanical keyboards. Available in different variants to suit your typing preference.',
        ARRAY['Low profile design', 'Hot-swappable', 'Long lifespan', 'Transparent housing', 'Compatible with Choc keycaps'],
        '{"Type": "Mechanical", "Total Travel": "3.0mm", "Pre-travel": "1.5mm", "Lifespan": "50 million actuations", "Pin Type": "5-pin", "Housing Material": "PC"}'::jsonb,
        true,
        NOW(),
        NOW()
      ),
      -- Keycap product
      (
        '550e8400-e29b-41d4-a716-446655440002',
        'tht-low-profile-keycaps',
        'KEYCAP',
        'THT Low Profile Keycap Set',
        'Premium PBT backlit keycap set designed specifically for low profile mechanical keyboards. Available with different legend styles to match your aesthetic preference.',
        ARRAY['PBT material', 'Backlit compatible', '46 keys set', 'Low profile design', 'Kailh Choc compatible', 'Durable construction'],
        '{"Material": "PBT", "Profile": "Low Profile", "Color": "Black", "Number of Keys": "46", "Backlit": "Yes"}'::jsonb,
        true,
        NOW(),
        NOW()
      ),
      -- Case product
      (
        '550e8400-e29b-41d4-a716-446655440003',
        'thypoono-commute-case',
        'CASE',
        'Thypoono Commute Case',
        'Protective carrying case designed specifically for the Thypoono keyboard. Perfect for commuting or travel, keeping your keyboard safe and secure.',
        ARRAY['Custom fit for Thypoono keyboard', 'Shock-absorbing padding', 'Water-resistant exterior', 'Compact design', 'Cable compartment', 'Reinforced zipper', 'Carrying handle'],
        '{"Material": "Ballistic nylon exterior, EVA foam interior", "Dimensions": "310 x 190 x 40 mm", "Weight": "250g", "Color": "Black", "Water resistance": "Splash-proof"}'::jsonb,
        true,
        NOW(),
        NOW()
      ),
      -- MX Switch product
      (
        '550e8400-e29b-41d4-a716-446655440004',
        'mx-switches',
        'SWITCH',
        'MX Switches',
        'Classic mechanical switches for mechanical keyboards. Available in different variants to suit your typing preference.',
        ARRAY['Standard MX design', 'Hot-swappable', 'Long lifespan', 'Transparent housing', 'Compatible with MX keycaps'],
        '{"Type": "Mechanical", "Total Travel": "4.0mm", "Pre-travel": "2.0mm", "Lifespan": "50 million actuations", "Pin Type": "5-pin", "Housing Material": "PC"}'::jsonb,
        true,
        NOW(),
        NOW()
      ),
      -- Kailh Choc V1 Keycap product
      (
        '550e8400-e29b-41d4-a716-446655440005',
        'tht-low-profile-keycaps-choc-v1',
        'KEYCAP',
        'THT Low Profile Keycap Set - Choc V1',
        'Premium PBT backlit keycap set designed specifically for Kailh Choc V1 low profile mechanical keyboards. Available with different legend styles to match your aesthetic preference.',
        ARRAY['PBT material', 'Backlit compatible', '46 keys set', 'Low profile design', 'Kailh Choc V1 compatible', 'Durable construction'],
        '{"Material": "PBT", "Profile": "Low Profile", "Color": "Black", "Number of Keys": "46", "Backlit": "Yes"}'::jsonb,
        true,
        NOW(),
        NOW()
      )
    `;

    console.log('Products inserted successfully');

    // Insert product variants
    console.log('Inserting product variants...');
    await prisma.$executeRaw`
      INSERT INTO "ProductVariant" (id, product_id, sku, name, price, stock_quantity, attributes, created_at, updated_at) VALUES
      -- Keyboard variants
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '550e8400-e29b-41d4-a716-446655440000', 'KB-THYP-ERG-CHOC', 'Thypoono - Ergonomic Layout', 11900, 50, '{
          "layout": "split",
          "keyboard_variant": "ergonomic",
          "compatibleWith": {
              "SWITCH": {
                  "stemType": ["Kailh Choc V1", "Kailh Choc V2"]
              }
          },
          "requiredAccessories": ["SWITCH", "KEYCAP"]
      }'::jsonb, NOW(), NOW()),
      ('a0eebc99-9c0b-4ef8-bb6d-7bb9bd380a12', '550e8400-e29b-41d4-a716-446655440000', 'KB-THYP-ERG-MX', 'Thypoono - Ergonomic Layout', 11900, 50, '{
          "layout": "split",
          "keyboard_variant": "ergonomic",
          "compatibleWith": {
              "SWITCH": {
                  "stemType": ["MX"]
              }
          },
          "requiredAccessories": ["SWITCH", "KEYCAP"]
      }'::jsonb, NOW(), NOW()),
      -- Switch variants
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', '550e8400-e29b-41d4-a716-446655440001', 'SW-CHOC-RED', 'Kailh Choc V2 Red Switch', 1900, 50, '{
          "type": "Linear",
          "actuation_force": "43g",
          "color": "Red",
          "feel": "Smooth",
          "stemType": "Kailh Choc V2",
          "compatibleWith": {
              "KEYCAP": {
                  "stemType": ["Kailh Choc V2"]
              }
          }
      }'::jsonb, NOW(), NOW()),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', '550e8400-e29b-41d4-a716-446655440001', 'SW-CHOC-BLUE', 'Kailh Choc V2 Blue Switch', 1900, 50, '{
          "type": "Clicky",
          "actuation_force": "50g",
          "color": "Blue",
          "feel": "Tactile with click",
          "stemType": "Kailh Choc V2",
          "compatibleWith": {
              "KEYCAP": {
                  "stemType": ["Kailh Choc V2"]
              }
          }
      }'::jsonb, NOW(), NOW()),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', '550e8400-e29b-41d4-a716-446655440001', 'SW-CHOC-BROWN', 'Kailh Choc V2 Brown Switch', 1900, 50, '{
          "type": "Tactile",
          "actuation_force": "45g",
          "color": "Brown",
          "feel": "Tactile bump",
          "stemType": "Kailh Choc V2",
          "compatibleWith": {
              "KEYCAP": {
                  "stemType": ["Kailh Choc V2"]
              }
          }
      }'::jsonb, NOW(), NOW()),
      -- Keycap variants
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '550e8400-e29b-41d4-a716-446655440002', 'KC-THT-CHAR', 'THT Low Profile Keycap Set - Characters', 2900, 50, '{
          "legend_type": "Characters",
          "color": "Black",
          "material": "PBT",
          "stemType": ["MX", "Kailh Choc V2"],
          "layout": "Split"
      }'::jsonb, NOW(), NOW()),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', '550e8400-e29b-41d4-a716-446655440002', 'KC-THT-DOTS', 'THT Low Profile Keycap Set - Dots', 2900, 50, '{
          "legend_type": "Dots",
          "color": "Black",
          "material": "PBT",
          "stemType": ["MX", "Kailh Choc V2"],
          "layout": "Split"
      }'::jsonb, NOW(), NOW()),
      -- Case variant
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', '550e8400-e29b-41d4-a716-446655440003', 'CASE-THYP-BLK', 'Thypoono Travel Case - Black', 3499, 50, '{
          "color": "Black",
          "material": "Ballistic nylon",
          "interior_padding": "EVA foam",
          "layout": "Split",
          "keyboard_variant": "ergonomic"
      }'::jsonb, NOW(), NOW()),
      -- MX Switch variants
      ('a0eebc99-9c0b-4ef8-bb6d-7bb9bd380a19', '550e8400-e29b-41d4-a716-446655440004', 'SW-MX-RED', 'MX Red Switch', 1900, 50, '{
          "type": "Linear",
          "actuation_force": "45g",
          "color": "Red",
          "feel": "Smooth",
          "stemType": "MX",
          "compatibleWith": {
              "KEYCAP": {
                  "stemType": ["MX"]
              }
          }
      }'::jsonb, NOW(), NOW()),
      -- Kailh Choc V1 Keycap variants
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '550e8400-e29b-41d4-a716-446655440005', 'KC-THT-DOTS-CHOC-V1', 'THT Low Profile Keycap Set - Dots (Choc V1)', 2900, 50, '{
          "legend_type": "Dots",
          "color": "Black",
          "material": "PBT",
          "stemType": ["Kailh Choc V1"],
          "layout": "Split"
      }'::jsonb, NOW(), NOW())
    `;

    console.log('Product variants inserted successfully');

    // Insert product images
    console.log('Inserting product images...');
    await prisma.$executeRaw`
      INSERT INTO "ProductImage" (id, product_id, url, alt, position) VALUES
      -- Keyboard images
      ('f47ac10b-58cc-4372-a567-0e02b2c3d479', '550e8400-e29b-41d4-a716-446655440000', '/images/products/thypoono/main.jpg', 'Thypoono Split Keyboard - Main View', 1),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d480', '550e8400-e29b-41d4-a716-446655440000', '/images/products/thypoono/angle.jpg', 'Thypoono Split Keyboard - Angle View', 2),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d481', '550e8400-e29b-41d4-a716-446655440000', '/images/products/thypoono/switches.jpg', 'Thypoono Split Keyboard - Switch Detail', 3),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d497', '550e8400-e29b-41d4-a716-446655440000', '/images/products/thypoono/mx-variant.jpg', 'Thypoono Split Keyboard - MX Variant', 4),
      -- Switch images
      ('f47ac10b-58cc-4372-a567-0e02b2c3d482', '550e8400-e29b-41d4-a716-446655440001', '/images/products/switches/choc-v1-main.jpg', 'Kailh Choc V1 Switches - Main View', 1),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d483', '550e8400-e29b-41d4-a716-446655440001', '/images/products/switches/choc-v1-red.jpg', 'Kailh Choc V1 Red Switch', 2),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d484', '550e8400-e29b-41d4-a716-446655440001', '/images/products/switches/choc-v1-blue.jpg', 'Kailh Choc V1 Blue Switch', 3),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d485', '550e8400-e29b-41d4-a716-446655440001', '/images/products/switches/choc-v1-brown.jpg', 'Kailh Choc V1 Brown Switch', 4),
      -- Keycap images
      ('f47ac10b-58cc-4372-a567-0e02b2c3d486', '550e8400-e29b-41d4-a716-446655440002', '/images/products/keycaps/tht-main.jpg', 'THT Low Profile Keycap Set - Main View', 1),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d487', '550e8400-e29b-41d4-a716-446655440002', '/images/products/keycaps/tht-characters.jpg', 'THT Low Profile Keycap Set - Characters', 2),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d488', '550e8400-e29b-41d4-a716-446655440002', '/images/products/keycaps/tht-dots.jpg', 'THT Low Profile Keycap Set - Dots', 3),
      -- Case images
      ('f47ac10b-58cc-4372-a567-0e02b2c3d490', '550e8400-e29b-41d4-a716-446655440003', '/images/products/case/thypoono-case-main.jpg', 'Thypoono Travel Case - Main View', 1),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d491', '550e8400-e29b-41d4-a716-446655440003', '/images/products/case/thypoono-case-open.jpg', 'Thypoono Travel Case - Open View', 2),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d492', '550e8400-e29b-41d4-a716-446655440003', '/images/products/case/thypoono-case-with-keyboard.jpg', 'Thypoono Travel Case - With Keyboard', 3),
      -- MX Switch images
      ('f47ac10b-58cc-4372-a567-0e02b2c3d493', '550e8400-e29b-41d4-a716-446655440004', '/images/products/switches/mx-main.jpg', 'MX Switches - Main View', 1),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d494', '550e8400-e29b-41d4-a716-446655440004', '/images/products/switches/mx-red.jpg', 'MX Red Switch', 2),
      -- Kailh Choc V1 Keycap images
      ('f47ac10b-58cc-4372-a567-0e02b2c3d495', '550e8400-e29b-41d4-a716-446655440005', '/images/products/keycaps/tht-choc-v1-main.jpg', 'THT Low Profile Keycap Set (Choc V1) - Main View', 1),
      ('f47ac10b-58cc-4372-a567-0e02b2c3d496', '550e8400-e29b-41d4-a716-446655440005', '/images/products/keycaps/tht-choc-v1-dots.jpg', 'THT Low Profile Keycap Set (Choc V1) - Dots', 2)
    `;

    console.log('Product images inserted successfully');
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
