import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPhone, sendOtp, verifyOtp, loginPin, setPin } from "./pwaApi";
import { savePwaSession } from "./usePwaSession";
import MergeAccountModal from "./MergeAccountModal";
import func2url from "../../../backend/func2url.json";

const SUPPORT_URL = func2url["support-email"];

interface Props {
  onSuccess: () => void;
}

type Step = "phone" | "pin" | "otp" | "name" | "set_pin";

export default function PwaParentAuth({ onSuccess }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pin, setPinValue] = useState(["", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [sessionToken, setSessionToken] = useState("");
  const [showMerge, setShowMerge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: "", email: "", message: "" });
  const [supportSending, setSupportSending] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handlePhoneSubmit = async () => {
    setError("");
    setLoading(true);
    const res = await checkPhone(phone);
    setLoading(false);

    if (res.error) { setError(res.error); return; }

    if (res.registered && res.has_pin) {
      setStep("pin");
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    } else {
      await doSendOtp();
    }
  };

  const doSendOtp = async () => {
    setError("");
    setLoading(true);
    const res = await sendOtp(phone);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep("otp");
    setResendCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleDigitInput = (
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
    if (val && index < arr.length - 1) refs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    arr: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Backspace" && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePinLogin = async (code?: string) => {
    const pinCode = code || pin.join("");
    if (pinCode.length !== 4) return;
    setError("");
    setLoading(true);
    const res = await loginPin(phone, pinCode);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setPinValue(["", "", "", ""]);
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
      return;
    }
    savePwaSession(res.session_token!, "parent");
    onSuccess();
  };

  const handleOtpChange = (index: number, val: string) => {
    handleDigitInput(index, val, otp, setOtp, otpRefs, (code) => handleVerifyOtp(code));
  };

  const handleVerifyOtp = async (code?: string) => {
    const codeToCheck = code || otp.join("");
    if (codeToCheck.length !== 6) { setError("Введите все 6 цифр."); return; }
    setError("");
    setLoading(true);
    const res = await verifyOtp(phone, codeToCheck);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      return;
    }
    setSessionToken(res.session_token || "");
    savePwaSession(res.session_token!, "parent");
    if (res.is_new) {
      setStep("name");
    } else if (res.has_telegram_account) {
      // Аккаунт уже привязан к Telegram — предложить объединение
      setShowMerge(true);
    } else if (!res.has_pin) {
      setStep("set_pin");
    } else {
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
    setSessionToken(res.session_token || "");
    savePwaSession(res.session_token!, "parent");
    setStep("set_pin");
  };

  const handleNewPinComplete = (code: string) => {
    if (code.length === 4) {
      setPinStep("confirm");
      setTimeout(() => confirmPinRefs.current[0]?.focus(), 100);
    }
  };

  const handleConfirmPinComplete = async (code: string) => {
    const entered = newPin.join("");
    if (code !== entered) {
      setError("Коды не совпадают. Попробуйте ещё раз.");
      setConfirmPin(["", "", "", ""]);
      setNewPin(["", "", "", ""]);
      setPinStep("enter");
      setTimeout(() => newPinRefs.current[0]?.focus(), 100);
      return;
    }
    setError("");
    setLoading(true);
    const res = await setPin(sessionToken, code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onSuccess();
  };

  const handleSkipPin = () => {
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
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSending(true);
    try {
      await fetch(SUPPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });
    } catch { /* игнорируем */ }
    setSupportSending(false);
    setSupportSent(true);
    setTimeout(() => { setShowSupport(false); setSupportSent(false); setSupportForm({ name: "", email: "", message: "" }); }, 3000);
  };

  const digitInputs = (
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void,
    size: number
  ) => (
    <div className="flex gap-2 justify-center">
      {arr.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleDigitInput(i, e.target.value, arr, setArr, refs, onComplete)}
          onKeyDown={(e) => handleDigitKeyDown(i, e, arr, refs)}
          className={`${size === 4 ? "w-14 h-14 text-2xl" : "w-11 h-12 text-xl"} text-center font-bold border-2 border-gray-200 rounded-xl focus:border-[#6B7BFF] focus:outline-none transition-colors`}
        />
      ))}
    </div>
  );

  return (
    <>
    {/* Модалка поддержки */}
    {showSupport && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl relative">
          <button onClick={() => setShowSupport(false)} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold">✕</button>
          {supportSent ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-5xl">✅</div>
              <p className="font-black text-[#1E1B4B] text-lg">Отправлено!</p>
              <p className="text-sm text-gray-400">Ответим в течение рабочего дня</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-black text-[#1E1B4B] mb-1">💬 Техническая поддержка</h2>
              <p className="text-sm text-gray-400 mb-5">Отвечаем в течение рабочего дня</p>
              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Ваше имя</label>
                  <input required value={supportForm.name} onChange={e => setSupportForm(f => ({ ...f, name: e.target.value }))} placeholder="Мария" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B7BFF]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Email для ответа</label>
                  <input required type="email" value={supportForm.email} onChange={e => setSupportForm(f => ({ ...f, email: e.target.value }))} placeholder="mail@example.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B7BFF]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Опишите проблему</label>
                  <textarea required value={supportForm.message} onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))} placeholder="Что случилось?" rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B7BFF] resize-none" />
                </div>
                <button type="submit" disabled={supportSending} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm disabled:opacity-60">
                  {supportSending ? "Отправляем..." : "Отправить →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    )}

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF] p-4">
      <div className="w-full max-w-sm space-y-4">

        {/* Карточка входа */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">

          <div className="text-center space-y-2">
            <div className="text-4xl">⭐</div>
            <h1 className="text-xl font-black text-[#1E1B4B]">СтарКидс</h1>
            {step === "phone" && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#6B7BFF]">Вход и регистрация для родителей</p>
                <p className="text-xs text-gray-400">Введите номер телефона — пришлём SMS-код</p>
              </div>
            )}
            {step === "pin" && <p className="text-sm text-gray-500">Введите код-пароль</p>}
            {step === "otp" && <p className="text-sm text-gray-500">Код отправлен на {phone}</p>}
            {step === "name" && <p className="text-sm text-gray-500">Как вас зовут?</p>}
            {step === "set_pin" && <p className="text-sm text-gray-500">{pinStep === "enter" ? "Придумайте код-пароль для быстрого входа" : "Повторите код-пароль"}</p>}
          </div>

          {step === "phone" && (
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="+7 (999) 000-00-00"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agreeTerms && agreePersonalData && handlePhoneSubmit()}
                className="text-center text-lg tracking-wide h-12"
                autoFocus
              />

              {/* Чекбоксы согласий */}
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#6B7BFF] flex-shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    Я принимаю{" "}
                    <a href="/legal?tab=terms" target="_blank" className="text-[#6B7BFF] underline font-semibold">пользовательское соглашение</a>
                    {" "}и{" "}
                    <a href="/legal?tab=privacy" target="_blank" className="text-[#6B7BFF] underline font-semibold">политику конфиденциальности</a>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreePersonalData}
                    onChange={e => setAgreePersonalData(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#6B7BFF] flex-shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    Я даю{" "}
                    <a href="/legal?tab=consent" target="_blank" className="text-[#6B7BFF] underline font-semibold">согласие на обработку персональных данных</a>
                    {" "}в соответствии с 152-ФЗ
                  </span>
                </label>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Button
                className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                onClick={handlePhoneSubmit}
                disabled={loading || phone.replace(/\D/g, "").length < 11 || !agreeTerms || !agreePersonalData}
              >
                {loading ? "Проверяем..." : "Получить код →"}
              </Button>
            </div>
          )}

        {step === "pin" && (
          <div className="space-y-4">
            {digitInputs(pin, setPinValue, pinRefs, handlePinLogin, 4)}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
              onClick={() => handlePinLogin()}
              disabled={loading || pin.some((d) => !d)}
            >
              {loading ? "Входим..." : "Войти"}
            </Button>
            <button
              className="w-full text-sm text-[#6B7BFF] text-center"
              onClick={doSendOtp}
            >
              Забыли код-пароль? Войти по SMS
            </button>
            <button
              className="w-full text-sm text-gray-400 text-center"
              onClick={() => { setStep("phone"); setPinValue(["", "", "", ""]); setError(""); }}
            >
              ← Изменить номер
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            {digitInputs(otp, setOtp, otpRefs, (code) => handleVerifyOtp(code), 6)}
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
              {loading ? "Сохраняем..." : "Далее"}
            </Button>
          </div>
        )}

        {step === "set_pin" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              {pinStep === "enter"
                ? "4 цифры — чтобы не вводить SMS каждый раз"
                : "Введите ещё раз для подтверждения"}
            </p>
            {pinStep === "enter"
              ? digitInputs(newPin, setNewPin, newPinRefs, handleNewPinComplete, 4)
              : digitInputs(confirmPin, setConfirmPin, confirmPinRefs, handleConfirmPinComplete, 4)
            }
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {pinStep === "confirm" && (
              <Button
                className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                onClick={() => handleConfirmPinComplete(confirmPin.join(""))}
                disabled={loading || confirmPin.some((d) => !d)}
              >
                {loading ? "Сохраняем..." : "Установить код-пароль"}
              </Button>
            )}

          </div>
        )}

      </div>

        {/* Кнопка поддержки */}
        <button
          onClick={() => setShowSupport(true)}
          className="w-full text-sm text-gray-400 text-center py-2 hover:text-[#6B7BFF] transition-colors"
        >
          💬 Техническая поддержка
        </button>
      </div>
    </div>

    {showMerge && (
      <MergeAccountModal
        phone={phone}
        sessionToken={sessionToken}
        onMerged={() => {
          setShowMerge(false);
          onSuccess();
        }}
        onSkip={() => {
          setShowMerge(false);
          onSuccess();
        }}
      />
    )}
    </>
  );
}