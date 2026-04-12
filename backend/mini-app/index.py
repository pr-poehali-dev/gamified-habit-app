"""
API для Telegram Mini App СтарКидс.
Два бота: parenttask_bot (родитель) и task4kids_bot (ребёнок).
Полный функционал: задачи, звёзды, ачивки, оценки, стикеры, стрики, подтверждения.
v2.1
"""
import json
import os
import hashlib
import hmac
import psycopg2
from datetime import datetime, timezone, date, timedelta
from urllib.parse import parse_qs, unquote

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")
PARENT_TOKEN = os.environ.get("PARENT_BOT_TOKEN", "")
CHILD_TOKEN = os.environ.get("CHILD_BOT_TOKEN", "")

STARS_PER_LEVEL = 10

GRADE_STARS = {5: 5, 4: 4, 3: 3, 2: 2}

ACHIEVEMENTS_DEF = [
    {"id": "first_task",  "check": lambda s: s["tasks_completed"] >= 1},
    {"id": "tasks_5",     "check": lambda s: s["tasks_completed"] >= 5},
    {"id": "tasks_10",    "check": lambda s: s["tasks_completed"] >= 10},
    {"id": "tasks_25",    "check": lambda s: s["tasks_completed"] >= 25},
    {"id": "stars_10",    "check": lambda s: s["total_stars"] >= 10},
    {"id": "stars_50",    "check": lambda s: s["total_stars"] >= 50},
    {"id": "stars_100",   "check": lambda s: s["total_stars"] >= 100},
    {"id": "level_3",     "check": lambda s: s["level"] >= 3},
    {"id": "level_5",     "check": lambda s: s["level"] >= 5},
    {"id": "level_10",    "check": lambda s: s["level"] >= 10},
    {"id": "spend_10",    "check": lambda s: s["stars_spent"] >= 10},
    {"id": "spend_30",    "check": lambda s: s["stars_spent"] >= 30},
    {"id": "reward_1",    "check": lambda s: s["rewards_bought"] >= 1},
    {"id": "reward_3",    "check": lambda s: s["rewards_bought"] >= 3},
    {"id": "streak_3",    "check": lambda s: s["streak"] >= 3},
    {"id": "streak_7",    "check": lambda s: s["streak"] >= 7},
]


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Tg-Init-Data",
    }


def json_response(data, status=200):
    return {
        "statusCode": status,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(data, default=str),
    }


def error_response(msg, status=400):
    return json_response({"error": msg}, status)


def validate_tg_init_data(init_data: str, bot_token: str) -> dict | None:
    try:
        parsed = parse_qs(init_data)
        parts = []
        user_data = None
        for key in sorted(parsed.keys()):
            if key == "hash":
                continue
            val = parsed[key][0]
            parts.append(f"{key}={val}")
            if key == "user":
                user_data = json.loads(unquote(val))
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret_key, "\n".join(parts).encode(), hashlib.sha256).hexdigest()
        received = parsed.get("hash", [""])[0]
        if hmac.compare_digest(expected, received):
            return user_data
        return None
    except Exception:
        return None


def resolve_telegram_id(body: dict, bot_token: str):
    """Возвращает telegram_id из initData, напрямую или по pwa_session_token."""
    init_data = body.get("initData", "")
    print(f"[DEBUG] initData present: {bool(init_data)}, length: {len(init_data)}")
    print(f"[DEBUG] telegram_id in body: {body.get('telegram_id')}")

    if init_data:
        user = validate_tg_init_data(init_data, bot_token)
        print(f"[DEBUG] strict validation result: {user}")
        if user:
            return user["id"]
        try:
            parsed = parse_qs(init_data)
            print(f"[DEBUG] parsed keys: {list(parsed.keys())}")
            if "user" in parsed:
                user_data = json.loads(unquote(parsed["user"][0]))
                print(f"[DEBUG] user_data: {user_data}")
                return user_data.get("id")
        except Exception as e:
            print(f"[DEBUG] fallback error: {e}")
        return None
    tid = body.get("telegram_id")
    if tid:
        return int(tid)
    return None


def resolve_parent_id_by_session(conn, body: dict):
    """Возвращает (parent_id, telegram_id) по pwa_session_token."""
    token = body.get("pwa_session_token", "")
    if not token:
        return None, None
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, telegram_id FROM {SCHEMA}.parents WHERE pwa_session_token = %s",
                (token,)
            )
            row = cur.fetchone()
        if row:
            return row[0], row[1]
    except Exception as e:
        print(f"[DEBUG] session resolve error: {e}")
    return None, None


def send_tg_message(token: str, chat_id: int, text: str, parse_mode="HTML"):
    import urllib.request
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": parse_mode}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=3)
    except Exception:
        pass


# ─── Child helpers ────────────────────────────────────────────────────────────

def _child_row_to_dict(row):
    return {"id": row[0], "name": row[1], "stars": row[2], "parent_id": row[3],
            "avatar": row[4] or "👧", "age": row[5] or 9, "role": "child",
            "total_stars_earned": row[6] or 0,
            "notifications_enabled": bool(row[7]) if row[7] is not None else True,
            "notification_settings": json.loads(row[8]) if row[8] else {"reminders": True, "motivation": True}}


