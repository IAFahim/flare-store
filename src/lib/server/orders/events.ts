import type { EventActor } from '$lib/server/db/schema';

export type OrderEventPayload = {
	orderId: number;
	publicId: string;
	from: string;
	to: string;
	actor: EventActor;
	payload: Record<string, unknown>;
};

type Listener = (event: OrderEventPayload) => void | Promise<void>;

/**
 * In-process event bus for order lifecycle events. Events are always
 * persisted to `order_events` first (transactional outbox-style: the row is
 * the source of truth), then dispatched to listeners after commit.
 *
 * Register listeners once at server start (see hooks.server.ts).
 */
const listeners = new Map<string, Set<Listener>>();

export function onOrderEvent(type: string, listener: Listener): () => void {
	let set = listeners.get(type);
	if (!set) {
		set = new Set();
		listeners.set(type, set);
	}
	set.add(listener);
	return () => set.delete(listener);
}

export function emitOrderEvent(type: string, payload: OrderEventPayload): void {
	const targets = [...(listeners.get(type) ?? []), ...(listeners.get('*') ?? [])];
	for (const listener of targets) {
		try {
			void Promise.resolve(listener(payload)).catch((err) =>
				console.error(`[order-event] listener for "${type}" failed:`, err)
			);
		} catch (err) {
			console.error(`[order-event] listener for "${type}" threw:`, err);
		}
	}
}

/**
 * Default listeners — plug real integrations in here (SMS, WhatsApp,
 * courier booking, email). Kept side-effect-free by default.
 */
export function registerDefaultListeners(): void {
	onOrderEvent('order.placed', (e) => {
		console.info(`[orders] placed ${e.publicId}`);
	});
	onOrderEvent('order.confirmed', (e) => {
		console.info(`[orders] confirmed ${e.publicId} — notify customer (SMS/WhatsApp hook)`);
	});
	onOrderEvent('order.shipped', (e) => {
		console.info(`[orders] shipped ${e.publicId} — send tracking link (SMS/WhatsApp hook)`);
	});
	onOrderEvent('payment.paid', (e) => {
		console.info(`[orders] payment received for ${e.publicId}`);
	});
}
