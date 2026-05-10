import { useState, useEffect, useCallback } from "react";

type Screen = "parent_tasks" | "parent_grades" | "child_tasks" | "child_shop" | "child_profile";

const ALL_SCREENS: Screen[] = ["parent_tasks", "parent_grades", "child_tasks", "child_shop", "child_profile"];

const SCREEN_META: Record<Screen, { label: string; emoji: string; who: "parent" | "child"; desc: string }> = {
  parent_tasks:  { label: "Задания",   emoji: "📋", who: "parent", desc: "Создавай задания и подтверждай выполнение" },
  parent_grades: { label: "Оценки",    emoji: "📝", who: "parent", desc: "Контролируй успеваемость в школе" },
  child_tasks:   { label: "Мои задачи",emoji: "✅", who: "child",  desc: "Ребёнок видит задания и отмечает выполнение" },
  child_shop:    { label: "Магазин",   emoji: "🛍️", who: "child",  desc: "Обменивает накопленные звёзды на призы" },
  child_profile: { label: "Профиль",   emoji: "🏆", who: "child",  desc: "Уровень, достижения и прогресс" },
};

// ─── Phone shell ────────────────────────────────────────────────────────────
function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 270,
      flexShrink: 0,
      background: "#e2e8f0",
      borderRadius: 44,
      padding: 4,
      boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
      position: "relative",
    }}>
      {/* Side buttons */}
      <div style={{ position: "absolute", left: -3, top: 80, width: 3, height: 32, background: "#c8d0da", borderRadius: "3px 0 0 3px" }} />
      <div style={{ position: "absolute", left: -3, top: 122, width: 3, height: 52, background: "#c8d0da", borderRadius: "3px 0 0 3px" }} />
      <div style={{ position: "absolute", left: -3, top: 184, width: 3, height: 52, background: "#c8d0da", borderRadius: "3px 0 0 3px" }} />
      <div style={{ position: "absolute", right: -3, top: 120, width: 3, height: 70, background: "#c8d0da", borderRadius: "0 3px 3px 0" }} />

      <div style={{
        background: "#f8f9ff",
        borderRadius: 40,
        overflow: "hidden",
        height: 560,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        {/* Status bar */}
        <div style={{ background: "#f8f9ff", padding: "10px 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
          <div style={{ width: 90, height: 22, background: "#1E1B4B", borderRadius: 99, position: "absolute", left: "50%", transform: "translateX(-50%)" }} />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10 }}>●●●</span>
            <span style={{ fontSize: 10 }}>📶</span>
            <span style={{ fontSize: 10 }}>🔋</span>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function ScreenParentTasks() {
  return (
    <div style={{ background: "linear-gradient(180deg, #F0F4FF 0%, #F8F9FF 100%)", minHeight: "100%", fontFamily: "Golos Text, sans-serif" }}>
      <div style={{ padding: "12px 14px 8px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 1 }}>Добро пожаловать</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#1E1B4B" }}>Мария</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 700, color: "#ea580c" }}>🔥 5</div>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👩</div>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "8px 10px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 5 }}>
            <span>⚡ Уровень 3 · Опытный</span><span>240 XP</span>
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg,#6B7BFF,#9B6BFF)", borderRadius: 99 }} />
          </div>
        </div>

        {/* Pending */}
        <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>⏳ Ждут подтверждения</div>
        <div style={{ background: "#fff8f1", border: "1px solid #fed7aa", borderRadius: 14, padding: "9px 11px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1E1B4B", marginBottom: 1 }}>🧹 Убраться в комнате</div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>Катя · сегодня · +3⭐</div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "5px 8px", fontSize: 11, fontWeight: 800, color: "#16a34a" }}>✓</div>
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "5px 8px", fontSize: 11, fontWeight: 800, color: "#dc2626" }}>✗</div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>📋 Активные задания</div>
        {[
          { emoji: "📚", title: "Домашнее задание", stars: 4, color: "#ede9fe", border: "#c4b5fd" },
          { emoji: "🦷", title: "Почистить зубы",   stars: 1, color: "#e0f2fe", border: "#7dd3fc" },
          { emoji: "🐕", title: "Погулять с собакой", stars: 3, color: "#fef9c3", border: "#fde047" },
        ].map((t, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12, padding: "8px 10px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 30, height: 30, background: t.color, border: `1px solid ${t.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{t.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B" }}>{t.title}</div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>Катя</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706" }}>+{t.stars}⭐</div>
          </div>
        ))}

        <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 14, padding: "11px", textAlign: "center", fontSize: 12, fontWeight: 800, color: "#fff", marginTop: 4, boxShadow: "0 4px 14px rgba(107,123,255,0.3)" }}>
          + Добавить задание
        </div>
      </div>
    </div>
  );
}

