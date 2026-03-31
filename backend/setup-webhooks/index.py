"""
Регистрирует webhooks для обоих Telegram-ботов.
Вызывается один раз после добавления токенов.
GET / — регистрирует оба webhook и возвращает результат.
"""
import json
import os
import urllib.request


CHILD_BOT_URL = "https://functions.poehali.dev/55bea415-4dac-4798-884c-60644941fca0"
PARENT_BOT_URL = "https://functions.poehali.dev/77555918-0477-48e9-8c06-e042967efe69"


def set_webhook(token, webhook_url):
    url = f"https://api.telegram.org/bot{token}/setWebhook"
    payload = json.dumps({"url": webhook_url}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def get_webhook_info(token):
    url = f"https://api.telegram.org/bot{token}/getWebhookInfo"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}, "body": ""}

    child_token = os.environ.get("CHILD_BOT_TOKEN", "")
    parent_token = os.environ.get("PARENT_BOT_TOKEN", "")

    results = {}

    if child_token:
        results["child_bot"] = set_webhook(child_token, CHILD_BOT_URL)
        results["child_bot_info"] = get_webhook_info(child_token)
    else:
        results["child_bot"] = {"error": "CHILD_BOT_TOKEN not set"}

    if parent_token:
        results["parent_bot"] = set_webhook(parent_token, PARENT_BOT_URL)
        results["parent_bot_info"] = get_webhook_info(parent_token)
    else:
        results["parent_bot"] = {"error": "PARENT_BOT_TOKEN not set"}

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps(results, ensure_ascii=False, indent=2)
    }
