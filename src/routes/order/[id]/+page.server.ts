import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrderByPublicId } from '$lib/server/catalog';
import { env as publicEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const order = await getOrderByPublicId(params.id);
	if (!order) error(404, 'Order not found');

	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		order,
		placed: url.searchParams.get('placed') === '1',
		brand: publicEnv.PUBLIC_SITE_NAME ?? 'Flare Store',
		whatsapp: publicEnv.PUBLIC_WHATSAPP_NUMBER ?? ''
	};
};
