export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
	'pending',
	'confirmed',
	'shipped',
	'delivered',
	'cancelled'
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const EVENT_ACTORS = ['customer', 'admin', 'webhook', 'system'] as const;
export type EventActor = (typeof EVENT_ACTORS)[number];
