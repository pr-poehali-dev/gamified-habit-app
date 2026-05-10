"""
Отправка обращений в поддержку на почту владельца.
Принимает: name, email, message. Отправляет письмо через SMTP (mail.ru).
"""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "invalid_json"})}

    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip()
    message = str(body.get("message", "")).strip()

    if not name or not email or not message:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "missing_fields"})}

    if len(message) > 5000:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "message_too_long"})}

    smtp_login = os.environ.get("SUPPORT_SMTP_LOGIN", "")
    smtp_password = os.environ.get("SUPPORT_SMTP_PASSWORD", "")
    to_email = os.environ.get("SUPPORT_TO_EMAIL", "max.krug@mail.ru")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[СтарКидс] Обращение от {name}"
    msg["From"] = smtp_login
    msg["To"] = to_email
    msg["Reply-To"] = email

    html_body = f"""
<html><body style="font-family: Arial, sans-serif; color: #1E1B4B; background: #f8f9ff; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.07);">
    <div style="font-size: 28px; margin-bottom: 8px;">💬</div>
    <h2 style="margin: 0 0 20px; font-size: 20px;">Новое обращение в поддержку</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #9ca3af; font-size: 13px; width: 100px;">Имя</td>
        <td style="padding: 8px 0; font-weight: 600;">{name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Email</td>
        <td style="padding: 8px 0; font-weight: 600;"><a href="mailto:{email}" style="color: #6B7BFF;">{email}</a></td>
      </tr>
    </table>
    <div style="background: #f8f9ff; border-radius: 12px; padding: 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      {message.replace(chr(10), '<br>')}
    </div>
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      Ответьте на это письмо — ответ придёт напрямую пользователю ({email})
    </div>
  </div>
</body></html>
"""

    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.mail.ru", 465) as server:
            server.login(smtp_login, smtp_password)
            server.sendmail(smtp_login, to_email, msg.as_string())
    except Exception as e:
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "smtp_error", "detail": str(e)})}

    return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}
