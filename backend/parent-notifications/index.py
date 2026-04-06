"""Триггерные уведомления родителям в Telegram — вызывается по расписанию (каждые 2-3 часа)."""
import json
import os
import urllib.request
import psycopg2
from datetime import datetime, timezone, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")
MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://tasks4kids.ru").rstrip("/") + "/parent"

TIPS = [
    "💡 Совет: добавляйте задания с дедлайном — это учит ребёнка планировать время.",
    "💡 Совет: чередуйте простые и сложные задания, чтобы поддерживать мотивацию.",
    "💡 Совет: хвалите ребёнка за выполненные задания — даже небольшие успехи важны!",
    "💡 Совет: добавьте награды в магазин — ребёнку будет интересно копить звёзды.",
    "💡 Совет: регулярность важнее количества — лучше 1-2 задания каждый день.",
]


def tg(token, chat_id, text, reply_markup=None):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=5)
        return True
    except Exception:
        return False


def was_sent_recently(cur, parent_id, trigger_type, hours=20):
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.notification_log "
        f"WHERE parent_id = %s AND trigger_type = %s AND sent_at > %s LIMIT 1",
        (parent_id, trigger_type, datetime.now(timezone.utc) - timedelta(hours=hours)),
    )
    return cur.fetchone() is not None


def log_sent(cur, parent_id, trigger_type):
    cur.execute(
        f"INSERT INTO {SCHEMA}.notification_log (parent_id, trigger_type) VALUES (%s, %s)",
        (parent_id, trigger_type),
    )


def get_tip(parent_id):
    return TIPS[parent_id % len(TIPS)]


