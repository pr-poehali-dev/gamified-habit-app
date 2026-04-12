import { useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { useRobokassa, openPaymentPage, isValidEmail } from "@/components/extensions/robokassa/useRobokassa";
import func2url from "../../../backend/func2url.json";

const ROBOKASSA_URL = func2url["robokassa-robokassa"];
const SUBSCRIPTION_PRICE = 299;

type SubscribeBlockProps = {
  email: string;
  emailError: string;
  showEmailForm: boolean;
  isLoading: boolean;
  onEmailChange: (v: string) => void;
  onSubscribeClick: () => void;
  onPayment: () => void;
  onBack: () => void;
};

const SubscribeBlock = memo(function SubscribeBlock({
  email, emailError, showEmailForm, isLoading,
  onEmailChange, onSubscribeClick, onPayment, onBack,
}: SubscribeBlockProps) {
  return (
    <div className="space-y-3">
      {!showEmailForm ? (
        <button
          onClick={onSubscribeClick}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-lg active:scale-95 transition-transform"
        >
          Оформить подписку — {SUBSCRIPTION_PRICE} ₽/мес
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center">Введите email для чека об оплате</p>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="example@mail.ru"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-[#6B7BFF] transition-colors"
            autoFocus
            autoComplete="email"
          />
          {emailError ? <p className="text-xs text-red-500 text-center">{emailError}</p> : null}
          <button
            onClick={onPayment}
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            {isLoading ? "Создаём платёж..." : `Оплатить ${SUBSCRIPTION_PRICE} ₽`}
          </button>
          <button onClick={onBack} className="w-full py-2 text-gray-400 text-xs">
            Назад
          </button>
        </div>
      )}
      <p className="text-[10px] text-gray-400 text-center">
        Оплата через Robokassa · Возврат в течение 3 дней
      </p>
    </div>
  );
});

type Props = {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
  isPremiumPaid: boolean;
  trialActive: boolean;
  trialDaysLeft: number;
  trialUsed: boolean;
  onActivateTrial: () => Promise<void>;
  parentName: string;
  parentTelegramId?: number;
  parentId?: number;
};

export function PremiumModal({ open, onClose, isPremium, isPremiumPaid, trialActive, trialDaysLeft, trialUsed, onActivateTrial, parentName, parentTelegramId, parentId }: Props) {
  const [activating, setActivating] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const { createPayment, isLoading } = useRobokassa({
    apiUrl: ROBOKASSA_URL,
    onError: (err) => setEmailError(`Ошибка: ${err.message}`),
  });

  const handleActivate = useCallback(async () => {
    setActivating(true);
    await onActivateTrial();
    setActivating(false);
  }, [onActivateTrial]);

  const handleSubscribeClick = useCallback(() => {
    setShowEmailForm(true);
    setEmailError("");
  }, []);

  const handleBack = useCallback(() => {
    setShowEmailForm(false);
  }, []);

  const handleEmailChange = useCallback((v: string) => {
    setEmail(v);
    setEmailError("");
  }, []);

  const handlePayment = useCallback(async () => {
    if (!isValidEmail(email)) {
      setEmailError("Введите корректный email");
      return;
    }
    setEmailError("");

    const data = await createPayment({
      amount: SUBSCRIPTION_PRICE,
      userName: parentName,
      userEmail: email,
      userPhone: "",
      orderComment: "Premium-подписка СтарКидс на 1 месяц",
      cartItems: [
        {
          id: "premium_monthly",
          name: "Premium-подписка СтарКидс (1 месяц)",
          price: SUBSCRIPTION_PRICE,
          quantity: 1,
        },
      ],
      ...(parentTelegramId ? { parent_telegram_id: parentTelegramId } : {}),
      ...(parentId ? { parent_id: parentId } : {}),
      successUrl: "https://tasks4kids.ru/payment-success",
      failUrl: "https://tasks4kids.ru/app",
    });

    if (data?.payment_url) {
      openPaymentPage(data.payment_url);
      onClose();
    }
  }, [email, parentName, parentTelegramId, createPayment, onClose]);

  const features = [
    { emoji: "📸", title: "Фото-задачи", desc: "Требуйте фотоотчёт о выполнении" },
    { emoji: "👨‍👩‍👧‍👦", title: "Несколько детей", desc: "Добавляйте больше одного ребёнка" },
    { emoji: "📊", title: "Аналитика", desc: "Детальная статистика по каждому ребёнку" },
  ];

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="bg-gradient-to-br from-[#6B7BFF] via-[#9B6BFF] to-[#C46BFF] px-6 py-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm active:scale-90 transition-transform">
            ✕
          </button>
          <div className="text-5xl mb-3">👑</div>
          <h2 className="text-white font-black text-2xl">Premium</h2>
          {trialActive && (
            <div className="mt-2 bg-white/20 rounded-2xl px-4 py-2 inline-block">
              <p className="text-white font-bold text-sm">
                Пробный период: {trialDaysLeft} {trialDaysLeft === 1 ? "день" : trialDaysLeft < 5 ? "дня" : "дней"}
              </p>
            </div>
          )}
          {isPremiumPaid && (
            <div className="mt-2 bg-white/20 rounded-2xl px-4 py-2 inline-block">
              <p className="text-white font-bold text-sm">Активен</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {features.map(f => (
              <div key={f.title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="font-bold text-[#1E1B4B] text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
                {isPremium && <span className="ml-auto text-green-500 font-black text-sm">✓</span>}
              </div>
            ))}
          </div>

          {!isPremium && !trialUsed && (
            <div className="space-y-3">
              <button
                onClick={handleActivate}
                disabled={activating}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50">
                {activating ? "Активация..." : "🎁 Попробовать 7 дней бесплатно"}
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                После пробного периода — {SUBSCRIPTION_PRICE} ₽/мес
              </p>
            </div>
          )}

          {!isPremium && trialUsed && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-700 font-bold text-sm">Пробный период завершён</p>
                <p className="text-amber-600 text-xs mt-1">Оформите подписку для доступа к Premium-функциям</p>
              </div>
              <SubscribeBlock
                email={email} emailError={emailError} showEmailForm={showEmailForm}
                isLoading={isLoading} onEmailChange={handleEmailChange}
                onSubscribeClick={handleSubscribeClick} onPayment={handlePayment} onBack={handleBack}
              />
            </div>
          )}

          {isPremium && !isPremiumPaid && trialActive && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                <p className="text-blue-700 font-bold text-sm">Пробный период истекает через {trialDaysLeft} {trialDaysLeft === 1 ? "день" : trialDaysLeft < 5 ? "дня" : "дней"}</p>
                <p className="text-blue-600 text-xs mt-1">Оформите подписку, чтобы не потерять доступ</p>
              </div>
              <SubscribeBlock
                email={email} emailError={emailError} showEmailForm={showEmailForm}
                isLoading={isLoading} onEmailChange={handleEmailChange}
                onSubscribeClick={handleSubscribeClick} onPayment={handlePayment} onBack={handleBack}
              />
            </div>
          )}

          {isPremiumPaid && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-green-700 font-bold text-sm">Premium активен</p>
              <p className="text-green-600 text-xs mt-1">Все функции доступны</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PremiumModal;