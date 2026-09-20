import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { productVariants, PRODUCT_STATUSES, type ProductOption } from '$lib/server/db/schema';

const detailSchema = z.array(z.object({ label: z.string().min(1), value: z.string() }));
const optionSchema = z.array(
	z.object({ name: z.string().min(1), values: z.array(z.string().min(1)).min(1) })
);

export const productFormSchema = z.object({
	title: z.string().trim().min(2).max(200),
	slug: z
		.string()
		.trim()
		.min(2)
		.max(200)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
	subtitle: z.string().trim().max(200).default(''),
	description: z.string().trim().max(10000).default(''),
	details: detailSchema.default([]),
	options: optionSchema.default([]),
	price: z.coerce.number().min(0),
	compareAtPrice: z.coerce.number().min(0).nullable().default(null),
	currency: z.string().trim().min(1).max(8).default('BDT'),
	status: z.enum(PRODUCT_STATUSES).default('draft'),
	featured: z.coerce.boolean().default(false),
	position: z.coerce.number().int().default(0)
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

/** Parse the admin product form; details/options arrive as JSON strings. */
export function parseProductForm(form: FormData) {
	const parseJson = (key: string) => {
		const raw = String(form.get(key) ?? '').trim();
		if (!raw) return undefined;
		try {
			return JSON.parse(raw);
		} catch {
			return undefined;
		}
	};

	return productFormSchema.safeParse({
		title: form.get('title'),
		slug: form.get('slug'),
		subtitle: form.get('subtitle') ?? '',
		description: form.get('description') ?? '',
		details: parseJson('details') ?? [],
		options: parseJson('options') ?? [],
		price: form.get('price'),
		compareAtPrice: form.get('compareAtPrice') || null,
		currency: form.get('currency') || 'BDT',
		status: form.get('status') || 'draft',
		featured: form.get('featured') === 'on' || form.get('featured') === 'true',
		position: form.get('position') || 0
	});
}

export { slugify } from '$lib/slug';

/**
 * Cartesian product of option axes → every combination gets a variant row.
 * Existing variants are kept (matched by name); only missing combos are added.
 */
export async function ensureVariants(productId: number, options: ProductOption[]) {
	if (options.length === 0) return 0;

	const combos = options.reduce<Record<string, string>[]>(
		(acc, axis) => acc.flatMap((combo) => axis.values.map((v) => ({ ...combo, [axis.name]: v }))),
		[{}]
	);

	const existing = await db
		.select({ name: productVariants.name })
		.from(productVariants)
		.where(eq(productVariants.productId, productId));
	const names = new Set(existing.map((e) => e.name));

	const missing = combos
		.map((options) => ({ options, name: Object.values(options).join(' / ') }))
		.filter((c) => !names.has(c.name));

	if (missing.length === 0) return 0;
	await db.insert(productVariants).values(
		missing.map((c, i) => ({
			productId,
			name: c.name,
			options: c.options,
			position: existing.length + i
		}))
	);
	return missing.length;
}
