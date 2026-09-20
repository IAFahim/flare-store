import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { placeOrder, placeOrderSchema } from './place';
import { hasGateway } from '$lib/server/payments/registry';

/**
 * Shared form action for placing an order. Used by the landing page and
 * product pages — items arrive as a JSON payload in the `items` field.
 */
export async function placeOrderAction(event: RequestEvent) {
	const form = await event.request.formData();

	let rawItems: unknown;
	try {
		rawItems = JSON.parse(String(form.get('items') ?? '[]'));
	} catch {
		return fail(400, { error: 'Invalid order payload' });
	}

	// No-JS fallback: qty::<variantId> number inputs
	if (!Array.isArray(rawItems) || rawItems.length === 0) {
		const fromFields = [...form.entries()]
			.filter(([k]) => k.startsWith('qty::'))
			.map(([k, v]) => ({ variantId: Number(k.slice(5)), quantity: Number(v) }))
			.filter((i) => Number.isInteger(i.variantId) && i.quantity > 0);
		if (fromFields.length > 0) rawItems = fromFields;
	}

	const parsed = placeOrderSchema.safeParse({
		customerName: form.get('customerName'),
		customerPhone: form.get('customerPhone'),
		customerAddress: form.get('customerAddress'),
		customerNote: form.get('customerNote') ?? '',
		shippingZoneId: form.get('shippingZoneId'),
		paymentMethod: form.get('paymentMethod') ?? 'cod',
		items: rawItems
	});

	if (!parsed.success) {
		return fail(400, {
			error: parsed.error.issues[0]?.message ?? 'Please check your order details'
		});
	}

	if (!hasGateway(parsed.data.paymentMethod)) {
		return fail(400, { error: 'Unknown payment method' });
	}

	let result;
	try {
		result = await placeOrder(parsed.data);
	} catch (err) {
		return fail(400, {
			error: err instanceof Error ? err.message : 'Could not place the order'
		});
	}

	if (result.payment.kind === 'redirect' && result.payment.redirectUrl) {
		redirect(303, result.payment.redirectUrl);
	}
	redirect(303, `/order/${result.order.publicId}?placed=1`);
}
