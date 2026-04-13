import { useState } from "react";
import func2url from "../../../backend/func2url.json";

const PWA_AUTH_URL = (func2url as Record<string, string>)["pwa-auth"];

async function callMerge(sessionToken: string, phone: string): Promise<{ status?: string; parent_id?: number; full_name?: string; error?: string }> {
  try {
    const res = await fetch(PWA_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "merge_accounts", session_token: sessionToken, phone }),
    });
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

interface Props {
  phone: string;
  sessionToken: string;
  onMerged: () => void;
  onSkip: () => void;
}

export default function MergeAccountModal({ phone, sessionToken, onMerged, onSkip }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMerge = async () => {
    setError("");
    setLoading(true);
    const res = await callMerge(sessionToken, phone);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onMerged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl space-y-5">
        <div className="flex justify-center">
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="text-center space-y-2">
          <div className="text-5xl">🔗</div>
          <h2 className="text-lg font-black text-[#1E1B4B]">Найден аккаунт Telegram</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Этот номер телефона привязан к аккаунту в Telegram Mini App.
            Объединить их в один?
          </p>
        </div>

        <div className="bg-[#F0F4FF] rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">✅</span>
            <p className="text-sm text-[#1E1B4B]">Все дети, задания и прогресс перейдут в ваш текущий аккаунт</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">✅</span>
            <p className="text-sm text-[#1E1B4B]">Сможете входить и через Telegram, и через приложение</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">✅</span>
            <p className="text-sm text-[#1E1B4B]">Данные старого аккаунта PWA будут удалены</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center font-medium">{error}</p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleMerge}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? "Объединяем..." : "Объединить аккаунты →"}
          </button>
          <button
            onClick={onSkip}
            disabled={loading}
            className="w-full py-3 text-sm text-gray-400 font-medium"
          >
            Оставить отдельными
          </button>
        </div>
      </div>
    </div>
  );
}