function ScreenParentGrades() {
  return (
    <div style={{ background: "linear-gradient(180deg,#F0F4FF,#F8F9FF)", minHeight: "100%", fontFamily: "Golos Text, sans-serif" }}>
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#1E1B4B", marginBottom: 12 }}>📝 Оценки</div>

        <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Ждут подтверждения</div>
        {[
          { subject: "Математика", grade: 5, stars: 5, color: "#dcfce7", fg: "#16a34a" },
          { subject: "Русский язык", grade: 4, stars: 4, color: "#dbeafe", fg: "#2563eb" },
        ].map((g, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 14, padding: "10px 11px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1E1B4B" }}>{g.subject}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>Катя · сегодня</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: g.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: g.fg }}>{g.grade}</div>
            </div>
            <div style={{ fontSize: 10, color: "#d97706", fontWeight: 600, marginBottom: 7 }}>Начислить {g.stars}⭐ за оценку</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "5px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#16a34a" }}>✓ Подтвердить</div>
              <div style={{ flex: 1, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "5px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#dc2626" }}>✗ Отклонить</div>
            </div>
          </div>
        ))}

        <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, marginTop: 4 }}>История</div>
        {[
          { subject: "Физика", grade: 3, stars: 3, fg: "#d97706", bg: "#fef9c3" },
          { subject: "История", grade: 5, stars: 5, fg: "#16a34a", bg: "#dcfce7" },
          { subject: "Химия",  grade: 4, stars: 4, fg: "#2563eb", bg: "#dbeafe" },
        ].map((g, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{g.subject}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>+{g.stars}⭐</div>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: g.fg }}>{g.grade}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenChildTasks() {
  return (
    <div style={{ background: "linear-gradient(180deg,#F0F4FF,#F8F9FF)", minHeight: "100%", fontFamily: "Golos Text, sans-serif" }}>
      <div style={{ padding: "12px 14px 8px" }}>
        {/* Child header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🦋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#1E1B4B" }}>Катя</div>
            <div style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>42⭐ · Уровень 4 🥈</div>
          </div>
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 800, color: "#ea580c" }}>🔥 5</div>
        </div>

        {/* Progress */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "8px 10px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 5 }}>
            <span>До уровня 5 🥇</span><span>42/50 ⭐</span>
          </div>
          <div style={{ height: 8, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg,#6B7BFF,#f59e0b)", borderRadius: 99 }} />
          </div>
        </div>

        <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Мои задания</div>
        {[
          { emoji: "🧹", title: "Убраться в комнате", stars: 3, deadline: "до 20:00", done: false, bg: "#ede9fe", border: "#c4b5fd" },
          { emoji: "📚", title: "Домашнее задание",   stars: 4, deadline: "до 22:00", done: false, bg: "#fce7f3", border: "#f9a8d4" },
          { emoji: "🦷", title: "Почистить зубы",     stars: 1, deadline: "",         done: true,  bg: "#dcfce7", border: "#86efac" },
          { emoji: "🌸", title: "Полить цветы",        stars: 2, deadline: "завтра",   done: false, bg: "#fef9c3", border: "#fde047" },
        ].map((t, i) => (
          <div key={i} style={{
            background: t.done ? "#f0fdf4" : "#fff",
            border: `1px solid ${t.done ? "#bbf7d0" : "#f3f4f6"}`,
            borderRadius: 12, padding: "8px 10px", marginBottom: 6,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            opacity: t.done ? 0.7 : 1,
          }}>
            <div style={{ width: 30, height: 30, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{t.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
              {t.deadline && <div style={{ fontSize: 9, color: "#9ca3af" }}>⏰ {t.deadline}</div>}
            </div>
            {t.done
              ? <div style={{ fontSize: 16 }}>✅</div>
              : <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 8, padding: "4px 7px", fontSize: 9, fontWeight: 800, color: "#fff" }}>+{t.stars}⭐</div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenChildShop() {
  return (
    <div style={{ background: "linear-gradient(180deg,#F0F4FF,#F8F9FF)", minHeight: "100%", fontFamily: "Golos Text, sans-serif" }}>
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#1E1B4B" }}>🛍️ Магазин</div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "4px 10px", fontSize: 13, fontWeight: 800, color: "#d97706" }}>42 ⭐</div>
        </div>

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "8px 10px", marginBottom: 12, fontSize: 10, color: "#0369a1", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🎁</span>
          <span style={{ fontWeight: 600 }}>Добавь желание — родители увидят что подарить!</span>
        </div>

        <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Доступные призы</div>
        {[
          { emoji: "🎮", title: "+1 час игры",       cost: 10, can: true },
          { emoji: "🍦", title: "Мороженое",          cost: 8,  can: true },
          { emoji: "🍕", title: "Пицца на ужин",     cost: 15, can: true },
          { emoji: "🎬", title: "Поход в кино",       cost: 30, can: true },
          { emoji: "🎯", title: "Новая игра",         cost: 80, can: false },
          { emoji: "🏖️", title: "Поездка на море",   cost: 200, can: false },
        ].map((r, i) => (
          <div key={i} style={{
            background: "#fff",
            border: "1px solid #f3f4f6",
            borderRadius: 12, padding: "8px 10px", marginBottom: 6,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            opacity: r.can ? 1 : 0.45,
          }}>
            <div style={{ width: 32, height: 32, background: "#f3f4f6", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{r.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1E1B4B" }}>{r.title}</div>
              <div style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>{r.cost} ⭐</div>
            </div>
            <div style={{
              background: r.can ? "linear-gradient(135deg,#6B7BFF,#9B6BFF)" : "#e5e7eb",
              borderRadius: 8, padding: "5px 9px", fontSize: 9, fontWeight: 800,
              color: r.can ? "#fff" : "#9ca3af",
            }}>{r.can ? "Купить" : "🔒"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenChildProfile() {
  const achievements = [
    { emoji: "⭐", title: "Первая звезда",  done: true },
    { emoji: "🔥", title: "Серия 3 дня",   done: true },
    { emoji: "📋", title: "5 заданий",     done: true },
    { emoji: "💰", title: "50 звёзд",      done: true },
    { emoji: "🛍️", title: "1-я покупка",  done: true },
    { emoji: "🔥", title: "Серия 7 дней",  done: false },
    { emoji: "📋", title: "10 заданий",    done: false },
    { emoji: "💎", title: "100 звёзд",     done: false },
  ];
  return (
    <div style={{ background: "linear-gradient(180deg,#F0F4FF,#F8F9FF)", minHeight: "100%", fontFamily: "Golos Text, sans-serif" }}>
      <div style={{ padding: "12px 14px 8px" }}>
        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 7px", boxShadow: "0 6px 20px rgba(107,123,255,0.35)" }}>🦋</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#1E1B4B" }}>Катя</div>
          <div style={{ fontSize: 11, color: "#6B7BFF", fontWeight: 700 }}>Уровень 4 · Серебро 🥈</div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>42 ⭐ заработано всего</div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[["12", "заданий"], ["42⭐", "звёзд"], ["🔥5", "серия"]].map(([v, l], i) => (
            <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "8px 4px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#1E1B4B" }}>{v}</div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "8px 10px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>
            <span>До уровня 5 🥇</span><span>42/50 ⭐</span>
          </div>
          <div style={{ height: 7, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg,#6B7BFF,#9B6BFF)", borderRadius: 99 }} />
          </div>
        </div>

        {/* Achievements */}
        <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Достижения</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
          {achievements.map((a, i) => (
            <div key={i} style={{
              background: a.done ? "#ede9fe" : "#f9fafb",
              border: `1px solid ${a.done ? "#c4b5fd" : "#e5e7eb"}`,
              borderRadius: 10, padding: "7px 3px", textAlign: "center",
              opacity: a.done ? 1 : 0.45,
            }}>
              <div style={{ fontSize: 17 }}>{a.emoji}</div>
              <div style={{ fontSize: 7, color: a.done ? "#7c3aed" : "#9ca3af", marginTop: 2, lineHeight: 1.2, fontWeight: 600 }}>{a.title}</div>
            </div>
          ))}
        </div>

        {/* Friend code */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "8px 10px", marginTop: 10, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>Мой код для друзей</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#d97706", letterSpacing: "0.15em" }}>STAR-42</div>
        </div>
      </div>
    </div>
  );
}

function ScreenContent({ screen }: { screen: Screen }) {
  switch (screen) {
    case "parent_tasks":  return <ScreenParentTasks />;
    case "parent_grades": return <ScreenParentGrades />;
    case "child_tasks":   return <ScreenChildTasks />;
    case "child_shop":    return <ScreenChildShop />;
    case "child_profile": return <ScreenChildProfile />;
  }
}

// ─── Bottom nav inside phone ─────────────────────────────────────────────────
const PARENT_TABS: Screen[] = ["parent_tasks", "parent_grades"];
const CHILD_TABS: Screen[]  = ["child_tasks", "child_shop", "child_profile"];

function BottomNav({ screen, onChange, who }: { screen: Screen; onChange: (s: Screen) => void; who: "parent" | "child" }) {
  const tabs = (who === "parent" ? PARENT_TABS : CHILD_TABS).map(id => ({ id, ...SCREEN_META[id] }));
  return (
    <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff", padding: "6px 4px 10px", display: "flex" }}>
      {tabs.map(t => {
        const active = screen === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            border: "none", background: "none", cursor: "pointer", padding: "2px 0",
          }}>
            <span style={{ fontSize: 17 }}>{t.emoji}</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: active ? "#6B7BFF" : "#9ca3af" }}>{t.label}</span>
            {active && <div style={{ width: 18, height: 3, background: "linear-gradient(90deg,#6B7BFF,#9B6BFF)", borderRadius: 99 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function AppMockup() {
  const [screen, setScreen] = useState<Screen>("parent_tasks");
  const [paused, setPaused] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  const who = SCREEN_META[screen].who;

  const goTo = useCallback((s: Screen) => {
    setFadeIn(false);
    setTimeout(() => { setScreen(s); setFadeIn(true); }, 180);
  }, []);

  // Автопереключение
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setScreen(cur => {
        const idx = ALL_SCREENS.indexOf(cur);
        const next = ALL_SCREENS[(idx + 1) % ALL_SCREENS.length];
        setFadeIn(false);
        setTimeout(() => setFadeIn(true), 180);
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section style={{ background: "#f8f9ff", padding: "72px 24px 80px", position: "relative", overflow: "hidden" }}>
      {/* Subtle bg blobs */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(107,123,255,0.07) 0%,transparent 70%)", top: -150, right: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(155,107,255,0.07) 0%,transparent 70%)", bottom: -100, left: -80, pointerEvents: "none" }} />

      <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 2 }}>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(107,123,255,0.1)", border: "1px solid rgba(107,123,255,0.25)",
            color: "#6B7BFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, marginBottom: 14,
          }}>Живое превью</div>
          <h2 style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "#1E1B4B", lineHeight: 1.2, marginBottom: 10,
          }}>Посмотри, как работает приложение</h2>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", maxWidth: 440, margin: "0 auto" }}>
            Реальный дизайн — родитель создаёт задания, ребёнок выполняет и копит звёзды
          </p>
        </div>

        {/* Layout */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>

          {/* Left panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 200, maxWidth: 240, flex: 1 }}>

            {/* Who toggle */}
            <div style={{ display: "flex", background: "#e5e7eb", borderRadius: 14, padding: 3, marginBottom: 20 }}>
              {(["parent", "child"] as const).map(w => {
                const active = who === w;
                return (
                  <button key={w} onClick={() => { setPaused(true); goTo(w === "parent" ? "parent_tasks" : "child_tasks"); }} style={{
                    flex: 1, padding: "8px 6px", borderRadius: 11, border: "none", cursor: "pointer",
                    background: active ? "#fff" : "transparent",
                    boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                    fontSize: 12, fontWeight: 800,
                    color: active ? "#1E1B4B" : "#6b7280",
                    transition: "all 0.2s",
                  }}>
                    {w === "parent" ? "👨‍👩‍👧 Родитель" : "🧒 Ребёнок"}
                  </button>
                );
              })}
            </div>

            {/* Screen tabs */}
            <div style={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Экраны</div>
            {(who === "parent" ? PARENT_TABS : CHILD_TABS).map(id => {
              const m = SCREEN_META[id];
              const active = screen === id;
              return (
                <button key={id} onClick={() => { setPaused(true); goTo(id); }} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px",
                  borderRadius: 14, border: `1px solid ${active ? "#6B7BFF" : "#e5e7eb"}`,
                  background: active ? "#ede9fe" : "#fff",
                  cursor: "pointer", marginBottom: 8, textAlign: "left",
                  boxShadow: active ? "0 2px 12px rgba(107,123,255,0.18)" : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: active ? "#5b21b6" : "#374151", marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: active ? "#7c3aed" : "#9ca3af", lineHeight: 1.3, fontWeight: 500 }}>{m.desc}</div>
                  </div>
                </button>
              );
            })}

            {/* Auto-play hint */}
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 7 }}>
              <button onClick={() => setPaused(p => !p)} style={{
                display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#6b7280",
              }}>
                {paused ? "▶ Авто" : "⏸ Пауза"}
              </button>
              {!paused && (
                <span style={{ fontSize: 9, color: "#9ca3af" }}>меняется автоматически</span>
              )}
            </div>

            {/* CTA */}
            <a href="/app" style={{
              display: "block", marginTop: 20,
              background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)",
              borderRadius: 16, padding: "14px 16px", textAlign: "center",
              fontSize: 14, fontWeight: 800, color: "#fff", textDecoration: "none",
              boxShadow: "0 6px 24px rgba(107,123,255,0.35)",
            }}>
              🚀 Попробовать бесплатно
            </a>
          </div>

          {/* Phone */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <PhoneShell>
              <div style={{
                opacity: fadeIn ? 1 : 0,
                transition: "opacity 0.18s ease",
                height: "100%", display: "flex", flexDirection: "column",
              }}>
                <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
                  <ScreenContent screen={screen} />
                </div>
                <BottomNav screen={screen} onChange={s => { setPaused(true); goTo(s); }} who={who} />
              </div>
            </PhoneShell>

            {/* Dots indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
              {ALL_SCREENS.map(s => (
                <button key={s} onClick={() => { setPaused(true); goTo(s); }} style={{
                  width: screen === s ? 20 : 6, height: 6, borderRadius: 99, border: "none", cursor: "pointer",
                  background: screen === s ? "#6B7BFF" : "#d1d5db",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
