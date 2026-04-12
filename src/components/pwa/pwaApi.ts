import func2url from "../../../backend/func2url.json";

const PWA_AUTH_URL = (func2url as Record<string, string>)["pwa-auth"];

async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(PWA_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

export async function checkPhone(phone: string): Promise<{ registered?: boolean; has_pin?: boolean; error?: string }> {
  return call({ action: "check_phone", phone }) as Promise<{ registered?: boolean; has_pin?: boolean; error?: string }>;
}

export async function sendOtp(phone: string): Promise<{ status?: string; error?: string }> {
  return call({ action: "send_otp", phone }) as Promise<{ status?: string; error?: string }>;
}

export async function verifyOtp(
  phone: string,
  otp: string,
  fullName?: string
): Promise<{ status?: string; role?: string; session_token?: string; parent_id?: number; full_name?: string; is_new?: boolean; has_pin?: boolean; error?: string }> {
  return call({ action: "verify_otp", phone, otp, full_name: fullName || "" }) as Promise<{
    status?: string; role?: string; session_token?: string; parent_id?: number; full_name?: string; is_new?: boolean; has_pin?: boolean; error?: string;
  }>;
}

export async function setPin(sessionToken: string, pin: string): Promise<{ status?: string; error?: string }> {
  return call({ action: "set_pin", session_token: sessionToken, pin }) as Promise<{ status?: string; error?: string }>;
}

export async function loginPin(
  phone: string,
  pin: string
): Promise<{ status?: string; role?: string; session_token?: string; parent_id?: number; full_name?: string; error?: string }> {
  return call({ action: "login_pin", phone, pin }) as Promise<{
    status?: string; role?: string; session_token?: string; parent_id?: number; full_name?: string; error?: string;
  }>;
}

export async function registerChild(
  inviteCode: string
): Promise<{ status?: string; role?: string; session_token?: string; child_id?: number; parent_id?: number; child_name?: string; error?: string }> {
  return call({ action: "register_child", invite_code: inviteCode }) as Promise<{
    status?: string; role?: string; session_token?: string; child_id?: number; parent_id?: number; child_name?: string; error?: string;
  }>;
}

export async function verifySession(
  sessionToken: string,
  role: "parent" | "child"
): Promise<Record<string, unknown>> {
  return call({ action: "verify_session", session_token: sessionToken, role });
}

export async function logoutPwa(
  sessionToken: string,
  role: "parent" | "child"
): Promise<Record<string, unknown>> {
  return call({ action: "logout", session_token: sessionToken, role });
}