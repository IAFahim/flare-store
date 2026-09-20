import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { parseProductForm } from '$lib/server/products';

export const actions: Actions = {
	default: async ({ request }) => {
		const parsed = parseProductForm(await request.formData());
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' });
		}
		try {
			const [product] = await db.insert(products).values(parsed.data).returning();
			redirect(303, `/admin/products/${product.id}`);
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err) throw err;
			return fail(400, {
				error: err instanceof Error ? err.message : 'Could not create product'
			});
		}
	}
};
