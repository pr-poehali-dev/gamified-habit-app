"""Триггерные уведомления детям в Telegram — вызывается по расписанию (каждые 2-3 часа)."""
import json
import os
import urllib.request
import psycopg2
from datetime import datetime, timezone, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")
MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://tasks4kids.ru").rstrip("/") + "/child"

MOTIVATIONS = [
    "🚀 Ты на верном пути! Каждая звезда приближает тебя к новой награде.",
    "💪 Чемпионы не сдаются — покажи, на что ты способен!",
    "🌟 Маленькие шаги ведут к большим победам!",
    "🎯 Ты молодец! Продолжай в том же духе!",
    "⭐ Каждое задание — это шанс стать ещё круче!",
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


def was_sent_recently(cur, child_id, trigger_type, hours=20):
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.notification_log "
        f"WHERE parent_id = %s AND trigger_type = %s AND sent_at > %s LIMIT 1",
        (child_id, trigger_type, datetime.now(timezone.utc) - timedelta(hours=hours)),
    )
    return cur.fetchone() is not None


def log_sent(cur, child_id, trigger_type):
    cur.execute(
        f"INSERT INTO {SCHEMA}.notification_log (parent_id, trigger_type) VALUES (%s, %s)",
        (child_id, trigger_type),
    )


def get_motivation(child_id):
    return MOTIVATIONS[child_id % len(MOTIVATIONS)]


def check_new_tasks(conn, cur, token, child_id, tg_id, name):
    """Триггер 1: у тебя новые задания (добавлены в последние 6ч, не выполнены)."""
    if was_sent_recently(cur, child_id, "child_new_tasks", hours=12):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=6)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status = 'pending' AND created_at > %s",
        (child_id, threshold),
    )
    count = cur.fetchone()[0]
    if count == 0:
        return False
    word = "задание" if count == 1 else ("задания" if count < 5 else "заданий")
    sent = tg(token, tg_id,
        f"📋 <b>{name}, у тебя {count} новых {word}!</b>\n\n"
        f"Родитель добавил задания — заходи и начинай выполнять! "
        f"За каждое получишь звёзды ⭐\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "⭐ Выполнить задания", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_new_tasks")
    return sent


def check_task_approved(conn, cur, token, child_id, tg_id, name):
    """Триггер 2: задание подтверждено, звёзды начислены."""
    if was_sent_recently(cur, child_id, "child_task_approved", hours=6):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=6)
    cur.execute(
        f"SELECT title, stars, emoji FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status = 'approved' AND completed_at > %s "
        f"ORDER BY completed_at DESC LIMIT 3",
        (child_id, threshold),
    )
    approved = cur.fetchall()
    if not approved:
        return False
    total_stars = sum(t[1] for t in approved)
    task_lines = "\n".join([f"  {t[2]} <b>{t[0]}</b> — +{t[1]}⭐" for t in approved])
    sent = tg(token, tg_id,
        f"🎉 <b>{name}, задания подтверждены!</b>\n\n"
        f"{task_lines}\n\n"
        f"Итого: <b>+{total_stars}⭐</b>\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "⭐ Открыть СтарКидс", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_task_approved")
    return sent


def check_deadline_soon(conn, cur, token, child_id, tg_id, name):
    """Триггер 3: задание скоро просрочится (дедлайн в ближайшие 6ч)."""
    if was_sent_recently(cur, child_id, "child_deadline", hours=12):
        return False
    now = datetime.now(timezone.utc)
    soon = now + timedelta(hours=6)
    cur.execute(
        f"SELECT title, emoji, deadline FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status = 'pending' "
        f"AND deadline IS NOT NULL AND deadline > %s AND deadline <= %s",
        (child_id, now, soon),
    )
    urgent = cur.fetchall()
    if not urgent:
        return False
    task_lines = "\n".join([f"  {t[1]} <b>{t[0]}</b>" for t in urgent])
    sent = tg(token, tg_id,
        f"⏰ <b>{name}, время поджимает!</b>\n\n"
        f"Эти задания скоро сгорят:\n{task_lines}\n\n"
        f"Успей выполнить, пока не поздно!\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "📋 Выполнить сейчас", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_deadline")
    return sent


def check_inactive(conn, cur, token, child_id, tg_id, name):
    """Триггер 4: ребёнок не заходил 2 дня."""
    if was_sent_recently(cur, child_id, "child_inactive", hours=48):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(days=2)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status IN ('approved', 'done', 'pending_confirm') "
        f"AND completed_at > %s",
        (child_id, threshold),
    )
    if cur.fetchone()[0] > 0:
        return False
    cur.execute(
        f"SELECT total_stars_earned, stars FROM {SCHEMA}.children WHERE id = %s", (child_id,)
    )
    row = cur.fetchone()
    total = row[0] if row else 0
    stars = row[1] if row else 0
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status = 'pending'",
        (child_id,),
    )
    pending = cur.fetchone()[0]
    if pending == 0:
        return False
    sent = tg(token, tg_id,
        f"👋 <b>{name}, мы скучаем!</b>\n\n"
        f"У тебя <b>{stars}⭐</b> звёзд и <b>{pending}</b> заданий ждут выполнения!\n\n"
        f"Заходи и заработай ещё больше звёзд 🌟\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "⭐ Вернуться в СтарКидс", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_inactive")
    return sent


