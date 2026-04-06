
ALTER TABLE t_p84704826_gamified_habit_app.parents
ADD COLUMN notification_settings TEXT NOT NULL DEFAULT '{"tips":true,"activity":true}';

ALTER TABLE t_p84704826_gamified_habit_app.children
ADD COLUMN notification_settings TEXT NOT NULL DEFAULT '{"reminders":true,"motivation":true}';
