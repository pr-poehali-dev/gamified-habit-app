"""
PWA-авторизация для СтарКидс. v3
Действия:
  - send_otp: отправить SMS с кодом родителю
  - verify_otp: проверить код, вернуть session_token
  - check_phone: проверить есть ли PIN у номера
  - set_pin: установить 4-значный код-пароль
  - login_pin: войти по номеру + PIN
  - register_child: зарегистрировать ребёнка по инвайт-коду
  - verify_session: проверить сессионный токен, вернуть профиль
"""
import json
import os
import random
import string
import hashlib
import secrets
import psycopg2
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p84704826_gamified_habit_app")
SMSAERO_EMAIL = os.environ.get("SMSAERO_EMAIL", "")
SMSAERO_API_KEY = os.environ.get("SMSAERO_API_KEY", "")
OTP_TTL_MINUTES = 10
SESSION_TTL_DAYS = 30

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


def normalize_phone(raw: str) -> str:
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) == 10:
        digits = "7" + digits
    elif len(digits) == 11 and digits[0] == "8":
        digits = "7" + digits[1:]
    if len(digits) != 11 or digits[0] != "7":
        raise ValueError("Неверный формат номера телефона")
    return "+" + digits


def send_sms(phone: str, message: str) -> tuple[bool, str]:
    import base64
    import http.client
    phone_digits = phone.lstrip("+")
    credentials = base64.b64encode(f"{SMSAERO_EMAIL}:{SMSAERO_API_KEY}".encode("utf-8")).decode("utf-8")
    params = urllib.parse.urlencode({
        "number": phone_digits,
        "text": message,
        "sign": "SMS Aero",
        "channel": "DIRECT",
    })
    try:
        conn = http.client.HTTPSConnection("gate.smsaero.ru", timeout=10)
        conn.request("GET", f"/v2/sms/send?{params}", headers={
            "Authorization": f"Basic {credentials}",
            "Accept": "application/json",
        })
        resp = conn.getresponse()
        raw = resp.read().decode("utf-8")
        print(f"[SMSAERO] status={resp.status} response: {raw}")
        if resp.status == 401:
            return False, "Неверный email или API-ключ SMSAero (401)"
        result = json.loads(raw)
        if result.get("success"):
            return True, ""
        return False, result.get("message", "неизвестная ошибка")
    except Exception as e:
        print(f"[SMSAERO] exception: {e}")
        return False, str(e)
    finally:
        conn.close()


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def generate_token() -> str:
    return secrets.token_hex(32)


