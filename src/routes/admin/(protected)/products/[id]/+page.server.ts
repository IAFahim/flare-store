import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { productImages, products, productVariants } from '$lib/server/db/schema';
import { getProductById } from '$lib/server/catalog';
import { ensureVariants, parseProductForm } from '$lib/server/products';
import { storage } from '$lib/server/storage';

async function loadProduct(id: string) {
	const product = await getProductById(Number(id));
	if (!product) error(404, 'Product not found');
	return product;
}

export const load: PageServerLoad = async ({ params }) => {
	return { product: await loadProduct(params.id) };
};

export const actions: Actions = {
	save: async ({ params, request }) => {
		const product = await loadProduct(params.id);
		const parsed = parseProductForm(await request.formData());
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' });
		}
		await db.update(products).set(parsed.data).where(eq(products.id, product.id));
		return { success: true };
	},

	generateVariants: async ({ params }) => {
		const product = await loadProduct(params.id);
		const created = await ensureVariants(product.id, product.options);
		return { success: true, created };
	},

	addVariant: async ({ params, request }) => {
		const product = await loadProduct(params.id);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Variant name is required' });

		const priceRaw = String(form.get('priceOverride') ?? '');
		const stockRaw = String(form.get('stock') ?? '');
		await db.insert(productVariants).values({
			productId: product.id,
			name,
			options: {},
			sku: String(form.get('sku') ?? '') || null,
			priceOverride: priceRaw ? Number(priceRaw) : null,
			stock: stockRaw === '' ? null : Number(stockRaw)
		});
		return { success: true };
	},

	updateVariant: async ({ params, request }) => {
		await loadProduct(params.id);
		const form = await request.formData();
		const id = Number(form.get('id'));
		const priceRaw = String(form.get('priceOverride') ?? '');
		const stockRaw = String(form.get('stock') ?? '');
		await db
			.update(productVariants)
			.set({
				sku: String(form.get('sku') ?? '') || null,
				priceOverride: priceRaw ? Number(priceRaw) : null,
				stock: stockRaw === '' ? null : Number(stockRaw),
				active: form.get('active') === 'true'
			})
			.where(eq(productVariants.id, id));
		return { success: true };
	},

	toggleVariant: async ({ params, request }) => {
		const product = await loadProduct(params.id);
		const form = await request.formData();
		const id = Number(form.get('id'));
		const variant = product.variants.find((v) => v.id === id);
		if (variant) {
			await db
				.update(productVariants)
				.set({ active: !variant.active })
				.where(eq(productVariants.id, id));
		}
		return { success: true };
	},

	deleteVariant: async ({ params, request }) => {
		const product = await loadProduct(params.id);
		const form = await request.formData();
		await db
			.delete(productVariants)
			.where(
				and(
					eq(productVariants.id, Number(form.get('id'))),
					eq(productVariants.productId, product.id)
				)
			);
		return { success: true };
	},

	uploadImage: async ({ params, request }) => {
		const product = await loadProduct(params.id);
		const form = await request.formData();
		const file = form.get('image');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Choose an image file' });
		}
		if (file.size > 5 * 1024 * 1024) return fail(400, { error: 'Image too large (max 5MB)' });

		const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
		const key = `products/${product.id}/${crypto.randomUUID()}.${ext}`;
		const stored = await storage.put(key, file, file.type || 'application/octet-stream');

		await db.insert(productImages).values({
			productId: product.id,
			url: stored.url,
			alt: String(form.get('alt') ?? product.title),
			colorKey: String(form.get('colorKey') ?? '') || null,
			position: product.images.length
		});
		return { success: true };
	},

	deleteImage: async ({ params, request }) => {
		const product = await loadProduct(params.id);
		const form = await request.formData();
		const id = Number(form.get('id'));
		const image = product.images.find((i) => i.id === id);
		if (image) {
			await db.delete(productImages).where(eq(productImages.id, id));
			// best-effort storage cleanup for uploaded objects
			if (!image.url.startsWith('/images/')) {
				const path = image.url.includes('/uploads/')
					? image.url.split('/uploads/')[1]
					: `products/${product.id}/${image.url.split('/').pop()}`;
				await storage.remove(path).catch(() => {});
			}
		}
		return { success: true };
	},

	delete: async ({ params }) => {
		const product = await loadProduct(params.id);
		await db.delete(products).where(eq(products.id, product.id));
		redirect(303, '/admin/products');
	}
};
