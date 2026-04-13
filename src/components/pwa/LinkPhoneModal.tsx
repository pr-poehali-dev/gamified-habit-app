import { useState, useRef, useEffect } from "react";
import func2url from "../../../backend/func2url.json";

const PWA_AUTH_URL = (func2url as Record<string, string>)["pwa-auth"];

async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(PWA_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
}

interface Props {
  telegramId: number;
  onSuccess: (phone: string) => void;
  onClose: () => void;
}

type Step = "phone" | "otp";

export default function LinkPhoneModal({ telegramId, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
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

  const handlePhoneSubmit = async () => {
    setError("");
    setLoading(true);
    const res = await call({ action: "link_phone_request", telegram_id: telegramId, phone });
    setLoading(false);
    if (res.error) { setError(res.error as string); return; }
    setStep("otp");
    setResendCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    const code = otp.join("");
    const res = await call({ action: "link_phone_confirm", telegram_id: telegramId, phone, otp: code });
    setLoading(false);
    if (res.error) { setError(res.error as string); return; }
    onSuccess(phone);
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setError("");
    setLoading(true);
    const res = await call({ action: "link_phone_request", telegram_id: telegramId, phone });
    setLoading(false);
    if (res.error) { setError(res.error as string); return; }
    setOtp(["", "", "", "", "", ""]);
    setResendCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-bold text-[#1E1B4B] text-base">Привязать телефон</p>
              <p className="text-xs text-gray-400">Для входа через PWA-приложение</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold active:scale-95 transition-transform">
            ✕
          </button>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-2xl p-3 text-xs text-blue-700">
              Введите номер телефона — на него придёт SMS с кодом подтверждения. После привязки сможете входить через PWA без Telegram.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Номер телефона</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                onKeyDown={e => { if (e.key === "Enter" && phone.replace(/\D/g, "").length >= 11) handlePhoneSubmit(); }}
                placeholder="+7 (___) ___-__-__"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-lg font-bold text-[#1E1B4B] focus:outline-none focus:border-[#6B7BFF] transition-colors tracking-wider"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}

            <button
              onClick={handlePhoneSubmit}
              disabled={loading || phone.replace(/\D/g, "").length < 11}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              {loading ? "Отправляем..." : "Получить код →"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-[#1E1B4B]">Код отправлен на</p>
              <p className="text-base font-black text-[#6B7BFF]">{phone}</p>
              <button onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }} className="text-xs text-gray-400 underline">
                Изменить номер
              </button>
            </div>

            <div className="flex gap-2 justify-center">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  maxLength={1}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKey(idx, e)}
                  className="w-11 h-13 text-center text-xl font-black border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6B7BFF] transition-colors"
                  style={{ height: "52px" }}
                />
              ))}
            </div>

            {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading || otp.some(d => !d)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              {loading ? "Проверяем..." : "Привязать телефон ✓"}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCountdown > 0 || loading}
              className="w-full text-sm text-gray-400 disabled:opacity-50"
            >
              {resendCountdown > 0 ? `Повторить через ${resendCountdown} сек.` : "Отправить код повторно"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
