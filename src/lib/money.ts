const CURRENCY_SYMBOLS: Record<string, string> = {
	BDT: '৳',
	USD: '$',
	EUR: '€',
	INR: '₹'
};

export function formatMoney(amount: number, currency = 'BDT'): string {
	const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
	const formatted = amount.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	return `${formatted}${symbol}`;
}
