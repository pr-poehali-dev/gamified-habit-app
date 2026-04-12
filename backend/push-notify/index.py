"""
Push-уведомления для PWA СтарКидс.
Действия:
  - subscribe: сохранить подписку браузера
  - unsubscribe: удалить подписку
  - send_to_parent: отправить push родителю (вызывается из mini-app)
  - send_to_child: отправить push ребёнку (вызывается из mini-app)
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}


def err(msg: str, code: int = 400) -> dict:
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def send_web_push(subscription: dict, payload: dict) -> bool:
    """Отправляет Web Push уведомление через VAPID."""
    try:
        from pywebpush import webpush, WebPushException

        vapid_private = os.environ.get("VAPID_PRIVATE_KEY", "")
        vapid_email = os.environ.get("VAPID_EMAIL", "")

        if not vapid_private or not vapid_email:
            print("[push] VAPID keys not configured")
            return False

        webpush(
            subscription_info=subscription,
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=vapid_private,
            vapid_claims={"sub": f"mailto:{vapid_email}"},
            ttl=86400,
        )
        return True
    except Exception as e:
        print(f"[push] send error: {e}")
        return False


def subscribe(body: dict) -> dict:
    """Сохраняет push-подписку браузера."""
    endpoint = body.get("endpoint", "")
    p256dh = body.get("p256dh", "")
    auth = body.get("auth", "")
    parent_id = body.get("parent_id")
    child_id = body.get("child_id")
    user_agent = body.get("user_agent", "")

    if not endpoint or not p256dh or not auth:
        return err("Неполные данные подписки.")
    if not parent_id and not child_id:
        return err("Укажите parent_id или child_id.")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""INSERT INTO {SCHEMA}.push_subscriptions (parent_id, child_id, endpoint, p256dh, auth, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (endpoint) DO UPDATE SET
                parent_id = EXCLUDED.parent_id,
                child_id = EXCLUDED.child_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                user_agent = EXCLUDED.user_agent""",
        (parent_id, child_id, endpoint, p256dh, auth, user_agent)
    )
    conn.commit()
    cur.close()
    conn.close()
    return ok({"status": "ok"})


def unsubscribe(body: dict) -> dict:
    """Удаляет push-подписку браузера."""
    endpoint = body.get("endpoint", "")
    if not endpoint:
        return err("Укажите endpoint.")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"UPDATE {SCHEMA}.push_subscriptions SET endpoint = endpoint WHERE endpoint = %s RETURNING id", (endpoint,))
    # Мягкое удаление — обнуляем auth чтобы не слать
    cur.execute(f"UPDATE {SCHEMA}.push_subscriptions SET auth = '' WHERE endpoint = %s", (endpoint,))
    conn.commit()
    cur.close()
    conn.close()
    return ok({"status": "ok"})


def send_to_parent(parent_id: int, payload: dict) -> dict:
    """Отправляет push всем подпискам родителя."""
    if not parent_id:
        return err("Укажите parent_id.")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT endpoint, p256dh, auth FROM {SCHEMA}.push_subscriptions WHERE parent_id = %s AND auth != ''",
        (parent_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    sent = 0
    for endpoint, p256dh, auth in rows:
        sub = {"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}}
        if send_web_push(sub, payload):
            sent += 1

    return ok({"status": "ok", "sent": sent})


def send_to_child(child_id: int, payload: dict) -> dict:
    """Отправляет push всем подпискам ребёнка."""
    if not child_id:
        return err("Укажите child_id.")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT endpoint, p256dh, auth FROM {SCHEMA}.push_subscriptions WHERE child_id = %s AND auth != ''",
        (child_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    sent = 0
    for endpoint, p256dh, auth in rows:
        sub = {"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}}
        if send_web_push(sub, payload):
            sent += 1

    return ok({"status": "ok", "sent": sent})


def handler(event: dict, context) -> dict:
    """Push-уведомления для PWA: подписка, отписка, отправка."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return err("Неверный JSON.")

    action = body.get("action", "")

    if action == "get_public_key":
        key = os.environ.get("VAPID_PUBLIC_KEY", "")
        if not key:
            return err("VAPID not configured", 500)
        return ok({"public_key": key})

    if action == "subscribe":
        return subscribe(body)

    if action == "unsubscribe":
        return unsubscribe(body)

    if action == "send_to_parent":
        return send_to_parent(body.get("parent_id"), body.get("payload", {}))

    if action == "send_to_child":
        return send_to_child(body.get("child_id"), body.get("payload", {}))

    return err("Неизвестное действие.")