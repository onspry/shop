import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
	try {
		// Clear existing data in the correct order (respecting foreign key constraints)
		console.log('Cleaning up existing data...');

		// First, delete cart items
		await prisma.cartItem.deleteMany();

		// Then delete order items
		await prisma.orderItem.deleteMany();

		// Then delete inventory transactions
		await prisma.inventoryTransaction.deleteMany();

		// Now it's safe to delete product-related data
		await prisma.productImage.deleteMany();
		await prisma.productVariant.deleteMany();
		await prisma.product.deleteMany();

		console.log('Database cleaned. Creating new products...');

		// Insert products
		await prisma.product.createMany({
			data: [
				{
					id: '550e8400-e29b-41d4-a716-446655440000',
					slug: 'thypoono',
					category: 'KEYBOARD',
					name: 'Thypoono',
					descriptions: {
						'en-US':
							'A premium low-profile mechanical keyboard with a sleek design and exceptional typing experience.',
						'en-UK':
							'A premium low-profile mechanical keyboard with a sleek design and exceptional typing experience.',
						'de-DE':
							'Eine hochwertige Low-Profile-Mechaniktastatur mit elegantem Design und außergewöhnlichem Tippgefühl.',
						'fr-FR':
							'Un clavier mécanique premium à profil bas avec un design élégant et une expérience de frappe exceptionnelle.',
						'zh-CN': '一款优质的低配机械键盘，设计时尚，打字体验卓越。'
					},
					features: {
						'en-US': ['Low-profile mechanical switches', 'Aluminum frame', 'RGB backlighting'],
						'en-UK': ['Low-profile mechanical switches', 'Aluminium frame', 'RGB backlighting'],
						'de-DE': ['Low-Profile-Mechanikschalter', 'Aluminiumrahmen', 'RGB-Beleuchtung'],
						'fr-FR': [
							'Interrupteurs mécaniques à profil bas',
							'Cadre en aluminium',
							'Rétroéclairage RGB'
						],
						'zh-CN': ['低配机械轴', '铝制框架', 'RGB背光']
					},
					specifications: {
						'en-US': {
							dimensions: '320 x 120 x 25mm',
							weight: '600g',
							connectivity: 'USB-C',
							switches: 'Low-profile mechanical'
						},
						'en-UK': {
							dimensions: '320 x 120 x 25mm',
							weight: '600g',
							connectivity: 'USB-C',
							switches: 'Low-profile mechanical'
						},
						'de-DE': {
							dimensions: '320 x 120 x 25mm',
							weight: '600g',
							connectivity: 'USB-C',
							switches: 'Low-Profile-Mechanik'
						},
						'fr-FR': {
							dimensions: '320 x 120 x 25mm',
							weight: '600g',
							connectivity: 'USB-C',
							switches: 'Mécanique à profil bas'
						},
						'zh-CN': {
							dimensions: '320 x 120 x 25mm',
							weight: '600g',
							connectivity: 'USB-C',
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
						'en-US': 'Low-profile mechanical switches perfect for slim keyboards.',
						'en-UK': 'Low-profile mechanical switches perfect for slim keyboards.',
						'de-DE': 'Low-Profile-Mechanikschalter, perfekt für schlanke Tastaturen.',
						'fr-FR': 'Interrupteurs mécaniques à profil bas parfaits pour les claviers minces.',
						'zh-CN': '适合超薄键盘的低配机械轴。'
					},
					features: {
						'en-US': [
							'Low-profile design',
							'Smooth linear action',
							'Durable construction',
							'Compatible with most low-profile keyboards'
						],
						'en-UK': [
							'Low-profile design',
							'Smooth linear action',
							'Durable construction',
							'Compatible with most low-profile keyboards'
						],
						'de-DE': [
							'Low-Profile-Design',
							'Sanfte lineare Bewegung',
							'Langlebige Konstruktion',
							'Kompatibel mit den meisten Low-Profile-Tastaturen'
						],
						'fr-FR': [
							'Design à profil bas',
							'Action linéaire fluide',
							'Construction durable',
							'Compatible avec la plupart des claviers à profil bas'
						],
						'zh-CN': ['低配设计', '顺滑线性触感', '耐用结构', '兼容大多数低配键盘']
					},
					specifications: {
						'en-US': {
							type: 'Linear',
							actuationForce: '50g',
							travelDistance: '1.5mm',
							lifespan: '50 million keystrokes'
						},
						'en-UK': {
							type: 'Linear',
							actuationForce: '50g',
							travelDistance: '1.5mm',
							lifespan: '50 million keystrokes'
						},
						'de-DE': {
							type: 'Linear',
							actuationForce: '50g',
							travelDistance: '1,5mm',
							lifespan: '50 Millionen Tastendrücke'
						},
						'fr-FR': {
							type: 'Linéaire',
							actuationForce: '50g',
							travelDistance: '1,5mm',
							lifespan: '50 millions de frappes'
						},
						'zh-CN': {
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
						'en-US': 'Premium low-profile keycaps designed for mechanical keyboards.',
						'en-UK': 'Premium low-profile keycaps designed for mechanical keyboards.',
						'de-DE': 'Hochwertige Low-Profile-Keycaps für mechanische Tastaturen.',
						'fr-FR':
							'Capuchons de touches à profil bas premium conçus pour les claviers mécaniques.',
						'zh-CN': '为机械键盘设计的优质低配键帽。'
					},
					features: {
						'en-US': [
							'Low-profile design',
							'PBT material',
							'Durable construction',
							'Compatible with most low-profile switches'
						],
						'en-UK': [
							'Low-profile design',
							'PBT material',
							'Durable construction',
							'Compatible with most low-profile switches'
						],
						'de-DE': [
							'Low-Profile-Design',
							'PBT-Material',
							'Langlebige Konstruktion',
							'Kompatibel mit den meisten Low-Profile-Schaltern'
						],
						'fr-FR': [
							'Design à profil bas',
							'Matériau PBT',
							'Construction durable',
							'Compatible avec la plupart des interrupteurs à profil bas'
						],
						'zh-CN': ['低配设计', 'PBT材质', '耐用结构', '兼容大多数低配轴']
					},
					specifications: {
						'en-US': {
							material: 'PBT',
							profile: 'Low',
							compatibility: 'Kailh Choc, Gateron Low Profile',
							thickness: '1.2mm'
						},
						'en-UK': {
							material: 'PBT',
							profile: 'Low',
							compatibility: 'Kailh Choc, Gateron Low Profile',
							thickness: '1.2mm'
						},
						'de-DE': {
							material: 'PBT',
							profile: 'Low',
							compatibility: 'Kailh Choc, Gateron Low Profile',
							thickness: '1,2mm'
						},
						'fr-FR': {
							material: 'PBT',
							profile: 'Bas',
							compatibility: 'Kailh Choc, Gateron Low Profile',
							thickness: '1,2mm'
						},
						'zh-CN': {
							material: 'PBT',
							profile: '低',
							compatibility: 'Kailh Choc, Gateron 低配',
							thickness: '1.2毫米'
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
					price: 19800,
					prices: {
						CNY: 92800,
						EUR: 19900,
						GBP: 16900,
						USD: 22500
					},
					stockQuantity: 50,
					attributes: {
						layout: 'split',
						keyboard_variant: 'ergonomic',
						compatibleWith: { SWITCH: { stemType: ['Kailh Choc V1', 'Kailh Choc V2'] } },
						requiredAccessories: ['SWITCH', 'KEYCAP']
					}
				},
				{
					id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
					productId: '550e8400-e29b-41d4-a716-446655440001',
					sku: 'SW-CHOC-RED',
					name: 'Kailh Choc V2 Red Switch',
					price: 1900,
					prices: {
						CNY: 15500,
						EUR: 1900,
						GBP: 1600,
						USD: 2200
					},
					stockQuantity: 50,
					attributes: {
						type: 'Linear',
						actuation_force: '43g',
						color: 'Red',
						feel: 'Smooth',
						stemType: 'Kailh Choc V2'
					}
				},
				{
					id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
					productId: '550e8400-e29b-41d4-a716-446655440001',
					sku: 'SW-CHOC-BLUE',
					name: 'Kailh Choc V2 Blue Switch',
					price: 1900,
					prices: {
						CNY: 15500,
						EUR: 1900,
						GBP: 1600,
						USD: 2200
					},
					stockQuantity: 50,
					attributes: {
						type: 'Tactile',
						actuation_force: '50g',
						color: 'Blue',
						feel: 'Clicky',
						stemType: 'Kailh Choc V2'
					}
				},
				{
					id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
					productId: '550e8400-e29b-41d4-a716-446655440001',
					sku: 'SW-CHOC-BROWN',
					name: 'Kailh Choc V2 Brown Switch',
					price: 1900,
					prices: {
						CNY: 15500,
						EUR: 1900,
						GBP: 1600,
						USD: 2200
					},
					stockQuantity: 50,
					attributes: {
						type: 'Tactile',
						actuation_force: '45g',
						color: 'Brown',
						feel: 'Tactile',
						stemType: 'Kailh Choc V2'
					}
				},
				{
					id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
					productId: '550e8400-e29b-41d4-a716-446655440002',
					sku: 'KC-THT-CHAR',
					name: 'THT Low Profile Keycap Set - Characters',
					price: 2900,
					prices: {
						CNY: 23500,
						EUR: 2900,
						GBP: 2500,
						USD: 3300
					},
					stockQuantity: 50,
					attributes: {
						legend_type: 'Characters',
						color: 'Black',
						material: 'PBT',
						stemType: ['MX', 'Kailh Choc V2'],
						layout: 'Split'
					}
				},
				{
					id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
					productId: '550e8400-e29b-41d4-a716-446655440002',
					sku: 'KC-THT-DOTS',
					name: 'THT Low Profile Keycap Set - Dots',
					price: 2900,
					prices: {
						CNY: 23500,
						EUR: 2900,
						GBP: 2500,
						USD: 3300
					},
					stockQuantity: 50,
					attributes: {
						legend_type: 'Dots',
						color: 'Black',
						material: 'PBT',
						stemType: ['MX', 'Kailh Choc V2'],
						layout: 'Split'
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

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
