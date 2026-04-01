"""
Настраивает Telegram ботов для работы только как Mini App.
Удаляет вебхуки (боты больше не обрабатывают сообщения),
устанавливает кнопку меню ведущую в Mini App.
"""
import json
import os
import urllib.request


def tg(token, method, payload=None):
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = json.dumps(payload or {}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}, "body": ""}

    child_token = os.environ.get("CHILD_BOT_TOKEN", "")
    parent_token = os.environ.get("PARENT_BOT_TOKEN", "")
    mini_app_url = os.environ.get("MINI_APP_URL", "https://tasks4kids.ru").rstrip("/")

    results = {}

    if parent_token:
        # Удаляем вебхук — бот больше не обрабатывает сообщения
        results["parent_delete_webhook"] = tg(parent_token, "deleteWebhook", {"drop_pending_updates": True})
        # Устанавливаем кнопку меню ведущую в Mini App
        results["parent_menu"] = tg(parent_token, "setChatMenuButton", {
            "menu_button": {"type": "web_app", "text": "👨 Открыть СтарКидс", "web_app": {"url": f"{mini_app_url}/parent"}}
        })
    else:
        results["parent"] = {"error": "PARENT_BOT_TOKEN not set"}

    if child_token:
        results["child_delete_webhook"] = tg(child_token, "deleteWebhook", {"drop_pending_updates": True})
        results["child_menu"] = tg(child_token, "setChatMenuButton", {
            "menu_button": {"type": "web_app", "text": "⭐ Открыть СтарКидс", "web_app": {"url": f"{mini_app_url}/child"}}
        })
    else:
        results["child"] = {"error": "CHILD_BOT_TOKEN not set"}

    results["mini_app_urls"] = {
        "parent": f"{mini_app_url}/parent",
        "child": f"{mini_app_url}/child",
    }

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps(results, ensure_ascii=False, indent=2)
    }
