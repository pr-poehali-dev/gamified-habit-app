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
    return {
        "keyboard": [
            [{"text": "📋 Мои задачи"}, {"text": "⭐ Мои звёзды"}],
            [{"text": "🛍️ Магазин"}, {"text": "👤 Профиль"}]
        ],
        "resize_keyboard": True
    }


def cmd_tasks(conn, token, chat_id, child_id):
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, emoji, title, stars, status FROM {SCHEMA}.tasks
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
        tid, emoji, title, stars, status = t
        if status == "done":
            text += f"✅ {emoji} {title} (+{stars}⭐) — <i>выполнено</i>\n"
        else:
            text += f"◻️ {emoji} <b>{title}</b> — {stars}⭐\n"
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
        with conn.cursor() as cur:
            cur.execute(f"""
                UPDATE {SCHEMA}.tasks SET status = 'done', completed_at = NOW()
                WHERE id = %s AND child_id = %s AND status = 'pending'
                RETURNING stars, title
            """, (task_id, child["id"]))
            row = cur.fetchone()
        conn.commit()

        if row:
            stars_earned, title = row
            tg_answer_callback(token, cq_id, f"⭐ +{stars_earned} звёзд!")
            tg_send(token, chat_id,
                f"🎉 Отлично! Ты выполнил задание <b>«{title}»</b>!\n"
                f"Ждёт подтверждения от родителя. +{stars_earned}⭐ скоро начислятся!")
        else:
            tg_answer_callback(token, cq_id, "Задание уже выполнено!")

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
