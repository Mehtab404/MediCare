-- Sessions issued before this moment stop working. Set whenever a password is changed or reset.
-- NULL means the password was never changed, so existing sessions stay valid.
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMPTZ;

-- Single-use reset links. Only a hash of the token is stored.
CREATE TABLE password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX password_resets_user_idx ON password_resets (user_id, created_at DESC);
