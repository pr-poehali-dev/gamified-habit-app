import { tg } from "./types";

export const API_URL = "https://functions.poehali.dev/3a2e1162-786c-43ae-a6b7-78b24771e462";

export async function apiCall(action: string, body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const webapp = tg();
  const initData = webapp?.initData || "";
  const payload = { action, initData, ...body };
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[apiCall] ${action} → HTTP ${res.status}`, data);
    }
    return data;
  } catch (e) {
    console.error(`[apiCall] ${action} → fetch error`, e);
    return { error: String(e) };
  }
}