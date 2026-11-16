-- Optional contact email for notifications. Only a verified address ever receives anything.
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;

-- One account per verified address. Unverified claims don't block anyone.
CREATE UNIQUE INDEX users_verified_email_idx ON users (lower(email)) WHERE email_verified_at IS NOT NULL;

-- Single-use verification links. Only a hash of the token is stored.
CREATE TABLE email_verifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_verifications_user_idx ON email_verifications (user_id, created_at DESC);

-- Set when the 24-hour reminder email goes out. Cleared if the appointment is rescheduled.
ALTER TABLE appointments ADD COLUMN reminder_sent_at TIMESTAMPTZ;
