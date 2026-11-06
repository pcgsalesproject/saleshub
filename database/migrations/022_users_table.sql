-- One table for everyone allowed to use SalesHub: login name, reset-mail address,
-- role, reachable menus and whether the account is enabled.
-- Passwords stay in Supabase Auth (matched by email).
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    menu_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

-- Carry over existing role/menu configuration. Missing usernames default to the
-- email's local part (suffixed with the old id when that collides).
INSERT INTO users (username, email, role, menu_keys, created_at)
SELECT
    CASE WHEN ur.username IS NOT NULL THEN LOWER(ur.username)
         WHEN COUNT(*) OVER (PARTITION BY LOWER(split_part(ur.email, '@', 1))) > 1
              THEN LOWER(split_part(ur.email, '@', 1)) || ur.id
         ELSE LOWER(split_part(ur.email, '@', 1)) END,
    LOWER(ur.email),
    r.name,
    COALESCE(uma.menu_keys, ARRAY['sales_admin','employees','assets','assignments','asset_history','inspection']::TEXT[]),
    ur.created_at
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
LEFT JOIN user_menu_access uma ON LOWER(uma.email) = LOWER(ur.email)
ON CONFLICT DO NOTHING;

-- Existing login accounts that had no role row keep working as viewers.
INSERT INTO users (username, email, role, menu_keys)
SELECT
    CASE WHEN COUNT(*) OVER (PARTITION BY LOWER(split_part(au.email, '@', 1))) > 1
              OR EXISTS (SELECT 1 FROM users u WHERE LOWER(u.username) = LOWER(split_part(au.email, '@', 1)))
         THEN LOWER(split_part(au.email, '@', 1)) || '_' || substr(au.id::text, 1, 4)
         ELSE LOWER(split_part(au.email, '@', 1)) END,
    LOWER(au.email),
    'viewer',
    ARRAY['sales_admin','employees','assets','assignments','asset_history','inspection']::TEXT[]
FROM auth.users au
WHERE au.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(au.email))
ON CONFLICT DO NOTHING;
