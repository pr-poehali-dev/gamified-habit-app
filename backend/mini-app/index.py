"""
API для Telegram Mini App СтарКидс.
Поддерживает авторизацию через Telegram initData, задачи и магазин наград.
"""
import json
import os
import hashlib
import hmac
import psycopg2
from datetime import datetime, timezone
from urllib.parse import parse_qs, unquote

SCHEMA = "t_p84704826_gamified_habit_app"


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
    """Валидирует Telegram WebApp initData и возвращает данные пользователя."""
    try:
        parsed = parse_qs(init_data)
        data_check_string_parts = []
        user_data = None
        for key in sorted(parsed.keys()):
            if key == "hash":
                continue
            val = parsed[key][0]
            data_check_string_parts.append(f"{key}={val}")
            if key == "user":
                user_data = json.loads(unquote(val))

        data_check_string = "\n".join(data_check_string_parts)
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        received_hash = parsed.get("hash", [""])[0]
        if hmac.compare_digest(expected_hash, received_hash):
            return user_data
        return None
    except Exception:
        return None


def get_child_by_tg(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, name, stars, parent_id FROM {SCHEMA}.children
            WHERE telegram_id = %s
        """, (telegram_id,))
        row = cur.fetchone()
    if row:
        return {"id": row[0], "name": row[1], "stars": row[2], "parent_id": row[3], "role": "child"}
    return None


def get_parent_by_tg(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, full_name FROM {SCHEMA}.parents WHERE telegram_id = %s
        """, (telegram_id,))
        row = cur.fetchone()
    if row:
        return {"id": row[0], "name": row[1], "role": "parent"}
    return None


def handle_auth(conn, body, bot_token):
    init_data = body.get("initData", "")
    # В dev-режиме принимаем telegram_id напрямую
    if not init_data and body.get("telegram_id"):
        telegram_id = int(body["telegram_id"])
    else:
        user = validate_tg_init_data(init_data, bot_token)
        if not user:
            return None, error_response("Invalid initData", 401)
        telegram_id = user["id"]

    child = get_child_by_tg(conn, telegram_id)
    if child:
        return telegram_id, json_response({**child, "telegram_id": telegram_id})

    parent = get_parent_by_tg(conn, telegram_id)
    if parent:
        with conn.cursor() as cur:
            cur.execute(f"SELECT id, name, stars FROM {SCHEMA}.children WHERE parent_id = %s ORDER BY created_at", (parent["id"],))
            children = [{"id": r[0], "name": r[1], "stars": r[2]} for r in cur.fetchall()]
        return telegram_id, json_response({**parent, "telegram_id": telegram_id, "children": children})

    return telegram_id, json_response({"role": "unknown", "telegram_id": telegram_id})


def handle_tasks_child(conn, child_id):
    now = datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, emoji, title, stars, status, deadline, late_stars, created_at, completed_at
            FROM {SCHEMA}.tasks
            WHERE child_id = %s
            ORDER BY
                CASE status WHEN 'pending' THEN 0 WHEN 'done' THEN 1 ELSE 2 END,
                created_at DESC
            LIMIT 30
        """, (child_id,))
        rows = cur.fetchall()

    tasks = []
    for r in rows:
        tid, emoji, title, stars, status, deadline, late_stars, created_at, completed_at = r
        if deadline and hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        is_overdue = deadline and now > deadline and status == "pending"
        actual_stars = late_stars if (is_overdue and late_stars is not None) else stars
        can_complete = not (is_overdue and late_stars is None and deadline is not None)
        tasks.append({
            "id": tid,
            "emoji": emoji,
            "title": title,
            "stars": actual_stars,
            "original_stars": stars,
            "late_stars": late_stars,
            "status": status,
            "deadline": deadline.isoformat() if deadline else None,
            "is_overdue": bool(is_overdue),
            "can_complete": can_complete and status == "pending",
            "created_at": created_at.isoformat() if created_at else None,
            "completed_at": completed_at.isoformat() if completed_at else None,
        })
    return json_response({"tasks": tasks})


def handle_tasks_parent(conn, parent_id, child_id=None):
    now = datetime.now(timezone.utc)
    where = "t.parent_id = %s"
    params = [parent_id]
    if child_id:
        where += " AND t.child_id = %s"
        params.append(child_id)

    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT t.id, c.name, t.emoji, t.title, t.stars, t.status,
                   t.deadline, t.late_stars, t.created_at, t.completed_at, t.child_id
            FROM {SCHEMA}.tasks t JOIN {SCHEMA}.children c ON t.child_id = c.id
            WHERE {where}
            ORDER BY t.created_at DESC LIMIT 50
        """, params)
        rows = cur.fetchall()

    tasks = []
    for r in rows:
        tid, child_name, emoji, title, stars, status, deadline, late_stars, created_at, completed_at, cid = r
        if deadline and hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        is_overdue = deadline and now > deadline and status == "pending"
        tasks.append({
            "id": tid,
            "child_name": child_name,
            "child_id": cid,
            "emoji": emoji,
            "title": title,
            "stars": stars,
            "late_stars": late_stars,
            "status": status,
            "deadline": deadline.isoformat() if deadline else None,
            "is_overdue": bool(is_overdue),
            "created_at": created_at.isoformat() if created_at else None,
            "completed_at": completed_at.isoformat() if completed_at else None,
        })
    return json_response({"tasks": tasks})


