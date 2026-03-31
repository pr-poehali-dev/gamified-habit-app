"""
Детский Telegram-бот СтарКидс.
Обрабатывает webhook от Telegram для бота ребёнка.
Команды: /start, /tasks, /stars, /shop, /profile
"""
import json
import os
import psycopg2
import urllib.request
import random
import string
from datetime import datetime, timezone


SCHEMA = "t_p84704826_gamified_habit_app"


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def tg_send(token, chat_id, text, reply_markup=None):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req)


def tg_answer_callback(token, callback_query_id, text=""):
    url = f"https://api.telegram.org/bot{token}/answerCallbackQuery"
    payload = {"callback_query_id": callback_query_id, "text": text}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req)


def get_or_create_child(conn, telegram_id, username, full_name):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name, stars FROM {SCHEMA}.children WHERE telegram_id = %s", (telegram_id,))
        row = cur.fetchone()
        if row:
            return {"id": row[0], "name": row[1], "stars": row[2]}
        return None


def get_session(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(f"SELECT state, state_data FROM {SCHEMA}.bot_sessions WHERE telegram_id = %s AND bot_type = 'child'", (telegram_id,))
        row = cur.fetchone()
        if row:
            return {"state": row[0], "data": row[1] or {}}
        return {"state": "idle", "data": {}}


def set_session(conn, telegram_id, state, data=None):
    with conn.cursor() as cur:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.bot_sessions (telegram_id, bot_type, state, state_data, updated_at)
            VALUES (%s, 'child', %s, %s, NOW())
            ON CONFLICT (telegram_id, bot_type) DO UPDATE SET state = EXCLUDED.state, state_data = EXCLUDED.state_data, updated_at = NOW()
        """, (telegram_id, state, json.dumps(data or {})))
    conn.commit()


def cmd_start(conn, token, chat_id, telegram_id, username, full_name):
    child = get_or_create_child(conn, telegram_id, username, full_name)
    if child:
        tg_send(token, chat_id,
            f"🌟 Привет, <b>{child['name']}</b>!\n\nУ тебя сейчас <b>{child['stars']} ⭐</b>\n\nВыбери раздел:",
            reply_markup=main_keyboard())
    else:
        session = get_session(conn, telegram_id)
        if session["state"] == "waiting_invite":
            tg_send(token, chat_id, "⏳ Жду твой код-приглашение от родителя...")
        else:
            set_session(conn, telegram_id, "waiting_invite")
            tg_send(token, chat_id,
                "👋 Привет! Я бот для детей — <b>СтарКидс</b>!\n\n"
                "Здесь ты будешь выполнять задания и получать звёзды ⭐, которые можно потратить на крутые награды 🎁\n\n"
                "Введи <b>код-приглашение</b> от родителя, чтобы начать:")


def main_keyboard():
    mini_app_url = os.environ.get("MINI_APP_URL", "")
    rows = [
        [{"text": "📋 Мои задачи"}, {"text": "⭐ Мои звёзды"}],
        [{"text": "🛍️ Магазин"}, {"text": "👤 Профиль"}],
    ]
    if mini_app_url:
        rows.append([{"text": "🚀 Открыть приложение", "web_app": {"url": mini_app_url}}])
    return {"keyboard": rows, "resize_keyboard": True}


def format_deadline_child(dt):
    if not dt:
        return None
    now = datetime.now(timezone.utc)
    if hasattr(dt, 'tzinfo') and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = dt - now
    if diff.total_seconds() < 0:
        return "🔴 просрочено!"
    days = diff.days
    hours = int(diff.total_seconds() / 3600)
    if hours <= 2:
        return f"🚨 осталось {hours}ч!"
    if days >= 1:
        return f"⏳ {days}д {hours % 24}ч"
    return f"⏳ {hours}ч"


def cmd_tasks(conn, token, chat_id, child_id):
    now = datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, emoji, title, stars, status, deadline, late_stars FROM {SCHEMA}.tasks
            WHERE child_id = %s AND status IN ('pending', 'done')
            ORDER BY created_at DESC LIMIT 10
        """, (child_id,))
        tasks = cur.fetchall()

    if not tasks:
        tg_send(token, chat_id, "📋 Пока задач нет. Жди от родителя! 😊", reply_markup=main_keyboard())
        return

    text = "📋 <b>Твои задачи:</b>\n\n"
    buttons = []
    for t in tasks:
        tid, emoji, title, stars, status, deadline, late_stars = t
        if deadline and hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        is_overdue = deadline and now > deadline
        actual_stars = late_stars if (is_overdue and late_stars) else stars

        if status == "done":
            text += f"🕐 {emoji} {title} (+{actual_stars}⭐) — <i>ждёт подтверждения</i>\n"
        else:
            dl_str = ""
            if deadline:
                dl_label = format_deadline_child(deadline)
                dl_str = f" [{dl_label}]"
            stars_str = f"{actual_stars}⭐"
            if is_overdue and late_stars and late_stars < stars:
                stars_str = f"~{stars}⭐→<b>{late_stars}⭐</b>"
            elif is_overdue and not late_stars:
                stars_str = f"~{stars}⭐ (нельзя выполнить)"
            icon = "🔴" if is_overdue else "◻️"
            text += f"{icon} {emoji} <b>{title}</b> — {stars_str}{dl_str}\n"
            if not (is_overdue and not late_stars):
                buttons.append([{"text": f"✅ Выполнил: {title[:25]}", "callback_data": f"done_{tid}"}])

    markup = {"inline_keyboard": buttons} if buttons else None
    tg_send(token, chat_id, text, reply_markup=markup)


