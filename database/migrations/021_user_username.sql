-- Users sign in with a username; email is kept for password-reset mail.
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_username_lower_idx
    ON user_roles (LOWER(username));
