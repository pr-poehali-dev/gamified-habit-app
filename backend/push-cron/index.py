"""
Cron-уведомления через Web Push для СтарКидс.
Аналог parent-notifications + child-notifications, но через Push вместо Telegram.
Запускается по расписанию каждые 2-3 часа.

Триггеры для родителей (6):
  1. no_children       — не добавил ребёнка 24ч+ после регистрации
  2. no_tasks_today    — нет заданий сегодня (вечером 17:00–20:00 МСК)
  3. pending_tasks     — ребёнок ждёт проверки >3ч
  4. all_tasks_done    — все задания выполнены
  5. streak_warning    — стрик сгорит сегодня (18:00–20:00 МСК)
  6. child_inactive    — ребёнок не заходил 3 дня

Триггеры для детей (6):
  1. child_new_tasks       — новые задания добавлены в последние 6ч
  2. child_task_approved   — задание подтверждено родителем
  3. child_deadline        — дедлайн через 6ч
  4. child_inactive        — не заходил 2 дня
  5. child_reward_available — хватает звёзд на награду
  6. child_friend_request  — входящие заявки в друзья

Trial-напоминания (2):
  1. trial_expiring — пробный период заканчивается через 36ч
  2. trial_expired  — пробный период закончился
"""
import json
import os
import urllib.request
import psycopg2
from datetime import datetime, timezone, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")
PUSH_NOTIFY_URL = os.environ.get("PUSH_NOTIFY_URL", "")

MSK = timezone(timedelta(hours=3))
QUIET_HOUR_START = 20
QUIET_HOUR_END = 9

PARENT_APP_URL = "/app"
CHILD_APP_URL = "/app"


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def is_quiet_time() -> bool:
    hour = datetime.now(MSK).hour
    return hour >= QUIET_HOUR_START or hour < QUIET_HOUR_END


# ─── Push helper ──────────────────────────────────────────────────────────────

def send_push(action: str, target_id: int, payload: dict) -> bool:
    """Отправляет Web Push через push-notify функцию."""
    if not PUSH_NOTIFY_URL:
        print("[push-cron] PUSH_NOTIFY_URL not set")
        return False
    try:
        key = "parent_id" if action == "send_to_parent" else "child_id"
        body = json.dumps({"action": action, key: target_id, "payload": payload}).encode()
        req = urllib.request.Request(
            PUSH_NOTIFY_URL,
            data=body,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode())
            return result.get("sent", 0) > 0
    except Exception as e:
        print(f"[push-cron] send error: {e}")
        return False


# ─── Deduplication ────────────────────────────────────────────────────────────

def was_sent_recently(cur, parent_id, child_id, trigger_type, hours=20) -> bool:
    if child_id:
        cur.execute(
            f"SELECT 1 FROM {SCHEMA}.notification_log "
            f"WHERE child_id = %s AND trigger_type = %s AND channel = 'push' AND sent_at > %s LIMIT 1",
            (child_id, trigger_type, datetime.now(timezone.utc) - timedelta(hours=hours)),
        )
    else:
        cur.execute(
            f"SELECT 1 FROM {SCHEMA}.notification_log "
            f"WHERE parent_id = %s AND trigger_type = %s AND channel = 'push' AND sent_at > %s LIMIT 1",
            (parent_id, trigger_type, datetime.now(timezone.utc) - timedelta(hours=hours)),
        )
    return cur.fetchone() is not None


def log_sent(cur, parent_id, child_id, trigger_type):
    cur.execute(
        f"INSERT INTO {SCHEMA}.notification_log (parent_id, child_id, trigger_type, channel) VALUES (%s, %s, %s, 'push')",
        (parent_id, child_id, trigger_type),
    )


# ─── Parent triggers ──────────────────────────────────────────────────────────