def cmd_stars(conn, token, chat_id, child_id, stars):
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE child_id = %s AND status = 'done'", (child_id,))
        done_count = cur.fetchone()[0]

    progress = (stars % 30)
    bar_filled = int(progress / 30 * 10)
    bar = "🟡" * bar_filled + "⚪" * (10 - bar_filled)

    text = (
        f"⭐ <b>Твои звёзды</b>\n\n"
        f"У тебя: <b>{stars} ⭐</b>\n\n"
        f"До следующей награды:\n{bar} {progress}/30\n\n"
        f"✅ Задач выполнено: <b>{done_count}</b>"
    )
    tg_send(token, chat_id, text, reply_markup=main_keyboard())


def cmd_shop(conn, token, chat_id, child_id, parent_id, stars):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, emoji, title, cost FROM {SCHEMA}.rewards WHERE parent_id = %s ORDER BY cost", (parent_id,))
        items = cur.fetchall()

    if not items:
        tg_send(token, chat_id, "🛍️ Магазин пока пуст. Родитель ещё не добавил награды!", reply_markup=main_keyboard())
        return

    text = f"🛍️ <b>Магазин наград</b>\nТвои звёзды: <b>{stars} ⭐</b>\n\n"
    buttons = []
    for item in items:
        iid, emoji, title, cost = item
        can_buy = stars >= cost
        text += f"{emoji} <b>{title}</b> — {cost}⭐ {'✅' if can_buy else '🔒'}\n"
        if can_buy:
            buttons.append([{"text": f"🛒 Купить: {title[:20]} ({cost}⭐)", "callback_data": f"buy_{iid}"}])

    markup = {"inline_keyboard": buttons} if buttons else None
    tg_send(token, chat_id, text, reply_markup=markup)


def cmd_profile(conn, token, chat_id, child_id, child_name, stars):
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE child_id = %s AND status = 'done'", (child_id,))
        done_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.reward_purchases WHERE child_id = %s AND status = 'approved'", (child_id,))
        bought_count = cur.fetchone()[0]

    text = (
        f"👤 <b>Профиль</b>\n\n"
        f"Имя: <b>{child_name}</b>\n"
        f"Звёзды: <b>{stars} ⭐</b>\n"
        f"Задач выполнено: <b>{done_count}</b>\n"
        f"Наград получено: <b>{bought_count}</b>"
    )
    tg_send(token, chat_id, text, reply_markup=main_keyboard())


def handle_invite_code(conn, token, chat_id, telegram_id, username, full_name, code):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name, parent_id FROM {SCHEMA}.children WHERE invite_code = %s AND telegram_id IS NULL", (code.strip(),))
        row = cur.fetchone()

    if not row:
        tg_send(token, chat_id, "❌ Код не найден или уже использован. Попроси у родителя новый код.")
        return

    child_id, child_name, parent_id = row
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.children SET telegram_id = %s WHERE id = %s", (telegram_id, child_id))
    conn.commit()

    set_session(conn, telegram_id, "idle")
    tg_send(token, chat_id,
        f"🎉 Отлично, <b>{child_name}</b>! Ты подключился к системе!\n\n"
        f"Теперь выполняй задания и зарабатывай звёзды ⭐",
        reply_markup=main_keyboard())


