CREATE TABLE IF NOT EXISTS t_p84704826_gamified_habit_app.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NULL,
  child_id BIGINT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(endpoint)
);