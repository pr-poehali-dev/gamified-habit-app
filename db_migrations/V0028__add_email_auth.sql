ALTER TABLE t_p84704826_gamified_habit_app.parents
  ADD COLUMN IF NOT EXISTS email text NULL,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_otp_code text NULL,
  ADD COLUMN IF NOT EXISTS email_otp_expires_at timestamp with time zone NULL;

CREATE UNIQUE INDEX IF NOT EXISTS parents_email_unique
  ON t_p84704826_gamified_habit_app.parents (email)
  WHERE email IS NOT NULL;
