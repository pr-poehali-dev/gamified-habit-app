ALTER TABLE t_p84704826_gamified_habit_app.tasks
    ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS late_stars INT,
    ADD COLUMN IF NOT EXISTS overdue_at TIMESTAMPTZ;

COMMENT ON COLUMN t_p84704826_gamified_habit_app.tasks.deadline IS 'Срок выполнения задачи';
COMMENT ON COLUMN t_p84704826_gamified_habit_app.tasks.late_stars IS 'Награда при выполнении после дедлайна';
COMMENT ON COLUMN t_p84704826_gamified_habit_app.tasks.overdue_at IS 'Когда задача была помечена просроченной';