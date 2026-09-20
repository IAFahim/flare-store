import type { PageServerLoad } from './$types';
import { listOrders } from '$lib/server/catalog';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? undefined;
	return { orders: await listOrders(status), status: status ?? 'all' };
};
