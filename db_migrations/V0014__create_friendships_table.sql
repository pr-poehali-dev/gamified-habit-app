
CREATE TABLE t_p84704826_gamified_habit_app.friendships (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES t_p84704826_gamified_habit_app.children(id),
    addressee_id BIGINT NOT NULL REFERENCES t_p84704826_gamified_habit_app.children(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON t_p84704826_gamified_habit_app.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON t_p84704826_gamified_habit_app.friendships(addressee_id);

ALTER TABLE t_p84704826_gamified_habit_app.children
ADD COLUMN friend_code TEXT UNIQUE;
