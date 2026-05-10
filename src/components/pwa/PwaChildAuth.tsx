import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerChild, childSetPin, childLoginPin } from "./pwaApi";
import { savePwaSession } from "./usePwaSession";

interface Props {
  onSuccess: () => void;
  onSwitchToParent: () => void;
}

type Step = "code" | "set_pin" | "login_pin";

export default function PwaChildAuth({ onSuccess, onSwitchToParent }: Props) {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("code");
  const [inviteCode, setInviteCode] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [childName, setChildName] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const codeFromUrl = searchParams.get("invite") || searchParams.get("code");
    if (codeFromUrl) setInviteCode(codeFromUrl.toUpperCase());
  }, [searchParams]);

  const handleDigit = (
    index: number,
    val: string,
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void
  ) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...arr];
    next[index] = val.slice(-1);
    setArr(next);
    if (val && index < 3) refs.current[index + 1]?.focus();
    if (next.every(d => d !== "")) onComplete(next.join(""));
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    arr: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Backspace" && !arr[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const PinInputs = (
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void
  ) => (
    <div className="flex gap-3 justify-center">
      {arr.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleDigit(i, e.target.value, arr, setArr, refs, onComplete)}
          onKeyDown={e => handleKeyDown(i, e, arr, refs)}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#FF8B6B] focus:outline-none transition-colors"
        />
      ))}
    </div>
  );

  // Шаг 1: ввод кода от родителя
  const handleRegister = async () => {
    if (!inviteCode.trim()) { setError("Введите код приглашения."); return; }
    setError("");
    setLoading(true);
    const res = await registerChild(inviteCode.trim().toUpperCase());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    savePwaSession(res.session_token!, "child");
    setSessionToken(res.session_token!);
    setChildName(res.child_name || "");
    if (res.has_pin) {
      // Уже есть PIN — но мы только что вошли через ссылку, сразу пускаем
      onSuccess();
    } else {
      // Новый пользователь — предлагаем установить PIN
      setStep("set_pin");
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    }
  };

  // Шаг 2а: установка PIN
  const handlePinEntered = (code: string) => {
    if (code.length === 4) {
      setPinStep("confirm");
      setTimeout(() => confirmRefs.current[0]?.focus(), 100);
    }
  };

  const handleConfirmPin = async (code: string) => {
    const entered = pin.join("");
    if (code !== entered) {
      setError("Коды не совпадают. Попробуй ещё раз.");
      setConfirmPin(["", "", "", ""]);
      setPin(["", "", "", ""]);
      setPinStep("enter");
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
      return;
    }
    setError("");
    setLoading(true);
    const res = await childSetPin(sessionToken, code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onSuccess();
  };

  const handleSkipPin = () => onSuccess();

  // Шаг 2б: вход по PIN (у пользователя есть PIN, но потерял сессию)
  const handleLoginPin = async (code: string) => {
    if (code.length !== 4) return;
    setError("");
    setLoading(true);
    const res = await childLoginPin(inviteCode.trim().toUpperCase(), code);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setPin(["", "", "", ""]);
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
      return;
    }
    savePwaSession(res.session_token!, "child");
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#FFF0F5] p-4">
      <div className="w-full max-w-sm space-y-3">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">

          {/* ── Шаг 1: код от родителя ── */}
          {step === "code" && (
            <>
              <div className="text-center space-y-2">
                <div className="text-4xl">🚀</div>
                <h1 className="text-xl font-black text-[#2D1B69]">Привет!</h1>
                <p className="text-sm text-gray-500">Введи код от родителя, чтобы войти</p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Например: ABC123"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleRegister()}
                  className="text-center text-2xl tracking-widest font-bold h-14 uppercase"
                  autoFocus
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <Button
                  className="w-full h-12 text-base bg-[#FF8B6B] hover:bg-[#EE7A5A] text-white"
                  onClick={handleRegister}
                  disabled={loading || !inviteCode.trim()}
                >
                  {loading ? "Проверяем..." : "Войти →"}
                </Button>
              </div>

              {/* Быстрый вход по PIN если уже был */}
              <div className="border-t pt-4 space-y-2 text-center">
                <button
                  className="text-xs text-[#FF8B6B] underline font-semibold"
                  onClick={() => { setStep("login_pin"); setTimeout(() => pinRefs.current[0]?.focus(), 100); }}
                >
                  Уже входил раньше? Войти по PIN-коду
                </button>
                <div />
                <p className="text-xs text-gray-400">Вы родитель?</p>
                <button className="text-sm text-[#6B7BFF] underline" onClick={onSwitchToParent}>
                  Войти как родитель
                </button>
              </div>
            </>
          )}

          {/* ── Шаг 2а: установка PIN ── */}
          {step === "set_pin" && (
            <>
              <div className="text-center space-y-2">
                <div className="text-4xl">🔐</div>
                <h1 className="text-xl font-black text-[#2D1B69]">
                  {childName ? `Привет, ${childName}!` : "Привет!"}
                </h1>
                <p className="text-sm text-gray-500">
                  {pinStep === "enter"
                    ? "Придумай PIN-код для быстрого входа"
                    : "Введи PIN ещё раз для подтверждения"}
                </p>
                <p className="text-xs text-gray-400">4 цифры — запомни их!</p>
              </div>

              <div className="space-y-4">
                {pinStep === "enter"
                  ? PinInputs(pin, setPin, pinRefs, handlePinEntered)
                  : PinInputs(confirmPin, setConfirmPin, confirmRefs, handleConfirmPin)
                }
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {loading && <p className="text-gray-400 text-sm text-center">Сохраняем...</p>}
              </div>

              <button
                className="w-full text-xs text-gray-400 text-center py-1"
                onClick={handleSkipPin}
              >
                Пропустить, войти без PIN
              </button>
            </>
          )}

          {/* ── Шаг 2б: вход по PIN ── */}
          {step === "login_pin" && (
            <>
              <div className="text-center space-y-2">
                <div className="text-4xl">🔑</div>
                <h1 className="text-xl font-black text-[#2D1B69]">Вход по PIN</h1>
                <p className="text-sm text-gray-500">Сначала введи код от родителя</p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Код от родителя (например: ABC123)"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="text-center text-lg tracking-widest font-bold h-12 uppercase"
                />
                <div>
                  <p className="text-xs text-gray-400 text-center mb-3">Теперь твой PIN-код</p>
                  {PinInputs(pin, setPin, pinRefs, handleLoginPin)}
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {loading && <p className="text-gray-400 text-sm text-center">Проверяем...</p>}
              </div>

              <div className="border-t pt-4 space-y-2 text-center">
                <button
                  className="text-xs text-gray-400 underline"
                  onClick={() => { setStep("code"); setPin(["", "", "", ""]); setError(""); }}
                >
                  ← Войти по ссылке от родителя
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
