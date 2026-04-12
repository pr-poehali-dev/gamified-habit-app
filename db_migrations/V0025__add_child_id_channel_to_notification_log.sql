ALTER TABLE t_p84704826_gamified_habit_app.notification_log 
  ADD COLUMN IF NOT EXISTS child_id bigint NULL,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'telegram';