def get_child_by_tg(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, stars, parent_id, avatar, age, total_stars_earned, notifications_enabled, notification_settings FROM {SCHEMA}.children WHERE telegram_id = %s",
            (telegram_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return _child_row_to_dict(row)


def get_child_by_session(conn, body: dict):
    """Возвращает (child, telegram_id) по pwa_session_token."""
    token = body.get("pwa_session_token", "")
    if not token:
        return None, None
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, stars, parent_id, avatar, age, total_stars_earned, notifications_enabled, notification_settings, telegram_id FROM {SCHEMA}.children WHERE pwa_session_token = %s",
            (token,)
        )
        row = cur.fetchone()
    if not row:
        return None, None
    child = _child_row_to_dict(row[:9])
    return child, row[9]


def resolve_child(conn, body: dict):
    """Находит ребёнка по telegram_id или pwa_session_token. Возвращает (tid, child) или (None, None)."""
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    child = get_child_by_tg(conn, tid) if tid else None
    if not child:
        child, session_tid = get_child_by_session(conn, body)
        if child and not tid:
            tid = session_tid or 0
    return tid, child


def compute_level(stars: int):
    level = stars // STARS_PER_LEVEL + 1
    xp_in = stars % STARS_PER_LEVEL
    return level, xp_in


def check_achievements(conn, child_id: int, stats: dict):
    """Проверяет и выдаёт новые ачивки, возвращает список новых id."""
    with conn.cursor() as cur:
        cur.execute(f"SELECT achievement_id FROM {SCHEMA}.achievements WHERE child_id = %s", (child_id,))
        existing = {r[0] for r in cur.fetchall()}
    new_ones = []
    for ach in ACHIEVEMENTS_DEF:
        if ach["id"] not in existing and ach["check"](stats):
            new_ones.append(ach["id"])
    if new_ones:
        with conn.cursor() as cur:
            for aid in new_ones:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.achievements (child_id, achievement_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (child_id, aid)
                )
        conn.commit()
    return new_ones


def get_child_stats(conn, child_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(f"SELECT stars, total_stars_earned FROM {SCHEMA}.children WHERE id = %s", (child_id,))
        row = cur.fetchone()
        stars = row[0] if row else 0
        total_stars_earned = row[1] if row else 0
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE child_id = %s AND status = 'approved'", (child_id,))
        tasks_completed = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(cost), 0) FROM {SCHEMA}.reward_purchases rp JOIN {SCHEMA}.rewards r ON rp.reward_id = r.id WHERE rp.child_id = %s", (child_id,))
        stars_spent = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reward_purchases WHERE child_id = %s", (child_id,))
        rewards_bought = cur.fetchone()[0]
        # Уровень считается от всех заработанных звёзд, а не от текущего баланса
        level, _ = compute_level(total_stars_earned)
    return {
        "total_stars": total_stars_earned, "tasks_completed": tasks_completed,
        "stars_spent": stars_spent, "rewards_bought": rewards_bought,
        "level": level, "streak": 0,
    }


# ─── Parent helpers ───────────────────────────────────────────────────────────

def get_parent_by_tg(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, full_name, parent_xp, parent_points, streak_current, streak_last_date, streak_claimed_today, streak_longest, is_premium, trial_started_at, trial_ends_at, trial_used, notifications_enabled, notification_settings FROM {SCHEMA}.parents WHERE telegram_id = %s",
            (telegram_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    from datetime import datetime, timezone
    from math import ceil
    is_premium_db = bool(row[8])
    trial_ends_at = row[10]
    trial_used = bool(row[11])
    trial_active = False
    trial_days_left = 0
    if trial_ends_at and not is_premium_db:
        now = datetime.now(timezone.utc)
        if trial_ends_at > now:
            trial_active = True
            remaining = trial_ends_at - now
            trial_days_left = max(1, ceil(remaining.total_seconds() / 86400))
    is_premium = is_premium_db or trial_active
    return {
        "id": row[0], "name": row[1], "role": "parent",
        "parent_xp": row[2] or 0, "parent_points": row[3] or 0,
        "streak_current": row[4] or 0,
        "streak_last_date": row[5].isoformat() if row[5] else None,
        "streak_claimed_today": row[6] or False,
        "streak_longest": row[7] or 0,
        "is_premium": is_premium,
        "is_premium_paid": is_premium_db,
        "trial_active": trial_active,
        "trial_days_left": trial_days_left,
        "trial_used": trial_used,
        "trial_ends_at": trial_ends_at.isoformat() if trial_ends_at else None,
        "notifications_enabled": bool(row[12]) if row[12] is not None else True,
        "notification_settings": json.loads(row[13]) if row[13] else {"tips": True, "activity": True},
    }


def get_streak_bonus(streak: int):
    """Рассчитать бонус за ежедневную активность по длине серии."""
    xp = round((min(streak, 10) / 10) * 100)
    points = round((min(streak, 10) / 10) * 1000)
    return xp, points


def advance_streak(conn, parent_id: int):
    """Обновить серию и автоматически начислить бонус за ежедневную активность."""
    today = date.today()
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT streak_current, streak_last_date, streak_longest, streak_claimed_today FROM {SCHEMA}.parents WHERE id = %s",
            (parent_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    current, last_date, longest, claimed_today = row[0] or 0, row[1], row[2] or 0, row[3]
    if last_date == today:
        return None
    if last_date and (today - last_date).days <= 1:
        new_current = current + 1
    else:
        new_current = 1
    new_longest = max(longest, new_current)
    xp_bonus, points_bonus = get_streak_bonus(new_current)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET streak_current=%s, streak_last_date=%s, streak_claimed_today=true, streak_longest=%s, parent_xp=parent_xp+%s, parent_points=parent_points+%s WHERE id=%s",
            (new_current, today, new_longest, xp_bonus, points_bonus, parent_id)
        )
    conn.commit()
    return {"streak": new_current, "xp": xp_bonus, "points": points_bonus, "longest": new_longest}


def add_parent_xp(conn, parent_id: int, xp: int):
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET parent_xp = parent_xp + %s WHERE id = %s RETURNING parent_xp, parent_points",
            (xp, parent_id)
        )
        row = cur.fetchone()
    conn.commit()
    if not row:
        return 0, 0
    total_xp, current_points = row
    # Каждый новый уровень (+100 XP) = +1000 баллов
    new_level = total_xp // 100 + 1
    expected_points = (new_level - 1) * 1000
    if expected_points > current_points:
        bonus = expected_points - current_points
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.parents SET parent_points = %s WHERE id = %s", (expected_points, parent_id))
        conn.commit()
        return total_xp, expected_points
    return total_xp, current_points


# ─── Route handlers ───────────────────────────────────────────────────────────

def handle_connect_child(conn, body):
    """Привязать ребёнка по коду приглашения из Mini App."""
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    print(f"[connect_child] tid={tid}, code={body.get('invite_code')}")
    if not tid:
        return error_response("Unauthorized", 401)
    code = (body.get("invite_code") or "").strip().upper()
    if not code:
        return error_response("Введи код приглашения", 400)

    # Сначала проверяем: возможно этот ребёнок УЖЕ подключён с этим telegram_id и этим кодом (ре-логин)
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, parent_id FROM {SCHEMA}.children WHERE invite_code = %s AND telegram_id = %s",
            (code, tid)
        )
        already_row = cur.fetchone()
    if already_row:
        print(f"[connect_child] re-login: child already connected with this telegram_id")
        return json_response({"ok": True, "child_name": already_row[1]})

    # Проверяем свободный код
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, parent_id FROM {SCHEMA}.children WHERE invite_code = %s AND telegram_id IS NULL",
            (code,)
        )
        row = cur.fetchone()
    if not row:
        # Дополнительная диагностика: код вообще существует?
        with conn.cursor() as cur:
            cur.execute(f"SELECT id, telegram_id FROM {SCHEMA}.children WHERE invite_code = %s", (code,))
            diag = cur.fetchone()
        if diag:
            print(f"[connect_child] code exists but taken by telegram_id={diag[1]}, child_id={diag[0]}")
            return error_response("Этот код уже использован другим ребёнком. Попроси родителя создать новый код.", 404)
        else:
            print(f"[connect_child] code not found in DB")
            return error_response("Код не найден. Проверь правильность кода.", 404)
    child_id, child_name, parent_id = row
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.children SET telegram_id = %s WHERE id = %s", (tid, child_id))
    conn.commit()
    print(f"[connect_child] success: child_id={child_id}, child_name={child_name}")
    # Уведомить родителя
    if PARENT_TOKEN and parent_id:
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
            p_row = cur.fetchone()
        if p_row:
            send_tg_message(PARENT_TOKEN, p_row[0], f"🎉 <b>{child_name}</b> подключился к СтарКидс!\n\nТеперь ты можешь создавать задания для него в приложении.")
    return json_response({"ok": True, "child_name": child_name})


def handle_auth_child(conn, body):
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    child = get_child_by_tg(conn, tid) if tid else None
    if not child:
        child, session_tid = get_child_by_session(conn, body)
        if child and not tid:
            tid = session_tid or 0
    if not child:
        return json_response({"role": "unknown", "telegram_id": tid or 0, "error": "no_tg_id"})
    # Уровень и XP считаются от всех заработанных звёзд (не от баланса)
    level, xp_in = compute_level(child["total_stars_earned"])
    with conn.cursor() as cur:
        cur.execute(f"SELECT achievement_id FROM {SCHEMA}.achievements WHERE child_id = %s", (child["id"],))
        achievements = [r[0] for r in cur.fetchall()]
        cur.execute(f"SELECT sticker_id, count FROM {SCHEMA}.stickers WHERE child_id = %s", (child["id"],))
        stickers = [{"stickerId": r[0], "count": r[1]} for r in cur.fetchall()]
        cur.execute(f"SELECT id, subject, grade, date, status, stars_awarded, created_at FROM {SCHEMA}.grade_requests WHERE child_id = %s ORDER BY created_at DESC LIMIT 20", (child["id"],))
        grades = [{"id": r[0], "subject": r[1], "grade": r[2], "date": str(r[3]), "status": r[4], "starsAwarded": r[5], "createdAt": str(r[6])} for r in cur.fetchall()]
        cur.execute(f"SELECT id, title, stars, emoji, status, require_photo, require_confirm, photo_status, deadline, extension_requested, extension_granted FROM {SCHEMA}.tasks WHERE child_id = %s ORDER BY created_at DESC LIMIT 50", (child["id"],))
        tasks = [{"id": r[0], "title": r[1], "stars": r[2], "emoji": r[3], "status": r[4], "requirePhoto": r[5], "requireConfirm": r[6], "photoStatus": r[7], "deadline": r[8].isoformat() if r[8] else None, "extensionRequested": bool(r[9]), "extensionGranted": bool(r[10])} for r in cur.fetchall()]
        rewards = []
        if child.get("parent_id"):
            cur.execute(f"SELECT id, title, cost, emoji, child_id, quantity FROM {SCHEMA}.rewards WHERE parent_id = %s AND child_id = %s AND quantity > 0 ORDER BY created_at", (child["parent_id"], child["id"]))
            rewards = [{"id": r[0], "title": r[1], "cost": r[2], "emoji": r[3], "childId": r[4], "quantity": r[5]} for r in cur.fetchall()]
        # История покупок наград
        cur.execute(
            f"""SELECT rp.id, rp.reward_id, r.title, r.emoji, r.cost, rp.status, rp.purchased_at
                FROM {SCHEMA}.reward_purchases rp
                JOIN {SCHEMA}.rewards r ON rp.reward_id = r.id
                WHERE rp.child_id = %s
                ORDER BY rp.purchased_at DESC LIMIT 20""",
            (child["id"],)
        )
        reward_purchases = [
            {"id": r[0], "rewardId": r[1], "title": r[2], "emoji": r[3], "cost": r[4], "status": r[5], "purchasedAt": str(r[6])}
            for r in cur.fetchall()
        ]
        cur.execute(f"SELECT id, title, emoji, status, created_at FROM {SCHEMA}.reward_wishes WHERE child_id = %s AND status = 'pending' ORDER BY created_at DESC", (child["id"],))
        wishes = [{"id": r[0], "title": r[1], "emoji": r[2], "status": r[3], "createdAt": str(r[4])} for r in cur.fetchall()]
    return json_response({
        **child, "telegram_id": tid, "level": level, "xpInLevel": xp_in,
        "achievements": achievements, "stickers": stickers,
        "gradeRequests": grades, "tasks": tasks, "rewards": rewards,
        "rewardPurchases": reward_purchases, "wishes": wishes,
    })


