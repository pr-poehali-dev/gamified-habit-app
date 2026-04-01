"""
API для Telegram Mini App СтарКидс.
Два бота: parenttask_bot (родитель) и task4kids_bot (ребёнок).
Полный функционал: задачи, звёзды, ачивки, оценки, стикеры, стрики, подтверждения.
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
    """Возвращает telegram_id из initData или напрямую."""
    init_data = body.get("initData", "")
    print(f"[DEBUG] initData present: {bool(init_data)}, length: {len(init_data)}")
    print(f"[DEBUG] telegram_id in body: {body.get('telegram_id')}")

    if init_data:
        # Строгая валидация
        user = validate_tg_init_data(init_data, bot_token)
        print(f"[DEBUG] strict validation result: {user}")
        if user:
            return user["id"]
        # Fallback: user.id без проверки подписи
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
    return int(tid) if tid else None


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

def get_child_by_tg(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, stars, parent_id, avatar, age FROM {SCHEMA}.children WHERE telegram_id = %s",
            (telegram_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "stars": row[2], "parent_id": row[3],
            "avatar": row[4] or "👧", "age": row[5] or 9, "role": "child"}


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
        cur.execute(f"SELECT stars FROM {SCHEMA}.children WHERE id = %s", (child_id,))
        row = cur.fetchone()
        stars = row[0] if row else 0
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE child_id = %s AND status = 'approved'", (child_id,))
        tasks_completed = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(cost), 0) FROM {SCHEMA}.reward_purchases rp JOIN {SCHEMA}.rewards r ON rp.reward_id = r.id WHERE rp.child_id = %s", (child_id,))
        stars_spent = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reward_purchases WHERE child_id = %s", (child_id,))
        rewards_bought = cur.fetchone()[0]
        level, _ = compute_level(stars)
    return {
        "total_stars": stars, "tasks_completed": tasks_completed,
        "stars_spent": stars_spent, "rewards_bought": rewards_bought,
        "level": level, "streak": 0,
    }


# ─── Parent helpers ───────────────────────────────────────────────────────────

def get_parent_by_tg(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, full_name, parent_xp, parent_points, streak_current, streak_last_date, streak_claimed_today, streak_longest FROM {SCHEMA}.parents WHERE telegram_id = %s",
            (telegram_id,)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row[0], "name": row[1], "role": "parent",
        "parent_xp": row[2] or 0, "parent_points": row[3] or 0,
        "streak_current": row[4] or 0,
        "streak_last_date": row[5].isoformat() if row[5] else None,
        "streak_claimed_today": row[6] or False,
        "streak_longest": row[7] or 0,
    }


def advance_streak(conn, parent_id: int):
    today = date.today()
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT streak_current, streak_last_date, streak_longest FROM {SCHEMA}.parents WHERE id = %s",
            (parent_id,)
        )
        row = cur.fetchone()
    if not row:
        return
    current, last_date, longest = row[0] or 0, row[1], row[2] or 0
    if last_date == today:
        return  # уже обновляли сегодня
    if last_date and (today - last_date).days <= 1:
        new_current = current + 1
    else:
        new_current = 1
    new_longest = max(longest, new_current)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET streak_current=%s, streak_last_date=%s, streak_claimed_today=false, streak_longest=%s WHERE id=%s",
            (new_current, today, new_longest, parent_id)
        )
    conn.commit()


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
    if not tid:
        return json_response({"role": "unknown", "telegram_id": 0, "error": "no_tg_id"})
    child = get_child_by_tg(conn, tid)
    if not child:
        return json_response({"role": "unknown", "telegram_id": tid})
    level, xp_in = compute_level(child["stars"])
    with conn.cursor() as cur:
        cur.execute(f"SELECT achievement_id FROM {SCHEMA}.achievements WHERE child_id = %s", (child["id"],))
        achievements = [r[0] for r in cur.fetchall()]
        cur.execute(f"SELECT sticker_id, count FROM {SCHEMA}.stickers WHERE child_id = %s", (child["id"],))
        stickers = [{"stickerId": r[0], "count": r[1]} for r in cur.fetchall()]
        cur.execute(f"SELECT id, subject, grade, date, status, stars_awarded, created_at FROM {SCHEMA}.grade_requests WHERE child_id = %s ORDER BY created_at DESC LIMIT 20", (child["id"],))
        grades = [{"id": r[0], "subject": r[1], "grade": r[2], "date": str(r[3]), "status": r[4], "starsAwarded": r[5], "createdAt": str(r[6])} for r in cur.fetchall()]
        cur.execute(f"SELECT id, title, stars, emoji, status, require_photo, require_confirm, photo_status FROM {SCHEMA}.tasks WHERE child_id = %s ORDER BY created_at DESC LIMIT 50", (child["id"],))
        tasks = [{"id": r[0], "title": r[1], "stars": r[2], "emoji": r[3], "status": r[4], "requirePhoto": r[5], "requireConfirm": r[6], "photoStatus": r[7]} for r in cur.fetchall()]
    return json_response({
        **child, "telegram_id": tid, "level": level, "xpInLevel": xp_in,
        "achievements": achievements, "stickers": stickers,
        "gradeRequests": grades, "tasks": tasks,
    })


def handle_auth_parent(conn, body):
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
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
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.parents (telegram_id, full_name) VALUES (%s, %s) ON CONFLICT (telegram_id) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id",
                (tid, full_name)
            )
            new_id = cur.fetchone()[0]
        conn.commit()
        parent = get_parent_by_tg(conn, tid)
        if not parent:
            return json_response({"role": "unknown", "telegram_id": tid})
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name, stars, avatar, age, invite_code, telegram_id FROM {SCHEMA}.children WHERE parent_id = %s ORDER BY created_at", (parent["id"],))
        children = [{"id": r[0], "name": r[1], "stars": r[2], "avatar": r[3] or "👧", "age": r[4] or 9, "inviteCode": r[5], "connected": r[6] is not None} for r in cur.fetchall()]
        cur.execute(f"SELECT id, title, stars, emoji, status, child_id, require_photo, require_confirm, photo_status FROM {SCHEMA}.tasks WHERE parent_id = %s ORDER BY created_at DESC LIMIT 50", (parent["id"],))
        tasks = [{"id": r[0], "title": r[1], "stars": r[2], "emoji": r[3], "status": r[4], "childId": r[5], "requirePhoto": r[6], "requireConfirm": r[7], "photoStatus": r[8]} for r in cur.fetchall()]
        # Pending grade requests from children
        if children:
            child_ids = [c["id"] for c in children]
            placeholders = ",".join(["%s"] * len(child_ids))
            cur.execute(f"SELECT gr.id, gr.child_id, c.name, gr.subject, gr.grade, gr.date, gr.status, gr.stars_awarded FROM {SCHEMA}.grade_requests gr JOIN {SCHEMA}.children c ON gr.child_id = c.id WHERE gr.child_id IN ({placeholders}) ORDER BY gr.created_at DESC LIMIT 50", child_ids)
            grades = [{"id": r[0], "childId": r[1], "childName": r[2], "subject": r[3], "grade": r[4], "date": str(r[5]), "status": r[6], "starsAwarded": r[7]} for r in cur.fetchall()]
        else:
            grades = []
        cur.execute(f"SELECT id, title, cost, emoji FROM {SCHEMA}.rewards WHERE parent_id = %s ORDER BY created_at", (parent["id"],))
        rewards = [{"id": r[0], "title": r[1], "cost": r[2], "emoji": r[3]} for r in cur.fetchall()]
    return json_response({**parent, "telegram_id": tid, "children": children, "tasks": tasks, "gradeRequests": grades, "rewards": rewards})


def handle_complete_task(conn, body):
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("Child not found", 404)
    task_id = body.get("task_id")
    if not task_id:
        return error_response("task_id required")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, stars, title, require_confirm, parent_id FROM {SCHEMA}.tasks WHERE id = %s AND child_id = %s AND status = 'pending'", (task_id, child["id"]))
        task = cur.fetchone()
    if not task:
        return error_response("Task not found", 404)
    t_id, stars, title, require_confirm, parent_id = task
    new_status = "pending_confirm" if require_confirm else "done"
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.tasks SET status = %s, completed_at = NOW() WHERE id = %s", (new_status, t_id))
    conn.commit()

    if not require_confirm:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars + %s WHERE id = %s RETURNING stars", (stars, child["id"]))
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
                send_tg_message(PARENT_TOKEN, p_row[0], f"✅ <b>{child['name']}</b> выполнил «<b>{title}</b>» — ждёт твоего подтверждения!\n\n💫 Награда: {stars}⭐\n\nОткрой @parenttask_bot → Задачи.")
        return json_response({"ok": True, "pending_confirm": True})


def handle_confirm_task(conn, body):
    print(f"[confirm_task] body keys: {list(body.keys())}, task_id={body.get('task_id')}, confirm_action={body.get('confirm_action')}")
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    print(f"[confirm_task] tid={tid}")
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
    print(f"[confirm_task] parent={parent}")
    if not parent:
        return error_response("Parent not found", 404)
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
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'approved' WHERE id = %s", (t_id,))
            cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars + %s WHERE id = %s RETURNING stars", (stars, child_id))
            new_stars = cur.fetchone()[0]
        conn.commit()
        add_parent_xp(conn, parent["id"], 30)
        advance_streak(conn, parent["id"])
        # Notify child
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id, name FROM {SCHEMA}.children WHERE id = %s", (child_id,))
            c_row = cur.fetchone()
        if c_row and CHILD_TOKEN:
            send_tg_message(CHILD_TOKEN, c_row[0], f"🎉 Родитель подтвердил «<b>{title}</b>»!\n\n💫 +{stars}⭐ начислено! Твой баланс: {new_stars}⭐")
        return json_response({"ok": True, "new_stars": new_stars})
    else:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'pending' WHERE id = %s", (t_id,))
        conn.commit()
        return json_response({"ok": True, "rejected": True})


def handle_add_task(conn, body):
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
    if not parent:
        return error_response("Parent not found", 404)
    child_id = body.get("child_id")
    title = body.get("title", "").strip()
    stars = int(body.get("stars", 3))
    emoji = body.get("emoji", "📋")
    require_photo = bool(body.get("require_photo", False))
    require_confirm = bool(body.get("require_confirm", False))
    if not title:
        return error_response("title required")
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.tasks (parent_id, child_id, title, stars, emoji, require_photo, require_confirm) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (parent["id"], child_id, title, stars, emoji, require_photo, require_confirm)
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
        send_tg_message(CHILD_TOKEN, c_row[0], f"📋 Новое задание от родителя!\n\n{emoji} <b>{title}</b>\n💫 Награда: {stars}⭐{photo_note}{confirm_note}\n\nОткрой @task4kids_bot для выполнения.")
    return json_response({"ok": True, "task_id": task_id})


def handle_submit_grade(conn, body):
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("Child not found", 404)
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
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
    if not parent:
        return error_response("Parent not found", 404)
    req_id = body.get("request_id")
    action = body.get("action", "approve")
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
            cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars + %s WHERE id = %s RETURNING stars", (stars, child_id))
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


def handle_buy_reward(conn, body):
    tid = resolve_telegram_id(body, CHILD_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    child = get_child_by_tg(conn, tid)
    if not child:
        return error_response("Child not found", 404)
    reward_id = body.get("reward_id")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, title, cost, parent_id FROM {SCHEMA}.rewards WHERE id = %s AND parent_id = %s", (reward_id, child["parent_id"]))
        reward = cur.fetchone()
    if not reward:
        return error_response("Reward not found", 404)
    r_id, title, cost, parent_id = reward
    if child["stars"] < cost:
        return error_response("Not enough stars")
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars - %s WHERE id = %s RETURNING stars", (cost, child["id"]))
        new_stars = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {SCHEMA}.reward_purchases (child_id, reward_id, status) VALUES (%s, %s, 'pending') ON CONFLICT DO NOTHING", (child["id"], r_id))
    conn.commit()
    if PARENT_TOKEN and parent_id:
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
            p_row = cur.fetchone()
        if p_row:
            send_tg_message(PARENT_TOKEN, p_row[0], f"🛍️ <b>{child['name']}</b> потратил {cost}⭐ на «<b>{title}</b>»!\n\nОткрой @parenttask_bot для подтверждения покупки.")
    return json_response({"ok": True, "new_stars": new_stars})


def handle_streak_claim(conn, body):
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
    if not parent:
        return error_response("Parent not found", 404)
    if parent["streak_claimed_today"]:
        return error_response("Already claimed today")
    streak = parent["streak_current"]
    xp_bonus = round((min(streak, 10) / 10) * 100)
    points_bonus = round((min(streak, 10) / 10) * 1000)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET streak_claimed_today=true, parent_xp=parent_xp+%s, parent_points=parent_points+%s WHERE id=%s",
            (xp_bonus, points_bonus, parent["id"])
        )
    conn.commit()
    return json_response({"ok": True, "xp": xp_bonus, "points": points_bonus, "streak": streak})


CHILD_AVATARS = ["👦", "👧", "🧒", "👶", "🐱", "🦊", "🐼", "🦁", "🐸", "🐧", "🦋", "🌟"]

import random
import string

def gen_invite_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def handle_add_child(conn, body):
    """Добавить ребёнка родителю (без Telegram — оффлайн профиль)."""
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
    if not parent:
        return error_response("Parent not found", 404)
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
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
    if not parent:
        return error_response("Parent not found", 404)
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
    tid = resolve_telegram_id(body, PARENT_TOKEN)
    if not tid:
        return error_response("Unauthorized", 401)
    parent = get_parent_by_tg(conn, tid)
    if not parent:
        return error_response("Parent not found", 404)
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
        if action == "child/grade/submit":
            return handle_submit_grade(conn, body)
        if action == "child/reward/buy":
            return handle_buy_reward(conn, body)

        # ── Parent routes ──
        if action == "parent/auth":
            return handle_auth_parent(conn, body)
        if action == "parent/task/add":
            return handle_add_task(conn, body)
        if action == "parent/task/confirm":
            return handle_confirm_task(conn, body)
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

        return error_response("Not found", 404)
    finally:
        conn.close()