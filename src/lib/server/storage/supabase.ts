import { createClient } from '@supabase/supabase-js';
import { config } from '$lib/server/config';
import type { StorageDriver, StoredObject } from './index';

function client() {
	return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
		auth: { persistSession: false }
	});
}

export const supabaseStorage: StorageDriver = {
	async put(key, data, contentType): Promise<StoredObject> {
		const bucket = client().storage.from(config.supabase.storageBucket);
		const { error } = await bucket.upload(key, data, {
			contentType,
			cacheControl: '31536000',
			upsert: false
		});
		if (error) throw new Error(`Supabase upload failed: ${error.message}`);
		const { data: pub } = bucket.getPublicUrl(key);
		return { url: pub.publicUrl, path: key };
	},

	async remove(path) {
		const { error } = await client().storage.from(config.supabase.storageBucket).remove([path]);
		if (error) throw new Error(`Supabase remove failed: ${error.message}`);
	}
};