def check_reward_available(conn, cur, token, child_id, tg_id, name):
    """Триггер 5: у ребёнка хватает звёзд на награду."""
    if was_sent_recently(cur, child_id, "child_reward_available", hours=24):
        return False
    cur.execute(
        f"SELECT stars FROM {SCHEMA}.children WHERE id = %s", (child_id,)
    )
    row = cur.fetchone()
    stars = row[0] if row else 0
    if stars < 5:
        return False
    cur.execute(
        f"SELECT r.title, r.emoji, r.cost FROM {SCHEMA}.rewards r "
        f"WHERE r.child_id = %s AND r.quantity > 0 AND r.cost <= %s "
        f"ORDER BY r.cost DESC LIMIT 1",
        (child_id, stars),
    )
    reward = cur.fetchone()
    if not reward:
        return False
    sent = tg(token, tg_id,
        f"🎁 <b>{name}, ты можешь купить награду!</b>\n\n"
        f"У тебя <b>{stars}⭐</b> — хватает на:\n"
        f"  {reward[1]} <b>{reward[0]}</b> ({reward[2]}⭐)\n\n"
        f"Заходи в магазин и обменяй звёзды! 🛍️\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "🛍️ Открыть магазин", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_reward_available")
    return sent


def check_friend_request(conn, cur, token, child_id, tg_id, name):
    """Триггер 6: есть входящие заявки в друзья."""
    if was_sent_recently(cur, child_id, "child_friend_request", hours=20):
        return False
    cur.execute(
        f"SELECT c.name FROM {SCHEMA}.friendships f "
        f"JOIN {SCHEMA}.children c ON c.id = f.requester_id "
        f"WHERE f.addressee_id = %s AND f.status = 'pending'",
        (child_id,),
    )
    requests = [r[0] for r in cur.fetchall()]
    if not requests:
        return False
    names = ", ".join(requests[:3])
    sent = tg(token, tg_id,
        f"👥 <b>{name}, тебя хотят добавить в друзья!</b>\n\n"
        f"Заявки от: <b>{names}</b>\n\n"
        f"Прими заявку и соревнуйтесь, кто соберёт больше звёзд! 🏆\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "👥 Посмотреть заявки", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_friend_request")
    return sent


def check_level_close(conn, cur, token, child_id, tg_id, name):
    """Триггер 7: осталось мало до следующего уровня (<=2 звезды)."""
    if was_sent_recently(cur, child_id, "child_level_close", hours=24):
        return False
    cur.execute(
        f"SELECT total_stars_earned FROM {SCHEMA}.children WHERE id = %s", (child_id,)
    )
    row = cur.fetchone()
    total = row[0] if row else 0
    xp_in_level = total % 10
    remaining = 10 - xp_in_level
    if remaining > 2 or remaining == 0:
        return False
    next_level = total // 10 + 2
    sent = tg(token, tg_id,
        f"🔥 <b>{name}, до уровня {next_level} осталось {remaining}⭐!</b>\n\n"
        f"Ты почти у цели! Выполни ещё пару заданий — "
        f"и получишь новый уровень! 🏆\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "⭐ Заработать звёзды", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_level_close")
    return sent


def check_grade_approved(conn, cur, token, child_id, tg_id, name):
    """Триггер 8: оценка подтверждена, звёзды начислены."""
    if was_sent_recently(cur, child_id, "child_grade_approved", hours=12):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=6)
    cur.execute(
        f"SELECT subject, grade, stars_awarded FROM {SCHEMA}.grade_requests "
        f"WHERE child_id = %s AND status = 'approved' AND created_at > %s "
        f"ORDER BY created_at DESC LIMIT 3",
        (child_id, threshold),
    )
    grades = cur.fetchall()
    if not grades:
        return False
    total_stars = sum(g[2] or 0 for g in grades)
    grade_lines = "\n".join([f"  📝 <b>{g[0]}</b> — оценка {g[1]}, +{g[2]}⭐" for g in grades])
    sent = tg(token, tg_id,
        f"📝 <b>{name}, оценки подтверждены!</b>\n\n"
        f"{grade_lines}\n\n"
        f"Итого: <b>+{total_stars}⭐</b> — так держать! 🎉\n\n"
        f"{get_motivation(child_id)}",
        reply_markup={"inline_keyboard": [[{"text": "⭐ Открыть СтарКидс", "web_app": {"url": MINI_APP_URL}}]]},
    )
    if sent:
        log_sent(cur, child_id, "child_grade_approved")
    return sent


TRIGGERS = [
    check_new_tasks,
    check_task_approved,
    check_deadline_soon,
    check_inactive,
    check_reward_available,
    check_friend_request,
    check_level_close,
    check_grade_approved,
]


def handler(event: dict, context) -> dict:
    """Проверить триггеры и отправить уведомления детям."""
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

    token = os.environ.get("CHILD_BOT_TOKEN", "")
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
                f"SELECT id, telegram_id, name FROM {SCHEMA}.children "
                f"WHERE telegram_id IS NOT NULL AND notifications_enabled = true ORDER BY id"
            )
            children = cur.fetchall()

        for child_id, tg_id, name in children:
            for trigger_fn in TRIGGERS:
                try:
                    with conn.cursor() as cur:
                        sent = trigger_fn(conn, cur, token, child_id, tg_id, name)
                        conn.commit()
                        if sent:
                            total_sent += 1
                except Exception as e:
                    conn.rollback()
                    errors += 1
                    print(f"[ERROR] trigger {trigger_fn.__name__} for child {child_id}: {e}")

    finally:
        conn.close()

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"ok": True, "notifications_sent": total_sent, "errors": errors}),
    }