def check_trial_reminder(conn, parent_id: int, telegram_id: int):
    """Отправляет напоминание за 1 день до окончания trial."""
    from datetime import datetime, timezone, timedelta
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT trial_ends_at, trial_reminder_sent, is_premium FROM {SCHEMA}.parents WHERE id = %s",
            (parent_id,)
        )
        row = cur.fetchone()
    if not row or not row[0] or row[1] or row[2]:
        return
    trial_ends_at, reminder_sent, is_premium_paid = row
    now = datetime.now(timezone.utc)
    time_left = trial_ends_at - now
    if timedelta(0) < time_left <= timedelta(hours=24):
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.parents SET trial_reminder_sent = true WHERE id = %s", (parent_id,))
        conn.commit()
        if PARENT_TOKEN:
            hours_left = max(1, int(time_left.total_seconds() // 3600))
            send_tg_message(
                PARENT_TOKEN, telegram_id,
                f"⏰ Пробный период Premium заканчивается через {hours_left}ч!\n\n"
                f"После окончания Premium-функции (📸 фото-задачи, 👨‍👩‍👧‍👦 несколько детей, 📊 аналитика) станут недоступны.\n\n"
                f"Откройте приложение, чтобы узнать подробнее о подписке."
            )


def get_parent_by_id(conn, parent_id):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, full_name, parent_xp, parent_points, streak_current, streak_last_date, streak_claimed_today, streak_longest, is_premium, trial_started_at, trial_ends_at, trial_used, notifications_enabled, notification_settings, telegram_id FROM {SCHEMA}.parents WHERE id = %s",
            (parent_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    from datetime import datetime, timezone
    from math import ceil
    is_premium_db = bool(row[8])
    trial_ends_at = row[10]
    trial_used = bool(row[11])
    trial_active = False
    trial_days_left = 0
    if trial_ends_at and not is_premium_db:
        now = datetime.now(timezone.utc)
        if trial_ends_at > now:
            trial_active = True
            remaining = trial_ends_at - now
            trial_days_left = max(1, ceil(remaining.total_seconds() / 86400))
    is_premium = is_premium_db or trial_active
    return {
        "id": row[0], "name": row[1], "role": "parent",
        "parent_xp": row[2] or 0, "parent_points": row[3] or 0,
        "streak_current": row[4] or 0,
        "streak_last_date": row[5].isoformat() if row[5] else None,
        "streak_claimed_today": row[6] or False,
        "streak_longest": row[7] or 0,
        "is_premium": is_premium,
        "is_premium_paid": is_premium_db,
        "trial_active": trial_active,
        "trial_days_left": trial_days_left,
        "trial_used": trial_used,
        "trial_ends_at": trial_ends_at.isoformat() if trial_ends_at else None,
        "notifications_enabled": bool(row[12]) if row[12] is not None else True,
        "notification_settings": json.loads(row[13]) if row[13] else {"tips": True, "activity": True},
        "telegram_id": row[14],
    }


def resolve_parent(conn, body):
    """Находит родителя по initData, telegram_id или pwa_session_token. Возвращает (tid, parent) или (None, None)."""
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    parent = None
    if tid:
        parent = get_parent_by_tg(conn, tid)
    if not parent:
        pid, session_tid = resolve_parent_id_by_session(conn, body)
        if pid:
            parent = get_parent_by_id(conn, pid)
            if parent and not tid:
                tid = session_tid or 0
    return tid, parent


def handle_auth_parent(conn, body):
    tid, parent = resolve_parent(conn, body)
    if not tid and not parent:
        return json_response({"role": "unknown", "telegram_id": 0, "error": "no_tg_id"})
    if not parent:
        # Авторегистрация — создаём родителя при первом входе
        first_name = body.get("first_name", "")
        if not first_name:
            try:
                init_data = body.get("initData", "")
                if init_data:
                    parsed = parse_qs(init_data)
                    if "user" in parsed:
                        u = json.loads(unquote(parsed["user"][0]))
                        first_name = u.get("first_name", "") + " " + u.get("last_name", "")
                        first_name = first_name.strip()
            except Exception:
                pass
        full_name = first_name or f"Родитель {tid}"
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        trial_end = now + timedelta(days=7)
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.parents (telegram_id, full_name, trial_started_at, trial_ends_at, trial_used) VALUES (%s, %s, %s, %s, true) ON CONFLICT (telegram_id) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id",
                (tid, full_name, now, trial_end)
            )
            new_id = cur.fetchone()[0]
        conn.commit()
        parent = get_parent_by_tg(conn, tid)
        if not parent:
            return json_response({"role": "unknown", "telegram_id": tid})
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name, stars, avatar, age, invite_code, telegram_id, pwa_session_token FROM {SCHEMA}.children WHERE parent_id = %s ORDER BY created_at", (parent["id"],))
        children = [{"id": r[0], "name": r[1], "stars": r[2], "avatar": r[3] or "👧", "age": r[4] or 9, "inviteCode": r[5], "connected": r[6] is not None or r[7] is not None} for r in cur.fetchall()]
        cur.execute(f"SELECT id, title, stars, emoji, status, child_id, require_photo, require_confirm, photo_status, deadline, extension_requested, extension_granted, photo_url FROM {SCHEMA}.tasks WHERE parent_id = %s ORDER BY created_at DESC LIMIT 50", (parent["id"],))
        tasks = [{"id": r[0], "title": r[1], "stars": r[2], "emoji": r[3], "status": r[4], "childId": r[5], "requirePhoto": r[6], "requireConfirm": r[7], "photoStatus": r[8], "deadline": r[9].isoformat() if r[9] else None, "extensionRequested": bool(r[10]), "extensionGranted": bool(r[11]), "photoUrl": r[12]} for r in cur.fetchall()]
        # Pending grade requests from children
        if children:
            child_ids = [c["id"] for c in children]
            placeholders = ",".join(["%s"] * len(child_ids))
            cur.execute(f"SELECT gr.id, gr.child_id, c.name, gr.subject, gr.grade, gr.date, gr.status, gr.stars_awarded FROM {SCHEMA}.grade_requests gr JOIN {SCHEMA}.children c ON gr.child_id = c.id WHERE gr.child_id IN ({placeholders}) ORDER BY gr.created_at DESC LIMIT 50", child_ids)
            grades = [{"id": r[0], "childId": r[1], "childName": r[2], "subject": r[3], "grade": r[4], "date": str(r[5]), "status": r[6], "starsAwarded": r[7]} for r in cur.fetchall()]
        else:
            grades = []
        cur.execute(f"SELECT id, title, cost, emoji, child_id, quantity FROM {SCHEMA}.rewards WHERE parent_id = %s ORDER BY created_at", (parent["id"],))
        rewards = [{"id": r[0], "title": r[1], "cost": r[2], "emoji": r[3], "childId": r[4], "quantity": r[5]} for r in cur.fetchall()]
        cur.execute(f"SELECT rw.id, rw.child_id, c.name, rw.title, rw.emoji, rw.created_at FROM {SCHEMA}.reward_wishes rw JOIN {SCHEMA}.children c ON rw.child_id = c.id WHERE rw.parent_id = %s AND rw.status = 'pending' ORDER BY rw.created_at DESC", (parent["id"],))
        reward_wishes = [{"id": r[0], "childId": r[1], "childName": r[2], "title": r[3], "emoji": r[4], "createdAt": str(r[5])} for r in cur.fetchall()]
    streak_claimed = advance_streak(conn, parent["id"])
    if streak_claimed:
        parent = get_parent_by_tg(conn, tid)
    streak = parent["streak_current"]
    next_xp, next_points = get_streak_bonus(streak + 1 if streak > 0 else 1)
    today_xp, today_points = get_streak_bonus(streak) if parent["streak_claimed_today"] else (0, 0)
    streak_reward = {
        "justClaimed": streak_claimed is not None,
        "todayXp": today_xp, "todayPoints": today_points,
        "nextXp": next_xp, "nextPoints": next_points,
        "claimed": parent["streak_claimed_today"],
    }
    check_trial_reminder(conn, parent["id"], tid)
    return json_response({**parent, "telegram_id": tid, "children": children, "tasks": tasks, "gradeRequests": grades, "rewards": rewards, "rewardWishes": reward_wishes, "streakReward": streak_reward})


def upload_photo_to_s3(photo_base64: str, task_id: int) -> str:
    """Загружает фото (base64) в S3 и возвращает публичный URL."""
    import boto3
    import base64
    import uuid

    # Убираем data URL prefix если есть (data:image/jpeg;base64,...)
    if "," in photo_base64:
        header, data = photo_base64.split(",", 1)
        # Определяем расширение из MIME-типа
        if "png" in header:
            ext = "png"
        elif "gif" in header:
            ext = "gif"
        elif "webp" in header:
            ext = "webp"
        else:
            ext = "jpg"
    else:
        data = photo_base64
        ext = "jpg"

    image_bytes = base64.b64decode(data)
    file_key = f"files/task_photos/{task_id}_{uuid.uuid4().hex[:8]}.{ext}"

    access_key = os.environ.get("AWS_ACCESS_KEY_ID", "")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY", "")

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="us-east-1",
    )

    s3.put_object(
        Bucket="files",
        Key=file_key,
        Body=image_bytes,
        ContentType=f"image/{ext}",
    )
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{file_key}"


def delete_photo_from_s3(photo_url: str):
    """Удаляет фото из S3 по CDN-ссылке."""
    try:
        import boto3
        prefix = "/bucket/"
        idx = photo_url.find(prefix)
        if idx == -1:
            return
        file_key = photo_url[idx + len(prefix):]
        access_key = os.environ.get("AWS_ACCESS_KEY_ID", "")
        secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="us-east-1",
        )
        s3.delete_object(Bucket="files", Key=file_key)
    except Exception as e:
        print(f"[S3] delete error: {e}")


