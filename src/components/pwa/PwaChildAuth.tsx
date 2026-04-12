import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerChild } from "./pwaApi";
import { savePwaSession } from "./usePwaSession";

interface Props {
  onSuccess: () => void;
  onSwitchToParent: () => void;
}

export default function PwaChildAuth({ onSuccess, onSwitchToParent }: Props) {
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const codeFromUrl = searchParams.get("invite") || searchParams.get("code");
    if (codeFromUrl) {
      setInviteCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleRegister = async () => {
    if (!inviteCode.trim()) { setError("Введите инвайт-код."); return; }
    if (!childName.trim()) { setError("Введите своё имя."); return; }
    const age = parseInt(childAge) || 10;
    setError("");
    setLoading(true);
    const res = await registerChild(inviteCode.trim().toUpperCase(), childName.trim(), age);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    savePwaSession(res.session_token!, "child");
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#FFF0F5] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6">

        <div className="text-center space-y-2">
          <div className="text-4xl">🚀</div>
          <h1 className="text-xl font-bold text-gray-900">Привет!</h1>
          <p className="text-sm text-gray-500">
            Введи код от родителя, чтобы войти
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Инвайт-код</label>
            <Input
              placeholder="Например: ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="text-center text-lg tracking-widest font-bold h-12 uppercase"
              autoFocus={!inviteCode}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Твоё имя</label>
            <Input
              placeholder="Например: Саша"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="h-12"
              autoFocus={!!inviteCode}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Сколько тебе лет?</label>
            <Input
              type="number"
              placeholder="10"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              min={4}
              max={18}
              className="h-12"
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            className="w-full h-12 text-base bg-[#FF8B6B] hover:bg-[#EE7A5A] text-white"
            onClick={handleRegister}
            disabled={loading || !inviteCode.trim() || !childName.trim()}
          >
            {loading ? "Входим..." : "Войти в приложение 🚀"}
          </Button>
        </div>

        <div className="border-t pt-4 text-center">
          <p className="text-xs text-gray-400 mb-2">Вы родитель?</p>
          <button className="text-sm text-[#6B7BFF] underline" onClick={onSwitchToParent}>
            Войти как родитель
          </button>
        </div>

      </div>
    </div>
  );
}
