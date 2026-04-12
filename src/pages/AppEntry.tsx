/**
 * Умная точка входа — определяет среду (Telegram vs PWA) и роль пользователя.
 * Telegram: авторизация через initData.
 * PWA: авторизация через SMS-код (родитель) или инвайт-код (ребёнок).
 */
import { useState, useEffect } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { usePwaSession, savePwaSession } from "@/components/pwa/usePwaSession";
import PwaParentAuth from "@/components/pwa/PwaParentAuth";
import PwaChildAuth from "@/components/pwa/PwaChildAuth";
import ParentMiniApp from "./ParentMiniApp";
import ChildMiniApp from "./ChildMiniApp";

type Role = "parent" | "child" | null;
type AuthMode = "child_invite" | "parent" | null;

const isTelegramEnv = () => {
  const initData = window.Telegram?.WebApp?.initData;
  return typeof initData === "string" && initData.length > 0;
};

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-[#6B7BFF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 font-medium text-sm">Загрузка...</p>
      </div>
    </div>
  );
}

export default function AppEntry() {
  const [role, setRole] = useState<Role>(null);
  const [pwaMode, setPwaMode] = useState<AuthMode>(null);
  const [ready, setReady] = useState(false);
  const pwaSession = usePwaSession();

  useEffect(() => {
    console.log("[AppEntry] pwaSession:", pwaSession === "loading" ? "loading" : pwaSession ? `role=${pwaSession.role}` : "null");
    if (pwaSession === "loading") return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasInvite = urlParams.has("invite") || urlParams.has("code");
    const inTelegram = isTelegramEnv();
    const initData = window.Telegram?.WebApp?.initData;
    console.log("[AppEntry] inTelegram:", inTelegram, "initData length:", initData?.length, "hasInvite:", hasInvite);
    console.log("[AppEntry] localStorage token:", localStorage.getItem("pwa_session_token") ? "exists" : "missing");

    if (inTelegram) {
      const webapp = tg();
      if (webapp) { webapp.ready(); webapp.expand(); }
    }

    if (pwaSession) {
      console.log("[AppEntry] Using pwaSession, role:", pwaSession.role);
      setRole(pwaSession.role);
      setReady(true);
      return;
    }

    if (inTelegram) {
      const webapp = tg();
      const detect = async () => {
        try {
          const tgId = webapp?.initDataUnsafe?.user?.id;
          const firstName = webapp?.initDataUnsafe?.user?.first_name || "";
          console.log("[AppEntry] Telegram detect: tgId:", tgId, "firstName:", firstName);

          const parentRes = await apiCall("parent/auth", {
            ...(tgId ? { telegram_id: tgId, first_name: firstName } : {}),
          });
          console.log("[AppEntry] parent/auth response:", JSON.stringify(parentRes).slice(0, 200));
          if (parentRes.role === "parent") { setRole("parent"); setReady(true); return; }

          const childRes = await apiCall("child/auth", tgId ? { telegram_id: tgId } : {});
          console.log("[AppEntry] child/auth response:", JSON.stringify(childRes).slice(0, 200));
          if (childRes.role === "child") { setRole("child"); setReady(true); return; }
        } catch (e) {
          console.error("[AppEntry] Telegram auth failed, falling back to PWA", e);
        }
        console.log("[AppEntry] Telegram auth: no role found, showing PWA form");
        setPwaMode(hasInvite ? "child_invite" : "parent");
        setReady(true);
      };
      detect();
      return;
    }

    console.log("[AppEntry] PWA mode, no session, showing auth form");
    setPwaMode(hasInvite ? "child_invite" : "parent");
    setReady(true);
  }, [pwaSession]);

  const handlePwaSuccess = (newRole: "parent" | "child") => {
    setRole(newRole);
    setPwaMode(null);
  };

  if (!ready || pwaSession === "loading") return <Spinner />;

  if (!role) {
    if (pwaMode === "child_invite") {
      return (
        <PwaChildAuth
          onSuccess={() => handlePwaSuccess("child")}
          onSwitchToParent={() => setPwaMode("parent")}
        />
      );
    }
    return (
      <PwaParentAuth
        onSuccess={() => handlePwaSuccess("parent")}
      />
    );
  }

  if (role === "child") return <ChildMiniApp />;
  return <ParentMiniApp />;
}