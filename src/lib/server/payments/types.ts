import type { Order, OrderItem, PaymentStatus } from '$lib/server/db/schema';

export type PaymentInitiation = {
	/** 'instructions' = show text to customer, 'redirect' = send to gateway checkout */
	kind: 'instructions' | 'redirect';
	instructions?: string;
	redirectUrl?: string;
};

export type VerifiedPaymentEvent = {
	/** Provider-assigned unique event/transaction id — used for idempotency */
	externalId: string;
	/** Normalised event type: payment.succeeded | payment.failed | payment.refunded */
	type: 'payment.succeeded' | 'payment.failed' | 'payment.refunded';
	/** Our public order id (orders.public_id) */
	orderPublicId: string;
	/** Provider transaction reference, if any */
	transactionId?: string;
	/** Amount reported by the provider, minor-currency-agnostic */
	amount?: number;
	/** Resulting payment_status on our side */
	resultingStatus: PaymentStatus;
	raw: Record<string, unknown>;
};

export type WebhookResult =
	{ ok: true; event: VerifiedPaymentEvent } | { ok: false; error: string };

/**
 * Contract every payment method must satisfy. COD never leaves the
 * `unpaid → paid` path; hosted gateways (bKash, SSLCommerz, Stripe-like
 * local providers) implement `initiatePayment` + signed `verifyWebhook`.
 */
export interface PaymentGateway {
	readonly name: string;
	/** Kick off payment after the order row exists. */
	initiatePayment(order: Order, items: OrderItem[]): Promise<PaymentInitiation>;
	/** Verify signature + normalise a raw webhook request. */
	verifyWebhook(request: Request, rawBody: string): Promise<WebhookResult>;
}
