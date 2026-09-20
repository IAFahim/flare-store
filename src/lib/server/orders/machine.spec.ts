import { describe, expect, it } from 'vitest';
import { canTransition, nextStatuses, PAYMENT_TRANSITIONS } from './machine';
import { placeOrderSchema } from './place';

describe('order state machine', () => {
	it('allows the happy path pending → confirmed → shipped → delivered', () => {
		expect(canTransition('pending', 'confirmed')).toBe(true);
		expect(canTransition('confirmed', 'shipped')).toBe(true);
		expect(canTransition('shipped', 'delivered')).toBe(true);
	});

	it('allows cancellation before delivery', () => {
		expect(canTransition('pending', 'cancelled')).toBe(true);
		expect(canTransition('confirmed', 'cancelled')).toBe(true);
		expect(canTransition('shipped', 'cancelled')).toBe(true);
	});

	it('rejects illegal transitions', () => {
		expect(canTransition('pending', 'shipped')).toBe(false);
		expect(canTransition('pending', 'delivered')).toBe(false);
		expect(canTransition('delivered', 'cancelled')).toBe(false);
		expect(canTransition('cancelled', 'confirmed')).toBe(false);
	});

	it('has terminal states with no outgoing transitions', () => {
		expect(nextStatuses('delivered')).toEqual([]);
		expect(nextStatuses('cancelled')).toEqual([]);
	});
});

describe('payment state machine', () => {
	it('COD: unpaid → paid', () => {
		expect(PAYMENT_TRANSITIONS.unpaid).toContain('paid');
	});
	it('gateway: pending → paid | failed', () => {
		expect(PAYMENT_TRANSITIONS.pending).toEqual(['paid', 'failed']);
	});
	it('paid can only be refunded', () => {
		expect(PAYMENT_TRANSITIONS.paid).toEqual(['refunded']);
	});
});

describe('placeOrderSchema', () => {
	const base = {
		customerName: 'Jane Doe',
		customerPhone: '01712345678',
		customerAddress: 'House 12, Road 5, Dhaka',
		shippingZoneId: '1',
		paymentMethod: 'cod',
		items: [{ variantId: '3', quantity: '2' }]
	};

	it('accepts valid input with string-coerced numbers', () => {
		const parsed = placeOrderSchema.safeParse(base);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.items[0]).toEqual({ variantId: 3, quantity: 2 });
		}
	});

	it('rejects empty items', () => {
		expect(placeOrderSchema.safeParse({ ...base, items: [] }).success).toBe(false);
	});

	it('rejects bad phone numbers', () => {
		expect(placeOrderSchema.safeParse({ ...base, customerPhone: 'not-a-phone' }).success).toBe(
			false
		);
	});

	it('rejects short addresses', () => {
		expect(placeOrderSchema.safeParse({ ...base, customerAddress: 'Dh' }).success).toBe(false);
	});
});
