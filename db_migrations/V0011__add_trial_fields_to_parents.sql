ALTER TABLE t_p84704826_gamified_habit_app.parents
  ADD COLUMN trial_started_at TIMESTAMPTZ NULL,
  ADD COLUMN trial_ends_at TIMESTAMPTZ NULL,
  ADD COLUMN trial_used BOOLEAN NOT NULL DEFAULT false;