def handle_complete_task(conn, child_id, child_name, task_id, parent_token, child_token):
    now = datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, stars, title, parent_id, deadline, late_stars
            FROM {SCHEMA}.tasks
            WHERE id = %s AND child_id = %s AND status = 'pending'
        """, (task_id, child_id))
        task = cur.fetchone()

    if not task:
        return error_response("Task not found or already done", 404)

    tid, stars, title, parent_id, deadline, late_stars = task
    if deadline and hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    is_overdue = deadline and now > deadline
    if is_overdue and late_stars is None and deadline is not None:
        return error_response("Task expired and cannot be completed", 403)

    actual_stars = late_stars if (is_overdue and late_stars is not None) else stars
    with conn.cursor() as cur:
        cur.execute(f"""
            UPDATE {SCHEMA}.tasks SET status = 'done', completed_at = NOW(), stars = %s WHERE id = %s
        """, (actual_stars, tid))
    conn.commit()

    # Уведомляем родителя
    if parent_token and parent_id:
        import urllib.request
        with conn.cursor() as cur:
            cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
            p_row = cur.fetchone()
        if p_row:
            late_note = f"\n⏰ <i>После срока — начислено {actual_stars}⭐</i>" if (is_overdue and late_stars is not None and late_stars < stars) else ""
            url = f"https://api.telegram.org/bot{parent_token}/sendMessage"
            payload = {"chat_id": p_row[0], "text": f"🔔 <b>{child_name}</b> выполнил «<b>{title}</b>»!{late_note}\n\nНаграда: {actual_stars}⭐\n\nНажмите «📋 Задачи» для подтверждения.", "parse_mode": "HTML"}
            data = json.dumps(payload).encode()
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            try:
                urllib.request.urlopen(req)
            except Exception:
                pass

    return json_response({"ok": True, "stars": actual_stars, "is_overdue": bool(is_overdue)})


def handle_approve_task(conn, parent_id, task_id, child_token):
    with conn.cursor() as cur:
        cur.execute(f"""
            UPDATE {SCHEMA}.tasks SET status = 'approved'
            WHERE id = %s AND parent_id = %s AND status = 'done'
            RETURNING child_id, stars, title
        """, (task_id, parent_id))
        row = cur.fetchone()
    if not row:
        return error_response("Task not found", 404)

    child_id, stars, title = row
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars + %s WHERE id = %s RETURNING stars, telegram_id, name", (stars, child_id))
        child_row = cur.fetchone()
    conn.commit()

    if child_token and child_row and child_row[1]:
        import urllib.request
        url = f"https://api.telegram.org/bot{child_token}/sendMessage"
        payload = {"chat_id": child_row[1], "text": f"🎉 Родитель подтвердил задание <b>«{title}»</b>!\n\nТебе начислено <b>+{stars}⭐</b>\nТеперь у тебя: <b>{child_row[0]}⭐</b> 🌟", "parse_mode": "HTML"}
        data = json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req)
        except Exception:
            pass

    return json_response({"ok": True, "stars_added": stars, "child_total": child_row[0] if child_row else None})


def handle_stats(conn, parent_id):
    now = datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT
                COUNT(*) FILTER (WHERE status = 'approved') as total_done,
                COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
                COUNT(*) FILTER (WHERE status = 'done') as awaiting,
                COUNT(*) FILTER (WHERE status = 'pending' AND deadline IS NOT NULL AND deadline < NOW()) as overdue
            FROM {SCHEMA}.tasks WHERE parent_id = %s
        """, (parent_id,))
        row = cur.fetchone()
        total_done, total_pending, awaiting, overdue = row

        cur.execute(f"""
            SELECT c.name, c.stars,
                   COUNT(t.id) FILTER (WHERE t.status = 'approved') as done,
                   COUNT(t.id) as total,
                   COUNT(t.id) FILTER (WHERE t.status = 'pending' AND t.deadline IS NOT NULL AND t.deadline < NOW()) as overdue_tasks
            FROM {SCHEMA}.children c
            LEFT JOIN {SCHEMA}.tasks t ON t.child_id = c.id
            WHERE c.parent_id = %s GROUP BY c.id, c.name, c.stars ORDER BY c.name
        """, (parent_id,))
        children = [{"name": r[0], "stars": r[1], "done": r[2], "total": r[3], "overdue": r[4]} for r in cur.fetchall()]

    return json_response({
        "total_done": total_done,
        "total_pending": total_pending,
        "awaiting": awaiting,
        "overdue": overdue,
        "children": children,
    })


