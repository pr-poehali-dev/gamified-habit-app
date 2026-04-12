import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPhone, sendOtp, verifyOtp, loginPin, setPin } from "./pwaApi";
import { savePwaSession } from "./usePwaSession";

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
    if (res.is_new) {
      setStep("name");
    } else if (!res.has_pin) {
      savePwaSession(res.session_token!, "parent");
      setStep("set_pin");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6">

        <div className="text-center space-y-2">
          <div className="text-4xl">⭐</div>
          <h1 className="text-xl font-bold text-gray-900">СтарКидс</h1>
          <p className="text-sm text-gray-500">
            {step === "phone" && "Введите номер телефона для входа"}
            {step === "pin" && "Введите код-пароль"}
            {step === "otp" && `Код отправлен на ${phone}`}
            {step === "name" && "Как вас зовут?"}
            {step === "set_pin" && (pinStep === "enter" ? "Придумайте код-пароль для быстрого входа" : "Повторите код-пароль")}
          </p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
              className="text-center text-lg tracking-wide h-12"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button
              className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
              onClick={handlePhoneSubmit}
              disabled={loading || phone.replace(/\D/g, "").length < 11}
            >
              {loading ? "Проверяем..." : "Продолжить"}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Нажимая кнопку, вы соглашаетесь с{" "}
              <a href="/terms" className="underline">условиями использования</a>
            </p>
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
            <button
              className="w-full text-sm text-gray-400 text-center"
              onClick={handleSkipPin}
            >
              Пропустить
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
