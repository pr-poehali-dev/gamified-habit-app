/**
 * Умная точка входа — определяет роль пользователя (родитель / ребёнок)
 * и рендерит нужный интерфейс без редиректа.
 */
import { useState, useEffect } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import ParentMiniApp from "./ParentMiniApp";
import ChildMiniApp from "./ChildMiniApp";

type Role = "parent" | "child" | "unknown" | null;

export default function AppEntry() {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const webapp = tg();
    if (webapp) { webapp.ready(); webapp.expand(); }

    const detect = async () => {
      const tgId = webapp?.initDataUnsafe?.user?.id;
      const firstName = webapp?.initDataUnsafe?.user?.first_name || "";

      // Сначала проверяем родителя
      const parentRes = await apiCall("parent/auth", {
        ...(tgId ? { telegram_id: tgId, first_name: firstName } : {}),
      });
      if (parentRes.role === "parent") {
        setRole("parent");
        return;
      }

      // Затем ребёнка
      const childRes = await apiCall("child/auth", tgId ? { telegram_id: tgId } : {});
      if (childRes.role === "child") {
        setRole("child");
        return;
      }

      // Не определено — по умолчанию пробуем как родитель (авторегистрация)
      setRole("parent");
    };

    detect();
  }, []);

  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#6B7BFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (role === "child") return <ChildMiniApp />;
  return <ParentMiniApp />;
}