def handle_callback(conn, token, callback_query):
    cq_id = callback_query["id"]
    chat_id = callback_query["message"]["chat"]["id"]
    telegram_id = callback_query["from"]["id"]
    data = callback_query.get("data", "")

    child = get_or_create_child(conn, telegram_id, None, None)
    if not child:
        tg_answer_callback(token, cq_id, "Сначала зарегистрируйся!")
        return

    if data.startswith("done_"):
        task_id = int(data.split("_")[1])
        now = datetime.now(timezone.utc)
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT id, stars, title, parent_id, deadline, late_stars
                FROM {SCHEMA}.tasks
                WHERE id = %s AND child_id = %s AND status = 'pending'
            """, (task_id, child["id"]))
            task = cur.fetchone()

        if not task:
            tg_answer_callback(token, cq_id, "Задание уже выполнено!")
            return

        tid, stars, title, parent_id, deadline, late_stars = task
        if deadline and hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        is_overdue = deadline and now > deadline
        # Если просрочено и late_stars=None — нельзя выполнить
        if is_overdue and late_stars is None and deadline:
            tg_answer_callback(token, cq_id, "⏰ Срок вышел — задание нельзя выполнить!")
            return

        actual_stars = late_stars if (is_overdue and late_stars is not None) else stars

        with conn.cursor() as cur:
            cur.execute(f"""
                UPDATE {SCHEMA}.tasks SET status = 'done', completed_at = NOW(), stars = %s
                WHERE id = %s
            """, (actual_stars, tid))
        conn.commit()

        overdue_note = ""
        if is_overdue and late_stars is not None and late_stars < stars:
            overdue_note = f"\n⏰ Задание выполнено после срока, начислено {actual_stars}⭐ (вместо {stars}⭐)"

        tg_answer_callback(token, cq_id, "✅ Отправлено на проверку!")
        tg_send(token, chat_id,
            f"🎉 Отлично! Ты выполнил задание <b>«{title}»</b>!\n"
            f"Ждёт подтверждения родителя — тогда получишь {actual_stars}⭐{overdue_note}")
        parent_token = os.environ.get("PARENT_BOT_TOKEN", "")
        if parent_token and parent_id:
            with conn.cursor() as cur:
                cur.execute(f"SELECT telegram_id FROM {SCHEMA}.parents WHERE id = %s", (parent_id,))
                p_row = cur.fetchone()
            if p_row:
                late_note = f"\n⏰ <i>Выполнено после срока — начислено {actual_stars}⭐</i>" if (is_overdue and late_stars is not None and late_stars < stars) else ""
                tg_send(parent_token, p_row[0],
                    f"🔔 <b>{child['name']}</b> выполнил задание <b>«{title}»</b>!{late_note}\n\n"
                    f"Награда: {actual_stars}⭐\n\n"
                    f"Нажмите «📋 Задачи» чтобы подтвердить.")

    elif data.startswith("buy_"):
        reward_id = int(data.split("_")[1])
        with conn.cursor() as cur:
            cur.execute(f"SELECT title, cost FROM {SCHEMA}.rewards WHERE id = %s", (reward_id,))
            reward = cur.fetchone()

        if not reward:
            tg_answer_callback(token, cq_id, "Награда не найдена")
            return

        title, cost = reward
        if child["stars"] < cost:
            tg_answer_callback(token, cq_id, "Недостаточно звёзд!")
            return

        with conn.cursor() as cur:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.reward_purchases (child_id, reward_id, status)
                VALUES (%s, %s, 'pending')
            """, (child["id"], reward_id))
            cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars - %s WHERE id = %s", (cost, child["id"]))
        conn.commit()

        tg_answer_callback(token, cq_id, f"🛒 Запрос отправлен родителю!")
        tg_send(token, chat_id,
            f"🛒 Ты запросил награду <b>«{title}»</b>!\n"
            f"Списано {cost}⭐. Родитель скоро подтвердит!")


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}, "body": ""}

    token = os.environ.get("CHILD_BOT_TOKEN", "")
    if not token:
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    conn = get_db()
    try:
        if "callback_query" in body:
            handle_callback(conn, token, body["callback_query"])
            return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"ok": True})}

        message = body.get("message", {})
        if not message:
            return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"ok": True})}

        chat_id = message["chat"]["id"]
        telegram_id = message["from"]["id"]
        username = message["from"].get("username", "")
        full_name = message["from"].get("first_name", "") + " " + message["from"].get("last_name", "")
        text = message.get("text", "").strip()

        child = get_or_create_child(conn, telegram_id, username, full_name)

        if text == "/start" or text == "🔙 Назад":
            cmd_start(conn, token, chat_id, telegram_id, username, full_name)
        elif not child:
            session = get_session(conn, telegram_id)
            if session["state"] == "waiting_invite":
                handle_invite_code(conn, token, chat_id, telegram_id, username, full_name, text)
            else:
                set_session(conn, telegram_id, "waiting_invite")
                tg_send(token, chat_id, "Введи код-приглашение от родителя:")
        elif text in ("📋 Мои задачи", "/tasks"):
            cmd_tasks(conn, token, chat_id, child["id"])
        elif text in ("⭐ Мои звёзды", "/stars"):
            with conn.cursor() as cur:
                cur.execute(f"SELECT id, parent_id FROM {SCHEMA}.children WHERE id = %s", (child["id"],))
                row = cur.fetchone()
            cmd_stars(conn, token, chat_id, child["id"], child["stars"])
        elif text in ("🛍️ Магазин", "/shop"):
            with conn.cursor() as cur:
                cur.execute(f"SELECT parent_id FROM {SCHEMA}.children WHERE id = %s", (child["id"],))
                row = cur.fetchone()
            parent_id = row[0] if row else None
            cmd_shop(conn, token, chat_id, child["id"], parent_id, child["stars"])
        elif text in ("👤 Профиль", "/profile"):
            cmd_profile(conn, token, chat_id, child["id"], child["name"], child["stars"])
        else:
            tg_send(token, chat_id, "Выбери раздел:", reply_markup=main_keyboard())

    finally:
        conn.close()

    return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"ok": True})}