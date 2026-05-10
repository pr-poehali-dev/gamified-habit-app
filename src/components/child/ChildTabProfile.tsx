import { useState } from "react";
import { XpBar } from "@/components/ui/XpBar";
import { AchievementGrid } from "@/components/ui/AchievementBadge";
import PushNotificationToggle from "@/components/pwa/PushNotificationToggle";
import type { AchievementId } from "@/lib/gameTypes";

const isChildPwaMode = () => {
  const d = window.Telegram?.WebApp?.initData;
  return !(typeof d === "string" && d.length > 0);
};

type ProfileProps = {
  name: string; avatar: string; age: number;
  stars: number; totalStarsEarned: number; level: number; levelEmoji: string;
  approvedTasksCount: number; achievements: AchievementId[];
  childId?: number;
  notificationsEnabled?: boolean;
  notificationSettings?: { reminders: boolean; motivation: boolean };
  onToggleNotifications?: (enabled: boolean, settings?: { reminders: boolean; motivation: boolean }) => void;
};

export function ChildTabProfile({ name, avatar, age, stars, totalStarsEarned, level, levelEmoji, approvedTasksCount, achievements, childId, notificationsEnabled = true, notificationSettings, onToggleNotifications }: ProfileProps) {
  const earned = totalStarsEarned ?? stars;
  const [showAchievements, setShowAchievements] = useState(false);
  return (
    <>
      <div className="bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B] rounded-3xl p-6 text-center text-white shadow-lg">
        <div className="text-6xl mb-2">{avatar}</div>
        <h2 className="text-2xl font-black">{name}</h2>
        <p className="opacity-80 font-bold">{age} лет</p>
        <div className="mt-3 flex items-center justify-center gap-2 bg-white/20 rounded-2xl px-4 py-2">
          <span className="text-xl">{levelEmoji}</span>
          <span className="font-black text-lg">Уровень {level}</span>
        </div>
      </div>
      <div className="bg-white/80 rounded-2xl px-4 py-3 shadow-sm">
        <XpBar stars={earned} showTierHint />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Звёзд", value: stars, emoji: "⭐" },
          { label: "Уровень", value: level, emoji: levelEmoji },
          { label: "Задач выполнено", value: approvedTasksCount, emoji: "✅" },
          { label: "Ачивок", value: `${achievements.length}/16`, emoji: "🏅" },
        ].map(s => (
          <div key={s.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
            <div className="text-3xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-black text-[#2D1B69]">{s.value}</div>
            <div className="text-xs font-bold text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div>
        <button
          onClick={() => setShowAchievements(v => !v)}
          className="w-full flex items-center justify-between bg-gradient-to-r from-[#FFF0F5] to-[#F0EEFF] rounded-2xl p-4 border border-[#FF6B9D]/20 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏅</span>
            <div className="text-left">
              <p className="font-black text-[#2D1B69] text-sm">Мои ачивки</p>
              <p className="text-xs text-gray-500">{achievements.length} из 16 открыто</p>
            </div>
          </div>
          <span className={`text-gray-400 text-lg transition-transform ${showAchievements ? "rotate-180" : ""}`}>▼</span>
        </button>
        {showAchievements && (
          <div className="mt-3">
            <AchievementGrid unlockedIds={achievements} />
          </div>
        )}
      </div>
      {/* Push-уведомления — только PWA */}
      {isChildPwaMode() && <PushNotificationToggle childId={childId} autoSubscribe />}

      {/* Notifications settings — только в Telegram */}
      {!isChildPwaMode() && <div className="bg-white/90 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-bold text-[#2D1B69] text-sm">Уведомления Telegram</p>
              <p className="text-xs text-gray-400">Что получать в Telegram</p>
            </div>
          </div>
          <button
            onClick={() => onToggleNotifications?.(!notificationsEnabled)}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${notificationsEnabled ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B]" : "bg-gray-300"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${notificationsEnabled ? "left-6" : "left-1"}`} />
          </button>
        </div>
        {notificationsEnabled && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm">📋</span>
                <div>
                  <p className="text-xs font-bold text-[#2D1B69]">Важные</p>
                  <p className="text-[10px] text-gray-400">Новые задания, подтверждения</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Всегда вкл</span>
            </div>
            {[
              { key: "reminders" as const, icon: "⏰", title: "Напоминания", desc: "Дедлайны, друзья, неактивность" },
              { key: "motivation" as const, icon: "🎯", title: "Мотивация", desc: "Награды, почти новый уровень" },
            ].map(cat => (
              <div key={cat.key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-[#2D1B69]">{cat.title}</p>
                    <p className="text-[10px] text-gray-400">{cat.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = { ...notificationSettings, [cat.key]: !notificationSettings?.[cat.key] };
                    onToggleNotifications?.(true, next);
                  }}
                  className={`w-10 h-6 rounded-full transition-all duration-300 relative ${notificationSettings?.[cat.key] !== false ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B]" : "bg-gray-300"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${notificationSettings?.[cat.key] !== false ? "left-5" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>}
    </>
  );
}
