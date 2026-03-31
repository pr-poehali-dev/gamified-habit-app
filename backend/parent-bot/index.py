"""
Родительский Telegram-бот СтарКидс.
Обрабатывает webhook от Telegram для бота родителя.
Команды: /start, /tasks, /rewards, /stats, /children
"""
import json
import os
import psycopg2
import urllib.request
import random
import string
from datetime import datetime, timedelta, timezone


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


def gen_invite_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def get_or_create_parent(conn, telegram_id, username, full_name):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, full_name FROM {SCHEMA}.parents WHERE telegram_id = %s", (telegram_id,))
        row = cur.fetchone()
        if row:
            return {"id": row[0], "name": row[1]}
        cur.execute(f"""
            INSERT INTO {SCHEMA}.parents (telegram_id, username, full_name)
            VALUES (%s, %s, %s) RETURNING id
        """, (telegram_id, username, full_name.strip()))
        parent_id = cur.fetchone()[0]
    conn.commit()
    return {"id": parent_id, "name": full_name.strip()}


def get_session(conn, telegram_id):
    with conn.cursor() as cur:
        cur.execute(f"SELECT state, state_data FROM {SCHEMA}.bot_sessions WHERE telegram_id = %s AND bot_type = 'parent'", (telegram_id,))
        row = cur.fetchone()
        if row:
            return {"state": row[0], "data": row[1] or {}}
        return {"state": "idle", "data": {}}


def set_session(conn, telegram_id, state, data=None):
    with conn.cursor() as cur:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.bot_sessions (telegram_id, bot_type, state, state_data, updated_at)
            VALUES (%s, 'parent', %s, %s, NOW())
            ON CONFLICT (telegram_id, bot_type) DO UPDATE SET state = EXCLUDED.state, state_data = EXCLUDED.state_data, updated_at = NOW()
        """, (telegram_id, state, json.dumps(data or {})))
    conn.commit()


def main_keyboard():
    mini_app_url = os.environ.get("MINI_APP_URL", "")
    rows = [
        [{"text": "📋 Задачи"}, {"text": "🎁 Награды"}],
        [{"text": "📊 Статистика"}, {"text": "👨‍👩‍👧 Дети"}],
        [{"text": "👤 Профиль"}],
    ]
    if mini_app_url:
        rows.append([{"text": "🚀 Открыть приложение", "web_app": {"url": mini_app_url}}])
    return {"keyboard": rows, "resize_keyboard": True}


def cmd_start(conn, token, chat_id, telegram_id, username, full_name):
    parent = get_or_create_parent(conn, telegram_id, username, full_name)
    tg_send(token, chat_id,
        f"👋 Привет, <b>{parent['name']}</b>!\n\n"
        f"Я помогу вам управлять задачами и наградами для детей.\n"
        f"Выберите раздел:",
        reply_markup=main_keyboard())


def cmd_children(conn, token, chat_id, parent_id):
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT id, name, age, stars, invite_code, telegram_id
            FROM {SCHEMA}.children WHERE parent_id = %s ORDER BY created_at
        """, (parent_id,))
        children = cur.fetchall()

    if not children:
        tg_send(token, chat_id,
            "👨‍👩‍👧 <b>Мои дети</b>\n\nДетей ещё нет.\n\nНажмите кнопку ниже, чтобы добавить ребёнка:",
            reply_markup={"inline_keyboard": [[{"text": "➕ Добавить ребёнка", "callback_data": "add_child"}]]})
        return

    text = "👨‍👩‍👧 <b>Мои дети:</b>\n\n"
    buttons = []
    for ch in children:
        cid, name, age, stars, invite_code, tg_id = ch
        status = "✅ подключён" if tg_id else f"⏳ код: <code>{invite_code}</code>"
        age_str = f", {age} лет" if age else ""
        text += f"👤 <b>{name}</b>{age_str} — {stars}⭐ — {status}\n"
        buttons.append([{"text": f"📋 Задачи для {name}", "callback_data": f"child_tasks_{cid}"}])

    buttons.append([{"text": "➕ Добавить ребёнка", "callback_data": "add_child"}])
    tg_send(token, chat_id, text, reply_markup={"inline_keyboard": buttons})


