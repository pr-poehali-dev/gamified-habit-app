"""
Настраивает Telegram ботов: регистрирует вебхуки и кнопки меню Mini App.
GET / — выполняет настройку и возвращает результат.
"""
import json
import os
import urllib.request


PARENT_BOT_URL = "https://functions.poehali.dev/2d26e70c-45dd-453b-bc66-584a06fe98b7"
CHILD_BOT_URL = "https://functions.poehali.dev/dea96d86-e228-4421-83c8-b683289eaa09"


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
        results["parent_webhook"] = tg(parent_token, "setWebhook", {"url": PARENT_BOT_URL})
        results["parent_webhook_info"] = tg(parent_token, "getWebhookInfo")
        results["parent_menu"] = tg(parent_token, "setChatMenuButton", {
            "menu_button": {"type": "web_app", "text": "👨 Открыть СтарКидс", "web_app": {"url": f"{mini_app_url}/parent"}}
        })
    else:
        results["parent"] = {"error": "PARENT_BOT_TOKEN not set"}

    if child_token:
        results["child_webhook"] = tg(child_token, "setWebhook", {"url": CHILD_BOT_URL})
        results["child_webhook_info"] = tg(child_token, "getWebhookInfo")
        results["child_menu"] = tg(child_token, "setChatMenuButton", {
            "menu_button": {"type": "web_app", "text": "⭐ Открыть СтарКидс", "web_app": {"url": f"{mini_app_url}/child"}}
        })
    else:
        results["child"] = {"error": "CHILD_BOT_TOKEN not set"}

    results["urls"] = {
        "parent_mini_app": f"{mini_app_url}/parent",
        "child_mini_app": f"{mini_app_url}/child",
    }

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps(results, ensure_ascii=False, indent=2)
    }
