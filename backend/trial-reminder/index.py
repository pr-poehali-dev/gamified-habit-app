"""Ежедневная проверка истекающих Trial-периодов и отправка напоминаний."""
import json
import os
import urllib.request
import psycopg2
from datetime import datetime, timezone, timedelta
from math import ceil

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")
MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://tasks4kids.ru").rstrip("/") + "/parent"


def tg(token, chat_id, text, reply_markup=None):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Проверить истекающие Trial и отправить напоминания родителям."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    token = os.environ.get("PARENT_BOT_TOKEN", "")
    db_url = os.environ.get("DATABASE_URL", "")
    if not token or not db_url:
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"ok": False, "error": "missing_config"}),
        }

    conn = psycopg2.connect(db_url)
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(hours=36)
    sent = 0
    expired = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, telegram_id, full_name, trial_ends_at "
                f"FROM {SCHEMA}.parents "
                f"WHERE trial_ends_at IS NOT NULL "
                f"AND trial_ends_at > %s "
                f"AND trial_ends_at <= %s "
                f"AND trial_reminder_sent = false "
                f"AND is_premium = false",
                (now, tomorrow),
            )
            expiring = cur.fetchall()

        for parent_id, telegram_id, name, trial_ends_at in expiring:
            remaining = trial_ends_at - now
            hours_left = max(1, ceil(remaining.total_seconds() / 3600))

            if hours_left <= 24:
                time_text = f"{hours_left} ч"
            else:
                time_text = "1 день"

            tg(
                token,
                telegram_id,
                f"⏰ <b>Пробный период заканчивается через {time_text}!</b>\n\n"
                f"После окончания станут недоступны:\n\n"
                f"📸 <b>Фото-задания</b> — ребёнок не сможет присылать фото выполненных заданий\n"
                f"👨‍👩‍👧‍👦 <b>Несколько детей</b> — нельзя будет добавить больше одного ребёнка\n"
                f"📊 <b>Аналитика</b> — подробная статистика по каждому ребёнку\n\n"
                f"Оформите подписку, чтобы сохранить все возможности 👇",
                reply_markup={
                    "inline_keyboard": [
                        [{"text": "👑 Подробнее о Premium", "web_app": {"url": MINI_APP_URL}}]
                    ]
                },
            )

            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.parents SET trial_reminder_sent = true WHERE id = %s",
                    (parent_id,),
                )
            conn.commit()
            sent += 1

        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, telegram_id, full_name "
                f"FROM {SCHEMA}.parents "
                f"WHERE trial_ends_at IS NOT NULL "
                f"AND trial_ends_at <= %s "
                f"AND is_premium = false "
                f"AND trial_used = true",
                (now,),
            )
            just_expired = cur.fetchall()

        for parent_id, telegram_id, name in just_expired:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT COUNT(*) FROM {SCHEMA}.parents "
                    f"WHERE id = %s AND trial_ends_at <= %s "
                    f"AND trial_ends_at > %s",
                    (parent_id, now, now - timedelta(hours=25)),
                )
                row = cur.fetchone()
                if row and row[0] > 0:
                    tg(
                        token,
                        telegram_id,
                        f"😔 <b>Пробный период завершён</b>\n\n"
                        f"Спасибо, что попробовали Premium, {name or 'друг'}!\n\n"
                        f"Базовые функции по-прежнему доступны:\n"
                        f"✅ Создание заданий\n"
                        f"✅ Магазин наград\n"
                        f"✅ Достижения и уровни\n"
                        f"✅ Серии дней\n\n"
                        f"Чтобы вернуть фото-задания, аналитику и несколько детей — оформите подписку 👇",
                        reply_markup={
                            "inline_keyboard": [
                                [{"text": "👑 Оформить Premium", "web_app": {"url": MINI_APP_URL}}]
                            ]
                        },
                    )
                    expired += 1

    finally:
        conn.close()

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"ok": True, "reminders_sent": sent, "expired_notified": expired}),
    }