def send_otp(phone_raw: str) -> dict:
    try:
        phone = normalize_phone(phone_raw)
    except ValueError as e:
        return err(str(e))

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT id FROM {SCHEMA}.parents WHERE phone_number = %s",
        (phone,)
    )
    exists = cur.fetchone()

    if exists:
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET otp_code = %s, otp_expires_at = %s WHERE phone_number = %s",
            (otp, expires_at, phone)
        )
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.parents (telegram_id, phone_number, otp_code, otp_expires_at, full_name)
                VALUES (0, %s, %s, %s, '')
                ON CONFLICT (phone_number) DO UPDATE SET otp_code = EXCLUDED.otp_code, otp_expires_at = EXCLUDED.otp_expires_at""",
            (phone, otp, expires_at)
        )

    conn.commit()
    cur.close()
    conn.close()

    message = f"СтарКидс: ваш код подтверждения {otp}. Действителен {OTP_TTL_MINUTES} минут."
    sent, sms_error = send_sms(phone, message)

    if not sent:
        print(f"[send_otp] SMS failed for {phone}: {sms_error}")
        return err(f"Не удалось отправить SMS: {sms_error}")

    return ok({"status": "sent", "phone": phone})


def verify_otp(phone_raw: str, otp_input: str, full_name: str = "") -> dict:
    try:
        phone = normalize_phone(phone_raw)
    except ValueError as e:
        return err(str(e))

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, otp_code, otp_expires_at, phone_verified, full_name, pwa_session_token, pin_code FROM {SCHEMA}.parents WHERE phone_number = %s",
        (phone,)
    )
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return err("Номер телефона не найден. Запросите код заново.")

    parent_id, stored_otp, expires_at, phone_verified, db_name, existing_token, pin_code = row

    if phone_verified and existing_token and stored_otp is None:
        token = existing_token
        name_to_save = full_name.strip() if full_name.strip() else (db_name or "")
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET full_name = %s WHERE id = %s",
            (name_to_save, parent_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return ok({
            "status": "ok",
            "role": "parent",
            "session_token": token,
            "parent_id": parent_id,
            "full_name": name_to_save,
            "is_new": False,
            "has_pin": bool(pin_code),
        })

    if expires_at is None or (expires_at.tzinfo is None and datetime.now(timezone.utc) > expires_at.replace(tzinfo=timezone.utc)) or (expires_at.tzinfo and datetime.now(timezone.utc) > expires_at):
        cur.close()
        conn.close()
        return err("Код истёк. Запросите новый.")

    if stored_otp != otp_input.strip():
        cur.close()
        conn.close()
        return err("Неверный код.")

    token = existing_token if existing_token else generate_token()

    name_to_save = full_name.strip() if full_name.strip() else (db_name or "")

    cur.execute(
        f"""UPDATE {SCHEMA}.parents
            SET phone_verified = true, otp_code = NULL, otp_expires_at = NULL,
                pwa_session_token = %s, full_name = %s
            WHERE id = %s""",
        (token, name_to_save, parent_id)
    )
    conn.commit()
    cur.close()
    conn.close()

    return ok({
        "status": "ok",
        "role": "parent",
        "session_token": token,
        "parent_id": parent_id,
        "full_name": name_to_save,
        "is_new": not phone_verified,
        "has_pin": bool(pin_code),
    })


def check_phone(phone_raw: str) -> dict:
    """Проверяет зарегистрирован ли номер и есть ли PIN."""
    try:
        phone = normalize_phone(phone_raw)
    except ValueError as e:
        return err(str(e))

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT phone_verified, pin_code FROM {SCHEMA}.parents WHERE phone_number = %s",
        (phone,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row or not row[0]:
        return ok({"registered": False, "has_pin": False})

    return ok({"registered": True, "has_pin": bool(row[1])})


def set_pin(session_token: str, pin: str) -> dict:
    """Установить или обновить 4-значный PIN."""
    if not session_token:
        return err("Нет токена сессии.", 401)
    if not pin or len(pin) != 4 or not pin.isdigit():
        return err("PIN должен состоять из 4 цифр.")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.parents SET pin_code = %s WHERE pwa_session_token = %s RETURNING id",
        (pin, session_token)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not row:
        return err("Сессия недействительна.", 401)

    return ok({"status": "ok"})


def login_pin(phone_raw: str, pin: str) -> dict:
    """Войти по номеру телефона и PIN-коду."""
    try:
        phone = normalize_phone(phone_raw)
    except ValueError as e:
        return err(str(e))

    if not pin or len(pin) != 4 or not pin.isdigit():
        return err("Введите 4-значный код-пароль.")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, pin_code, full_name, pwa_session_token FROM {SCHEMA}.parents WHERE phone_number = %s AND phone_verified = true",
        (phone,)
    )
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return err("Номер не найден.")

    parent_id, stored_pin, full_name, existing_token = row

    if not stored_pin:
        cur.close()
        conn.close()
        return err("PIN не установлен. Войдите по SMS.")

    if stored_pin != pin:
        cur.close()
        conn.close()
        return err("Неверный код-пароль.")

    token = existing_token if existing_token else generate_token()
    if not existing_token:
        cur.execute(
            f"UPDATE {SCHEMA}.parents SET pwa_session_token = %s WHERE id = %s",
            (token, parent_id)
        )
        conn.commit()

    cur.close()
    conn.close()

    return ok({
        "status": "ok",
        "role": "parent",
        "session_token": token,
        "parent_id": parent_id,
        "full_name": full_name or "",
    })


def register_child(invite_code: str, child_name: str, child_age: int, phone_raw: str = "") -> dict:
    if not invite_code or not child_name:
        return err("Укажите инвайт-код и имя ребёнка.")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, parent_id FROM {SCHEMA}.children WHERE invite_code = %s",
        (invite_code.strip().upper(),)
    )
    child_row = cur.fetchone()

    if not child_row:
        cur.close()
        conn.close()
        return err("Инвайт-код не найден. Попросите родителя проверить ссылку.")

    child_id, parent_id = child_row

    phone = None
    if phone_raw:
        try:
            phone = normalize_phone(phone_raw)
        except ValueError:
            phone = None

    token = generate_token()

    cur.execute(
        f"""UPDATE {SCHEMA}.children
            SET name = %s, age = %s, phone_number = %s, pwa_session_token = %s
            WHERE id = %s""",
        (child_name.strip(), child_age, phone, token, child_id)
    )
    conn.commit()
    cur.close()
    conn.close()

    return ok({
        "status": "ok",
        "role": "child",
        "session_token": token,
        "child_id": child_id,
        "parent_id": parent_id,
        "child_name": child_name.strip(),
    })


def verify_session(session_token: str, role: str) -> dict:
    if not session_token or role not in ("parent", "child"):
        return err("Неверные параметры.")

    conn = get_conn()
    cur = conn.cursor()

    if role == "parent":
        cur.execute(
            f"SELECT id, full_name, phone_number, is_premium, is_premium_paid, premium_until, pin_code FROM {SCHEMA}.parents WHERE pwa_session_token = %s",
            (session_token,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return err("Сессия недействительна.", 401)
        pid, name, phone, is_premium, is_premium_paid, premium_until, pin_code = row
        return ok({
            "status": "ok",
            "role": "parent",
            "parent_id": pid,
            "full_name": name or "",
            "phone_number": phone or "",
            "is_premium": is_premium or is_premium_paid,
            "premium_until": premium_until.isoformat() if premium_until else None,
            "has_pin": bool(pin_code),
        })
    else:
        cur.execute(
            f"SELECT c.id, c.name, c.age, c.stars, c.parent_id, p.full_name FROM {SCHEMA}.children c JOIN {SCHEMA}.parents p ON p.id = c.parent_id WHERE c.pwa_session_token = %s",
            (session_token,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return err("Сессия недействительна.", 401)
        cid, name, age, stars, parent_id, parent_name = row
        return ok({
            "status": "ok",
            "role": "child",
            "child_id": cid,
            "child_name": name or "",
            "age": age,
            "stars": stars or 0,
            "parent_id": parent_id,
            "parent_name": parent_name or "",
        })


def handler(event: dict, context) -> dict:
    """PWA-авторизация: OTP для родителя, инвайт-код для ребёнка, проверка сессии."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return err("Неверный JSON.")

    action = body.get("action")

    if action == "send_otp":
        return send_otp(body.get("phone", ""))

    if action == "check_phone":
        return check_phone(body.get("phone", ""))

    if action == "verify_otp":
        return verify_otp(
            body.get("phone", ""),
            body.get("otp", ""),
            body.get("full_name", ""),
        )

    if action == "set_pin":
        return set_pin(body.get("session_token", ""), body.get("pin", ""))

    if action == "login_pin":
        return login_pin(body.get("phone", ""), body.get("pin", ""))

    if action == "register_child":
        return register_child(
            body.get("invite_code", ""),
            body.get("child_name", ""),
            int(body.get("child_age", 10)),
            body.get("phone", ""),
        )

    if action == "verify_session":
        return verify_session(
            body.get("session_token", ""),
            body.get("role", ""),
        )

    return err("Неизвестное действие.")