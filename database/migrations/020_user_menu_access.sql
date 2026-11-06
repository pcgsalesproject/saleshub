-- Configure which top-level navigation areas each user can open.
-- A missing row keeps existing behavior until an administrator configures the user.
CREATE TABLE IF NOT EXISTS user_menu_access (
    email TEXT PRIMARY KEY,
    menu_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make case-insensitive lookups unique.
CREATE UNIQUE INDEX IF NOT EXISTS user_menu_access_email_lower_idx
    ON user_menu_access (LOWER(email));
