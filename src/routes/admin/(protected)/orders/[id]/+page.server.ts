import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getOrderById } from '$lib/server/catalog';
import {
	InvalidTransition,
	nextStatuses,
	transitionOrder,
	transitionPayment
} from '$lib/server/orders/machine';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '$lib/server/db/schema';
import type { OrderStatus, PaymentStatus } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const order = await getOrderById(Number(params.id));
	if (!order) error(404, 'Order not found');
	return { order, nextStatuses: nextStatuses(order.status) };
};

export const actions: Actions = {
	transition: async ({ params, request }) => {
		const form = await request.formData();
		const to = String(form.get('to') ?? '') as OrderStatus;
		if (!ORDER_STATUSES.includes(to)) return fail(400, { error: 'Invalid status' });

		try {
			await transitionOrder(Number(params.id), to, {
				actor: 'admin',
				note: String(form.get('note') ?? '')
			});
		} catch (err) {
			if (err instanceof InvalidTransition) return fail(400, { error: err.message });
			throw err;
		}
		return { success: true };
	},

	payment: async ({ params, request }) => {
		const form = await request.formData();
		const to = String(form.get('to') ?? '') as PaymentStatus;
		if (!PAYMENT_STATUSES.includes(to)) return fail(400, { error: 'Invalid payment status' });

		try {
			await transitionPayment(Number(params.id), to, { actor: 'admin' });
		} catch (err) {
			if (err instanceof InvalidTransition) return fail(400, { error: err.message });
			throw err;
		}
		return { success: true };
	}
};
