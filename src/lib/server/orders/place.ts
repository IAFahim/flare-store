import { randomBytes } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import {
	orderEvents,
	orderItems,
	orders,
	productVariants,
	products,
	shippingZones,
	type Order,
	type OrderItem
} from '$lib/server/db/schema';
import { emitOrderEvent } from './events';
import { getGateway } from '$lib/server/payments/registry';
import type { PaymentInitiation } from '$lib/server/payments/types';

const itemSchema = z.object({
	variantId: z.coerce.number().int().positive(),
	quantity: z.coerce.number().int().min(1).max(20)
});

export const placeOrderSchema = z.object({
	customerName: z.string().trim().min(2, 'Name is required').max(120),
	customerPhone: z
		.string()
		.trim()
		.regex(/^[+0-9()\-\s]{6,20}$/, 'Enter a valid phone number'),
	customerAddress: z.string().trim().min(5, 'Address is required').max(500),
	customerNote: z.string().trim().max(500).optional().default(''),
	shippingZoneId: z.coerce.number().int().positive(),
	paymentMethod: z.string().min(1),
	items: z.array(itemSchema).min(1, 'Select at least one item')
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export type PlaceOrderResult = {
	order: Order;
	items: OrderItem[];
	payment: PaymentInitiation;
};

function publicId(): string {
	const stamp = Date.now().toString(36).toUpperCase();
	const rand = randomBytes(3).toString('hex').toUpperCase();
	return `FS-${stamp}-${rand}`;
}

/**
 * Creates the order, its items and the `order.placed` event in one
 * transaction, then delegates to the chosen payment gateway. Prices are
 * always recomputed server-side — the client only sends variant ids + qty.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
	const zoneRows = await db
		.select()
		.from(shippingZones)
		.where(and(eq(shippingZones.id, input.shippingZoneId), eq(shippingZones.active, true)))
		.limit(1);
	const zone = zoneRows[0];
	if (!zone) throw new Error('Invalid shipping zone');

	const variantIds = input.items.map((i) => i.variantId);
	const variantRows = await db
		.select({ variant: productVariants, product: products })
		.from(productVariants)
		.innerJoin(products, eq(productVariants.productId, products.id))
		.where(inArray(productVariants.id, variantIds));

	const byId = new Map(variantRows.map((r) => [r.variant.id, r]));
	const lines = input.items.map((item) => {
		const row = byId.get(item.variantId);
		if (!row || !row.variant.active || row.product.status !== 'active') {
			throw new Error('One of the selected items is unavailable');
		}
		if (row.variant.stock !== null && row.variant.stock < item.quantity) {
			throw new Error(`Insufficient stock for ${row.variant.name}`);
		}
		const unitPrice = row.variant.priceOverride ?? row.product.price;
		return {
			row,
			quantity: item.quantity,
			unitPrice,
			lineTotal: unitPrice * item.quantity
		};
	});

	const itemsTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
	const grandTotal = itemsTotal + zone.fee;
	const currency = lines[0]?.row.product.currency ?? 'BDT';
	const gateway = getGateway(input.paymentMethod);

	const { order, items } = await db.transaction(async (tx) => {
		const [order] = await tx
			.insert(orders)
			.values({
				publicId: publicId(),
				status: 'pending',
				paymentStatus: input.paymentMethod === 'cod' ? 'unpaid' : 'pending',
				paymentMethod: input.paymentMethod,
				customerName: input.customerName,
				customerPhone: input.customerPhone,
				customerAddress: input.customerAddress,
				customerNote: input.customerNote,
				itemsTotal,
				shippingFee: zone.fee,
				grandTotal,
				currency,
				shippingZoneId: zone.id,
				shippingZoneName: zone.name
			})
			.returning();

		const items = await tx
			.insert(orderItems)
			.values(
				lines.map((l) => ({
					orderId: order.id,
					productId: l.row.product.id,
					variantId: l.row.variant.id,
					title: l.row.product.title,
					variantName: l.row.variant.name,
					options: l.row.variant.options,
					unitPrice: l.unitPrice,
					quantity: l.quantity,
					lineTotal: l.lineTotal
				}))
			)
			.returning();

		// decrement tracked stock
		for (const l of lines) {
			if (l.row.variant.stock !== null) {
				await tx
					.update(productVariants)
					.set({ stock: l.row.variant.stock - l.quantity })
					.where(eq(productVariants.id, l.row.variant.id));
			}
		}

		await tx.insert(orderEvents).values({
			orderId: order.id,
			type: 'order.placed',
			fromStatus: null,
			toStatus: 'pending',
			actor: 'customer',
			payload: { paymentMethod: input.paymentMethod, grandTotal }
		});

		return { order, items };
	});

	emitOrderEvent('order.placed', {
		orderId: order.id,
		publicId: order.publicId,
		from: '',
		to: 'pending',
		actor: 'customer',
		payload: { paymentMethod: input.paymentMethod, grandTotal }
	});

	const payment = await gateway.initiatePayment(order, items);
	return { order, items, payment };
}
