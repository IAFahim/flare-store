import { hasSupabaseStorage } from '$lib/server/config';
import { localStorage } from './local';
import { supabaseStorage } from './supabase';

export type StoredObject = {
	/** Public URL (or app-relative path for local driver) used in <img src> */
	url: string;
	/** Provider-internal path, stored for deletes */
	path: string;
};

export interface StorageDriver {
	put(key: string, data: Blob | Uint8Array, contentType: string): Promise<StoredObject>;
	remove(path: string): Promise<void>;
}

/**
 * Storage driver selection:
 *  - `STORAGE_DRIVER=supabase` + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → Supabase Storage
 *  - otherwise → local `static/uploads/` (dev only; files don't persist on Workers)
 */
export const storage: StorageDriver = hasSupabaseStorage() ? supabaseStorage : localStorage;
