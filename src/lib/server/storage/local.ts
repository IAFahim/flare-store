import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { StorageDriver, StoredObject } from './index';

const UPLOAD_DIR = 'static/uploads';

/**
 * Local filesystem driver for development. Files land in static/uploads and
 * are served by the dev server / static adapter. Not suitable for Workers —
 * set STORAGE_DRIVER=supabase in production.
 */
export const localStorage: StorageDriver = {
	async put(key, data): Promise<StoredObject> {
		const dest = join(process.cwd(), UPLOAD_DIR, key);
		await mkdir(dirname(dest), { recursive: true });
		const buffer = data instanceof Uint8Array ? data : new Uint8Array(await data.arrayBuffer());
		await writeFile(dest, buffer);
		return { url: `/uploads/${key}`, path: key };
	},

	async remove(path) {
		try {
			await unlink(join(process.cwd(), UPLOAD_DIR, path));
		} catch {
			// already gone
		}
	}
};
