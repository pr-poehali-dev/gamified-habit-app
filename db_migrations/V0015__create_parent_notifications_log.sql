
CREATE TABLE t_p84704826_gamified_habit_app.notification_log (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT NOT NULL REFERENCES t_p84704826_gamified_habit_app.parents(id),
    trigger_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_log_parent_trigger ON t_p84704826_gamified_habit_app.notification_log(parent_id, trigger_type, sent_at);
