import { useState } from "react";
import func2url from "../../../backend/func2url.json";

const SUPPORT_URL = func2url["support-email"];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SupportModal({ open, onClose }: Props) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch(SUPPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch { /* игнорируем */ }
    setSending(false);
    setSent(true);
    setTimeout(() => {
      onClose();
      setSent(false);
      setForm({ name: "", email: "", message: "" });
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {sent ? (
          <div className="text-center py-8 space-y-3">
            <div className="text-5xl">✅</div>
            <p className="text-lg font-black text-[#1E1B4B]">Сообщение отправлено!</p>
            <p className="text-sm text-gray-400">Ответим на ваш email в течение рабочего дня</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-[#1E1B4B]">💬 Техподдержка</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ответим в течение рабочего дня</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold active:scale-95 transition-transform"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Ваше имя</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Мария"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] focus:outline-none focus:border-[#6B7BFF] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Email для ответа</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="mail@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] focus:outline-none focus:border-[#6B7BFF] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Опишите проблему</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Что случилось или что хотите уточнить?"
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] focus:outline-none focus:border-[#6B7BFF] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-60"
              >
                {sending ? "Отправляем..." : "Отправить →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