def handle_upload_photo(conn, body):
    """Загружает фото задачи в S3 и возвращает URL. Вызывается отдельно перед child/complete."""
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    task_id = body.get("task_id")
    photo_base64 = body.get("photo_base64")
    if not task_id or not photo_base64:
        return error_response("task_id and photo_base64 required")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, parent_id, require_photo FROM {SCHEMA}.tasks WHERE id = %s AND child_id = %s", (task_id, child["id"]))
        task_row = cur.fetchone()
        if not task_row:
            return error_response("Task not found", 404)
    try:
        photo_url = upload_photo_to_s3(photo_base64, task_id)
    except Exception as e:
        print(f"[upload_photo] S3 error: {e}")
        return error_response(f"Upload failed: {e}", 500)
    return json_response({"ok": True, "photo_url": photo_url})


def handle_complete_task(conn, body):
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    task_id = body.get("task_id")
    if not task_id:
        return error_response("task_id required")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, stars, title, require_confirm, require_photo, parent_id FROM {SCHEMA}.tasks WHERE id = %s AND child_id = %s AND status = 'pending'", (task_id, child["id"]))
        task = cur.fetchone()
    if not task:
        return error_response("Task not found", 404)
    t_id, stars, title, require_confirm, require_photo, parent_id = task

    # Принимаем либо уже загруженный URL (photo_url), либо base64 для обратной совместимости
    photo_url = body.get("photo_url")
    photo_base64 = body.get("photo_base64")

    # Если передан base64 (старый путь) — загружаем в S3
    if not photo_url and photo_base64:
        try:
            photo_url = upload_photo_to_s3(photo_base64, t_id)
        except Exception as e:
            print(f"[complete_task] S3 upload error: {e}")
            return error_response(f"Photo upload failed: {e}", 500)

    if require_photo and not photo_url:
        return error_response("photo_required")

    # Если задача требует фото — require_confirm тоже должен быть True (автоматически)
    effective_require_confirm = require_confirm or require_photo

    new_status = "pending_confirm" if effective_require_confirm else "approved"

    if photo_url:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.tasks SET status = %s, completed_at = NOW(), photo_url = %s, photo_status = 'uploaded' WHERE id = %s",
                (new_status, photo_url, t_id)
            )
    else:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status = %s, completed_at = NOW() WHERE id = %s", (new_status, t_id))
    conn.commit()

    if not effective_require_confirm:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.children SET stars = stars + %s, total_stars_earned = total_stars_earned + %s WHERE id = %s RETURNING stars",
                (stars, stars, child["id"])
            )
            new_stars = cur.fetchone()[0]
        conn.commit()
        stats = get_child_stats(conn, child["id"])
        new_achievements = check_achievements(conn, child["id"], stats)
        # Notify parent
        if PARENT_TOKEN and parent_id:
            with conn.cursor() as cur:
                cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
                p_row = cur.fetchone()
            if p_row:
                send_tg_message(PARENT_TOKEN, p_row[0], f"🔔 <b>{child['name']}</b> выполнил «<b>{title}</b>»!\n\n💫 Начислено: {stars}⭐\n\nОткрой @parenttask_bot для подробностей.")
        return json_response({"ok": True, "new_stars": new_stars, "stars_earned": stars, "new_achievements": new_achievements})
    else:
        # Require confirm — notify parent to approve
        if PARENT_TOKEN and parent_id:
            with conn.cursor() as cur:
                cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
                p_row = cur.fetchone()
            if p_row:
                photo_note = "\n📸 Ребёнок прикрепил фото — проверь в приложении!" if photo_url else ""
                send_tg_message(PARENT_TOKEN, p_row[0], f"✅ <b>{child['name']}</b> выполнил «<b>{title}</b>» — ждёт твоего подтверждения!\n\n💫 Награда: {stars}⭐{photo_note}\n\nОткрой @parenttask_bot → Задачи.")
        return json_response({"ok": True, "pending_confirm": True})


def handle_confirm_task(conn, body):
    print(f"[confirm_task] body keys: {list(body.keys())}, task_id={body.get('task_id')}, confirm_action={body.get('confirm_action')}")
    tid, parent = resolve_parent(conn, body)
    print(f"[confirm_task] tid={tid} parent={bool(parent)}")
    if not parent:
        return error_response("Unauthorized", 401)
    task_id = body.get("task_id")
    action = body.get("confirm_action", "approve")  # approve | reject
    print(f"[confirm_task] task_id={task_id}, action={action}, parent_id={parent['id']}")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, child_id, stars, title, status FROM {SCHEMA}.tasks WHERE id = %s AND parent_id = %s", (task_id, parent["id"]))
        task_raw = cur.fetchone()
    print(f"[confirm_task] task_raw (any status)={task_raw}")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, child_id, stars, title FROM {SCHEMA}.tasks WHERE id = %s AND parent_id = %s AND status IN ('pending_confirm', 'done')", (task_id, parent["id"]))
        task = cur.fetchone()
    print(f"[confirm_task] task (filtered)={task}")
    if not task:
        return error_response("Task not found", 404)
    t_id, child_id, stars, title = task
    if action == "approve":
        with conn.cursor() as cur:
            cur.execute(f"SELECT photo_url FROM {SCHEMA}.tasks WHERE id = %s", (t_id,))
            photo_row = cur.fetchone()
            photo_url = photo_row[0] if photo_row else None
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'approved', photo_url = NULL, photo_status = 'deleted' WHERE id = %s", (t_id,))
            cur.execute(
                f"UPDATE {SCHEMA}.children SET stars = stars + %s, total_stars_earned = total_stars_earned + %s WHERE id = %s RETURNING stars",
                (stars, stars, child_id)
            )
            new_stars = cur.fetchone()[0]
        conn.commit()
        if photo_url:
            delete_photo_from_s3(photo_url)
        add_parent_xp(conn, parent["id"], 30)
        advance_streak(conn, parent["id"])
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id, name FROM {SCHEMA}.children WHERE id = %s", (child_id,))
            c_row = cur.fetchone()
        if c_row and CHILD_TOKEN:
            send_tg_message(CHILD_TOKEN, c_row[0], f"🎉 Родитель подтвердил «<b>{title}</b>»!\n\n💫 +{stars}⭐ начислено! Твой баланс: {new_stars}⭐")
        return json_response({"ok": True, "new_stars": new_stars})
    else:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'pending', photo_url = NULL, photo_status = 'none' WHERE id = %s", (t_id,))
        conn.commit()
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.children WHERE id = %s", (child_id,))
            c_row = cur.fetchone()
        if c_row and CHILD_TOKEN:
            send_tg_message(CHILD_TOKEN, c_row[0], f"↩️ Родитель вернул задачу «<b>{title}</b>».\n\nПопробуй выполнить ещё раз! Открой @task4kids_bot.")
        return json_response({"ok": True, "rejected": True})


def handle_add_task(conn, body):
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    child_id = body.get("child_id")
    title = body.get("title", "").strip()
    stars = int(body.get("stars", 3))
    emoji = body.get("emoji", "📋")
    require_photo = bool(body.get("require_photo", False))
    require_confirm = bool(body.get("require_confirm", False))
    if require_photo and not parent.get("is_premium"):
        return error_response("premium_required", 403)
    deadline_str = body.get("deadline")  # ISO string or None
    if not title:
        return error_response("title required")
    deadline_val = None
    if deadline_str:
        try:
            from datetime import timezone as _tz
            deadline_val = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        except Exception:
            deadline_val = None
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.tasks (parent_id, child_id, title, stars, emoji, require_photo, require_confirm, deadline) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (parent["id"], child_id, title, stars, emoji, require_photo, require_confirm, deadline_val)
        )
        task_id = cur.fetchone()[0]
    conn.commit()
    add_parent_xp(conn, parent["id"], 20)
    advance_streak(conn, parent["id"])
    # Notify child
    with conn.cursor() as cur:
        cur.execute(f"SELECT telegram_id, name FROM {SCHEMA}.children WHERE id = %s", (child_id,))
        c_row = cur.fetchone()
    if c_row and CHILD_TOKEN:
        photo_note = "\n📸 Нужен фотоотчёт" if require_photo else ""
        confirm_note = "\n✅ Нужно подтверждение родителя" if require_confirm else ""
        deadline_note = ""
        if deadline_val:
            deadline_note = f"\n⏰ Срок: до {deadline_val.strftime('%d.%m %H:%M')}"
        send_tg_message(CHILD_TOKEN, c_row[0], f"📋 Новое задание от родителя!\n\n{emoji} <b>{title}</b>\n💫 Награда: {stars}⭐{photo_note}{confirm_note}{deadline_note}\n\nОткрой @task4kids_bot для выполнения.")
    return json_response({"ok": True, "task_id": task_id})