def format_deadline(dt):
    if not dt:
        return None
    now = datetime.now(timezone.utc)
    if hasattr(dt, 'tzinfo') and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = dt - now
    if diff.total_seconds() < 0:
        hours_ago = int(abs(diff.total_seconds()) / 3600)
        return f"⏰ просрочено {hours_ago}ч назад"
    days = diff.days
    hours = int(diff.total_seconds() / 3600)
    if days >= 1:
        return f"⏳ осталось {days}д"
    return f"⏳ осталось {hours}ч"


def parse_deadline_input(text):
    """Парсит ввод дедлайна: '1д', '2д', '12ч', '3д 6ч' или число (дни)"""
    text = text.strip().lower()
    if text in ("нет", "0", "-", "без срока"):
        return None, None
    total_hours = 0
    import re
    days_match = re.search(r'(\d+)\s*д', text)
    hours_match = re.search(r'(\d+)\s*ч', text)
    if days_match:
        total_hours += int(days_match.group(1)) * 24
    if hours_match:
        total_hours += int(hours_match.group(1))
    if not days_match and not hours_match:
        try:
            total_hours = int(text) * 24
        except ValueError:
            return None, "error"
    if total_hours <= 0:
        return None, "error"
    deadline = datetime.now(timezone.utc) + timedelta(hours=total_hours)
    return deadline, None


