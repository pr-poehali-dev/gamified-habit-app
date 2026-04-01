-- Расширение схемы для полного функционала Mini App
ALTER TABLE t_p84704826_gamified_habit_app.tasks
  ADD COLUMN IF NOT EXISTS require_photo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_confirm boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_url text NULL,
  ADD COLUMN IF NOT EXISTS photo_status text NULL DEFAULT 'none';

ALTER TABLE t_p84704826_gamified_habit_app.children
  ADD COLUMN IF NOT EXISTS avatar text NULL DEFAULT '👧',
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;

ALTER TABLE t_p84704826_gamified_habit_app.parents
  ADD COLUMN IF NOT EXISTS parent_xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_current integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date date NULL,
  ADD COLUMN IF NOT EXISTS streak_claimed_today boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS streak_longest integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS t_p84704826_gamified_habit_app.grade_requests (
  id bigserial PRIMARY KEY,
  child_id bigint REFERENCES t_p84704826_gamified_habit_app.children(id),
  parent_id bigint REFERENCES t_p84704826_gamified_habit_app.parents(id),
  subject text NOT NULL,
  grade integer NOT NULL CHECK (grade BETWEEN 2 AND 5),
  date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stars_awarded integer NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p84704826_gamified_habit_app.stickers (
  id bigserial PRIMARY KEY,
  child_id bigint REFERENCES t_p84704826_gamified_habit_app.children(id),
  sticker_id text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE (child_id, sticker_id)
);

CREATE TABLE IF NOT EXISTS t_p84704826_gamified_habit_app.achievements (
  id bigserial PRIMARY KEY,
  child_id bigint REFERENCES t_p84704826_gamified_habit_app.children(id),
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (child_id, achievement_id)
);
