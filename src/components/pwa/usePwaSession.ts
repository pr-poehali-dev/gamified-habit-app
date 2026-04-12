import { useState, useEffect } from "react";
import { verifySession } from "./pwaApi";

const TOKEN_KEY = "pwa_session_token";
const ROLE_KEY = "pwa_session_role";

export interface PwaSession {
  token: string;
  role: "parent" | "child";
  profile: Record<string, unknown>;
}

export function savePwaSession(token: string, role: "parent" | "child") {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearPwaSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getPwaSessionRaw(): { token: string; role: "parent" | "child" } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY) as "parent" | "child" | null;
  if (token && role) return { token, role };
  return null;
}

export function usePwaSession() {
  const [session, setSession] = useState<PwaSession | null | "loading">("loading");

  useEffect(() => {
    const raw = getPwaSessionRaw();
    if (!raw) {
      setSession(null);
      return;
    }
    verifySession(raw.token, raw.role).then((profile) => {
      if (profile.status === "ok") {
        setSession({ token: raw.token, role: raw.role, profile });
      } else {
        clearPwaSession();
        setSession(null);
      }
    });
  }, []);

  return session;
}