def handle_submit_grade(conn, body):
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    subject = body.get("subject", "").strip()
    grade = int(body.get("grade", 0))
    date_str = body.get("date", str(date.today()))
    if not subject or grade not in GRADE_STARS:
        return error_response("Invalid grade data")
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.grade_requests (child_id, parent_id, subject, grade, date) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (child["id"], child["parent_id"], subject, grade, date_str)
        )
        req_id = cur.fetchone()[0]
    conn.commit()
    # Notify parent
    if PARENT_TOKEN and child["parent_id"]:
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (child["parent_id"],))
            p_row = cur.fetchone()
        if p_row:
            send_tg_message(PARENT_TOKEN, p_row[0], f"📝 <b>{child['name']}</b> получил оценку!\n\n📚 Предмет: {subject}\n🔢 Оценка: {grade} ({GRADE_STARS[grade]}⭐)\n📅 Дата: {date_str}\n\nОткрой @parenttask_bot → Оценки для подтверждения.")
    return json_response({"ok": True, "request_id": req_id})


def handle_approve_grade(conn, body):
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    req_id = body.get("request_id")
    action = body.get("grade_action", body.get("action", "approve"))
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, child_id, grade, subject FROM {SCHEMA}.grade_requests WHERE id = %s AND parent_id = %s AND status = 'pending'", (req_id, parent["id"]))
        req = cur.fetchone()
    if not req:
        return error_response("Request not found", 404)
    r_id, child_id, grade, subject = req
    if action == "approve":
        stars = GRADE_STARS.get(grade, grade)
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.grade_requests SET status = 'approved', stars_awarded = %s WHERE id = %s", (stars, r_id))
            cur.execute(
                f"UPDATE {SCHEMA}.children SET stars = stars + %s, total_stars_earned = total_stars_earned + %s WHERE id = %s RETURNING stars",
                (stars, stars, child_id)
            )
            new_stars = cur.fetchone()[0]
        conn.commit()
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.children WHERE id = %s", (child_id,))
            c_row = cur.fetchone()
        if c_row and CHILD_TOKEN:
            send_tg_message(CHILD_TOKEN, c_row[0], f"🌟 Родитель подтвердил оценку!\n\n📚 {subject}: {grade} балл → +{stars}⭐\n\nТвой баланс: {new_stars}⭐")
        return json_response({"ok": True, "stars_awarded": stars})
    else:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.grade_requests SET status = 'rejected' WHERE id = %s", (r_id,))
        conn.commit()
        return json_response({"ok": True, "rejected": True})


def handle_request_extension(conn, body):
    """Ребёнок запрашивает дополнительное время для задачи."""
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    task_id = body.get("task_id")
    if not task_id:
        return error_response("task_id required")
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, title, parent_id, deadline, extension_requested FROM {SCHEMA}.tasks WHERE id = %s AND child_id = %s AND status = 'pending'",
            (task_id, child["id"])
        )
        task = cur.fetchone()
    if not task:
        return error_response("Task not found", 404)
    t_id, title, parent_id, deadline, already_requested = task
    if already_requested:
        return error_response("Extension already requested")
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.tasks SET extension_requested = TRUE, extension_granted = FALSE WHERE id = %s",
            (t_id,)
        )
    conn.commit()
    # Уведомить родителя
    if PARENT_TOKEN and parent_id:
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
            p_row = cur.fetchone()
        if p_row:
            deadline_info = ""
            if deadline:
                deadline_info = f"\n⏰ Срок был: {deadline.strftime('%d.%m %H:%M')}"
            send_tg_message(
                PARENT_TOKEN, p_row[0],
                f"⏰ <b>{child['name']}</b> просит доп. время для задачи «<b>{title}</b>»!{deadline_info}\n\nОткрой @parenttask_bot → Задачи чтобы продлить или отказать."
            )
    return json_response({"ok": True})


def handle_task_extension(conn, body):
    """Родитель отвечает на запрос дополнительного времени."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    task_id = body.get("task_id")
    action = body.get("extension_action", "grant")  # grant | deny
    hours = int(body.get("hours", 24))
    if not task_id:
        return error_response("task_id required")
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, title, child_id, deadline FROM {SCHEMA}.tasks WHERE id = %s AND parent_id = %s AND extension_requested = TRUE",
            (task_id, parent["id"])
        )
        task = cur.fetchone()
    if not task:
        return error_response("Task not found or no extension request", 404)
    t_id, title, child_id, current_deadline = task
    if action == "grant":
        now = datetime.now(timezone.utc)
        base = current_deadline if current_deadline and current_deadline > now else now
        new_deadline = base + timedelta(hours=hours)
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.tasks SET deadline = %s, extension_requested = FALSE, extension_granted = TRUE, extension_hours = %s WHERE id = %s",
                (new_deadline, hours, t_id)
            )
        conn.commit()
        # Уведомить ребёнка
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.children WHERE id = %s", (child_id,))
            c_row = cur.fetchone()
        if c_row and CHILD_TOKEN:
            send_tg_message(
                CHILD_TOKEN, c_row[0],
                f"✅ Родитель продлил срок для задачи «<b>{title}</b>»!\n\n⏰ Новый дедлайн: {new_deadline.strftime('%d.%m %H:%M')}\n\nУдачи! Открой @task4kids_bot."
            )
        return json_response({"ok": True, "new_deadline": new_deadline.isoformat(), "hours_granted": hours})
    else:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.tasks SET extension_requested = FALSE WHERE id = %s",
                (t_id,)
            )
        conn.commit()
        # Уведомить ребёнка
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.children WHERE id = %s", (child_id,))
            c_row = cur.fetchone()
        if c_row and CHILD_TOKEN:
            send_tg_message(
                CHILD_TOKEN, c_row[0],
                f"⏰ Родитель не продлил срок для задачи «<b>{title}</b>».\n\nПостарайся выполнить как можно скорее! Открой @task4kids_bot."
            )
        return json_response({"ok": True, "denied": True})


def handle_buy_reward(conn, body):
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    reward_id = body.get("reward_id")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, title, cost, parent_id, child_id, quantity FROM {SCHEMA}.rewards WHERE id = %s AND parent_id = %s", (reward_id, child["parent_id"]))
        reward = cur.fetchone()
    if not reward:
        return error_response("Reward not found", 404)
    r_id, title, cost, parent_id, reward_child_id, quantity = reward
    # Проверяем, что награда предназначена именно этому ребёнку
    if reward_child_id != child["id"]:
        return error_response("Reward not found", 404)
    # Проверяем наличие доступных наград
    if quantity <= 0:
        return error_response("Награда недоступна (закончилась)")
    if child["stars"] < cost:
        return error_response("Not enough stars")
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars - %s WHERE id = %s RETURNING stars", (cost, child["id"]))
        new_stars = cur.fetchone()[0]
        # Уменьшаем счётчик доступных наград
        cur.execute(f"UPDATE {SCHEMA}.rewards SET quantity = quantity - 1 WHERE id = %s RETURNING quantity", (r_id,))
        new_quantity = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {SCHEMA}.reward_purchases (child_id, reward_id, status) VALUES (%s, %s, 'pending')", (child["id"], r_id))
    conn.commit()
    # Обновляем статистику ачивок
    stats = get_child_stats(conn, child["id"])
    check_achievements(conn, child["id"], stats)
    if PARENT_TOKEN and parent_id:
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
            p_row = cur.fetchone()
        if p_row:
            qty_info = f" (осталось: {new_quantity} шт.)" if new_quantity > 0 else " (последняя!)"
            send_tg_message(PARENT_TOKEN, p_row[0], f"🛍️ <b>{child['name']}</b> потратил {cost}⭐ на «<b>{title}</b>»!{qty_info}\n\nОткрой @parenttask_bot для подтверждения покупки.")
    return json_response({"ok": True, "new_stars": new_stars, "new_quantity": new_quantity})


def handle_streak_claim(conn, body):
    """Бонус начисляется автоматически. Эндпоинт оставлен для совместимости."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    streak = parent["streak_current"]
    xp, points = get_streak_bonus(streak)
    return json_response({"ok": True, "xp": xp, "points": points, "streak": streak, "auto": True})


CHILD_AVATARS = ["👦", "👧", "🧒", "👶", "🐱", "🦊", "🐼", "🦁", "🐸", "🐧", "🦋", "🌟"]

import random
import string

