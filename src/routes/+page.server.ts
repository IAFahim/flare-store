import type { Actions, PageServerLoad } from './$types';
import { getFeaturedProduct, listActiveProducts, listShippingZones } from '$lib/server/catalog';
import { placeOrderAction } from '$lib/server/orders/action';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { FaqItem } from '$lib/components/store/Faq.svelte';

const FAQ: FaqItem[] = [
	{
		question: 'How long does shipping take?',
		answer: 'Standard delivery takes 2-4 business days inside the country.'
	},
	{
		question: 'Do you ship internationally?',
		answer: 'Yes, we ship worldwide. Shipping costs depend on region and product.'
	},
	{
		question: 'How do I track my order?',
		answer: 'Keep your order confirmation link — it always shows the current status.'
	},
	{
		question: 'Where can I find your size chart?',
		answer: 'Each product page lists exact sizing under "The details".'
	},
	{
		question: 'What is your return policy?',
		answer:
			'Check your product in front of the delivery person — if you wish, you can return it instantly.'
	},
	{
		question: 'How do I wash my garments?',
		answer: 'Wash cold on a gentle cycle. Hang dry or tumble dry low to prevent shrinking.'
	}
];

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	const [featured, products, zones] = await Promise.all([
		getFeaturedProduct(),
		listActiveProducts(),
		listShippingZones()
	]);

	return {
		featured,
		products,
		zones,
		faq: FAQ,
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
