import func2url from "@/../func2url.json";

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

export async function sendOtp(phone: string): Promise<{ status?: string; error?: string }> {
  return call({ action: "send_otp", phone }) as Promise<{ status?: string; error?: string }>;
}

export async function verifyOtp(
  phone: string,
  otp: string,
  fullName?: string
): Promise<{ status?: string; role?: string; session_token?: string; parent_id?: number; full_name?: string; is_new?: boolean; error?: string }> {
  return call({ action: "verify_otp", phone, otp, full_name: fullName || "" }) as Promise<{
    status?: string; role?: string; session_token?: string; parent_id?: number; full_name?: string; is_new?: boolean; error?: string;
  }>;
}

export async function registerChild(
  inviteCode: string,
  childName: string,
  childAge: number,
  phone?: string
): Promise<{ status?: string; role?: string; session_token?: string; child_id?: number; parent_id?: number; child_name?: string; error?: string }> {
  return call({ action: "register_child", invite_code: inviteCode, child_name: childName, child_age: childAge, phone: phone || "" }) as Promise<{
    status?: string; role?: string; session_token?: string; child_id?: number; parent_id?: number; child_name?: string; error?: string;
  }>;
}

export async function verifySession(
  sessionToken: string,
  role: "parent" | "child"
): Promise<Record<string, unknown>> {
  return call({ action: "verify_session", session_token: sessionToken, role });
}
