import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOtp, verifyOtp } from "./pwaApi";
import { savePwaSession } from "./usePwaSession";

interface Props {
  onSuccess: () => void;
}

type Step = "phone" | "otp" | "name";

export default function PwaParentAuth({ onSuccess }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isNew, setIsNew] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 1) return "+7";
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (val: string) => {
    if (val === "" || val === "+") { setPhone(""); return; }
    setPhone(formatPhone(val));
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    const res = await sendOtp(phone);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep("otp");
    setResendCountdown(60);
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[index] = val.slice(-1);
    setOtp(next);
    if (val && index < 5) inputsRef.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) {
      handleVerifyOtp(next.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const codeToCheck = code || otp.join("");
    if (codeToCheck.length !== 6) { setError("Введите все 6 цифр."); return; }
    setError("");
    setLoading(true);
    const res = await verifyOtp(phone, codeToCheck);
    setLoading(false);
    if (res.error) { setError(res.error); setOtp(["", "", "", "", "", ""]); setTimeout(() => inputsRef.current[0]?.focus(), 100); return; }
    if (res.is_new) {
      setIsNew(true);
      setStep("name");
    } else {
      savePwaSession(res.session_token!, "parent");
      onSuccess();
    }
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) { setError("Введите ваше имя."); return; }
    setError("");
    setLoading(true);
    const res = await verifyOtp(phone, otp.join(""), fullName);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    savePwaSession(res.session_token!, "parent");
    onSuccess();
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);
    const res = await sendOtp(phone);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResendCountdown(60);
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6">

        <div className="text-center space-y-2">
          <div className="text-4xl">⭐</div>
          <h1 className="text-xl font-bold text-gray-900">СтарКидс</h1>
          <p className="text-sm text-gray-500">
            {step === "phone" && "Введите номер телефона для входа"}
            {step === "otp" && `Код отправлен на ${phone}`}
            {step === "name" && "Как вас зовут?"}
          </p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              className="text-center text-lg tracking-wide h-12"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
              onClick={handleSendOtp}
              disabled={loading || phone.replace(/\D/g, "").length < 11}
            >
              {loading ? "Отправляем..." : "Получить SMS-код"}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Нажимая кнопку, вы соглашаетесь с{" "}
              <a href="/terms" className="underline">условиями использования</a>
            </p>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#6B7BFF] focus:outline-none transition-colors"
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some((d) => !d)}
            >
              {loading ? "Проверяем..." : "Подтвердить"}
            </Button>
            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-sm text-gray-400">Повторная отправка через {resendCountdown} сек.</p>
              ) : (
                <button className="text-sm text-[#6B7BFF] underline" onClick={handleResend}>
                  Отправить код повторно
                </button>
              )}
            </div>
            <button className="w-full text-sm text-gray-400 text-center" onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}>
              ← Изменить номер
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">Это первый вход — расскажите, как вас зовут</p>
            <Input
              placeholder="Например: Мария"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="text-center text-lg h-12"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
              onClick={handleSaveName}
              disabled={loading || !fullName.trim()}
            >
              {loading ? "Сохраняем..." : "Войти"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