def gen_invite_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def handle_add_child(conn, body):
    """Добавить ребёнка родителю (без Telegram — оффлайн профиль)."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    if not parent.get("is_premium"):
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.children WHERE parent_id = %s", (parent["id"],))
            child_count = cur.fetchone()[0]
        if child_count >= 1:
            return error_response("premium_required", 403)
    name = (body.get("name") or "").strip()
    age = body.get("age", 9)
    avatar = body.get("avatar", "👧")
    if not name:
        return error_response("Имя обязательно", 400)
    code = gen_invite_code()
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.children (parent_id, name, age, avatar, stars, invite_code) VALUES (%s, %s, %s, %s, 0, %s) RETURNING id",
            (parent["id"], name, age, avatar, code)
        )
        child_id = cur.fetchone()[0]
    conn.commit()
    return json_response({"ok": True, "child_id": child_id, "invite_code": code})


def handle_child_invite(conn, body):
    """Сгенерировать новый код приглашения для ребёнка (если уже подключён — сбросить)."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    child_id = body.get("child_id")
    if not child_id:
        return error_response("child_id required", 400)
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.children WHERE id = %s AND parent_id = %s", (child_id, parent["id"]))
        if not cur.fetchone():
            return error_response("Child not found", 404)
    code = gen_invite_code()
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.children SET invite_code = %s WHERE id = %s", (code, child_id))
    conn.commit()
    return json_response({"ok": True, "invite_code": code})


def handle_remove_child(conn, body):
    """Удалить ребёнка родителя (только если нет звёзд или родитель подтвердил)."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    child_id = body.get("child_id")
    if not child_id:
        return error_response("child_id required", 400)
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.children WHERE id = %s AND parent_id = %s", (child_id, parent["id"]))
        if not cur.fetchone():
            return error_response("Child not found", 404)
        cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE child_id = %s", (child_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.grade_requests WHERE child_id = %s", (child_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.achievements WHERE child_id = %s", (child_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.children WHERE id = %s", (child_id,))
    conn.commit()
    return json_response({"ok": True})


def handle_add_reward(conn, body):
    """Родитель добавляет награду для конкретного ребёнка с указанием количества."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    title = (body.get("title") or "").strip()
    cost = body.get("cost", 10)
    emoji = body.get("emoji", "🎁")
    child_id = body.get("child_id")
    quantity = body.get("quantity", 1)
    if not title:
        return error_response("Название обязательно", 400)
    try:
        cost = int(cost)
        if cost < 1:
            raise ValueError
    except (ValueError, TypeError):
        return error_response("Стоимость должна быть числом >= 1", 400)
    try:
        quantity = int(quantity)
        if quantity < 1:
            raise ValueError
    except (ValueError, TypeError):
        return error_response("Количество должно быть числом >= 1", 400)
    if not child_id:
        return error_response("Необходимо выбрать ребёнка", 400)
    # Проверяем, что ребёнок принадлежит этому родителю
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.children WHERE id = %s AND parent_id = %s", (child_id, parent["id"]))
        if not cur.fetchone():
            return error_response("Ребёнок не найден", 404)
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.rewards (parent_id, child_id, title, cost, emoji, quantity) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (parent["id"], child_id, title, cost, emoji, quantity)
        )
        reward_id = cur.fetchone()[0]
    conn.commit()
    return json_response({"ok": True, "reward_id": reward_id})


def handle_remove_reward(conn, body):
    """Родитель удаляет награду."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    reward_id = body.get("reward_id")
    if not reward_id:
        return error_response("reward_id required", 400)
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.rewards WHERE id = %s AND parent_id = %s", (reward_id, parent["id"]))
        if not cur.fetchone():
            return error_response("Reward not found", 404)
        cur.execute(f"DELETE FROM {SCHEMA}.reward_purchases WHERE reward_id = %s", (reward_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.rewards WHERE id = %s", (reward_id,))
    conn.commit()
    return json_response({"ok": True})


def handle_activate_trial(conn, body):
    """Активация 7-дневного пробного периода Premium."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    if parent.get("is_premium_paid"):
        return error_response("already_premium", 400)
    if parent.get("trial_used"):
        return error_response("trial_already_used", 400)
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=7)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET trial_started_at = %s, trial_ends_at = %s, trial_used = true WHERE id = %s",
            (now, trial_end, parent["id"])
        )
    conn.commit()
    return json_response({"ok": True, "trial_ends_at": trial_end.isoformat(), "trial_days_left": 7})


def handle_delete_task(conn, body):
    """Родитель удаляет выполненное задание (статус approved/done) из истории."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    task_id = body.get("task_id")
    if not task_id:
        return error_response("task_id required", 400)
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.tasks WHERE id = %s AND parent_id = %s AND status IN ('approved', 'done')",
            (task_id, parent["id"])
        )
        if not cur.fetchone():
            return error_response("Task not found or not completed", 404)
        cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
    conn.commit()
    return json_response({"ok": True})


def handle_cancel_task(conn, body):
    """Родитель отменяет незавершённое задание (статус pending)."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    task_id = body.get("task_id")
    if not task_id:
        return error_response("task_id required", 400)
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, child_id, title FROM {SCHEMA}.tasks WHERE id = %s AND parent_id = %s AND status = 'pending'",
            (task_id, parent["id"])
        )
        task = cur.fetchone()
        if not task:
            return error_response("Task not found or not pending", 404)
        t_id, child_id, title = task
        cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id = %s", (t_id,))
    conn.commit()
    # Уведомляем ребёнка об отмене задания
    with conn.cursor() as cur:
        cur.execute(f"SELECT telegram_id FROM {SCHEMA}.children WHERE id = %s", (child_id,))
        c_row = cur.fetchone()
    if c_row and CHILD_TOKEN:
        send_tg_message(CHILD_TOKEN, c_row[0], f"❌ Родитель отменил задание «<b>{title}</b>»")
    return json_response({"ok": True})


def handle_child_delete_task(conn, body):
    """Ребёнок удаляет выполненное задание (статус approved/done) из своей истории."""
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    child_id = child["id"]
    task_id = body.get("task_id")
    if not task_id:
        return error_response("task_id required", 400)
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.tasks WHERE id = %s AND child_id = %s AND status IN ('approved', 'done')",
            (task_id, child_id)
        )
        if not cur.fetchone():
            return error_response("Task not found or not completed", 404)
        cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id = %s", (task_id,))
    conn.commit()
    return json_response({"ok": True})


def handle_child_purchases(conn, body):
    """История покупок наград ребёнка из PostgreSQL."""
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT rp.id, rp.reward_id, r.title, r.emoji, r.cost, rp.status, rp.purchased_at
                FROM {SCHEMA}.reward_purchases rp
                JOIN {SCHEMA}.rewards r ON rp.reward_id = r.id
                WHERE rp.child_id = %s
                ORDER BY rp.purchased_at DESC LIMIT 50""",
            (child["id"],)
        )
        purchases = [
            {"id": r[0], "rewardId": r[1], "title": r[2], "emoji": r[3], "cost": r[4], "status": r[5], "purchasedAt": str(r[6])}
            for r in cur.fetchall()
        ]
    return json_response({"ok": True, "purchases": purchases, "totalSpent": sum(p["cost"] for p in purchases)})


def handle_child_wish_add(conn, body):
    """Ребёнок запрашивает желаемую награду."""
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    title = (body.get("title") or "").strip()
    emoji = body.get("emoji", "🎁")
    if not title:
        return error_response("title required", 400)
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reward_wishes WHERE child_id = %s AND status = 'pending'", (child["id"],))
        cnt = cur.fetchone()[0]
        if cnt >= 10:
            return error_response("too_many_wishes", 400)
        cur.execute(
            f"INSERT INTO {SCHEMA}.reward_wishes (child_id, parent_id, title, emoji) VALUES (%s, %s, %s, %s) RETURNING id",
            (child["id"], child["parent_id"], title, emoji)
        )
        wish_id = cur.fetchone()[0]
    conn.commit()
    if PARENT_TOKEN:
        with conn.cursor() as cur:
            cur.execute(f"SELECT p.telegram_id FROM {SCHEMA}.parents p WHERE p.id = %s", (child["parent_id"],))
            p_row = cur.fetchone()
        if p_row:
            send_tg_message(PARENT_TOKEN, p_row[0], f"💫 {child['name']} хочет награду: <b>{emoji} {title}</b>\n\nПосмотри в разделе Бонусы → Желаемые награды")
    return json_response({"ok": True, "wish_id": wish_id})


def handle_child_wish_delete(conn, body):
    """Ребёнок удаляет свой запрос на награду."""
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    wish_id = body.get("wish_id")
    if not wish_id:
        return error_response("wish_id required", 400)
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {SCHEMA}.reward_wishes WHERE id = %s AND child_id = %s", (wish_id, child["id"]))
    conn.commit()
    return json_response({"ok": True})


def handle_parent_wish_dismiss(conn, body):
    """Родитель отклоняет желание ребёнка."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    wish_id = body.get("wish_id")
    if not wish_id:
        return error_response("wish_id required", 400)
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {SCHEMA}.reward_wishes WHERE id = %s AND parent_id = %s", (wish_id, parent["id"]))
    conn.commit()
    return json_response({"ok": True})


