import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProductBySlug, listShippingZones } from '$lib/server/catalog';
import { placeOrderAction } from '$lib/server/orders/action';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const product = await getProductBySlug(params.slug);
	if (!product || product.status !== 'active') error(404, 'Product not found');

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	return {
		product,
		zones: await listShippingZones(),
		brand: publicEnv.PUBLIC_SITE_NAME ?? 'Flare Store',
		whatsapp: publicEnv.PUBLIC_WHATSAPP_NUMBER ?? '',
		paymentMethods: [
			{ value: 'cod', label: 'Cash on delivery', hint: 'Pay when you receive' },
			...(env.LOCAL_GATEWAY_URL
				? [{ value: 'local_gateway', label: 'Online payment', hint: 'bKash / cards' }]
				: [])
		]
	};
};

export const actions: Actions = {
	default: placeOrderAction
};
