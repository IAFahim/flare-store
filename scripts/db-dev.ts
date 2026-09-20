/**
 * Local dev Postgres without Docker — runs real PostgreSQL (embedded-postgres
 * binaries) in-process on port 5432 with the same credentials as compose.yaml.
 *
 * Usage: node scripts/db-dev.ts   (or `npm run db:dev`)
 * Data persists in ./.pgdata — delete it to reset.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { mkdirSync } from 'node:fs';

const pg = new EmbeddedPostgres({
	databaseDir: './.pgdata',
	user: 'root',
	password: 'mysecretpassword',
	port: 5432,
	persistent: true
});

mkdirSync('./.pgdata', { recursive: true });

await pg.initialise();
await pg.start();

try {
	await pg.createDatabase('local');
	console.log('[db] created database "local"');
} catch {
	// already exists
}

console.log('[db] PostgreSQL ready on localhost:5432 (root / mysecretpassword / local)');
console.log('[db] DATABASE_URL=postgres://root:mysecretpassword@localhost:5432/local');

const shutdown = async () => {
	console.log('\n[db] stopping…');
	await pg.stop();
	process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
