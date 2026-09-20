import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	orderEvents,
	orderItems,
	orders,
	productImages,
	products,
	productVariants,
	shippingZones,
	type Order,
	type OrderEvent,
	type OrderItem,
	type Product,
	type ProductImage,
	type ProductVariant,
	type ShippingZone
} from '$lib/server/db/schema';

export type ProductWithRelations = Product & {
	images: ProductImage[];
	variants: ProductVariant[];
};

function effectivePrice(product: Product, variant?: ProductVariant): number {
	return variant?.priceOverride ?? product.price;
}

export async function listActiveProducts(): Promise<ProductWithRelations[]> {
	const rows = await db
		.select()
		.from(products)
		.where(eq(products.status, 'active'))
		.orderBy(asc(products.position), desc(products.createdAt));
	return attachRelations(rows);
}

export async function getFeaturedProduct(): Promise<ProductWithRelations | null> {
	const [row] = await db
		.select()
		.from(products)
		.where(and(eq(products.status, 'active'), eq(products.featured, true)))
		.orderBy(asc(products.position))
		.limit(1);
	if (!row) return null;
	const [withRel] = await attachRelations([row]);
	return withRel;
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
	const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
	if (!row) return null;
	const [withRel] = await attachRelations([row]);
	return withRel;
}

export async function getProductById(id: number): Promise<ProductWithRelations | null> {
	const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
	if (!row) return null;
	const [withRel] = await attachRelations([row]);
	return withRel;
}

export async function listAllProducts(): Promise<ProductWithRelations[]> {
	const rows = await db
		.select()
		.from(products)
		.orderBy(asc(products.position), desc(products.createdAt));
	return attachRelations(rows);
}

async function attachRelations(rows: Product[]): Promise<ProductWithRelations[]> {
	if (rows.length === 0) return [];
	const ids = rows.map((r) => r.id);
	const [images, variants] = await Promise.all([
		db
			.select()
			.from(productImages)
			.where(inArray(productImages.productId, ids))
			.orderBy(asc(productImages.position)),
		db
			.select()
			.from(productVariants)
			.where(inArray(productVariants.productId, ids))
			.orderBy(asc(productVariants.position))
	]);
	return rows.map((p) => ({
		...p,
		images: images.filter((i) => i.productId === p.id),
		variants: variants.filter((v) => v.productId === p.id)
	}));
}

export async function listShippingZones(): Promise<ShippingZone[]> {
	return db
		.select()
		.from(shippingZones)
		.where(eq(shippingZones.active, true))
		.orderBy(asc(shippingZones.position));
}

export type OrderWithItems = Order & { items: OrderItem[]; events: OrderEvent[] };

export async function getOrderByPublicId(publicId: string): Promise<OrderWithItems | null> {
	const [order] = await db.select().from(orders).where(eq(orders.publicId, publicId)).limit(1);
	if (!order) return null;
	return attachOrderRelations(order);
}

export async function getOrderById(id: number): Promise<OrderWithItems | null> {
	const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
	if (!order) return null;
	return attachOrderRelations(order);
}

export async function listOrders(status?: string): Promise<OrderWithItems[]> {
	const rows = status
		? await db
				.select()
				.from(orders)
				.where(eq(orders.status, status as Order['status']))
				.orderBy(desc(orders.createdAt))
				.limit(200)
		: await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
	return Promise.all(rows.map(attachOrderRelations));
}

export async function countOrdersByStatus(): Promise<Record<string, number>> {
	const rows = await db.select({ status: orders.status }).from(orders);
	const counts: Record<string, number> = {};
	for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
	return counts;
}

async function attachOrderRelations(order: Order): Promise<OrderWithItems> {
	const [items, events] = await Promise.all([
		db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
		db
			.select()
			.from(orderEvents)
			.where(eq(orderEvents.orderId, order.id))
			.orderBy(asc(orderEvents.createdAt))
	]);
	return { ...order, items, events };
}

export { effectivePrice };