def check_parent_no_children(cur, parent_id, name):
    if was_sent_recently(cur, parent_id, None, "push_no_children", hours=72):
        return False
    cur.execute(f"SELECT created_at FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
    row = cur.fetchone()
    if not row or not row[0]:
        return False
    age_hours = (datetime.now(timezone.utc) - row[0]).total_seconds() / 3600
    if age_hours < 24:
        return False
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.children WHERE parent_id = %s", (parent_id,))
    if cur.fetchone()[0] > 0:
        return False
    sent = send_push("send_to_parent", parent_id, {
        "title": "👋 Добавьте ребёнка",
        "body": f"{name or 'Родитель'}, вы ещё не добавили ребёнка — перейдите в раздел «Дети»",
        "url": PARENT_APP_URL, "tag": "no_children",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_no_children")
    return sent


def check_parent_no_tasks_today(cur, parent_id, name):
    now = datetime.now(MSK)
    if now.hour < 17:
        return False
    if was_sent_recently(cur, parent_id, None, "push_no_tasks_today", hours=20):
        return False
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.children WHERE parent_id = %s", (parent_id,))
    if cur.fetchone()[0] == 0:
        return False
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE parent_id = %s AND created_at >= %s",
        (parent_id, today_start),
    )
    if cur.fetchone()[0] > 0:
        return False
    sent = send_push("send_to_parent", parent_id, {
        "title": "📋 Сегодня нет заданий",
        "body": "Ребёнок ждёт — добавьте хотя бы одно задание",
        "url": PARENT_APP_URL, "tag": "no_tasks_today",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_no_tasks_today")
    return sent


def check_parent_pending_tasks(cur, parent_id, name):
    if was_sent_recently(cur, parent_id, None, "push_pending_tasks", hours=8):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=3)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE parent_id = %s AND status = 'pending_confirm' AND completed_at < %s",
        (parent_id, threshold),
    )
    count = cur.fetchone()[0]
    if count == 0:
        return False
    word = "задание" if count == 1 else ("задания" if count < 5 else "заданий")
    sent = send_push("send_to_parent", parent_id, {
        "title": "✅ Ребёнок ждёт проверки!",
        "body": f"{count} {word} выполнено и ждёт вашего подтверждения",
        "url": PARENT_APP_URL, "tag": "pending_tasks",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_pending_tasks")
    return sent


def check_parent_all_tasks_done(cur, parent_id, name):
    if was_sent_recently(cur, parent_id, None, "push_all_tasks_done", hours=20):
        return False
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE parent_id = %s AND status IN ('pending', 'pending_confirm')",
        (parent_id,),
    )
    if cur.fetchone()[0] > 0:
        return False
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE parent_id = %s AND status IN ('approved', 'done') AND completed_at > %s",
        (parent_id, datetime.now(timezone.utc) - timedelta(hours=24)),
    )
    if cur.fetchone()[0] == 0:
        return False
    sent = send_push("send_to_parent", parent_id, {
        "title": "🎉 Все задания выполнены!",
        "body": "Ребёнок молодец — добавьте новые задания",
        "url": PARENT_APP_URL, "tag": "all_tasks_done",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_all_tasks_done")
    return sent


def check_parent_streak_warning(cur, parent_id, name):
    now = datetime.now(MSK)
    if now.hour < 18:
        return False
    if was_sent_recently(cur, parent_id, None, "push_streak_warning", hours=20):
        return False
    cur.execute(
        f"SELECT streak_current, streak_last_date FROM {SCHEMA}.parents WHERE id = %s",
        (parent_id,),
    )
    row = cur.fetchone()
    streak, last_date = row[0], row[1]
    if streak < 2:
        return False
    if last_date and last_date >= now.date():
        return False
    sent = send_push("send_to_parent", parent_id, {
        "title": f"🔥 Стрик {streak} дней сгорит!",
        "body": "Зайдите в приложение сегодня, чтобы сохранить серию",
        "url": PARENT_APP_URL, "tag": "streak_warning",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_streak_warning")
    return sent


def check_parent_child_inactive(cur, parent_id, name):
    if was_sent_recently(cur, parent_id, None, "push_child_inactive", hours=72):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(days=3)
    cur.execute(
        f"""SELECT c.name FROM {SCHEMA}.children c
            LEFT JOIN {SCHEMA}.tasks t ON t.child_id = c.id
                AND t.completed_at > %s
                AND t.status IN ('approved', 'done', 'pending_confirm')
            WHERE c.parent_id = %s
            GROUP BY c.id, c.name
            HAVING COUNT(t.id) = 0
            LIMIT 1""",
        (threshold, parent_id),
    )
    row = cur.fetchone()
    if not row:
        return False
    child_name = row[0]
    sent = send_push("send_to_parent", parent_id, {
        "title": f"😴 {child_name} не заходил 3 дня",
        "body": "Проверьте, всё ли в порядке — напомните ребёнку о заданиях",
        "url": PARENT_APP_URL, "tag": "child_inactive",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_child_inactive")
    return sent


# ─── Child triggers ───────────────────────────────────────────────────────────

def check_child_new_tasks(cur, child_id, parent_id, name):
    if was_sent_recently(cur, parent_id, child_id, "push_child_new_tasks", hours=12):
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
    sent = send_push("send_to_child", child_id, {
        "title": f"📋 {count} новых {word}!",
        "body": f"{name}, родитель добавил задания — заходи и выполняй",
        "url": CHILD_APP_URL, "tag": "child_new_tasks",
    })
    if sent:
        log_sent(cur, parent_id, child_id, "push_child_new_tasks")
    return sent


def check_child_task_approved(cur, child_id, parent_id, name):
    if was_sent_recently(cur, parent_id, child_id, "push_child_task_approved", hours=6):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(hours=6)
    cur.execute(
        f"SELECT title, stars FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status = 'approved' AND completed_at > %s "
        f"ORDER BY completed_at DESC LIMIT 3",
        (child_id, threshold),
    )
    approved = cur.fetchall()
    if not approved:
        return False
    total_stars = sum(t[1] for t in approved)
    sent = send_push("send_to_child", child_id, {
        "title": "🎉 Задания подтверждены!",
        "body": f"{name}, тебе начислено +{total_stars}⭐",
        "url": CHILD_APP_URL, "tag": "child_task_approved",
    })
    if sent:
        log_sent(cur, parent_id, child_id, "push_child_task_approved")
    return sent


def check_child_deadline(cur, child_id, parent_id, name):
    if was_sent_recently(cur, parent_id, child_id, "push_child_deadline", hours=12):
        return False
    now = datetime.now(timezone.utc)
    soon = now + timedelta(hours=6)
    cur.execute(
        f"SELECT title FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status = 'pending' "
        f"AND deadline IS NOT NULL AND deadline > %s AND deadline <= %s",
        (child_id, now, soon),
    )
    urgent = cur.fetchall()
    if not urgent:
        return False
    titles = ", ".join([t[0] for t in urgent[:2]])
    sent = send_push("send_to_child", child_id, {
        "title": "⏰ Дедлайн через 6 часов!",
        "body": f"{name}, срочно: {titles}",
        "url": CHILD_APP_URL, "tag": "child_deadline",
    })
    if sent:
        log_sent(cur, parent_id, child_id, "push_child_deadline")
    return sent


def check_child_inactive(cur, child_id, parent_id, name):
    if was_sent_recently(cur, parent_id, child_id, "push_child_inactive", hours=48):
        return False
    threshold = datetime.now(timezone.utc) - timedelta(days=2)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tasks "
        f"WHERE child_id = %s AND status IN ('approved', 'done', 'pending_confirm') AND completed_at > %s",
        (child_id, threshold),
    )
    if cur.fetchone()[0] > 0:
        return False
    cur.execute(
        f"SELECT stars, (SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE child_id = %s AND status = 'pending') "
        f"FROM {SCHEMA}.children WHERE id = %s",
        (child_id, child_id),
    )
    row = cur.fetchone()
    if not row or row[1] == 0:
        return False
    stars, pending = row
    sent = send_push("send_to_child", child_id, {
        "title": "👋 Мы скучаем!",
        "body": f"{name}, у тебя {stars}⭐ и {pending} заданий ждут",
        "url": CHILD_APP_URL, "tag": "child_inactive",
    })
    if sent:
        log_sent(cur, parent_id, child_id, "push_child_inactive")
    return sent


def check_child_reward_available(cur, child_id, parent_id, name):
    if was_sent_recently(cur, parent_id, child_id, "push_child_reward", hours=24):
        return False
    cur.execute(f"SELECT stars FROM {SCHEMA}.children WHERE id = %s", (child_id,))
    row = cur.fetchone()
    stars = row[0] if row else 0
    if stars < 5:
        return False
    cur.execute(
        f"SELECT title, emoji, cost FROM {SCHEMA}.rewards "
        f"WHERE child_id = %s AND quantity > 0 AND cost <= %s ORDER BY cost DESC LIMIT 1",
        (child_id, stars),
    )
    reward = cur.fetchone()
    if not reward:
        return False
    sent = send_push("send_to_child", child_id, {
        "title": "🎁 Можно купить награду!",
        "body": f"{name}, у тебя {stars}⭐ — хватает на {reward[1]} {reward[0]}",
        "url": CHILD_APP_URL, "tag": "child_reward",
    })
    if sent:
        log_sent(cur, parent_id, child_id, "push_child_reward")
    return sent


def check_child_friend_request(cur, child_id, parent_id, name):
    if was_sent_recently(cur, parent_id, child_id, "push_child_friend_req", hours=20):
        return False
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.friendships f "
        f"JOIN {SCHEMA}.children c ON c.id = f.requester_id "
        f"WHERE f.addressee_id = %s AND f.status = 'pending'",
        (child_id,),
    )
    count = cur.fetchone()[0]
    if count == 0:
        return False
    sent = send_push("send_to_child", child_id, {
        "title": "👫 Заявка в друзья!",
        "body": f"{name}, {count} чел. хотят дружить",
        "url": CHILD_APP_URL, "tag": "friend_request",
    })
    if sent:
        log_sent(cur, parent_id, child_id, "push_child_friend_req")
    return sent


# ─── Trial reminders ──────────────────────────────────────────────────────────

def check_trial_expiring(cur, parent_id, name):
    if was_sent_recently(cur, parent_id, None, "push_trial_expiring", hours=72):
        return False
    cur.execute(
        f"SELECT trial_ends_at, is_premium_paid, trial_used FROM {SCHEMA}.parents WHERE id = %s",
        (parent_id,),
    )
    row = cur.fetchone()
    if not row or not row[0] or row[1] or not row[2]:
        return False
    trial_ends_at, is_premium_paid, trial_used = row
    now = datetime.now(timezone.utc)
    if not (now < trial_ends_at <= now + timedelta(hours=36)):
        return False
    hours_left = int((trial_ends_at - now).total_seconds() / 3600)
    time_str = f"{hours_left} ч." if hours_left <= 24 else "1 день"
    sent = send_push("send_to_parent", parent_id, {
        "title": "⏳ Пробный период заканчивается",
        "body": f"До конца Premium осталось {time_str} — оформите подписку",
        "url": PARENT_APP_URL, "tag": "trial_expiring",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_trial_expiring")
    return sent


def check_trial_expired(cur, parent_id, name):
    if was_sent_recently(cur, parent_id, None, "push_trial_expired", hours=72):
        return False
    cur.execute(
        f"SELECT trial_ends_at, is_premium_paid FROM {SCHEMA}.parents WHERE id = %s",
        (parent_id,),
    )
    row = cur.fetchone()
    if not row or not row[0] or row[1]:
        return False
    trial_ends_at = row[0]
    now = datetime.now(timezone.utc)
    if not (trial_ends_at <= now <= trial_ends_at + timedelta(hours=25)):
        return False
    sent = send_push("send_to_parent", parent_id, {
        "title": "👑 Пробный период завершён",
        "body": "Оформите Premium, чтобы продолжить пользоваться всеми функциями",
        "url": PARENT_APP_URL, "tag": "trial_expired",
    })
    if sent:
        log_sent(cur, parent_id, None, "push_trial_expired")
    return sent


# ─── Main handler ─────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Cron-уведомления через Web Push — запускается по расписанию."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}

    if is_quiet_time():
        print(f"[push-cron] quiet time, skipping")
        return {"statusCode": 200, "body": json.dumps({"skipped": "quiet_time"})}

    conn = get_db()
    cur = conn.cursor()

    stats = {"parents_notified": 0, "children_notified": 0, "total_sent": 0}

    try:
        # ── Родители с push-подписками ──
        cur.execute(f"""
            SELECT DISTINCT p.id, p.full_name
            FROM {SCHEMA}.parents p
            JOIN {SCHEMA}.push_subscriptions ps ON ps.parent_id = p.id AND ps.auth != ''
        """)
        parents = cur.fetchall()

        for parent_id, name in parents:
            sent_any = False
            sent_any |= bool(check_parent_no_children(cur, parent_id, name))
            sent_any |= bool(check_parent_no_tasks_today(cur, parent_id, name))
            sent_any |= bool(check_parent_pending_tasks(cur, parent_id, name))
            sent_any |= bool(check_parent_all_tasks_done(cur, parent_id, name))
            sent_any |= bool(check_parent_streak_warning(cur, parent_id, name))
            sent_any |= bool(check_parent_child_inactive(cur, parent_id, name))
            sent_any |= bool(check_trial_expiring(cur, parent_id, name))
            sent_any |= bool(check_trial_expired(cur, parent_id, name))
            if sent_any:
                stats["parents_notified"] += 1
                stats["total_sent"] += 1

        conn.commit()

        # ── Дети с push-подписками ──
        cur.execute(f"""
            SELECT DISTINCT c.id, c.parent_id, c.name
            FROM {SCHEMA}.children c
            JOIN {SCHEMA}.push_subscriptions ps ON ps.child_id = c.id AND ps.auth != ''
        """)
        children = cur.fetchall()

        for child_id, parent_id, name in children:
            sent_any = False
            sent_any |= bool(check_child_new_tasks(cur, child_id, parent_id, name))
            sent_any |= bool(check_child_task_approved(cur, child_id, parent_id, name))
            sent_any |= bool(check_child_deadline(cur, child_id, parent_id, name))
            sent_any |= bool(check_child_inactive(cur, child_id, parent_id, name))
            sent_any |= bool(check_child_reward_available(cur, child_id, parent_id, name))
            sent_any |= bool(check_child_friend_request(cur, child_id, parent_id, name))
            if sent_any:
                stats["children_notified"] += 1
                stats["total_sent"] += 1

        conn.commit()

    finally:
        cur.close()
        conn.close()

    print(f"[push-cron] done: {stats}")
    return {"statusCode": 200, "body": json.dumps(stats)}
