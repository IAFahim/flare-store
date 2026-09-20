import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const config = {
	databaseUrl: env.DATABASE_URL,
	supabase: {
		url: env.SUPABASE_URL ?? '',
		serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
		storageBucket: env.SUPABASE_STORAGE_BUCKET ?? 'product-images'
	},
	storageDriver: (env.STORAGE_DRIVER ?? 'local') as 'local' | 'supabase',
	admin: {
		email: env.ADMIN_EMAIL ?? 'admin@example.com',
		password: env.ADMIN_PASSWORD ?? 'change-me'
	},
	sessionSecret: env.SESSION_SECRET ?? 'dev-only-secret-change-me',
	paymentWebhookSecret: env.PAYMENT_WEBHOOK_SECRET ?? '',
	site: {
		url: publicEnv.PUBLIC_SITE_URL ?? 'http://localhost:5173',
		name: publicEnv.PUBLIC_SITE_NAME ?? 'Flare Store',
		whatsapp: publicEnv.PUBLIC_WHATSAPP_NUMBER ?? ''
	}
} as const;

export function hasSupabaseStorage(): boolean {
	return (
		config.storageDriver === 'supabase' &&
		Boolean(config.supabase.url) &&
		Boolean(config.supabase.serviceRoleKey)
	);
}
