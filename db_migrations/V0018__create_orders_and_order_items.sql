CREATE TABLE IF NOT EXISTS t_p84704826_gamified_habit_app.orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    parent_telegram_id BIGINT,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50),
    delivery_address TEXT,
    order_comment TEXT,
    amount NUMERIC(10,2) NOT NULL,
    robokassa_inv_id BIGINT UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_url TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p84704826_gamified_habit_app.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES t_p84704826_gamified_habit_app.orders(id),
    product_id VARCHAR(100),
    product_name VARCHAR(255),
    product_price NUMERIC(10,2),
    quantity INTEGER DEFAULT 1
);