def handle_shop(conn, child_id, parent_id, stars):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, emoji, title, cost FROM {SCHEMA}.rewards WHERE parent_id = %s ORDER BY cost", (parent_id,))
        items = [{"id": r[0], "emoji": r[1], "title": r[2], "cost": r[3], "can_buy": stars >= r[3]} for r in cur.fetchall()]
    return json_response({"items": items, "stars": stars})


def handle_buy(conn, child_id, reward_id, stars):
    with conn.cursor() as cur:
        cur.execute(f"SELECT title, cost FROM {SCHEMA}.rewards WHERE id = %s", (reward_id,))
        reward = cur.fetchone()
    if not reward:
        return error_response("Reward not found", 404)
    title, cost = reward
    if stars < cost:
        return error_response("Not enough stars", 403)
    with conn.cursor() as cur:
        cur.execute(f"INSERT INTO {SCHEMA}.reward_purchases (child_id, reward_id, status) VALUES (%s, %s, 'pending')", (child_id, reward_id))
        cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars - %s WHERE id = %s RETURNING stars", (cost, child_id))
        new_stars = cur.fetchone()[0]
    conn.commit()
    return json_response({"ok": True, "title": title, "new_stars": new_stars})


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    path = event.get("path", "/").rstrip("/") or "/"
    method = event.get("httpMethod", "GET")
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    bot_token = os.environ.get("CHILD_BOT_TOKEN", "") or os.environ.get("PARENT_BOT_TOKEN", "")
    parent_token = os.environ.get("PARENT_BOT_TOKEN", "")
    child_token = os.environ.get("CHILD_BOT_TOKEN", "")

    conn = get_db()
    try:
        if path == "/" or path == "/auth":
            _, resp = handle_auth(conn, body, bot_token)
            return resp

        # Определяем пользователя из заголовка или тела
        telegram_id = None
        init_data = event.get("headers", {}).get("X-Tg-Init-Data", "") or body.get("initData", "")
        if init_data:
            user = validate_tg_init_data(init_data, bot_token)
            if user:
                telegram_id = user["id"]
        if not telegram_id and body.get("telegram_id"):
            telegram_id = int(body["telegram_id"])

        if not telegram_id:
            return error_response("Unauthorized", 401)

        child = get_child_by_tg(conn, telegram_id)
        parent = get_parent_by_tg(conn, telegram_id) if not child else None

        if path == "/tasks" and method == "GET":
            if child:
                return handle_tasks_child(conn, child["id"])
            if parent:
                child_id = event.get("queryStringParameters", {}).get("child_id")
                return handle_tasks_parent(conn, parent["id"], child_id)
            return error_response("User not found", 404)

        if path == "/tasks/complete" and method == "POST":
            if not child:
                return error_response("Only children can complete tasks", 403)
            task_id = body.get("task_id")
            if not task_id:
                return error_response("task_id required", 400)
            return handle_complete_task(conn, child["id"], child["name"], int(task_id), parent_token, child_token)

        if path == "/tasks/approve" and method == "POST":
            if not parent:
                return error_response("Only parents can approve tasks", 403)
            task_id = body.get("task_id")
            if not task_id:
                return error_response("task_id required", 400)
            return handle_approve_task(conn, parent["id"], int(task_id), child_token)

        if path == "/stats" and method == "GET":
            if parent:
                return handle_stats(conn, parent["id"])
            return error_response("Only parents can view stats", 403)

        if path == "/shop" and method == "GET":
            if not child:
                return error_response("Only children can view shop", 403)
            return handle_shop(conn, child["id"], child["parent_id"], child["stars"])

        if path == "/shop/buy" and method == "POST":
            if not child:
                return error_response("Only children can buy", 403)
            reward_id = body.get("reward_id")
            if not reward_id:
                return error_response("reward_id required", 400)
            return handle_buy(conn, child["id"], int(reward_id), child["stars"])

        return error_response("Not found", 404)

    finally:
        conn.close()