def cmd_tasks(conn, token, chat_id, parent_id):
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT t.id, c.name, t.emoji, t.title, t.stars, t.status, t.deadline, t.late_stars
            FROM {SCHEMA}.tasks t JOIN {SCHEMA}.children c ON t.child_id = c.id
            WHERE t.parent_id = %s ORDER BY t.created_at DESC LIMIT 15
        """, (parent_id,))
        tasks = cur.fetchall()

    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name FROM {SCHEMA}.children WHERE parent_id = %s", (parent_id,))
        children = cur.fetchall()

    if not tasks and not children:
        tg_send(token, chat_id, "📋 Сначала добавьте ребёнка в разделе «Дети»!", reply_markup=main_keyboard())
        return

    if not tasks:
        tg_send(token, chat_id, "📋 Задач пока нет. Нажмите кнопку для добавления:",
            reply_markup={"inline_keyboard": [[{"text": "➕ Добавить задачу", "callback_data": "add_task"}]]})
        return

    now = datetime.now(timezone.utc)
    text = "📋 <b>Задачи:</b>\n\n"
    approve_buttons = []
    for t in tasks:
        tid, child_name, emoji, title, stars, status, deadline, late_stars = t
        if deadline and hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        is_overdue = deadline and now > deadline and status == "pending"
        actual_stars = late_stars if (is_overdue and late_stars) else stars

        if status == "pending":
            icon = "🔴" if is_overdue else "◻️"
        elif status == "done":
            icon = "🕐"
            approve_buttons.append([{"text": f"✅ Подтвердить: {title[:20]} ({child_name})", "callback_data": f"approve_{tid}"}])
        elif status == "overdue":
            icon = "⏰"
        else:
            icon = "✅"

        dl_str = ""
        if deadline and status == "pending":
            dl_str = f" [{format_deadline(deadline)}]"
        stars_str = f"{actual_stars}⭐"
        if is_overdue and late_stars and late_stars < stars:
            stars_str = f"<s>{stars}⭐</s>→{late_stars}⭐"
        text += f"{icon} {emoji} <b>{title}</b> — {child_name} ({stars_str}){dl_str}\n"

    buttons = approve_buttons + [[{"text": "➕ Добавить задачу", "callback_data": "add_task"}]]
    tg_send(token, chat_id, text, reply_markup={"inline_keyboard": buttons})


def cmd_rewards(conn, token, chat_id, parent_id):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, emoji, title, cost FROM {SCHEMA}.rewards WHERE parent_id = %s ORDER BY cost", (parent_id,))
        rewards = cur.fetchall()

        cur.execute(f"""
            SELECT rp.id, c.name, r.title, r.cost, rp.status
            FROM {SCHEMA}.reward_purchases rp
            JOIN {SCHEMA}.children c ON rp.child_id = c.id
            JOIN {SCHEMA}.rewards r ON rp.reward_id = r.id
            WHERE c.parent_id = %s AND rp.status = 'pending'
        """, (parent_id,))
        pending = cur.fetchall()

    text = "🎁 <b>Награды в магазине:</b>\n\n"
    if rewards:
        for r in rewards:
            rid, emoji, title, cost = r
            text += f"{emoji} <b>{title}</b> — {cost}⭐\n"
    else:
        text += "<i>Наград ещё нет</i>\n"

    buttons = []
    if pending:
        text += "\n\n⏳ <b>Запросы от детей:</b>\n"
        for p in pending:
            pid, child_name, reward_title, cost, _ = p
            text += f"🛒 {child_name} хочет «{reward_title}» ({cost}⭐)\n"
            buttons.append([{"text": f"✅ Одобрить: {reward_title[:20]} ({child_name})", "callback_data": f"approve_reward_{pid}"}])

    buttons.append([{"text": "➕ Добавить награду", "callback_data": "add_reward"}])
    tg_send(token, chat_id, text, reply_markup={"inline_keyboard": buttons})


def cmd_stats(conn, token, chat_id, parent_id):
    now = datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE parent_id = %s AND status = 'approved'", (parent_id,))
        total_done = cur.fetchone()[0]

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE parent_id = %s AND status = 'pending'", (parent_id,))
        total_pending = cur.fetchone()[0]

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tasks WHERE parent_id = %s AND status = 'done'", (parent_id,))
        awaiting = cur.fetchone()[0]

        # Просроченные: pending + дедлайн прошёл
        cur.execute(f"""
            SELECT COUNT(*) FROM {SCHEMA}.tasks
            WHERE parent_id = %s AND status = 'pending'
            AND deadline IS NOT NULL AND deadline < NOW()
        """, (parent_id,))
        overdue_count = cur.fetchone()[0]

        cur.execute(f"""
            SELECT c.name, c.stars,
                   COUNT(CASE WHEN t.status = 'approved' THEN 1 END) as done,
                   COUNT(t.id) as total,
                   COUNT(CASE WHEN t.status = 'pending' AND t.deadline IS NOT NULL AND t.deadline < NOW() THEN 1 END) as overdue
            FROM {SCHEMA}.children c
            LEFT JOIN {SCHEMA}.tasks t ON t.child_id = c.id
            WHERE c.parent_id = %s GROUP BY c.id, c.name, c.stars
        """, (parent_id,))
        children_stats = cur.fetchall()

    text = (
        f"📊 <b>Статистика</b>\n\n"
        f"✅ Задач выполнено: <b>{total_done}</b>\n"
        f"🕐 Ждут подтверждения: <b>{awaiting}</b>\n"
        f"◻️ В работе: <b>{total_pending}</b>\n"
        f"🔴 Просрочено: <b>{overdue_count}</b>\n\n"
    )

    if children_stats:
        text += "<b>По детям:</b>\n"
        for ch in children_stats:
            name, stars, done, total, overdue = ch
            pct = int(done / total * 100) if total > 0 else 0
            overdue_str = f" 🔴{overdue}" if overdue else ""
            text += f"👤 {name}: {done}/{total} задач, {stars}⭐ ({pct}%){overdue_str}\n"

    tg_send(token, chat_id, text, reply_markup=main_keyboard())


def handle_callback(conn, token, callback_query):
    cq_id = callback_query["id"]
    chat_id = callback_query["message"]["chat"]["id"]
    telegram_id = callback_query["from"]["id"]
    data = callback_query.get("data", "")

    parent = get_or_create_parent(conn, telegram_id,
        callback_query["from"].get("username", ""),
        callback_query["from"].get("first_name", ""))

    if data == "add_child":
        set_session(conn, telegram_id, "add_child_name")
        tg_send(token, chat_id, "Введите <b>имя ребёнка</b>:")
        tg_answer_callback(token, cq_id)

    elif data.startswith("child_tasks_"):
        child_id = int(data.split("_")[2])
        with conn.cursor() as cur:
            cur.execute(f"SELECT name FROM {SCHEMA}.children WHERE id = %s AND parent_id = %s", (child_id, parent["id"]))
            row = cur.fetchone()
        if row:
            set_session(conn, telegram_id, "add_task_title", {"child_id": child_id, "child_name": row[0]})
            tg_send(token, chat_id,
                f"Добавляем задачу для <b>{row[0]}</b>.\n\nВведите название задачи:")
        tg_answer_callback(token, cq_id)

    elif data == "add_task":
        with conn.cursor() as cur:
            cur.execute(f"SELECT id, name FROM {SCHEMA}.children WHERE parent_id = %s", (parent["id"],))
            children = cur.fetchall()

        if not children:
            tg_send(token, chat_id, "Сначала добавьте ребёнка в разделе «Дети»!")
        elif len(children) == 1:
            cid, cname = children[0]
            set_session(conn, telegram_id, "add_task_title", {"child_id": cid, "child_name": cname})
            tg_send(token, chat_id, f"Задача для <b>{cname}</b>.\nВведите название:")
        else:
            buttons = [[{"text": name, "callback_data": f"child_tasks_{cid}"}] for cid, name in children]
            tg_send(token, chat_id, "Выберите ребёнка:", reply_markup={"inline_keyboard": buttons})
        tg_answer_callback(token, cq_id)

    elif data == "add_reward":
        set_session(conn, telegram_id, "add_reward_title")
        tg_send(token, chat_id, "Введите <b>название награды</b> (например: Поход в кино 🎬):")
        tg_answer_callback(token, cq_id)

    elif data.startswith("approve_reward_"):
        purchase_id = int(data.split("_")[2])
        with conn.cursor() as cur:
            cur.execute(f"""
                UPDATE {SCHEMA}.reward_purchases SET status = 'approved'
                WHERE id = %s RETURNING child_id, reward_id
            """, (purchase_id,))
            row = cur.fetchone()
        conn.commit()

        if row:
            tg_answer_callback(token, cq_id, "✅ Награда одобрена!")
            tg_send(token, chat_id, "✅ Награда одобрена и выдана ребёнку!")
        else:
            tg_answer_callback(token, cq_id, "Не найдено")

    elif data.startswith("approve_"):
        task_id = int(data.split("_")[1])
        with conn.cursor() as cur:
            cur.execute(f"""
                UPDATE {SCHEMA}.tasks SET status = 'approved'
                WHERE id = %s AND parent_id = %s AND status = 'done'
                RETURNING child_id, stars, title
            """, (task_id, parent["id"]))
            row = cur.fetchone()
        if row:
            child_id, stars, title = row
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.children SET stars = stars + %s WHERE id = %s RETURNING stars, telegram_id, name", (stars, child_id))
                child_row = cur.fetchone()
            conn.commit()
            tg_answer_callback(token, cq_id, f"✅ +{stars}⭐ начислено!")
            tg_send(token, chat_id, f"✅ Задача «{title}» подтверждена! <b>{child_row[2]}</b> получил <b>{stars}⭐</b>")
            # Уведомляем ребёнка через детский бот
            child_token = os.environ.get("CHILD_BOT_TOKEN", "")
            if child_token and child_row and child_row[1]:
                new_stars = child_row[0]
                tg_send(child_token, child_row[1],
                    f"🎉 Родитель подтвердил задание <b>«{title}»</b>!\n\n"
                    f"Тебе начислено <b>+{stars}⭐</b>\n"
                    f"Теперь у тебя: <b>{new_stars}⭐</b> 🌟")
        else:
            tg_answer_callback(token, cq_id, "Задача не найдена")
            conn.commit()


def _create_task(conn, token, chat_id, telegram_id, parent_id, data, deadline, late_stars):
    stars = data["stars"]
    with conn.cursor() as cur:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.tasks (parent_id, child_id, title, stars, emoji, status, deadline, late_stars)
            VALUES (%s, %s, %s, %s, '📋', 'pending', %s, %s)
        """, (parent_id, data["child_id"], data["title"], stars, deadline, late_stars))
        cur.execute(f"SELECT telegram_id FROM {SCHEMA}.children WHERE id = %s", (data["child_id"],))
        child_tg = cur.fetchone()
    conn.commit()
    set_session(conn, telegram_id, "idle")

    dl_str = ""
    if deadline:
        if hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        diff = deadline - datetime.now(timezone.utc)
        days = diff.days
        hours = int(diff.total_seconds() / 3600)
        dl_str = f"\nСрок: {days}д {hours % 24}ч" if days > 0 else f"\nСрок: {hours}ч"
        if late_stars:
            dl_str += f" (после срока: {late_stars}⭐)"
        elif late_stars == 0:
            dl_str += " (после срока не засчитывается)"

    tg_send(token, chat_id,
        f"✅ Задача <b>«{data['title']}»</b> добавлена для <b>{data['child_name']}</b>!\n"
        f"Награда: {stars}⭐{dl_str}",
        reply_markup=main_keyboard())

    child_token = os.environ.get("CHILD_BOT_TOKEN", "")
    if child_token and child_tg and child_tg[0]:
        child_dl = ""
        if deadline:
            if hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            diff = deadline - datetime.now(timezone.utc)
            days = diff.days
            hours = int(diff.total_seconds() / 3600)
            child_dl = f"\n⏳ Срок: {days}д {hours % 24}ч" if days > 0 else f"\n⏳ Срок: {hours}ч"
        tg_send(child_token, child_tg[0],
            f"📋 Новое задание от родителя!\n\n"
            f"<b>«{data['title']}»</b>\n\n"
            f"Награда: <b>{stars}⭐</b>{child_dl}\n\n"
            f"Нажми «📋 Мои задачи» чтобы посмотреть все задания.")


