CREATE UNIQUE INDEX IF NOT EXISTS parents_telegram_id_unique_positive
  ON t_p84704826_gamified_habit_app.parents (telegram_id)
  WHERE telegram_id > 0;