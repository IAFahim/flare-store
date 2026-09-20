import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { paymentEvents } from '$lib/server/db/schema';
import { getGateway, hasGateway } from '$lib/server/payments/registry';
import { InvalidTransition, transitionOrder, transitionPayment } from '$lib/server/orders/machine';
import { emitOrderEvent } from '$lib/server/orders/events';
import { getOrderByPublicId } from '$lib/server/catalog';

export const POST: RequestHandler = async ({ params, request }) => {
	const provider = params.provider;
	if (!hasGateway(provider)) error(404, 'Unknown provider');

	const rawBody = await request.text();
	const gateway = getGateway(provider);
	const result = await gateway.verifyWebhook(request, rawBody);

	if (!result.ok) {
		return json({ ok: false, error: result.error }, { status: 401 });
	}

	const event = result.event;
	const order = await getOrderByPublicId(event.orderPublicId);

	// Persist first — unique(provider, externalId) makes retries idempotent.
	let inserted;
	try {
		[inserted] = await db
			.insert(paymentEvents)
			.values({
				provider,
				externalId: event.externalId,
				eventType: event.type,
				orderId: order?.id ?? null,
				signatureValid: true,
				payload: event.raw
			})
			.returning();
	} catch {
		// duplicate (provider, external_id) — already processed
		return json({ ok: true, duplicate: true });
	}

	if (!order) {
		await db
			.update(paymentEvents)
			.set({ error: `Unknown order ${event.orderPublicId}` })
			.where(eq(paymentEvents.id, inserted.id));
		return json({ ok: false, error: 'Unknown order' }, { status: 404 });
	}

	try {
		await transitionPayment(order.id, event.resultingStatus, {
			actor: 'webhook',
			eventType: event.type,
			payload: { provider, externalId: event.externalId, transactionId: event.transactionId }
		});

		// A successful payment confirms a pending order.
		if (event.type === 'payment.succeeded' && order.status === 'pending') {
			await transitionOrder(order.id, 'confirmed', {
				actor: 'webhook',
				payload: { provider, externalId: event.externalId }
			});
		}

		await db
			.update(paymentEvents)
			.set({ processed: true })
			.where(eq(paymentEvents.id, inserted.id));

		emitOrderEvent(event.type, {
			orderId: order.id,
			publicId: order.publicId,
			from: order.status,
			to: order.status,
			actor: 'webhook',
			payload: { provider, externalId: event.externalId }
		});

		return json({ ok: true });
	} catch (err) {
		const message =
			err instanceof InvalidTransition ? err.message : 'Failed to apply payment event';
		await db.update(paymentEvents).set({ error: message }).where(eq(paymentEvents.id, inserted.id));
		// 200 for invalid-but-verified transitions so the provider stops retrying
		return json({ ok: err instanceof InvalidTransition, error: message }, { status: 200 });
	}
};
