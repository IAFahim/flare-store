import { config } from '$lib/server/config';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'flare_admin';
const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8h

async function hmacHex(value: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(config.sessionSecret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
	return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export async function createAdminSession(cookies: Cookies): Promise<void> {
	const expires = Date.now() + MAX_AGE_MS;
	const payload = `${config.admin.email}.${expires}`;
	const signature = await hmacHex(payload);
	cookies.set(COOKIE_NAME, `${payload}.${signature}`, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV,
		maxAge: MAX_AGE_MS / 1000
	});
}

export function clearAdminSession(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

export async function verifyAdminCookie(value: string | undefined): Promise<boolean> {
	if (!value) return false;
	// token = `${email}.${expires}.${sig}` — emails contain dots, so split
	// from the right: signature after last dot, expiry before it.
	const lastDot = value.lastIndexOf('.');
	if (lastDot < 0) return false;
	const signature = value.slice(lastDot + 1);
	const rest = value.slice(0, lastDot);
	const midDot = rest.lastIndexOf('.');
	if (midDot < 0) return false;
	const email = rest.slice(0, midDot);
	const expires = rest.slice(midDot + 1);

	if (email !== config.admin.email) return false;
	if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
	const expected = await hmacHex(`${email}.${expires}`);
	return timingSafeEqual(signature, expected);
}

export function checkCredentials(email: string, password: string): boolean {
	return email === config.admin.email && password === config.admin.password;
}