def check_no_children(conn, cur, token, parent_id, tg_id, name):
    """Триггер 1: не добавлен ни один ребёнок (24ч после регистрации)."""
    if was_sent_recently(cur, parent_id, "no_children", hours=72):
        return False
    cur.execute(
        f"SELECT created_at FROM {SCHEMA}.parents WHERE id = %s", (parent_id,)
    )
    created = cur.fetchone()[0]
    if not created:
        return False
    age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
    if age_hours < 24:
        return False
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.children WHERE parent_id = %s", (parent_id,)
    )
    if cur.fetchone()[0] > 0:
        return False
    sent = tg(token, tg_id,
        f"👋 <b>{name or 'Привет'}!</b>\n\n"
        f"Вы зарегистрировались, но ещё не добавили ни одного ребёнка.\n\n"
        f"Откройте приложение → раздел <b>Профиль</b> → <b>Добавить ребёнка</b>. "
        f"Создайте первое задание и начните вместе!\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "➕ Добавить ребёнка", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "no_children")
    return sent


def check_no_tasks_today(conn, cur, token, parent_id, tg_id, name):
    """Триггер 2: ни одного задания за день (проверяем вечером)."""
    now = datetime.now(timezone.utc)
    if now.hour < 17:
        return False
    if was_sent_recently(cur, parent_id, "no_tasks_today", hours=20):
        return False
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.children WHERE parent_id = %s", (parent_id,)
    )
    if cur.fetchone()[0] == 0:
        return False
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE parent_id = %s AND created_at >= %s",
        (parent_id, today_start),
    )
    if cur.fetchone()[0] > 0:
        return False
    sent = tg(token, tg_id,
        f"📋 <b>{name or 'Родитель'}, сегодня пока нет новых заданий</b>\n\n"
        f"Ребёнок ждёт! Добавьте хотя бы одно задание — "
        f"даже маленькие дела формируют привычку.\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "📋 Добавить задание", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "no_tasks_today")
    return sent


def check_pending_tasks(conn, cur, token, parent_id, tg_id, name):
    """Триггер 3: ребёнок ждёт проверки задания >3ч."""
    if was_sent_recently(cur, parent_id, "pending_tasks", hours=8):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=3)
    cur.execute(
        f"SELECT COUNT(*), MIN(completed_at) FROM {SCHEMA}.tasks "
        f"WHERE parent_id = %s AND status = 'pending_confirm' AND completed_at < %s",
        (parent_id, threshold),
    )
    row = cur.fetchone()
    count = row[0]
    if count == 0:
        return False
    word = "задание" if count == 1 else ("задания" if count < 5 else "заданий")
    sent = tg(token, tg_id,
        f"✅ <b>Ребёнок ждёт проверки!</b>\n\n"
        f"{count} {word} выполнено и ожидает вашего подтверждения. "
        f"Быстрая проверка мотивирует ребёнка продолжать!\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "✅ Проверить задания", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "pending_tasks")
    return sent


def check_all_tasks_done(conn, cur, token, parent_id, tg_id, name):
    """Триггер 4: ребёнок выполнил все задания."""
    if was_sent_recently(cur, parent_id, "all_tasks_done", hours=20):
        return False
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE parent_id = %s AND status IN ('pending', 'pending_confirm')",
        (parent_id,),
    )
    active = cur.fetchone()[0]
    if active > 0:
        return False
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE parent_id = %s AND status IN ('approved', 'done') "
        f"AND completed_at > %s",
        (parent_id, datetime.now(timezone.utc) - timedelta(hours=24)),
    )
    recently_done = cur.fetchone()[0]
    if recently_done == 0:
        return False
    sent = tg(token, tg_id,
        f"🎉 <b>Все задания выполнены!</b>\n\n"
        f"Ребёнок молодец — все текущие задания сделаны. "
        f"Самое время добавить новые задачи на завтра!\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "📋 Добавить задания", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "all_tasks_done")
    return sent


def check_streak_warning(conn, cur, token, parent_id, tg_id, name):
    """Триггер 5: стрик может сгореть (не заходил сегодня)."""
    now = datetime.now(timezone.utc)
    if now.hour < 18:
        return False
    if was_sent_recently(cur, parent_id, "streak_warning", hours=20):
        return False
    cur.execute(
        f"SELECT streak_current, streak_last_date FROM {SCHEMA}.parents WHERE id = %s",
        (parent_id,),
    )
    row = cur.fetchone()
    streak = row[0]
    last_date = row[1]
    if streak < 2:
        return False
    today = now.date()
    if last_date and last_date >= today:
        return False
    sent = tg(token, tg_id,
        f"🔥 <b>Стрик {streak} дней может сгореть!</b>\n\n"
        f"Вы сегодня ещё не заходили в приложение. "
        f"Зайдите, чтобы сохранить серию и получить бонус!\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "🔥 Сохранить стрик", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "streak_warning")
    return sent


def check_child_inactive(conn, cur, token, parent_id, tg_id, name):
    """Триггер 6: ребёнок не заходил 3 дня."""
    if was_sent_recently(cur, parent_id, "child_inactive", hours=72):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(days=3)
    cur.execute(
        f"SELECT c.name FROM {SCHEMA}.children c "
        f"LEFT JOIN {SCHEMA}.tasks t ON t.child_id = c.id AND t.status IN ('approved', 'done', 'pending_confirm') AND t.completed_at > %s "
        f"WHERE c.parent_id = %s AND c.telegram_id IS NOT NULL "
        f"GROUP BY c.id, c.name "
        f"HAVING COUNT(t.id) = 0",
        (threshold, parent_id),
    )
    inactive = [r[0] for r in cur.fetchall()]
    if not inactive:
        return False
    children_text = ", ".join(inactive)
    sent = tg(token, tg_id,
        f"😴 <b>{children_text} давно не заходил(а)</b>\n\n"
        f"Более 3 дней без активности. Попробуйте добавить интересное задание "
        f"или напомните ребёнку про приложение!\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "📋 Создать задание", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "child_inactive")
    return sent


def check_pending_grades(conn, cur, token, parent_id, tg_id, name):
    """Триггер 7: непроверенные оценки >6ч."""
    if was_sent_recently(cur, parent_id, "pending_grades", hours=20):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=6)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.grade_requests "
        f"WHERE parent_id = %s AND status = 'pending' AND created_at < %s",
        (parent_id, threshold),
    )
    count = cur.fetchone()[0]
    if count == 0:
        return False
    word = "оценка ждёт" if count == 1 else ("оценки ждут" if count < 5 else "оценок ждут")
    sent = tg(token, tg_id,
        f"📝 <b>{count} {word} подтверждения!</b>\n\n"
        f"Ребёнок отправил оценки на проверку. "
        f"Подтвердите их, чтобы начислить звёзды!\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "📝 Проверить оценки", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "pending_grades")
    return sent


def check_new_wishes(conn, cur, token, parent_id, tg_id, name):
    """Триггер 8: ребёнок попросил награду."""
    if was_sent_recently(cur, parent_id, "new_wishes", hours=20):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=6)
    cur.execute(
        f"SELECT w.title, w.emoji, c.name FROM {SCHEMA}.reward_wishes w "
        f"JOIN {SCHEMA}.children c ON w.child_id = c.id "
        f"WHERE w.parent_id = %s AND w.status = 'pending' AND w.created_at > %s "
        f"ORDER BY w.created_at DESC LIMIT 3",
        (parent_id, datetime.now(timezone.utc) - timedelta(hours=24)),
    )
    wishes = cur.fetchall()
    if not wishes:
        return False
    wish_lines = "\n".join([f"  {w[1]} <b>{w[0]}</b> (от {w[2]})" for w in wishes])
    sent = tg(token, tg_id,
        f"💫 <b>Ребёнок мечтает о награде!</b>\n\n"
        f"{wish_lines}\n\n"
        f"Добавьте награду в магазин — это отличная мотивация!\n\n"
        f"{get_tip(parent_id)}",
        reply_markup={"inline_keyboard": [[{"text": "🎁 Открыть магазин наград", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, parent_id, "new_wishes")
    return sent


TRIGGERS = [
    ("important", check_pending_tasks),
    ("important", check_pending_grades),
    ("important", check_new_wishes),
    ("tips", check_no_children),
    ("tips", check_no_tasks_today),
    ("tips", check_all_tasks_done),
    ("activity", check_streak_warning),
    ("activity", check_child_inactive),
]


def handler(event: dict, context) -> dict:
    """Проверить триггеры и отправить уведомления родителям."""
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
    total_sent = 0
    errors = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, telegram_id, full_name, notification_settings FROM {SCHEMA}.parents "
                f"WHERE telegram_id IS NOT NULL AND notifications_enabled = true ORDER BY id"
            )
            parents = cur.fetchall()

        for parent_id, tg_id, name, settings_raw in parents:
            try:
                settings = json.loads(settings_raw) if settings_raw else {"tips": True, "activity": True}
            except Exception:
                settings = {"tips": True, "activity": True}
            for category, trigger_fn in TRIGGERS:
                if category != "important" and not settings.get(category, True):
                    continue
                try:
                    with conn.cursor() as cur:
                        sent = trigger_fn(conn, cur, token, parent_id, tg_id, name)
                        conn.commit()
                        if sent:
                            total_sent += 1
                except Exception as e:
                    conn.rollback()
                    errors += 1
                    print(f"[ERROR] trigger {trigger_fn.__name__} for parent {parent_id}: {e}")

    finally:
        conn.close()

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"ok": True, "notifications_sent": total_sent, "errors": errors}),
    }