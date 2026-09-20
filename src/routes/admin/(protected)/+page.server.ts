import type { PageServerLoad } from './$types';
import { countOrdersByStatus, listAllProducts, listOrders } from '$lib/server/catalog';

export const load: PageServerLoad = async () => {
	const [counts, recent, products] = await Promise.all([
		countOrdersByStatus(),
		listOrders(),
		listAllProducts()
	]);
	return { counts, recent: recent.slice(0, 8), productCount: products.length };
};