def handle_child_analytics(conn, body):
    """Детальная аналитика по всем детям родителя."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    if not parent.get("is_premium"):
        return error_response("premium_required", 403)

    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, avatar, age, stars, total_stars_earned FROM {SCHEMA}.children WHERE parent_id = %s ORDER BY created_at",
            (parent["id"],)
        )
        children_rows = cur.fetchall()

    result = []
    for child_id, name, avatar, age, stars, total_stars_earned in children_rows:
        total_stars_earned = total_stars_earned or 0
        stars = stars or 0
        level, _ = compute_level(total_stars_earned)

        with conn.cursor() as cur:
            # Задачи: всего, выполненных, отменённых, на рассмотрении, в процессе
            cur.execute(f"""
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'approved') AS completed,
                    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                    COUNT(*) FILTER (WHERE status = 'pending_confirm') AS pending_confirm,
                    COALESCE(SUM(stars) FILTER (WHERE status = 'approved'), 0) AS earned_from_tasks,
                    COUNT(*) FILTER (WHERE deadline IS NOT NULL AND status = 'pending' AND deadline < NOW()) AS overdue,
                    COUNT(*) FILTER (WHERE require_photo = true) AS with_photo,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS tasks_last_7d,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS tasks_last_30d,
                    COUNT(*) FILTER (WHERE status = 'approved' AND completed_at >= NOW() - INTERVAL '7 days') AS completed_last_7d,
                    COUNT(*) FILTER (WHERE status = 'approved' AND completed_at >= NOW() - INTERVAL '30 days') AS completed_last_30d
                FROM {SCHEMA}.tasks WHERE child_id = %s
            """, (child_id,))
            t = cur.fetchone()
            tasks_total, tasks_completed, tasks_pending, tasks_pending_confirm, earned_from_tasks, tasks_overdue, tasks_with_photo, tasks_last_7d, tasks_last_30d, completed_last_7d, completed_last_30d = t

            # Награды: потрачено звёзд, куплено наград, топ наград
            cur.execute(f"""
                SELECT
                    COALESCE(SUM(r.cost), 0) AS stars_spent,
                    COUNT(*) AS rewards_bought
                FROM {SCHEMA}.reward_purchases rp
                JOIN {SCHEMA}.rewards r ON rp.reward_id = r.id
                WHERE rp.child_id = %s
            """, (child_id,))
            rw = cur.fetchone()
            stars_spent, rewards_bought = rw

            # Топ-3 наиболее покупаемых награды
            cur.execute(f"""
                SELECT r.title, r.emoji, COUNT(*) AS cnt
                FROM {SCHEMA}.reward_purchases rp
                JOIN {SCHEMA}.rewards r ON rp.reward_id = r.id
                WHERE rp.child_id = %s
                GROUP BY r.id, r.title, r.emoji
                ORDER BY cnt DESC
                LIMIT 3
            """, (child_id,))
            top_rewards = [{"title": row[0], "emoji": row[1], "count": row[2]} for row in cur.fetchall()]

            # Ачивки
            cur.execute(f"SELECT achievement_id, unlocked_at FROM {SCHEMA}.achievements WHERE child_id = %s ORDER BY unlocked_at", (child_id,))
            achievements = [{"id": row[0], "unlockedAt": str(row[1])} for row in cur.fetchall()]

            # Оценки: всего, среднее, по предметам
            cur.execute(f"""
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                    COALESCE(AVG(grade) FILTER (WHERE status = 'approved'), 0) AS avg_grade,
                    COALESCE(SUM(stars_awarded) FILTER (WHERE status = 'approved'), 0) AS stars_from_grades
                FROM {SCHEMA}.grade_requests WHERE child_id = %s
            """, (child_id,))
            gr = cur.fetchone()
            grades_total, grades_approved, avg_grade, stars_from_grades = gr

            # Топ-3 предметов по оценкам
            cur.execute(f"""
                SELECT subject, ROUND(AVG(grade)::numeric, 1) AS avg_g, COUNT(*) AS cnt
                FROM {SCHEMA}.grade_requests
                WHERE child_id = %s AND status = 'approved'
                GROUP BY subject
                ORDER BY avg_g DESC
                LIMIT 3
            """, (child_id,))
            top_subjects = [{"subject": row[0], "avgGrade": float(row[1]), "count": row[2]} for row in cur.fetchall()]

            # Динамика по неделям (последние 4 недели): задач выполнено и звёзд заработано
            cur.execute(f"""
                SELECT
                    DATE_TRUNC('week', completed_at) AS week,
                    COUNT(*) AS tasks_done,
                    COALESCE(SUM(stars), 0) AS stars_earned
                FROM {SCHEMA}.tasks
                WHERE child_id = %s AND status = 'approved' AND completed_at IS NOT NULL
                  AND completed_at >= NOW() - INTERVAL '28 days'
                GROUP BY week
                ORDER BY week
            """, (child_id,))
            weekly_activity = [{"week": str(row[0])[:10], "tasksDone": row[1], "starsEarned": row[2]} for row in cur.fetchall()]

            # Соотношение оценок (5,4,3,2)
            cur.execute(f"""
                SELECT grade, COUNT(*) FROM {SCHEMA}.grade_requests
                WHERE child_id = %s AND status = 'approved'
                GROUP BY grade ORDER BY grade DESC
            """, (child_id,))
            grade_distribution = {str(row[0]): row[1] for row in cur.fetchall()}

        # Коэффициент выполнения задач
        completion_rate = round((tasks_completed / tasks_total * 100) if tasks_total > 0 else 0, 1)
        stars_balance = total_stars_earned - stars_spent

        result.append({
            "childId": child_id,
            "name": name,
            "avatar": avatar or "👧",
            "age": age or 0,
            "level": level,
            "starsBalance": stars,
            "totalStarsEarned": total_stars_earned,
            "starsSpent": int(stars_spent),
            "starsFromTasks": int(earned_from_tasks),
            "starsFromGrades": int(stars_from_grades),
            "tasks": {
                "total": int(tasks_total),
                "completed": int(tasks_completed),
                "pending": int(tasks_pending),
                "pendingConfirm": int(tasks_pending_confirm),
                "overdue": int(tasks_overdue),
                "withPhoto": int(tasks_with_photo),
                "last7d": int(tasks_last_7d),
                "last30d": int(tasks_last_30d),
                "completedLast7d": int(completed_last_7d),
                "completedLast30d": int(completed_last_30d),
                "completionRate": float(completion_rate),
            },
            "rewards": {
                "bought": int(rewards_bought),
                "starsSpent": int(stars_spent),
                "topRewards": top_rewards,
            },
            "grades": {
                "total": int(grades_total),
                "approved": int(grades_approved),
                "avgGrade": round(float(avg_grade), 1),
                "starsFromGrades": int(stars_from_grades),
                "topSubjects": top_subjects,
                "distribution": grade_distribution,
            },
            "achievements": achievements,
            "weeklyActivity": weekly_activity,
        })

    return json_response({"ok": True, "analytics": result})


import secrets as _secrets


def ensure_friend_code(conn, child_id):
    """Генерирует friend_code если его нет."""
    with conn.cursor() as cur:
        cur.execute(f"SELECT friend_code FROM {SCHEMA}.children WHERE id = %s", (child_id,))
        code = cur.fetchone()[0]
        if code:
            return code
        code = _secrets.token_hex(4).upper()
        cur.execute(f"UPDATE {SCHEMA}.children SET friend_code = %s WHERE id = %s", (code, child_id))
        conn.commit()
        return code


def handle_friends_list(conn, body):
    """Список друзей + входящие заявки."""
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("no_tg_id")
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("not_found")
    cid = child["id"]
    friend_code = ensure_friend_code(conn, cid)
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT c.id, c.name, c.avatar, c.stars, c.total_stars_earned, c.age,
                   (SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE child_id = c.id AND status = 'approved') as tasks_done
            FROM {SCHEMA}.friendships f
            JOIN {SCHEMA}.children c ON c.id = CASE WHEN f.requester_id = %s THEN f.addressee_id ELSE f.requester_id END
            WHERE (f.requester_id = %s OR f.addressee_id = %s) AND f.status = 'accepted'
            ORDER BY c.total_stars_earned DESC
        """, (cid, cid, cid))
        friends = []
        for r in cur.fetchall():
            lvl, _ = compute_level(r[4])
            friends.append({"id": r[0], "name": r[1], "avatar": r[2], "stars": r[3], "totalStarsEarned": r[4], "age": r[5], "tasksDone": r[6], "level": lvl})
        cur.execute(f"""
            SELECT f.id, c.id as child_id, c.name, c.avatar, c.age
            FROM {SCHEMA}.friendships f
            JOIN {SCHEMA}.children c ON c.id = f.requester_id
            WHERE f.addressee_id = %s AND f.status = 'pending'
            ORDER BY f.created_at DESC
        """, (cid,))
        incoming = [{"requestId": r[0], "childId": r[1], "name": r[2], "avatar": r[3], "age": r[4]} for r in cur.fetchall()]
        cur.execute(f"""
            SELECT f.id, c.id as child_id, c.name, c.avatar
            FROM {SCHEMA}.friendships f
            JOIN {SCHEMA}.children c ON c.id = f.addressee_id
            WHERE f.requester_id = %s AND f.status = 'pending'
        """, (cid,))
        outgoing = [{"requestId": r[0], "childId": r[1], "name": r[2], "avatar": r[3]} for r in cur.fetchall()]
    my_tasks_done = 0
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE child_id = %s AND status = 'approved'", (cid,))
        my_tasks_done = cur.fetchone()[0]
    my_level, _ = compute_level(child["total_stars_earned"])
    return json_response({
        "ok": True,
        "friendCode": friend_code,
        "me": {"id": cid, "name": child["name"], "avatar": child["avatar"], "stars": child["stars"], "totalStarsEarned": child["total_stars_earned"], "level": my_level, "tasksDone": my_tasks_done},
        "friends": friends,
        "incoming": incoming,
        "outgoing": outgoing,
    })


