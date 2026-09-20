import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { verifyAdminCookie } from '$lib/server/admin/auth';
import { registerDefaultListeners } from '$lib/server/orders/events';

registerDefaultListeners();

const adminSession: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = await verifyAdminCookie(event.cookies.get('flare_admin'));
	return resolve(event);
};

const headers: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	if (event.url.pathname.startsWith('/admin') || event.url.pathname.startsWith('/api')) {
		response.headers.set('cache-control', 'no-store');
	}
	return response;
};

export const handle = sequence(adminSession, headers);
