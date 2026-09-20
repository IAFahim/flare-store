import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

type Db = PostgresJsDatabase<typeof schema>;

// Lazily connected so asset/error requests never open a socket.
type DbStore = { url: string; sql?: Sql; db?: Db };

const requestDb = new AsyncLocalStorage<DbStore>();
let shared: DbStore | undefined;

function initStore(store: DbStore): Db {
	if (!store.db) {
		store.sql = postgres(store.url, { prepare: false });
		store.db = drizzle(store.sql, { schema });
	}
	return store.db;
}

/**
 * Run `fn` with a request-scoped DB connection. Workers sockets die with their
 * request, so the client cannot be cached globally — Hyperdrive pools upstream,
 * making per-request clients cheap. `done` ends the socket; schedule it via
 * `ctx.waitUntil` so it runs after the response is sent.
 */
export function withDb<T>(url: string, fn: (done: () => Promise<void>) => T): T {
	const store: DbStore = { url };
	const done = () => store.sql?.end() ?? Promise.resolve();
	return requestDb.run(store, () => fn(done));
}

function init(): Db {
	const store = requestDb.getStore();
	if (store) return initStore(store);
	// Non-request context (vite dev, scripts) — safe to share a singleton.
	if (!shared) {
		const url = env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set');
		shared = { url };
	}
	return initStore(shared);
}

export const db = new Proxy({} as Db, {
	get(_, prop) {
		const target = init() as unknown as Record<PropertyKey, unknown>;
		const value = target[prop];
		return typeof value === 'function' ? value.bind(target) : value;
	}
});
