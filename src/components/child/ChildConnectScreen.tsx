import { useState } from "react";
import { apiCall } from "@/components/miniapp/useApi";

type Props = { onConnected: () => void };

export function ChildConnectScreen({ onConnected }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (code.trim().length < 4) return;
    setLoading(true);
    setError("");
    const res = await apiCall("child/connect", { invite_code: code.trim().toUpperCase() });
    if (res.ok) {
      onConnected();
    } else {
      setError(String(res.error || "Неверный код, попробуй ещё раз"));
      setLoading(false);
    }
  };

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
