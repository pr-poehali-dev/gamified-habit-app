UPDATE t_p84704826_gamified_habit_app.parents
SET trial_started_at = NOW(),
    trial_ends_at = NOW() + INTERVAL '7 days',
    trial_used = true
WHERE trial_used = false AND phone_verified = true;