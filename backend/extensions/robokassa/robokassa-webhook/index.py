import json
import os
import hashlib
import psycopg2
from urllib.parse import parse_qs


def calculate_signature(*args) -> str:
    """Создание MD5 подписи по документации Robokassa"""
    joined = ':'.join(str(arg) for arg in args)
    return hashlib.md5(joined.encode()).hexdigest().upper()


def get_db_connection():
    """Получение подключения к БД"""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(dsn)


HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/plain'
}


def handler(event: dict, context) -> dict:
    '''
    Result URL вебхук от Robokassa для подтверждения оплаты.
    Robokassa отправляет: OutSum, InvId, SignatureValue
    Returns: OK{InvId} если подпись верна и заказ обновлён
    '''
    method = event.get('httpMethod', 'GET').upper()

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': '', 'isBase64Encoded': False}

    password_2 = os.environ.get('ROBOKASSA_PASSWORD_2')
    if not password_2:
        return {'statusCode': 500, 'headers': HEADERS, 'body': 'Configuration error', 'isBase64Encoded': False}

    # Парсинг параметров из body или query string
    params = {}
    body = event.get('body', '')

    if method == 'POST' and body:
        if event.get('isBase64Encoded', False):
            import base64
            body = base64.b64decode(body).decode('utf-8')
        parsed = parse_qs(body)
        params = {k: v[0] for k, v in parsed.items()}

    if not params:
        params = event.get('queryStringParameters') or {}

    out_sum = params.get('OutSum', params.get('out_summ', ''))
    inv_id = params.get('InvId', params.get('inv_id', ''))
    signature_value = params.get('SignatureValue', params.get('crc', '')).upper()

    if not out_sum or not inv_id or not signature_value:
        return {'statusCode': 400, 'headers': HEADERS, 'body': 'Missing required parameters', 'isBase64Encoded': False}

    # Проверка подписи
    expected_signature = calculate_signature(out_sum, inv_id, password_2)
    if signature_value != expected_signature:
        return {'statusCode': 400, 'headers': HEADERS, 'body': 'Invalid signature', 'isBase64Encoded': False}

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(f"""
        UPDATE {schema}.orders
        SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE robokassa_inv_id = %s AND status = 'pending'
        RETURNING id, order_number, user_email, parent_telegram_id
    """, (int(inv_id),))

    result = cur.fetchone()

    if not result:
        cur.execute(f"SELECT status FROM {schema}.orders WHERE robokassa_inv_id = %s", (int(inv_id),))
        existing = cur.fetchone()
        conn.close()

        if existing and existing[0] == 'paid':
            return {'statusCode': 200, 'headers': HEADERS, 'body': f'OK{inv_id}', 'isBase64Encoded': False}
        return {'statusCode': 404, 'headers': HEADERS, 'body': 'Order not found', 'isBase64Encoded': False}

    order_id, order_number, user_email, parent_telegram_id = result

    # Активируем Premium у родителя в БД
    if parent_telegram_id:
        import datetime
        premium_until = datetime.datetime.now() + datetime.timedelta(days=30)
        cur.execute(f"""
            UPDATE {schema}.parents
            SET is_premium_paid = TRUE, premium_until = %s
            WHERE telegram_id = %s
        """, (premium_until, parent_telegram_id))

    conn.commit()
    cur.close()
    conn.close()

    # Уведомление родителю в Telegram
    if parent_telegram_id:
        import urllib.request
        bot_token = os.environ.get('PARENT_BOT_TOKEN', '')
        if bot_token:
            text = (
                f"👑 *Premium активирован!*\n\n"
                f"Ваша подписка СтарКидс активна на 30 дней.\n"
                f"Заказ: `{order_number}`\n\n"
                f"Откройте приложение и пользуйтесь всеми возможностями Premium!"
            )
            payload = json.dumps({
                'chat_id': parent_telegram_id,
                'text': text,
                'parse_mode': 'Markdown'
            }).encode()
            req = urllib.request.Request(
                f'https://api.telegram.org/bot{bot_token}/sendMessage',
                data=payload,
                headers={'Content-Type': 'application/json'}
            )
            urllib.request.urlopen(req, timeout=5)

    return {'statusCode': 200, 'headers': HEADERS, 'body': f'OK{inv_id}', 'isBase64Encoded': False}