def handle_friend_add(conn, body):
    """Отправить запрос дружбы по friend_code."""
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("no_tg_id")
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("not_found")
    code = (body.get("friend_code") or "").strip().upper()
    if not code:
        return error_response("no_code")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.children WHERE friend_code = %s", (code,))
        row = cur.fetchone()
        if not row:
            return error_response("invalid_code")
        target_id = row[0]
        if target_id == child["id"]:
            return error_response("self_add")
        a, b = min(child["id"], target_id), max(child["id"], target_id)
        cur.execute(f"SELECT id, status FROM {SCHEMA}.friendships WHERE (requester_id = %s AND addressee_id = %s) OR (requester_id = %s AND addressee_id = %s)", (child["id"], target_id, target_id, child["id"]))
        existing = cur.fetchone()
        if existing:
            if existing[1] == "accepted":
                return error_response("already_friends")
            if existing[1] == "pending":
                return error_response("already_sent")
            if existing[1] == "rejected":
                cur.execute(f"UPDATE {SCHEMA}.friendships SET status = 'pending', requester_id = %s, addressee_id = %s, updated_at = now() WHERE id = %s", (child["id"], target_id, existing[0]))
                conn.commit()
                return json_response({"ok": True})
        cur.execute(f"INSERT INTO {SCHEMA}.friendships (requester_id, addressee_id, status) VALUES (%s, %s, 'pending')", (child["id"], target_id))
        conn.commit()
    return json_response({"ok": True})


def handle_friend_accept(conn, body):
    """Принять заявку."""
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("no_tg_id")
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("not_found")
    request_id = body.get("request_id")
    if not request_id:
        return error_response("no_request_id")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, addressee_id, status FROM {SCHEMA}.friendships WHERE id = %s", (request_id,))
        row = cur.fetchone()
        if not row or row[1] != child["id"] or row[2] != "pending":
            return error_response("invalid_request")
        cur.execute(f"UPDATE {SCHEMA}.friendships SET status = 'accepted', updated_at = now() WHERE id = %s", (request_id,))
        conn.commit()
    return json_response({"ok": True})


def handle_friend_reject(conn, body):
    """Отклонить заявку."""
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("no_tg_id")
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("not_found")
    request_id = body.get("request_id")
    if not request_id:
        return error_response("no_request_id")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, addressee_id, status FROM {SCHEMA}.friendships WHERE id = %s", (request_id,))
        row = cur.fetchone()
        if not row or row[1] != child["id"] or row[2] != "pending":
            return error_response("invalid_request")
        cur.execute(f"UPDATE {SCHEMA}.friendships SET status = 'rejected', updated_at = now() WHERE id = %s", (request_id,))
        conn.commit()
    return json_response({"ok": True})


def handle_friend_remove(conn, body):
    """Удалить друга (ставим rejected)."""
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("no_tg_id")
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("not_found")
    friend_id = body.get("friend_id")
    if not friend_id:
        return error_response("no_friend_id")
    with conn.cursor() as cur:
        cur.execute(f"""
            UPDATE {SCHEMA}.friendships SET status = 'rejected', updated_at = now()
            WHERE ((requester_id = %s AND addressee_id = %s) OR (requester_id = %s AND addressee_id = %s)) AND status = 'accepted'
        """, (child["id"], friend_id, friend_id, child["id"]))
        conn.commit()
    return json_response({"ok": True})


def handle_parent_toggle_notifications(conn, body):
    """Переключить уведомления для родителя."""
    tid, parent = resolve_parent(conn, body)
    if not parent:
        return error_response("Unauthorized", 401)
    enabled = body.get("enabled")
    settings = body.get("settings")
    with conn.cursor() as cur:
        if enabled is not None:
            cur.execute(
                f"UPDATE {SCHEMA}.parents SET notifications_enabled = %s WHERE id = %s",
                (bool(enabled), parent["id"]),
            )
        if settings:
            cur.execute(
                f"UPDATE {SCHEMA}.parents SET notification_settings = %s WHERE id = %s",
                (json.dumps(settings), parent["id"]),
            )
        conn.commit()
    return json_response({"ok": True})


def handle_child_toggle_notifications(conn, body):
    """Переключить уведомления для ребёнка."""
    tid, child = resolve_child(conn, body)
    if not child:
        return error_response("Unauthorized", 401)
    enabled = body.get("enabled")
    settings = body.get("settings")
    with conn.cursor() as cur:
        if enabled is not None:
            cur.execute(
                f"UPDATE {SCHEMA}.children SET notifications_enabled = %s WHERE id = %s",
                (bool(enabled), child["id"]),
            )
        if settings:
            cur.execute(
                f"UPDATE {SCHEMA}.children SET notification_settings = %s WHERE id = %s",
                (json.dumps(settings), child["id"]),
            )
        conn.commit()
    return json_response({"ok": True})


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # Роут передаётся полем action в теле запроса
    action = body.get("action", "")

    conn = get_db()
    try:
        # ── Child routes ──
        if action == "child/auth":
            return handle_auth_child(conn, body)
        if action == "child/connect":
            return handle_connect_child(conn, body)
        if action == "child/complete":
            return handle_complete_task(conn, body)
        if action == "child/upload_photo":
            return handle_upload_photo(conn, body)
        if action == "child/grade/submit":
            return handle_submit_grade(conn, body)
        if action == "child/reward/buy":
            return handle_buy_reward(conn, body)
        if action == "child/task/request_extension":
            return handle_request_extension(conn, body)
        if action == "child/task/delete":
            return handle_child_delete_task(conn, body)
        if action == "child/purchases":
            return handle_child_purchases(conn, body)
        if action == "child/wish/add":
            return handle_child_wish_add(conn, body)
        if action == "child/wish/delete":
            return handle_child_wish_delete(conn, body)
        if action == "child/friends/list":
            return handle_friends_list(conn, body)
        if action == "child/friends/add":
            return handle_friend_add(conn, body)
        if action == "child/friends/accept":
            return handle_friend_accept(conn, body)
        if action == "child/friends/reject":
            return handle_friend_reject(conn, body)
        if action == "child/friends/remove":
            return handle_friend_remove(conn, body)
        if action == "child/notifications/toggle":
            return handle_child_toggle_notifications(conn, body)

        # ── Parent routes ──
        if action == "parent/auth":
            return handle_auth_parent(conn, body)
        if action == "parent/task/add":
            return handle_add_task(conn, body)
        if action == "parent/task/confirm":
            return handle_confirm_task(conn, body)
        if action == "parent/task/extension":
            return handle_task_extension(conn, body)
        if action == "parent/grade/approve":
            return handle_approve_grade(conn, body)
        if action == "parent/streak/claim":
            return handle_streak_claim(conn, body)
        if action == "parent/child/add":
            return handle_add_child(conn, body)
        if action == "parent/child/remove":
            return handle_remove_child(conn, body)
        if action == "parent/child/invite":
            return handle_child_invite(conn, body)
        if action == "parent/reward/add":
            return handle_add_reward(conn, body)
        if action == "parent/reward/remove":
            return handle_remove_reward(conn, body)
        if action == "parent/task/delete":
            return handle_delete_task(conn, body)
        if action == "parent/task/cancel":
            return handle_cancel_task(conn, body)
        if action == "parent/analytics":
            return handle_child_analytics(conn, body)
        if action == "parent/trial/activate":
            return handle_activate_trial(conn, body)
        if action == "parent/wish/dismiss":
            return handle_parent_wish_dismiss(conn, body)
        if action == "parent/notifications/toggle":
            return handle_parent_toggle_notifications(conn, body)

        return error_response("Not found", 404)
    finally:
        conn.close()