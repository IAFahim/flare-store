import { sql } from 'drizzle-orm';
import {
	bigint,
	boolean,
	check,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export {
	EVENT_ACTORS,
	ORDER_STATUSES,
	PAYMENT_STATUSES,
	PRODUCT_STATUSES,
	type EventActor,
	type OrderStatus,
	type PaymentStatus,
	type ProductStatus
} from '$lib/constants';

import type { EventActor, OrderStatus, PaymentStatus, ProductStatus } from '$lib/constants';

export type ProductDetail = { label: string; value: string };
export type ProductOption = { name: string; values: string[] };
export type VariantOptions = Record<string, string>;

const createdAt = timestamp('created_at', { withTimezone: true, mode: 'date' })
	.notNull()
	.defaultNow();
const updatedAt = timestamp('updated_at', { withTimezone: true, mode: 'date' })
	.notNull()
	.defaultNow()
	.$onUpdate(() => new Date());

const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' });

export const products = pgTable(
	'products',
	{
		id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		subtitle: text('subtitle').notNull().default(''),
		description: text('description').notNull().default(''),
		details: jsonb('details').$type<ProductDetail[]>().notNull().default([]),
		options: jsonb('options').$type<ProductOption[]>().notNull().default([]),
		price: money('price').notNull(),
		compareAtPrice: money('compare_at_price'),
		currency: text('currency').notNull().default('BDT'),
		status: text('status').$type<ProductStatus>().notNull().default('draft'),
		featured: boolean('featured').notNull().default(false),
		position: integer('position').notNull().default(0),
		createdAt,
		updatedAt
	},
	(t) => [
		index('products_status_featured_idx').on(t.status, t.featured),
		check('products_status_check', sql`${t.status} in ('draft', 'active', 'archived')`),
		check('products_price_check', sql`${t.price} >= 0`)
	]
);

export const productImages = pgTable(
	'product_images',
	{
		id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
		productId: bigint('product_id', { mode: 'number' })
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		url: text('url').notNull(),
		alt: text('alt').notNull().default(''),
		colorKey: text('color_key'),
		position: integer('position').notNull().default(0),
		createdAt
	},
	(t) => [index('product_images_product_id_idx').on(t.productId)]
);

export const productVariants = pgTable(
	'product_variants',
	{
		id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
		productId: bigint('product_id', { mode: 'number' })
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		options: jsonb('options').$type<VariantOptions>().notNull().default({}),
		sku: text('sku'),
		priceOverride: money('price_override'),
		stock: integer('stock'),
		active: boolean('active').notNull().default(true),
		position: integer('position').notNull().default(0),
		createdAt,
		updatedAt
	},
	(t) => [
		index('product_variants_product_id_idx').on(t.productId),
		uniqueIndex('product_variants_product_name_idx').on(t.productId, t.name),
		check('product_variants_stock_check', sql`${t.stock} is null or ${t.stock} >= 0`)
	]
);

export const shippingZones = pgTable('shipping_zones', {
	id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
	name: text('name').notNull(),
	fee: money('fee').notNull().default(0),
	position: integer('position').notNull().default(0),
	active: boolean('active').notNull().default(true),
	createdAt
});

export const orders = pgTable(
	'orders',
	{
		id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
		publicId: text('public_id').notNull().unique(),
		status: text('status').$type<OrderStatus>().notNull().default('pending'),
		paymentStatus: text('payment_status').$type<PaymentStatus>().notNull().default('unpaid'),
		paymentMethod: text('payment_method').notNull().default('cod'),
		customerName: text('customer_name').notNull(),
		customerPhone: text('customer_phone').notNull(),
		customerAddress: text('customer_address').notNull(),
		customerNote: text('customer_note').notNull().default(''),
		itemsTotal: money('items_total').notNull(),
		shippingFee: money('shipping_fee').notNull().default(0),
		grandTotal: money('grand_total').notNull(),
		currency: text('currency').notNull().default('BDT'),
		shippingZoneId: bigint('shipping_zone_id', { mode: 'number' }).references(
			() => shippingZones.id,
			{ onDelete: 'set null' }
		),
		shippingZoneName: text('shipping_zone_name').notNull().default(''),
		createdAt,
		updatedAt
	},
	(t) => [
		index('orders_status_idx').on(t.status),
		index('orders_created_at_idx').on(t.createdAt),
		check(
			'orders_status_check',
			sql`${t.status} in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')`
		),
		check(
			'orders_payment_status_check',
			sql`${t.paymentStatus} in ('unpaid', 'pending', 'paid', 'failed', 'refunded')`
		),
		check('orders_totals_check', sql`${t.grandTotal} >= 0 and ${t.itemsTotal} >= 0`)
	]
);

export const orderItems = pgTable(
	'order_items',
	{
		id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
		orderId: bigint('order_id', { mode: 'number' })
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		productId: bigint('product_id', { mode: 'number' }).references(() => products.id, {
			onDelete: 'set null'
		}),
		variantId: bigint('variant_id', { mode: 'number' }).references(() => productVariants.id, {
			onDelete: 'set null'
		}),
		title: text('title').notNull(),
		variantName: text('variant_name').notNull().default(''),
		options: jsonb('options').$type<VariantOptions>().notNull().default({}),
		unitPrice: money('unit_price').notNull(),
		quantity: integer('quantity').notNull(),
		lineTotal: money('line_total').notNull(),
		createdAt
	},
	(t) => [
		index('order_items_order_id_idx').on(t.orderId),
		index('order_items_product_id_idx').on(t.productId),
		check('order_items_quantity_check', sql`${t.quantity} > 0`)
	]
);

export const orderEvents = pgTable(
	'order_events',
	{
		id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
		orderId: bigint('order_id', { mode: 'number' })
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		fromStatus: text('from_status'),
		toStatus: text('to_status'),
		actor: text('actor').$type<EventActor>().notNull().default('system'),
		note: text('note').notNull().default(''),
		payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
		createdAt
	},
	(t) => [
		index('order_events_order_id_idx').on(t.orderId, t.createdAt),
		check('order_events_actor_check', sql`${t.actor} in ('customer', 'admin', 'webhook', 'system')`)
	]
);

export const paymentEvents = pgTable(
	'payment_events',
	{
		id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
		provider: text('provider').notNull(),
		externalId: text('external_id').notNull(),
		eventType: text('event_type').notNull(),
		orderId: bigint('order_id', { mode: 'number' }).references(() => orders.id, {
			onDelete: 'set null'
		}),
		signatureValid: boolean('signature_valid').notNull().default(false),
		processed: boolean('processed').notNull().default(false),
		error: text('error'),
		payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
		createdAt
	},
	(t) => [
		uniqueIndex('payment_events_provider_external_idx').on(t.provider, t.externalId),
		index('payment_events_order_id_idx').on(t.orderId)
	]
);

export const settings = pgTable('settings', {
	key: text('key').primaryKey(),
	value: jsonb('value').$type<unknown>().notNull(),
	updatedAt
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ShippingZone = typeof shippingZones.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type PaymentEvent = typeof paymentEvents.$inferSelect;
