/**
 * Seed script — creates the starter catalog (mirrors reyangan.com's
 * flare-pant store) and shipping zones.
 *
 * Usage: node --env-file=.env scripts/seed.ts
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import {
	products,
	productImages,
	productVariants,
	shippingZones
} from '../src/lib/server/db/schema.ts';
import { slugify } from '../src/lib/slug.ts';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const db = drizzle(postgres(url), {
	schema: { products, productImages, productVariants, shippingZones }
});

type SeedProduct = {
	title: string;
	subtitle: string;
	description: string;
	details: { label: string; value: string }[];
	options: { name: string; values: string[] }[];
	price: number;
	compareAtPrice?: number;
	featured: boolean;
	position: number;
	images: { url: string; alt: string; colorKey?: string }[];
};

const SEED_PRODUCTS: SeedProduct[] = [
	{
		title: 'High Waist Stretchable Comfy Ladies Light Flare Pant',
		subtitle: 'Lounge · Est. comfort',
		description:
			'A modern take on lounge comfort. Made from a signature medium-weight Laguna sand-wash scuba fabric with a smooth elastic waistband and single front pleat for a tailored touch.\n\nThe wide-leg fit and side pockets make it perfect for both lounging and stepping out.',
		details: [
			{ label: 'Fabric', value: 'China Spandex Scuba, 220 GSM' },
			{ label: 'Sizes', value: '26, 28, 30, 32, 34, 36' },
			{ label: 'Length', value: '37″ – 40″' },
			{ label: 'Colours', value: 'Black, White, Beige / Camel' },
			{ label: 'Waist', value: 'Smooth elastic waistband' },
			{ label: 'Details', value: 'Single front pleat, side pockets' }
		],
		options: [
			{ name: 'Color', values: ['Black', 'White', 'Beige / Camel'] },
			{ name: 'Size', values: ['26', '28', '30', '32', '34', '36'] }
		],
		price: 800,
		featured: true,
		position: 0,
		images: [
			{
				url: '/images/products/flare-pant-black.svg',
				alt: 'High waist flare pant — black',
				colorKey: 'Black'
			},
			{
				url: '/images/products/flare-pant-white.svg',
				alt: 'High waist flare pant — white',
				colorKey: 'White'
			},
			{
				url: '/images/products/flare-pant-beige.svg',
				alt: 'High waist flare pant — beige camel',
				colorKey: 'Beige / Camel'
			}
		]
	},
	{
		title: 'Everyday Relaxed Cotton Tee',
		subtitle: 'Essentials · Heavyweight',
		description:
			'A boxy everyday tee in 240 GSM combed cotton. Garment-dyed, pre-shrunk, and cut with dropped shoulders for an easy drape.',
		details: [
			{ label: 'Fabric', value: 'Combed cotton, 240 GSM' },
			{ label: 'Fit', value: 'Relaxed, dropped shoulders' },
			{ label: 'Care', value: 'Cold wash, hang dry' }
		],
		options: [
			{ name: 'Color', values: ['Sand'] },
			{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }
		],
		price: 550,
		compareAtPrice: 650,
		featured: false,
		position: 1,
		images: [
			{
				url: '/images/products/tee-sand.svg',
				alt: 'Everyday relaxed tee — sand',
				colorKey: 'Sand'
			}
		]
	},
	{
		title: 'Wide Leg Linen Pant',
		subtitle: 'Essentials · Breathable linen',
		description:
			'A breezy wide-leg pant in a soft linen blend. High-rise with an elastic back waist — cool in the heat, polished enough for going out.',
		details: [
			{ label: 'Fabric', value: 'Linen-viscose blend, 180 GSM' },
			{ label: 'Fit', value: 'High rise, wide leg' },
			{ label: 'Waist', value: 'Elastic back, flat front' },
			{ label: 'Care', value: 'Gentle machine wash' }
		],
		options: [
			{ name: 'Color', values: ['Sage'] },
			{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }
		],
		price: 950,
		featured: false,
		position: 2,
		images: [
			{
				url: '/images/products/linen-pant-sage.svg',
				alt: 'Wide leg linen pant — sage',
				colorKey: 'Sage'
			}
		]
	},
	{
		title: 'Ribbed Knit Midi Skirt',
		subtitle: 'Essentials · Stretch rib knit',
		description:
			'A pull-on midi skirt in a soft ribbed knit that hugs without squeezing. Sits high on the waist with a clean hem — easy to dress up or down.',
		details: [
			{ label: 'Fabric', value: 'Ribbed knit, 260 GSM' },
			{ label: 'Fit', value: 'Slim, midi length' },
			{ label: 'Waist', value: 'Wide elastic waistband' },
			{ label: 'Care', value: 'Cold hand wash' }
		],
		options: [
			{ name: 'Color', values: ['Oat'] },
			{ name: 'Size', values: ['S', 'M', 'L'] }
		],
		price: 720,
		compareAtPrice: 850,
		featured: false,
		position: 3,
		images: [
			{
				url: '/images/products/knit-skirt-oat.svg',
				alt: 'Ribbed knit midi skirt — oat',
				colorKey: 'Oat'
			}
		]
	}
];

const SEED_ZONES = [
	{ name: 'ঢাকার ভিতরে — Inside Dhaka', fee: 70, position: 0 },
	{ name: 'ঢাকার বাহিরে — Outside Dhaka', fee: 130, position: 1 }
];

function variantCombos(options: SeedProduct['options']) {
	return options.reduce<Record<string, string>[]>(
		(acc, axis) => acc.flatMap((c) => axis.values.map((v) => ({ ...c, [axis.name]: v }))),
		[{}]
	);
}

async function main() {
	console.log('Seeding shipping zones…');
	for (const zone of SEED_ZONES) {
		const existing = await db.select().from(shippingZones).where(eq(shippingZones.name, zone.name));
		if (existing.length === 0) await db.insert(shippingZones).values(zone);
	}

	for (const seed of SEED_PRODUCTS) {
		const slug = slugify(seed.title);
		let [product] = await db.select().from(products).where(eq(products.slug, slug));
		if (!product) {
			[product] = await db
				.insert(products)
				.values({
					slug,
					title: seed.title,
					subtitle: seed.subtitle,
					description: seed.description,
					details: seed.details,
					options: seed.options,
					price: seed.price,
					compareAtPrice: seed.compareAtPrice ?? null,
					currency: 'BDT',
					status: 'active',
					featured: seed.featured,
					position: seed.position
				})
				.returning();
			console.log(`Created product: ${seed.title}`);
		} else {
			console.log(`Product exists: ${seed.title}`);
		}

		const images = await db
			.select()
			.from(productImages)
			.where(eq(productImages.productId, product.id));
		if (images.length === 0) {
			await db.insert(productImages).values(
				seed.images.map((img, i) => ({
					productId: product.id,
					url: img.url,
					alt: img.alt,
					colorKey: img.colorKey ?? null,
					position: i
				}))
			);
		}

		const variants = await db
			.select()
			.from(productVariants)
			.where(eq(productVariants.productId, product.id));
		if (variants.length === 0) {
			await db.insert(productVariants).values(
				variantCombos(seed.options).map((options, i) => ({
					productId: product.id,
					name: Object.values(options).join(' / '),
					options,
					position: i
				}))
			);
		}
	}

	console.log('Seed complete');
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
