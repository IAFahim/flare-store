import { env } from '$env/dynamic/private';
import { config } from '$lib/server/config';
import type { Order } from '$lib/server/db/schema';
import type { PaymentGateway, PaymentInitiation, WebhookResult } from './types';

/**
 * Generic adapter for a "local" hosted-payment gateway (bKash, SSLCommerz,
 * aamarPay-style). The provider redirects the customer to a hosted checkout
 * and calls our webhook with an HMAC-SHA256 signature of the raw body in the
 * `x-signature` header.
 *
 * Env:
 *   LOCAL_GATEWAY_URL        — base URL of the gateway's create-session API
 *   PAYMENT_WEBHOOK_SECRET   — shared secret used to verify webhook signatures
 */
async function hmacSha256Hex(secret: string, body: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
	return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

type GatewayEventPayload = {
	event_id?: string;
	type?: string;
	data?: {
		order_id?: string;
		transaction_id?: string;
		amount?: number;
	};
};

const TYPE_MAP: Record<string, 'payment.succeeded' | 'payment.failed' | 'payment.refunded'> = {
	'payment.succeeded': 'payment.succeeded',
	'payment.completed': 'payment.succeeded',
	'payment.success': 'payment.succeeded',
	'payment.failed': 'payment.failed',
	'payment.cancelled': 'payment.failed',
	'payment.refunded': 'payment.refunded'
};

export const localGateway: PaymentGateway = {
	name: 'local_gateway',

	async initiatePayment(order: Order): Promise<PaymentInitiation> {
		const base = env.LOCAL_GATEWAY_URL;
		if (!base) {
			return {
				kind: 'instructions',
				instructions:
					'Online payment is not configured yet. Please choose cash on delivery or contact us.'
			};
		}

		const res = await fetch(`${base.replace(/\/$/, '')}/api/session`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				order_id: order.publicId,
				amount: order.grandTotal,
				currency: order.currency,
				customer: {
					name: order.customerName,
					phone: order.customerPhone
				},
				callback_url: `${config.site.url}/order/${order.publicId}`,
				webhook_url: `${config.site.url}/api/webhooks/local_gateway`
			})
		});

		if (!res.ok) {
			throw new Error(`Gateway session failed: ${res.status}`);
		}
		const data = (await res.json()) as { redirect_url?: string; payment_url?: string };
		const redirectUrl = data.redirect_url ?? data.payment_url;
		if (!redirectUrl) throw new Error('Gateway did not return a redirect URL');
		return { kind: 'redirect', redirectUrl };
	},

	async verifyWebhook(request: Request, rawBody: string): Promise<WebhookResult> {
		const secret = config.paymentWebhookSecret;
		if (!secret) return { ok: false, error: 'PAYMENT_WEBHOOK_SECRET is not configured' };

		const signature = request.headers.get('x-signature') ?? '';
		const expected = await hmacSha256Hex(secret, rawBody);
		if (!signature || !timingSafeEqual(signature.toLowerCase(), expected)) {
			return { ok: false, error: 'Invalid webhook signature' };
		}

		let payload: GatewayEventPayload;
		try {
			payload = JSON.parse(rawBody);
		} catch {
			return { ok: false, error: 'Malformed webhook payload' };
		}

		const type = payload.type ? TYPE_MAP[payload.type] : undefined;
		const orderPublicId = payload.data?.order_id;
		if (!payload.event_id || !type || !orderPublicId) {
			return { ok: false, error: 'Payload missing event_id, type, or order_id' };
		}

		return {
			ok: true,
			event: {
				externalId: payload.event_id,
				type,
				orderPublicId,
				transactionId: payload.data?.transaction_id,
				amount: payload.data?.amount,
				resultingStatus:
					type === 'payment.succeeded' ? 'paid' : type === 'payment.failed' ? 'failed' : 'refunded',
				raw: payload as Record<string, unknown>
			}
		};
	}
};