def handle_state_input(conn, token, chat_id, telegram_id, parent_id, text, session):
    state = session["state"]
    data = session["data"]

    if state == "add_child_name":
        code = gen_invite_code()
        with conn.cursor() as cur:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.children (parent_id, name, invite_code)
                VALUES (%s, %s, %s)
            """, (parent_id, text.strip(), code))
        conn.commit()
        set_session(conn, telegram_id, "idle")
        tg_send(token, chat_id,
            f"✅ Ребёнок <b>{text.strip()}</b> добавлен!\n\n"
            f"Код-приглашение: <code>{code}</code>\n\n"
            f"Пусть ребёнок откроет детского бота и введёт этот код.",
            reply_markup=main_keyboard())

    elif state == "add_task_title":
        set_session(conn, telegram_id, "add_task_stars", {**data, "title": text.strip()})
        tg_send(token, chat_id,
            f"Задача: <b>{text.strip()}</b>\n\nСколько ⭐ дать за выполнение? (введите число от 1 до 10):")

    elif state == "add_task_stars":
        try:
            stars = max(1, min(100, int(text.strip())))
        except ValueError:
            tg_send(token, chat_id, "Введите число от 1 до 100:")
            return
        set_session(conn, telegram_id, "add_task_deadline", {**data, "stars": stars})
        tg_send(token, chat_id,
            f"Задача: <b>{data['title']}</b> — {stars}⭐\n\n"
            f"⏳ <b>Срок выполнения?</b>\n\n"
            f"Напишите, например: <code>2д</code> (2 дня), <code>12ч</code> (12 часов), <code>1д 6ч</code>\n"
            f"Или <code>нет</code> — без срока:")

    elif state == "add_task_deadline":
        deadline, err = parse_deadline_input(text)
        if err:
            tg_send(token, chat_id, "Не понял. Напишите например <code>2д</code>, <code>12ч</code> или <code>нет</code>:")
            return
        if deadline:
            set_session(conn, telegram_id, "add_task_late_stars", {**data, "deadline": deadline.isoformat()})
            tg_send(token, chat_id,
                f"⭐ Сколько звёзд за выполнение <b>ПОСЛЕ</b> срока?\n\n"
                f"(Основная награда: {data['stars']}⭐. Введите меньшую сумму или <code>0</code> — нельзя выполнить после срока):")
        else:
            # Нет дедлайна — сразу создаём задачу
            _create_task(conn, token, chat_id, telegram_id, parent_id, data, None, None)

    elif state == "add_task_late_stars":
        try:
            late_stars = max(0, min(data["stars"], int(text.strip())))
        except ValueError:
            tg_send(token, chat_id, "Введите число:")
            return
        deadline_str = data.get("deadline")
        deadline = datetime.fromisoformat(deadline_str) if deadline_str else None
        _create_task(conn, token, chat_id, telegram_id, parent_id, data, deadline, late_stars if late_stars > 0 else None)

    elif state == "add_reward_title":
        set_session(conn, telegram_id, "add_reward_cost", {"title": text.strip()})
        tg_send(token, chat_id, f"Награда: <b>{text.strip()}</b>\n\nСколько ⭐ стоит? (введите число):")

    elif state == "add_reward_cost":
        try:
            cost = max(1, int(text.strip()))
        except ValueError:
            tg_send(token, chat_id, "Введите число:")
            return

        with conn.cursor() as cur:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.rewards (parent_id, title, cost, emoji)
                VALUES (%s, %s, %s, '🎁')
            """, (parent_id, data["title"], cost))
        conn.commit()
        set_session(conn, telegram_id, "idle")
        tg_send(token, chat_id,
            f"✅ Награда <b>«{data['title']}»</b> добавлена в магазин!\n"
            f"Стоимость: {cost}⭐",
            reply_markup=main_keyboard())
    else:
        tg_send(token, chat_id, "Выберите раздел:", reply_markup=main_keyboard())


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}, "body": ""}

    token = os.environ.get("PARENT_BOT_TOKEN", "")
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
        full_name = (message["from"].get("first_name", "") + " " + message["from"].get("last_name", "")).strip()
        text = message.get("text", "").strip()

        parent = get_or_create_parent(conn, telegram_id, username, full_name)
        session = get_session(conn, telegram_id)

        if text == "/start":
            set_session(conn, telegram_id, "idle")
            cmd_start(conn, token, chat_id, telegram_id, username, full_name)
        elif session["state"] != "idle" and not text.startswith("/"):
            handle_state_input(conn, token, chat_id, telegram_id, parent["id"], text, session)
        elif text in ("📋 Задачи", "/tasks"):
            cmd_tasks(conn, token, chat_id, parent["id"])
        elif text in ("🎁 Награды", "/rewards"):
            cmd_rewards(conn, token, chat_id, parent["id"])
        elif text in ("📊 Статистика", "/stats"):
            cmd_stats(conn, token, chat_id, parent["id"])
        elif text in ("👨‍👩‍👧 Дети", "/children"):
            cmd_children(conn, token, chat_id, parent["id"])
        elif text in ("👤 Профиль", "/profile"):
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.children WHERE parent_id = %s", (parent["id"],))
                child_count = cur.fetchone()[0]
            tg_send(token, chat_id,
                f"👤 <b>Профиль</b>\n\n"
                f"Имя: <b>{parent['name']}</b>\n"
                f"Детей: <b>{child_count}</b>",
                reply_markup=main_keyboard())
        else:
            tg_send(token, chat_id, "Выберите раздел:", reply_markup=main_keyboard())

    finally:
        conn.close()

    return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": json.dumps({"ok": True})}