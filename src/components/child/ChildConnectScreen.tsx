import { useState, useEffect } from "react";
import { apiCall } from "@/components/miniapp/useApi";
import { tg } from "@/components/miniapp/types";

type Props = { onConnected: () => void; wasDeleted?: boolean };

export function ChildConnectScreen({ onConnected, wasDeleted = false }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(false);
  const [error, setError] = useState("");
  const [showConnectForm, setShowConnectForm] = useState(!wasDeleted);

  // Read invite code from Telegram start_param (passed via ?startapp=CODE or initDataUnsafe.start_param)
  useEffect(() => {
    const webapp = tg();

    // Try initDataUnsafe.start_param (standard Telegram deep link via ?start=CODE)
    const startParam = webapp?.initDataUnsafe?.start_param;

    // Also try URL search params (passed as ?startapp=CODE in web_app url)
    const urlParams = new URLSearchParams(window.location.search);
    const startApp = urlParams.get("startapp");

    const inviteCode = (startParam || startApp || "").trim().toUpperCase();

    if (inviteCode && inviteCode.length >= 4) {
      setCode(inviteCode);
      setAutoConnecting(true);
      handleAutoConnect(inviteCode);
    }
  }, []);

  const handleAutoConnect = async (inviteCode: string) => {
    setLoading(true);
    setError("");
    const res = await apiCall("child/connect", { invite_code: inviteCode });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      localStorage.removeItem("child_was_connected");
      onConnected();
    } else {
      setAutoConnecting(false);
      setError(String(res.error || "Неверный код, попробуй ещё раз"));
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (code.trim().length < 4) return;
    setLoading(true);
    setError("");
    const res = await apiCall("child/connect", { invite_code: code.trim().toUpperCase() });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      localStorage.removeItem("child_was_connected");
      onConnected();
    } else {
      setError(String(res.error || "Неверный код, попробуй ещё раз"));
      setLoading(false);
    }
  };

  // Экран "профиль удалён родителем"
  if (wasDeleted && !showConnectForm && !(autoConnecting && !error)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF] px-6" style={{ fontFamily: "Nunito, sans-serif" }}>
        <div className="text-7xl mb-6">😔</div>
        <h1 className="text-2xl font-black text-[#2D1B69] mb-3 text-center">Профиль удалён</h1>
        <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed max-w-xs">
          Родитель удалил твой профиль.<br />
          Чтобы продолжить пользоваться приложением, попроси родителя создать новый профиль и поделиться кодом.
        </p>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => setShowConnectForm(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#C96BD9] text-white font-black text-base shadow-lg active:scale-95 transition-transform"
          >
            🔑 У меня есть новый код
          </button>
        </div>

        <div className="mt-8 bg-white/60 rounded-2xl px-5 py-4 max-w-xs text-center">
          <p className="text-xs text-gray-500 font-semibold">
            📱 Родитель создаёт новый профиль<br />
            в разделе <b>«Дети»</b> → <b>«Добавить ребёнка»</b>
          </p>
        </div>
      </div>
    );
  }

  // Auto-connecting screen — shown while we silently connect via start_param
  if (autoConnecting && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF] px-6" style={{ fontFamily: "Nunito, sans-serif" }}>
        <div className="text-7xl mb-6 animate-bounce">🌟</div>
        <h1 className="text-2xl font-black text-[#2D1B69] mb-2 text-center">Подключаемся...</h1>
        <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
          Используем код <b className="text-[#FF6B9D]">{code}</b>
        </p>
        <div className="flex gap-2">
          <span className="w-3 h-3 bg-[#FF6B9D] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-3 h-3 bg-[#C96BD9] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-3 h-3 bg-[#6B9DFF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF] px-6" style={{ fontFamily: "Nunito, sans-serif" }}>
      <div className="text-6xl mb-4">🔑</div>
      <h1 className="text-2xl font-black text-[#2D1B69] mb-2 text-center">Введи код</h1>
      <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
        Попроси родителя открыть приложение СтарКидс,<br />
        перейти во вкладку <b>«Дети»</b> и показать тебе код
      </p>

      <div className="w-full max-w-xs space-y-4">
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleConnect()}
          placeholder="XXXXXX"
          maxLength={6}
          autoFocus
          className="w-full text-center text-3xl font-black tracking-[0.3em] border-2 border-[#FF6B9D]/30 rounded-2xl px-4 py-4 text-[#2D1B69] bg-white focus:outline-none focus:border-[#FF6B9D] transition-colors"
        />

        {error && (
          <p className="text-red-500 text-sm font-bold text-center">{error}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={code.trim().length < 4 || loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-black text-base shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "Подключаюсь..." : "Подключиться →"}
        </button>
      </div>

      <div className="mt-10 bg-white/60 rounded-2xl px-5 py-4 max-w-xs text-center">
        <p className="text-xs text-gray-500 font-semibold">
          📱 Родитель видит код в разделе<br />
          <b>«Дети»</b> рядом с твоим именем
        </p>
      </div>
    </div>
  );
}