-- Add total_stars_earned column to track all-time earned stars for XP/level calculation
ALTER TABLE t_p84704826_gamified_habit_app.children
ADD COLUMN IF NOT EXISTS total_stars_earned integer NOT NULL DEFAULT 0;

-- Initialize total_stars_earned from existing data:
-- It should be at least as much as current stars balance
-- (since we don't have historical data, use current stars as baseline)
UPDATE t_p84704826_gamified_habit_app.children
SET total_stars_earned = GREATEST(stars, 0)
WHERE total_stars_earned = 0;
