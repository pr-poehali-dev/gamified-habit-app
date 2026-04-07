import { useState, useEffect, useCallback } from "react";
import { apiCall } from "@/components/miniapp/useApi";
import { tg } from "@/components/miniapp/types";
import { getLevelEmoji } from "@/lib/gameTypes";

type FriendInfo = {
  id: number;
  name: string;
  avatar: string;
  stars: number;
  totalStarsEarned: number;
  level: number;
  tasksDone: number;
  age?: number;
};

type IncomingRequest = {
  requestId: number;
  childId: number;
  name: string;
  avatar: string;
  age: number;
};

type OutgoingRequest = {
  requestId: number;
  childId: number;
  name: string;
  avatar: string;
};

type FriendsData = {
  friendCode: string;
  me: FriendInfo;
  friends: FriendInfo[];
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
};

export function ChildTabFriends() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const res = await apiCall("child/friends/list", {});
    if (res.ok) {
      setData(res as unknown as FriendsData);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addFriend = async () => {
    if (!code.trim() || sending) return;
    setSending(true);
    const res = await apiCall("child/friends/add", { friend_code: code.trim() });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast("📨 Запрос отправлен!");
      setCode("");
      load();
    } else {
      const errMap: Record<string, string> = {
        invalid_code: "Код не найден",
        self_add: "Это твой код",
        already_friends: "Вы уже друзья",
        already_sent: "Запрос уже отправлен",
      };
      showToast("❌ " + (errMap[res.error as string] || "Ошибка"));
    }
    setSending(false);
  };

  const acceptRequest = async (requestId: number) => {
    const res = await apiCall("child/friends/accept", { request_id: requestId });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast("🤝 Друг добавлен!");
      load();
    }
  };

  const rejectRequest = async (requestId: number) => {
    const res = await apiCall("child/friends/reject", { request_id: requestId });
    if (res.ok) {
      showToast("Заявка отклонена");
      load();
    }
  };

  const removeFriend = async (friendId: number) => {
    const res = await apiCall("child/friends/remove", { friend_id: friendId });
    if (res.ok) {
      showToast("Друг удалён");
      setConfirmRemove(null);
      load();
    }
  };

  const BOT_LINK = "https://t.me/task4kids_bot";

  const copyCode = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.friendCode);
    tg()?.HapticFeedback?.notificationOccurred("success");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!data) return;
    const text = `Добавь меня в друзья в СтарКидс! 🌟\n\nМой код: ${data.friendCode}\n\n👉 Открой бота: ${BOT_LINK}\n→ Нажми «Открыть СтарКидс»\n→ Перейди в «Друзья»\n→ Введи мой код`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch (_) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      tg()?.HapticFeedback?.notificationOccurred("success");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const allParticipants = [data.me, ...data.friends].sort((a, b) => b.totalStarsEarned - a.totalStarsEarned);
  const hasFriends = data.friends.length > 0;

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#2D1B69] text-white rounded-2xl px-4 py-3 text-sm font-bold shadow-xl text-center" style={{ animation: "slideDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* Incoming requests */}
      {data.incoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-bold text-[#2D1B69]">📬 Заявки в друзья</h3>
            <span className="bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{data.incoming.length}</span>
          </div>
          <div className="space-y-2">
            {data.incoming.map(req => (
              <div key={req.requestId} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 flex items-center gap-3">
                <span className="text-3xl">{req.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2D1B69] text-sm">{req.name}</p>
                  <p className="text-xs text-gray-400">{req.age} лет</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => rejectRequest(req.requestId)} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold active:scale-95 transition-transform">✕</button>
                  <button onClick={() => acceptRequest(req.requestId)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white text-xs font-bold active:scale-95 transition-transform">✓ Принять</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {hasFriends ? (
        <div>
          <h3 className="text-base font-bold text-[#2D1B69] mb-2">🏆 Рейтинг друзей</h3>
          <div className="space-y-2">
            {allParticipants.map((p, idx) => {
              const isMe = p.id === data.me.id;
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;
              return (
                <div key={p.id} className={`rounded-2xl p-4 shadow-sm flex items-center gap-3 ${isMe ? "bg-gradient-to-r from-[#FFF0F5] to-[#F0EEFF] border-2 border-[#FF6B9D]/30" : "bg-white border border-gray-100"}`}>
                  <div className="w-8 text-center">
                    <span className={`text-lg font-black ${idx < 3 ? "" : "text-gray-400 text-sm"}`}>{medal}</span>
                  </div>
                  <span className="text-3xl">{p.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-[#2D1B69] text-sm truncate">{p.name}</p>
                      {isMe && <span className="bg-[#FF6B9D] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">ТЫ</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{getLevelEmoji(p.level)} Ур. {p.level}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">✅ {p.tasksDone} задач</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-amber-500">{p.totalStarsEarned}</p>
                    <p className="text-[10px] text-gray-400 font-bold">звёзд ⭐</p>
                  </div>
                  {!isMe && (
                    <div className="shrink-0">
                      {confirmRemove === p.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => setConfirmRemove(null)} className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 text-gray-500 font-bold">Нет</button>
                          <button onClick={() => removeFriend(p.id)} className="text-[10px] px-2 py-1 rounded-lg bg-red-500 text-white font-bold">Да</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemove(p.id)} className="text-gray-300 text-sm active:scale-90 transition-transform">✕</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF] rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-black text-[#2D1B69] mb-2">Пока нет друзей</h3>
          <p className="text-sm text-gray-500 mb-1">Добавь друга по коду и соревнуйтесь</p>
          <p className="text-sm text-gray-500">кто соберёт больше звёзд!</p>
        </div>
      )}

      {/* My code */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wide">Твой код для друзей</p>
        <button
          onClick={copyCode}
          className="w-full bg-gradient-to-r from-[#F0EEFF] to-[#FFF0F5] rounded-xl px-4 py-4 text-center active:scale-[0.98] transition-transform relative"
        >
          <span className="text-2xl font-black text-[#2D1B69] tracking-[0.3em]">{data.friendCode}</span>
          <span className={`absolute top-2 right-3 text-xs font-bold transition-all ${copied ? "text-green-500" : "text-gray-400"}`}>
            {copied ? "✓ Скопировано" : "Нажми, чтобы скопировать"}
          </span>
        </button>
        <div className="bg-[#F8F7FF] rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-bold text-[#2D1B69]">📋 Как добавить друга:</p>
          <p className="text-[11px] text-gray-500">1. Отправь свой код другу</p>
          <p className="text-[11px] text-gray-500">2. Друг открывает <b>@task4kids_bot</b> в Telegram</p>
          <p className="text-[11px] text-gray-500">3. Нажимает «Открыть СтарКидс» → «Друзья»</p>
          <p className="text-[11px] text-gray-500">4. Вводит твой код — и вы друзья!</p>
        </div>
        <button
          onClick={shareCode}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span>📤</span> Отправить код другу
        </button>
      </div>

      {/* Add friend */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wide">У тебя есть код от друга?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Введи код друга"
            maxLength={10}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2D1B69] bg-gray-50 placeholder:text-gray-300 uppercase tracking-widest text-center"
          />
          <button
            onClick={addFriend}
            disabled={!code.trim() || sending}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 shrink-0"
          >
            {sending ? "⏳" : "➕"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center">Введи код, который тебе прислал друг, и нажми ➕</p>
      </div>

      {/* Outgoing requests */}
      {data.outgoing.length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Отправленные заявки</p>
          <div className="space-y-2">
            {data.outgoing.map(req => (
              <div key={req.requestId} className="bg-white/80 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-2xl">{req.avatar}</span>
                <p className="flex-1 font-bold text-gray-500 text-sm">{req.name}</p>
                <span className="text-xs text-gray-400 font-bold">⏳ ждём</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChildTabFriends;