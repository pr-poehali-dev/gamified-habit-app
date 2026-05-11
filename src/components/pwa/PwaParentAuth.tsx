import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPhone, sendOtp, verifyOtp, loginPin, setPin, checkEmail, sendEmailOtp, verifyEmailOtp, updateName } from "./pwaApi";
import { savePwaSession } from "./usePwaSession";
import MergeAccountModal from "./MergeAccountModal";
import func2url from "../../../backend/func2url.json";

const SUPPORT_URL = func2url["support-email"];

interface Props { onSuccess: () => void; }

type AuthMethod = "phone" | "email" | "telegram";
type Step = "choose" | "phone" | "pin" | "otp" | "email" | "email_otp" | "name" | "set_pin";

export default function PwaParentAuth({ onSuccess }: Props) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [step, setStep] = useState<Step>("choose");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
  const [isNewEmail, setIsNewEmail] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (!digits.length) return "";
    if (digits.length <= 1) return "+7";
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handleDigitInput = (
    index: number, val: string,
    arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void
  ) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...arr];
    next[index] = val.slice(-1);
    setArr(next);
    if (val && index < arr.length - 1) refs.current[index + 1]?.focus();
    if (next.every(d => d !== "")) onComplete(next.join(""));
  };

  const handleDigitKeyDown = (
    index: number, e: React.KeyboardEvent,
    arr: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Backspace" && !arr[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const digitInputs = (
    arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void, size: number
  ) => (
    <div className="flex gap-2 justify-center">
      {arr.map((digit, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }}
          type="tel" inputMode="numeric" maxLength={1} value={digit}
          onChange={e => handleDigitInput(i, e.target.value, arr, setArr, refs, onComplete)}
          onKeyDown={e => handleDigitKeyDown(i, e, arr, refs)}
          className={`${size === 4 ? "w-14 h-14 text-2xl" : "w-11 h-12 text-xl"} text-center font-bold border-2 border-gray-200 rounded-xl focus:border-[#6B7BFF] focus:outline-none transition-colors`}
        />
      ))}
    </div>
  );

  // ── Phone flow ──
  const handlePhoneSubmit = async () => {
    setError(""); setLoading(true);
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
    setError(""); setLoading(true);
    const res = await sendOtp(phone);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep("otp"); setResendCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handlePinLogin = async (code?: string) => {
    const pinCode = code || pin.join("");
    if (pinCode.length !== 4) return;
    setError(""); setLoading(true);
    const res = await loginPin(phone, pinCode);
    setLoading(false);
    if (res.error) { setError(res.error); setPinValue(["", "", "", ""]); setTimeout(() => pinRefs.current[0]?.focus(), 100); return; }
    savePwaSession(res.session_token!, "parent");
    onSuccess();
  };

  const handleVerifyOtp = async (code?: string) => {
    const c = code || otp.join("");
    if (c.length !== 6) { setError("Введите все 6 цифр."); return; }
    setError(""); setLoading(true);
    const res = await verifyOtp(phone, c);
    setLoading(false);
    if (res.error) { setError(res.error); setOtp(["", "", "", "", "", ""]); setTimeout(() => otpRefs.current[0]?.focus(), 100); return; }
    setSessionToken(res.session_token || "");
    savePwaSession(res.session_token!, "parent");
    if (res.is_new) { setStep("name"); }
    else if (res.has_telegram_account) { setShowMerge(true); }
    else if (!res.has_pin) { setStep("set_pin"); }
    else { onSuccess(); }
  };

  const handleResendPhone = async () => {
    setOtp(["", "", "", "", "", ""]); setError(""); setLoading(true);
    const res = await sendOtp(phone);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResendCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ── Email flow ──
  const handleEmailSubmit = async () => {
    setError(""); setLoading(true);
    const check = await checkEmail(email);
    if (check.error) { setError(check.error); setLoading(false); return; }
    const res = await sendEmailOtp(email);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setIsNewEmail(!check.registered);
    setStep("email_otp");
    setResendCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleVerifyEmailOtp = async (code?: string) => {
    const c = code || otp.join("");
    if (c.length !== 6) { setError("Введите все 6 цифр."); return; }
    setError(""); setLoading(true);
    const res = await verifyEmailOtp(email, c);
    setLoading(false);
    if (res.error) { setError(res.error); setOtp(["", "", "", "", "", ""]); setTimeout(() => otpRefs.current[0]?.focus(), 100); return; }
    setSessionToken(res.session_token || "");
    savePwaSession(res.session_token!, "parent");
    if (res.is_new) { setStep("name"); }
    else { setStep("set_pin"); }
  };

  const handleResendEmail = async () => {
    setOtp(["", "", "", "", "", ""]); setError(""); setLoading(true);
    const res = await sendEmailOtp(email);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResendCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ── Name & PIN ──
  const handleSaveName = async () => {
    if (!fullName.trim()) { setError("Введите ваше имя."); return; }
    setError(""); setLoading(true);
    if (authMethod === "email") {
      // Сессия уже создана — просто обновляем имя
      const res = await updateName(sessionToken, fullName);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
    } else {
      const res = await verifyOtp(phone, otp.join(""), fullName);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      setSessionToken(res.session_token || "");
      savePwaSession(res.session_token!, "parent");
    }
    setStep("set_pin");
  };

  const handleNewPinComplete = (code: string) => {
    if (code.length === 4) { setPinStep("confirm"); setTimeout(() => confirmPinRefs.current[0]?.focus(), 100); }
  };

  const handleConfirmPinComplete = async (code: string) => {
    const entered = newPin.join("");
    if (code !== entered) {
      setError("Коды не совпадают."); setConfirmPin(["", "", "", ""]); setNewPin(["", "", "", ""]);
      setPinStep("enter"); setTimeout(() => newPinRefs.current[0]?.focus(), 100); return;
    }
    setError(""); setLoading(true);
    const res = await setPin(sessionToken, code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onSuccess();
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSupportSending(true);
    try { await fetch(SUPPORT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(supportForm) }); } catch { /* ignore */ }
    setSupportSending(false); setSupportSent(true);
    setTimeout(() => { setShowSupport(false); setSupportSent(false); setSupportForm({ name: "", email: "", message: "" }); }, 3000);
  };

  const Agreements = () => (
    <div className="space-y-2.5">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#6B7BFF] flex-shrink-0" />
        <span className="text-xs text-gray-500 leading-relaxed">
          Я принимаю{" "}
          <a href="/legal?tab=terms" target="_blank" className="text-[#6B7BFF] underline font-semibold">пользовательское соглашение</a>{" "}и{" "}
          <a href="/legal?tab=privacy" target="_blank" className="text-[#6B7BFF] underline font-semibold">политику конфиденциальности</a>
        </span>
      </label>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={agreePersonalData} onChange={e => setAgreePersonalData(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#6B7BFF] flex-shrink-0" />
        <span className="text-xs text-gray-500 leading-relaxed">
          Я даю{" "}
          <a href="/legal?tab=consent" target="_blank" className="text-[#6B7BFF] underline font-semibold">согласие на обработку персональных данных</a>{" "}в соответствии с 152-ФЗ
        </span>
      </label>
    </div>
  );

  const agreed = agreeTerms && agreePersonalData;

  return (
    <>
      {/* Поддержка */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setShowSupport(false)} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold">✕</button>
            {supportSent ? (
              <div className="text-center py-6 space-y-3"><div className="text-5xl">✅</div><p className="font-black text-[#1E1B4B] text-lg">Отправлено!</p><p className="text-sm text-gray-400">Ответим в течение рабочего дня</p></div>
            ) : (
              <>
                <h2 className="text-lg font-black text-[#1E1B4B] mb-1">💬 Техническая поддержка</h2>
                <p className="text-sm text-gray-400 mb-5">Отвечаем в течение рабочего дня</p>
                <form onSubmit={handleSupportSubmit} className="space-y-3">
                  <input required value={supportForm.name} onChange={e => setSupportForm(f => ({ ...f, name: e.target.value }))} placeholder="Ваше имя" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B7BFF]" />
                  <input required type="email" value={supportForm.email} onChange={e => setSupportForm(f => ({ ...f, email: e.target.value }))} placeholder="Email для ответа" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B7BFF]" />
                  <textarea required value={supportForm.message} onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))} placeholder="Опишите проблему" rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B7BFF] resize-none" />
                  <button type="submit" disabled={supportSending} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm disabled:opacity-60">{supportSending ? "Отправляем..." : "Отправить →"}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF] p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">

            <div className="text-center space-y-1">
              <div className="text-4xl">⭐</div>
              <h1 className="text-xl font-black text-[#1E1B4B]">СтарКидс</h1>
              <p className="text-xs text-gray-400">Вход и регистрация для родителей</p>
            </div>

            {/* ── Выбор метода ── */}
            {step === "choose" && (
              <div className="space-y-4">
                {/* Вкладки */}
                <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-2xl p-1">
                  {(["phone", "email", "telegram"] as AuthMethod[]).map(m => (
                    <button key={m} onClick={() => setAuthMethod(m)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${authMethod === m ? "bg-white shadow text-[#6B7BFF]" : "text-gray-400"}`}>
                      {m === "phone" ? "📱 Телефон" : m === "email" ? "📧 Email" : "✈️ Telegram"}
                    </button>
                  ))}
                </div>

                {authMethod === "phone" && (
                  <div className="space-y-4">
                    <Input type="tel" placeholder="+7 (999) 000-00-00" value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      onKeyDown={e => e.key === "Enter" && agreed && handlePhoneSubmit()}
                      className="text-center text-lg tracking-wide h-12" autoFocus />
                    <Agreements />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Button className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                      onClick={() => { setStep("phone"); handlePhoneSubmit(); }}
                      disabled={loading || phone.replace(/\D/g, "").length < 11 || !agreed}>
                      {loading ? "Проверяем..." : "Получить SMS-код →"}
                    </Button>
                  </div>
                )}

                {authMethod === "email" && (
                  <div className="space-y-4">
                    <Input type="email" placeholder="mail@example.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && agreed && handleEmailSubmit()}
                      className="text-center text-base h-12" autoFocus />
                    <Agreements />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Button className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                      onClick={() => { setStep("email"); handleEmailSubmit(); }}
                      disabled={loading || !email.includes("@") || !agreed}>
                      {loading ? "Отправляем..." : "Получить код на email →"}
                    </Button>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-amber-700 text-center">
                        ⚠️ При входе через email функции ограничены до подтверждения телефона или Telegram
                      </p>
                    </div>
                  </div>
                )}

                {authMethod === "telegram" && (
                  <div className="space-y-4 text-center">
                    <div className="bg-[#F0F4FF] rounded-2xl p-5 space-y-3">
                      <div className="text-4xl">✈️</div>
                      <p className="text-sm font-bold text-[#1E1B4B]">Войдите через Telegram-бота</p>
                      <p className="text-xs text-gray-500">Откройте бота и нажмите «Открыть СтарКидс» — вы войдёте автоматически</p>
                      <a href="https://t.me/parenttask_bot" target="_blank" rel="noreferrer"
                        className="block w-full py-3 rounded-xl bg-[#2AABEE] text-white font-bold text-sm active:scale-95 transition-transform">
                        Открыть @parenttask_bot
                      </a>
                    </div>
                    <p className="text-xs text-gray-400">Telegram-аккаунт — это полный доступ без ограничений</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PIN ── */}
            {step === "pin" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">Введите код-пароль для {phone}</p>
                {digitInputs(pin, setPinValue, pinRefs, handlePinLogin, 4)}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <Button className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                  onClick={() => handlePinLogin()} disabled={loading || pin.some(d => !d)}>
                  {loading ? "Входим..." : "Войти"}
                </Button>
                <button className="w-full text-sm text-[#6B7BFF] text-center" onClick={doSendOtp}>Забыли код-пароль? Войти по SMS</button>
                <button className="w-full text-sm text-gray-400 text-center" onClick={() => { setStep("choose"); setPinValue(["", "", "", ""]); setError(""); }}>← Назад</button>
              </div>
            )}

            {/* ── OTP (телефон) ── */}
            {step === "otp" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">Код отправлен на {phone}</p>
                {digitInputs(otp, setOtp, otpRefs, handleVerifyOtp, 6)}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <Button className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                  onClick={() => handleVerifyOtp()} disabled={loading || otp.some(d => !d)}>
                  {loading ? "Проверяем..." : "Подтвердить"}
                </Button>
                <button className="w-full text-sm text-center" onClick={handleResendPhone}
                  disabled={resendCountdown > 0}>
                  {resendCountdown > 0
                    ? <span className="text-gray-400">Повторить через {resendCountdown} с</span>
                    : <span className="text-[#6B7BFF]">Отправить повторно</span>}
                </button>
                <button className="w-full text-sm text-gray-400 text-center" onClick={() => { setStep("choose"); setError(""); }}>← Назад</button>
              </div>
            )}

            {/* ── Email OTP ── */}
            {step === "email_otp" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">Код отправлен на <b>{email}</b></p>
                {digitInputs(otp, setOtp, otpRefs, handleVerifyEmailOtp, 6)}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <Button className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                  onClick={() => handleVerifyEmailOtp()} disabled={loading || otp.some(d => !d)}>
                  {loading ? "Проверяем..." : "Подтвердить"}
                </Button>
                {isNewEmail && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 text-center">
                    ⚠️ Новый аккаунт. Часть функций будет недоступна до подтверждения через телефон или Telegram
                  </div>
                )}
                <button className="w-full text-sm text-center" onClick={handleResendEmail} disabled={resendCountdown > 0}>
                  {resendCountdown > 0
                    ? <span className="text-gray-400">Повторить через {resendCountdown} с</span>
                    : <span className="text-[#6B7BFF]">Отправить повторно</span>}
                </button>
                <button className="w-full text-sm text-gray-400 text-center" onClick={() => { setStep("choose"); setOtp(["", "", "", "", "", ""]); setError(""); }}>← Назад</button>
              </div>
            )}

            {/* ── Имя ── */}
            {step === "name" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">Как вас зовут?</p>
                <Input placeholder="Ваше имя" value={fullName} onChange={e => setFullName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveName()}
                  className="text-center text-lg h-12" autoFocus />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <Button className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                  onClick={handleSaveName} disabled={loading || !fullName.trim()}>
                  {loading ? "Сохраняем..." : "Далее →"}
                </Button>
                <button className="w-full text-xs text-gray-400 text-center" onClick={() => { setStep("choose"); setError(""); }}>← Начать заново</button>
              </div>
            )}

            {/* ── PIN установка ── */}
            {step === "set_pin" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">
                  {pinStep === "enter" ? "Придумайте код-пароль для быстрого входа" : "Повторите код-пароль"}
                </p>
                <p className="text-xs text-gray-400 text-center">4 цифры — чтобы не вводить код каждый раз</p>
                {pinStep === "enter"
                  ? digitInputs(newPin, setNewPin, newPinRefs, handleNewPinComplete, 4)
                  : digitInputs(confirmPin, setConfirmPin, confirmPinRefs, handleConfirmPinComplete, 4)}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {pinStep === "confirm" && (
                  <Button className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
                    onClick={() => handleConfirmPinComplete(confirmPin.join(""))}
                    disabled={loading || confirmPin.some(d => !d)}>
                    {loading ? "Сохраняем..." : "Установить код-пароль"}
                  </Button>
                )}
                <button className="w-full text-xs text-gray-400 text-center py-1" onClick={onSuccess}>Пропустить</button>
              </div>
            )}

          </div>

          <button onClick={() => setShowSupport(true)} className="w-full text-sm text-gray-400 text-center py-2 hover:text-[#6B7BFF] transition-colors flex items-center justify-center gap-1.5">
            <span className="relative inline-flex">
              💬
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white" />
            </span>
            Техническая поддержка
          </button>
        </div>
      </div>

      {showMerge && (
        <MergeAccountModal phone={phone} sessionToken={sessionToken}
          onMerged={() => { setShowMerge(false); onSuccess(); }}
          onSkip={() => { setShowMerge(false); onSuccess(); }} />
      )}
    </>
  );
}