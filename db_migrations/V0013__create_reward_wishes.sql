CREATE TABLE t_p84704826_gamified_habit_app.reward_wishes (
  id BIGSERIAL PRIMARY KEY,
  child_id BIGINT NOT NULL REFERENCES t_p84704826_gamified_habit_app.children(id),
  parent_id BIGINT NOT NULL REFERENCES t_p84704826_gamified_habit_app.parents(id),
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);