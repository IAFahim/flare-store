import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkCredentials, createAdminSession } from '$lib/server/admin/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.isAdmin) redirect(303, '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');

		if (!checkCredentials(email, password)) {
			return fail(401, { error: 'Invalid email or password' });
		}
		await createAdminSession(cookies);
		redirect(303, '/admin');
	}
};
