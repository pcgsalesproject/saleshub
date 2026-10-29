import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var _sql: ReturnType<typeof postgres> | undefined;
}

// Session pooler (5432). The transaction pooler (6543) hangs when pages fire several
// queries concurrently (Promise.all), so stay on session mode and keep one connection
// per serverless instance in production to limit pool usage.
const isProd = process.env.NODE_ENV === 'production';

const sql = globalThis._sql ?? postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: isProd ? 1 : 3,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

if (process.env.NODE_ENV !== 'production') globalThis._sql = sql;

export default sql;
