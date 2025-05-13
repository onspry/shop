import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.productImage.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();

    // Insert products
    await prisma.product.createMany({
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          slug: 'thypoono',
          category: 'KEYBOARD',
          name: 'Thypoono',
          descriptions: {
            en: 'A premium low-profile mechanical keyboard with a sleek design and exceptional typing experience.',
            de: 'Eine hochwertige Low-Profile-Mechaniktastatur mit elegantem Design und außergewöhnlichem Tippgefühl.',
            fr: 'Un clavier mécanique premium à profil bas avec un design élégant et une expérience de frappe exceptionnelle.',
            cn: '一款优质的低配机械键盘，设计时尚，打字体验卓越。'
          },
          features: {
            en: [
              'Low-profile mechanical switches',
              'Aluminum frame',
              'RGB backlighting',
              'Bluetooth connectivity',
              'Long battery life'
            ],
            de: [
              'Low-Profile-Mechanikschalter',
              'Aluminiumrahmen',
              'RGB-Beleuchtung',
              'Bluetooth-Verbindung',
              'Lange Akkulaufzeit'
            ],
            fr: [
              'Interrupteurs mécaniques à profil bas',
              'Cadre en aluminium',
              'Rétroéclairage RGB',
              'Connectivité Bluetooth',
              'Longue durée de vie de la batterie'
            ],
            cn: [
              '低配机械轴',
              '铝制框架',
              'RGB背光',
              '蓝牙连接',
              '长效电池续航'
            ]
          },
          specifications: {
            en: {
              dimensions: '320 x 120 x 25mm',
              weight: '600g',
              battery: '4000mAh',
              connectivity: 'Bluetooth 5.1, USB-C',
              switches: 'Low-profile mechanical'
            },
            de: {
              dimensions: '320 x 120 x 25mm',
              weight: '600g',
              battery: '4000mAh',
              connectivity: 'Bluetooth 5.1, USB-C',
              switches: 'Low-Profile-Mechanik'
            },
            fr: {
              dimensions: '320 x 120 x 25mm',
              weight: '600g',
              battery: '4000mAh',
              connectivity: 'Bluetooth 5.1, USB-C',
              switches: 'Mécanique à profil bas'
            },
            cn: {
              dimensions: '320 x 120 x 25mm',
              weight: '600g',
              battery: '4000mAh',
              connectivity: '蓝牙5.1, USB-C',
              switches: '低配机械轴'
            }
          },
          isAccessory: false
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          slug: 'kailh-choc-v2-switches',
          category: 'SWITCH',
          name: 'Kailh Choc V2 Switches',
          descriptions: {
            en: 'Low-profile mechanical switches perfect for slim keyboards.',
            de: 'Low-Profile-Mechanikschalter, perfekt für schlanke Tastaturen.',
            fr: 'Interrupteurs mécaniques à profil bas parfaits pour les claviers minces.',
            cn: '适合超薄键盘的低配机械轴。'
          },
          features: {
            en: [
              'Low-profile design',
              'Smooth linear action',
              'Durable construction',
              'Compatible with most low-profile keyboards'
            ],
            de: [
              'Low-Profile-Design',
              'Sanfte lineare Bewegung',
              'Langlebige Konstruktion',
              'Kompatibel mit den meisten Low-Profile-Tastaturen'
            ],
            fr: [
              'Design à profil bas',
              'Action linéaire fluide',
              'Construction durable',
              'Compatible avec la plupart des claviers à profil bas'
            ],
            cn: [
              '低配设计',
              '顺滑线性触感',
              '耐用结构',
              '兼容大多数低配键盘'
            ]
          },
          specifications: {
            en: {
              type: 'Linear',
              actuationForce: '50g',
              travelDistance: '1.5mm',
              lifespan: '50 million keystrokes'
            },
            de: {
              type: 'Linear',
              actuationForce: '50g',
              travelDistance: '1,5mm',
              lifespan: '50 Millionen Tastendrücke'
            },
            fr: {
              type: 'Linéaire',
              actuationForce: '50g',
              travelDistance: '1,5mm',
              lifespan: '50 millions de frappes'
            },
            cn: {
              type: '线性',
              actuationForce: '50g',
              travelDistance: '1.5毫米',
              lifespan: '5000万次按键寿命'
            }
          },
          isAccessory: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          slug: 'tht-low-profile-keycaps',
          category: 'KEYCAP',
          name: 'THT Low Profile Keycaps',
          descriptions: {
            en: 'Premium low-profile keycaps designed for mechanical keyboards.',
            de: 'Hochwertige Low-Profile-Keycaps für mechanische Tastaturen.',
            fr: 'Capuchons de touches à profil bas premium conçus pour les claviers mécaniques.',
            cn: '为机械键盘设计的优质低配键帽。'
          },
          features: {
            en: [
              'Low-profile design',
              'PBT material',
              'Durable construction',
              'Compatible with most low-profile switches'
            ],
            de: [
              'Low-Profile-Design',
              'PBT-Material',
              'Langlebige Konstruktion',
              'Kompatibel mit den meisten Low-Profile-Schaltern'
            ],
            fr: [
              'Design à profil bas',
              'Matériau PBT',
              'Construction durable',
              'Compatible avec la plupart des interrupteurs à profil bas'
            ],
            cn: [
              '低配设计',
              'PBT材质',
              '耐用结构',
              '兼容大多数低配轴'
            ]
          },
          specifications: {
            en: {
              material: 'PBT',
              profile: 'Low',
              compatibility: 'Kailh Choc, Gateron Low Profile',
              thickness: '1.2mm'
            },
            de: {
              material: 'PBT',
              profile: 'Low',
              compatibility: 'Kailh Choc, Gateron Low Profile',
              thickness: '1,2mm'
            },
            fr: {
              material: 'PBT',
              profile: 'Bas',
              compatibility: 'Kailh Choc, Gateron Low Profile',
              thickness: '1,2mm'
            },
            cn: {
              material: 'PBT',
              profile: '低',
              compatibility: 'Kailh Choc, Gateron 低配',
              thickness: '1.2毫米'
            }
          },
          isAccessory: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          slug: 'commute-bag',
          category: 'ACCESSORY',
          name: 'Commute Bag',
          descriptions: {
            en: 'A stylish and functional bag designed to carry your keyboard and accessories.',
            de: 'Eine stilvolle und funktionale Tasche für Ihre Tastatur und Zubehör.',
            fr: 'Un sac élégant et fonctionnel conçu pour transporter votre clavier et vos accessoires.',
            cn: '一款时尚且实用的包，专为携带您的键盘和配件而设计。'
          },
          features: {
            en: [
              'Water-resistant material',
              'Padded interior',
              'Multiple compartments',
              'Adjustable shoulder strap'
            ],
            de: [
              'Wasserdichtes Material',
              'Gepolstertes Innenfutter',
              'Mehrere Fächer',
              'Verstellbarer Schultergurt'
            ],
            fr: [
              'Matériau résistant à l\'eau',
              'Intérieur rembourré',
              'Compartiments multiples',
              'Bandoulière ajustable'
            ],
            cn: [
              '防水材质',
              '内部填充',
              '多个隔层',
              '可调节肩带'
            ]
          },
          specifications: {
            en: {
              dimensions: '40 x 30 x 15cm',
              material: 'Water-resistant nylon',
              capacity: '15L',
              compartments: '3'
            },
            de: {
              dimensions: '40 x 30 x 15cm',
              material: 'Wasserdichtes Nylon',
              capacity: '15L',
              compartments: '3'
            },
            fr: {
              dimensions: '40 x 30 x 15cm',
              material: 'Nylon résistant à l\'eau',
              capacity: '15L',
              compartments: '3'
            },
            cn: {
              dimensions: '40 x 30 x 15cm',
              material: '防水尼龙',
              capacity: '15升',
              compartments: '3'
            }
          },
          isAccessory: true
        }
      ]
    });

    // Insert variants
    await prisma.productVariant.createMany({
      data: [
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          sku: 'KB-THYP-ERG-CHOC',
          name: 'Thypoono - Ergonomic Layout',
          price: 11900,
          stockQuantity: 50,
          attributes: {
            layout: "split",
            keyboard_variant: "ergonomic",
            compatibleWith: { SWITCH: { stemType: ["Kailh Choc V1", "Kailh Choc V2"] } },
            requiredAccessories: ["SWITCH", "KEYCAP"]
          }
        },
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-7bb9bd380a12',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          sku: 'KB-THYP-ERG-MX',
          name: 'Thypoono - Ergonomic Layout',
          price: 11900,
          stockQuantity: 50,
          attributes: {
            layout: "split",
            keyboard_variant: "ergonomic",
            compatibleWith: { SWITCH: { stemType: ["MX"] } },
            requiredAccessories: ["SWITCH", "KEYCAP"]
          }
        },
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
          productId: '550e8400-e29b-41d4-a716-446655440001',
          sku: 'SW-CHOC-RED',
          name: 'Kailh Choc V2 Red Switch',
          price: 1900,
          stockQuantity: 50,
          attributes: {
            type: "Linear",
            actuation_force: "43g",
            color: "Red",
            feel: "Smooth",
            stemType: "Kailh Choc V2"
          }
        },
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
          productId: '550e8400-e29b-41d4-a716-446655440001',
          sku: 'SW-CHOC-BLUE',
          name: 'Kailh Choc V2 Blue Switch',
          price: 1900,
          stockQuantity: 50,
          attributes: {
            type: "Tactile",
            actuation_force: "50g",
            color: "Blue",
            feel: "Clicky",
            stemType: "Kailh Choc V2"
          }
        },
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
          productId: '550e8400-e29b-41d4-a716-446655440001',
          sku: 'SW-CHOC-BROWN',
          name: 'Kailh Choc V2 Brown Switch',
          price: 1900,
          stockQuantity: 50,
          attributes: {
            type: "Tactile",
            actuation_force: "45g",
            color: "Brown",
            feel: "Tactile",
            stemType: "Kailh Choc V2"
          }
        },
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
          productId: '550e8400-e29b-41d4-a716-446655440002',
          sku: 'KC-THT-CHAR',
          name: 'THT Low Profile Keycap Set - Characters',
          price: 2900,
          stockQuantity: 50,
          attributes: {
            legend_type: "Characters",
            color: "Black",
            material: "PBT",
            stemType: ["MX", "Kailh Choc V2"],
            layout: "Split"
          }
        },
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
          productId: '550e8400-e29b-41d4-a716-446655440002',
          sku: 'KC-THT-DOTS',
          name: 'THT Low Profile Keycap Set - Dots',
          price: 2900,
          stockQuantity: 50,
          attributes: {
            legend_type: "Dots",
            color: "Black",
            material: "PBT",
            stemType: ["MX", "Kailh Choc V2"],
            layout: "Split"
          }
        },
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          productId: '550e8400-e29b-41d4-a716-446655440003',
          sku: 'BAG-COMMUTE',
          name: 'Commute Bag',
          price: 4900,
          stockQuantity: 30,
          attributes: {
            size: "15.6\"",
            color: "Black",
            material: "Nylon",
            compartments: ["Laptop", "Keyboard", "Accessories"]
          }
        }
      ]
    });

    // Insert images
    await prisma.productImage.createMany({
      data: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          url: '/images/products/thypoono/main.jpg',
          alt: 'Thypoono Split Keyboard - Main View',
          position: 1
        },
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
          productId: '550e8400-e29b-41d4-a716-446655440001',
          url: '/images/products/switches/choc-v1-main.jpg',
          alt: 'Kailh Choc V1 Switches - Main View',
          position: 1
        },
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d486',
          productId: '550e8400-e29b-41d4-a716-446655440002',
          url: '/images/products/keycaps/tht-main.jpg',
          alt: 'THT Low Profile Keycap Set - Main View',
          position: 1
        },
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d489',
          productId: '550e8400-e29b-41d4-a716-446655440003',
          url: '/images/products/bags/commute-main.jpg',
          alt: 'Commute Bag - Main View',
          position: 1
        }
      ]
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
