import { codGateway } from './cod';
import { localGateway } from './local-gateway';
import type { PaymentGateway } from './types';

const gateways = new Map<string, PaymentGateway>([
	[codGateway.name, codGateway],
	[localGateway.name, localGateway]
]);

export const PAYMENT_METHODS = [...gateways.keys()];

export function getGateway(name: string): PaymentGateway {
	const gateway = gateways.get(name);
	if (!gateway) throw new Error(`Unknown payment method: ${name}`);
	return gateway;
}

export function hasGateway(name: string): boolean {
	return gateways.has(name);
}
