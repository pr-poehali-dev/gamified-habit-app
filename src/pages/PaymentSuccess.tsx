import { useEffect } from "react";

const APP_URL = "/app";

export default function PaymentSuccess() {
  useEffect(() => {
    setTimeout(() => {
      window.location.href = APP_URL;
    }, 3000);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF] px-6 text-center"
      style={{ fontFamily: "Golos Text, sans-serif" }}
    >
      <div className="text-7xl mb-6" style={{ animation: "bounceIn 0.5s ease" }}>
        🎉
      </div>
      <h1 className="text-2xl font-black text-[#1E1B4B] mb-3">Оплата прошла!</h1>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        Premium-подписка активирована.<br />Возвращаемся в приложение...
      </p>

      <a
        href={APP_URL}
        className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-base shadow-lg active:scale-95 transition-transform text-center block"
      >
        Открыть СтарКидс 👑
      </a>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
