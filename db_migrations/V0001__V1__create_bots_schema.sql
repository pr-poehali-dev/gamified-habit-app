CREATE TABLE t_p84704826_gamified_habit_app.parents (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p84704826_gamified_habit_app.children (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES t_p84704826_gamified_habit_app.parents(id),
    telegram_id BIGINT UNIQUE,
    name TEXT NOT NULL,
    age INT,
    stars INT DEFAULT 0,
    invite_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p84704826_gamified_habit_app.tasks (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES t_p84704826_gamified_habit_app.parents(id),
    child_id BIGINT REFERENCES t_p84704826_gamified_habit_app.children(id),
    title TEXT NOT NULL,
    stars INT NOT NULL DEFAULT 1,
    emoji TEXT DEFAULT '📋',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE t_p84704826_gamified_habit_app.rewards (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES t_p84704826_gamified_habit_app.parents(id),
    title TEXT NOT NULL,
    cost INT NOT NULL,
    emoji TEXT DEFAULT '🎁',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p84704826_gamified_habit_app.reward_purchases (
    id BIGSERIAL PRIMARY KEY,
    child_id BIGINT REFERENCES t_p84704826_gamified_habit_app.children(id),
    reward_id BIGINT REFERENCES t_p84704826_gamified_habit_app.rewards(id),
    status TEXT DEFAULT 'pending',
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p84704826_gamified_habit_app.bot_sessions (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    bot_type TEXT NOT NULL,
    state TEXT DEFAULT 'idle',
    state_data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX bot_sessions_unique ON t_p84704826_gamified_habit_app.bot_sessions(telegram_id, bot_type);
