"""
Детский бот @task4kids_bot.
Обрабатывает только /start — отправляет приветствие с кнопкой открытия Mini App.
"""
import json
import os
import urllib.request


MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://tasks4kids.ru").rstrip("/") + "/child"


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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}

    token = os.environ.get("CHILD_BOT_TOKEN", "")
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
    text = message.get("text", "")
    first_name = message.get("from", {}).get("first_name", "")

    if chat_id and text.startswith("/start"):
        parts = text.split(maxsplit=1)
        invite_code = parts[1].strip() if len(parts) > 1 else None

        if invite_code:
            # Deep link with invite code — pass it as startapp parameter
            mini_app_url_with_code = f"{MINI_APP_URL}?startapp={invite_code}"
            tg(token, chat_id,
                f"🌟 Привет, <b>{first_name}</b>!\n\n"
                f"Код приглашения <b>{invite_code}</b> уже подставлен — просто нажми кнопку ниже и подключись! 👇",
                reply_markup={
                    "inline_keyboard": [[
                        {"text": "⭐ Войти в СтарКидс", "web_app": {"url": mini_app_url_with_code}}
                    ]]
                }
            )
        else:
            tg(token, chat_id,
                f"🌟 Привет, <b>{first_name}</b>!\n\n"
                f"Я помогаю выполнять задания и зарабатывать звёзды ⭐\n\n"
                f"<b>Как начать:</b>\n"
                f"1️⃣ Попроси родителя открыть <b>@parenttask_bot</b>\n"
                f"2️⃣ Родитель добавит тебя в разделе «Дети» и даст код\n"
                f"3️⃣ Нажми кнопку ниже и введи код 👇",
                reply_markup={
                    "inline_keyboard": [[
                        {"text": "⭐ Открыть СтарКидс", "web_app": {"url": MINI_APP_URL}}
                    ]]
                }
            )

    return {"statusCode": 200, "body": "ok"}