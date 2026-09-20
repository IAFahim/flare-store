import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	orderEvents,
	orders,
	type EventActor,
	type OrderStatus,
	type PaymentStatus
} from '$lib/server/db/schema';
import { emitOrderEvent } from './events';

/**
 * Order lifecycle state machine.
 *
 *   pending ──▶ confirmed ──▶ shipped ──▶ delivered
 *      │            │            │
 *      └────────────┴────────────┴──▶ cancelled
 *
 * Every transition is recorded in `order_events` inside the same transaction
 * as the status update, then emitted to listeners after commit.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending: ['confirmed', 'cancelled'],
	confirmed: ['shipped', 'cancelled'],
	shipped: ['delivered', 'cancelled'],
	delivered: [],
	cancelled: []
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
	unpaid: ['pending', 'paid', 'failed'],
	pending: ['paid', 'failed'],
	failed: ['pending', 'paid'],
	paid: ['refunded'],
	refunded: []
};

export class InvalidTransition extends Error {
	constructor(
		public readonly kind: 'status' | 'payment',
		public readonly from: string,
		public readonly to: string
	) {
		super(`Invalid ${kind} transition: ${from} → ${to}`);
		this.name = 'InvalidTransition';
	}
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
	return ORDER_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
	return ORDER_TRANSITIONS[from];
}

type TransitionOptions = {
	actor: EventActor;
	note?: string;
	payload?: Record<string, unknown>;
	paymentStatus?: PaymentStatus;
	eventType?: string;
};

/**
 * Atomically move an order to a new status. Throws InvalidTransition when the
 * move is not allowed. Optionally updates payment_status in the same write.
 */
export async function transitionOrder(
	orderId: number,
	to: OrderStatus,
	opts: TransitionOptions
): Promise<void> {
	const event = await db.transaction(async (tx) => {
		const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
		if (!order) throw new Error(`Order ${orderId} not found`);
		if (!canTransition(order.status, to)) {
			throw new InvalidTransition('status', order.status, to);
		}
		if (
			opts.paymentStatus &&
			!PAYMENT_TRANSITIONS[order.paymentStatus].includes(opts.paymentStatus)
		) {
			throw new InvalidTransition('payment', order.paymentStatus, opts.paymentStatus);
		}

		await tx
			.update(orders)
			.set({
				status: to,
				...(opts.paymentStatus ? { paymentStatus: opts.paymentStatus } : {}),
				updatedAt: new Date()
			})
			.where(eq(orders.id, orderId));

		const [row] = await tx
			.insert(orderEvents)
			.values({
				orderId,
				type: opts.eventType ?? `order.${to}`,
				fromStatus: order.status,
				toStatus: to,
				actor: opts.actor,
				note: opts.note ?? '',
				payload: opts.payload ?? {}
			})
			.returning();

		return { order, event: row };
	});

	emitOrderEvent(event.event.type, {
		orderId,
		publicId: event.order.publicId,
		from: event.order.status,
		to,
		actor: opts.actor,
		payload: opts.payload ?? {}
	});
}

/**
 * Update only the payment status (e.g. mark COD collected on delivery).
 */
export async function transitionPayment(
	orderId: number,
	to: PaymentStatus,
	opts: Omit<TransitionOptions, 'paymentStatus'>
): Promise<void> {
	const event = await db.transaction(async (tx) => {
		const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
		if (!order) throw new Error(`Order ${orderId} not found`);
		if (!PAYMENT_TRANSITIONS[order.paymentStatus].includes(to)) {
			throw new InvalidTransition('payment', order.paymentStatus, to);
		}

		await tx
			.update(orders)
			.set({ paymentStatus: to, updatedAt: new Date() })
			.where(eq(orders.id, orderId));

		const [row] = await tx
			.insert(orderEvents)
			.values({
				orderId,
				type: opts.eventType ?? `payment.${to}`,
				fromStatus: order.status,
				toStatus: order.status,
				actor: opts.actor,
				note: opts.note ?? '',
				payload: { paymentStatus: to, ...(opts.payload ?? {}) }
			})
			.returning();

		return { order, event: row };
	});

	emitOrderEvent(event.event.type, {
		orderId,
		publicId: event.order.publicId,
		from: event.order.status,
		to: event.order.status,
		actor: opts.actor,
		payload: event.event.payload
	});
}
