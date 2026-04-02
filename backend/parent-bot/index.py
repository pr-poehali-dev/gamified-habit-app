"""
Родительский бот @parenttask_bot.
/start — приветствие с кнопкой Mini App.
/premium <telegram_id> — админ-команда для включения/выключения Premium.
"""
import json
import os
import urllib.request
import psycopg2


MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://tasks4kids.ru").rstrip("/") + "/parent"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")
ADMIN_IDS = [int(x.strip()) for x in os.environ.get("ADMIN_IDS", "83945752").split(",") if x.strip()]


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


def handle_premium_command(token, chat_id, args):
    """Включить/выключить Premium для родителя по telegram_id."""
    if chat_id not in ADMIN_IDS:
        tg(token, chat_id, "⛔ Нет доступа к этой команде.")
        return

    if not args:
        tg(token, chat_id,
           "📋 <b>Управление Premium</b>\n\n"
           "Использование:\n"
           "<code>/premium 123456789</code> — переключить Premium\n"
           "<code>/premium 123456789 on</code> — включить\n"
           "<code>/premium 123456789 off</code> — выключить\n"
           "<code>/premium list</code> — список Premium-пользователей")
        return

    if args[0] == "list":
        db_url = os.environ.get("DATABASE_URL", "")
        if not db_url:
            tg(token, chat_id, "❌ DATABASE_URL не настроен")
            return
        conn = psycopg2.connect(db_url)
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT telegram_id, full_name FROM {SCHEMA}.parents WHERE is_premium = true ORDER BY full_name")
                rows = cur.fetchall()
            if not rows:
                tg(token, chat_id, "📋 Нет Premium-пользователей")
                return
            lines = [f"👑 <b>Premium ({len(rows)})</b>\n"]
            for tid, name in rows:
                lines.append(f"• <code>{tid}</code> — {name or '—'}")
            tg(token, chat_id, "\n".join(lines))
        finally:
            conn.close()
        return

    target_id = args[0]
    try:
        target_id = int(target_id)
    except ValueError:
        tg(token, chat_id, "❌ Укажи telegram_id числом.\n\nПример: <code>/premium 123456789</code>")
        return

    force_state = None
    if len(args) > 1:
        if args[1].lower() in ("on", "1", "true", "да"):
            force_state = True
        elif args[1].lower() in ("off", "0", "false", "нет"):
            force_state = False

    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        tg(token, chat_id, "❌ DATABASE_URL не настроен")
        return

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT id, full_name, is_premium FROM {SCHEMA}.parents WHERE telegram_id = %s", (target_id,))
            row = cur.fetchone()

        if not row:
            tg(token, chat_id, f"❌ Родитель с telegram_id <code>{target_id}</code> не найден.")
            return

        parent_id, name, current_premium = row
        new_premium = force_state if force_state is not None else (not current_premium)

        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.parents SET is_premium = %s WHERE id = %s", (new_premium, parent_id))
        conn.commit()

        status = "👑 Premium включён" if new_premium else "❌ Premium выключен"
        tg(token, chat_id,
           f"{status}\n\n"
           f"👤 {name or '—'}\n"
           f"🆔 <code>{target_id}</code>")
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Webhook родительского бота: /start и /premium."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}

    token = os.environ.get("PARENT_BOT_TOKEN", "")
    if not token:
        return {"statusCode": 200, "body": "ok"}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    message = body.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    text = (message.get("text") or "").strip()

    if not chat_id:
        return {"statusCode": 200, "body": "ok"}

    if text.startswith("/premium"):
        args = text.split()[1:]
        handle_premium_command(token, chat_id, args)
        return {"statusCode": 200, "body": "ok"}

    if text.startswith("/start"):
        first_name = message.get("from", {}).get("first_name", "")
        tg(token, chat_id,
            f"👋 Привет, <b>{first_name}</b>!\n\n"
            f"Я помогаю управлять заданиями и наградами для детей 🎯\n\n"
            f"Нажми кнопку ниже чтобы открыть приложение 👇",
            reply_markup={
                "inline_keyboard": [[
                    {"text": "🚀 Открыть СтарКидс", "web_app": {"url": MINI_APP_URL}}
                ]]
            }
        )

    return {"statusCode": 200, "body": "ok"}
