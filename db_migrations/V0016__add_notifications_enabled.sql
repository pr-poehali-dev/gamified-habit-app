
ALTER TABLE t_p84704826_gamified_habit_app.parents
ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE t_p84704826_gamified_habit_app.children
ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT true;
