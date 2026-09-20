import type { PageServerLoad } from './$types';
import { listAllProducts } from '$lib/server/catalog';

export const load: PageServerLoad = async () => {
	return { products: await listAllProducts() };
};
