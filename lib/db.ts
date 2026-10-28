import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var _sql: ReturnType<typeof postgres> | undefined;
}

// Use the Supabase transaction pooler (6543) instead of session mode (5432), which caps
// clients at pool_size 15 and is exhausted quickly by serverless instances.
const connectionString = process.env.DATABASE_URL!.replace(
  /(\.pooler\.supabase\.com):5432\b/,
  '$1:6543'
);

const isProd = process.env.NODE_ENV === 'production';

const sql = globalThis._sql ?? postgres(connectionString, {
  ssl: 'require',
  prepare: false, // required by Supabase transaction pooler (port 6543)
  max: isProd ? 1 : 3,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

if (process.env.NODE_ENV !== 'production') globalThis._sql = sql;

export default sql;
