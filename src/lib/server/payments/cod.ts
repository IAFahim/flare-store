import type { PaymentGateway, PaymentInitiation, WebhookResult } from './types';

/**
 * Cash on delivery — the default gateway. No initiation round-trip and no
 * webhooks: the order stays `unpaid` until delivery, when an admin marks it
 * paid (or a courier webhook does, via the local gateway adapter).
 */
export const codGateway: PaymentGateway = {
	name: 'cod',

	async initiatePayment(): Promise<PaymentInitiation> {
		return {
			kind: 'instructions',
			instructions: 'Pay with cash when your order is delivered.'
		};
	},

	async verifyWebhook(): Promise<WebhookResult> {
		return { ok: false, error: 'COD does not receive webhooks' };
	}
};
