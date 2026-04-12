import { useState } from "react";
import { type AchievementId, ACHIEVEMENTS_MAP } from "@/lib/gameTypes";

const CDN = "https://cdn.poehali.dev/projects/646a8e3a-c6c3-4005-9a70-b35e18c651d5/files";

const ACHIEVEMENT_DETAILS: Record<AchievementId, { detail: string; img: string }> = {
  first_task:  { detail: "Каждое путешествие начинается с первого шага! Ты взялся за дело — молодец, так держать!", img: `${CDN}/bcb835ca-9119-433d-b409-83efc6f7aa40.jpg` },
  tasks_5:     { detail: "Настоящий герой не останавливается! Пять заданий позади — впереди новые подвиги.", img: `${CDN}/cbdcdd6d-3ea4-456a-a226-9c9fda423900.jpg` },
  tasks_10:    { detail: "Ты как ниндзя — быстро и чётко! 10 заданий — это серьёзный результат.", img: `${CDN}/17bc04a9-d2b6-41a3-89fa-0ba066336c22.jpg` },
  tasks_25:    { detail: "Легендарный рыцарь! 25 заданий выполнено — ты настоящий чемпион.", img: `${CDN}/573825d6-5428-4b84-b778-0d2218b0c80f.jpg` },
  stars_10:    { detail: "Первые 10 звёзд сверкают в твоей коллекции! Магия только начинается.", img: `${CDN}/043dcca0-7db8-4ef6-b533-77c92d525341.jpg` },
  stars_50:    { detail: "50 звёзд — ты покоряешь галактику! Космический исследователь.", img: `${CDN}/73c0e705-d2dd-4207-a527-4263c9a83228.jpg` },
  stars_100:   { detail: "100 звёзд! Ты стал повелителем звёздного неба. Легенда!", img: `${CDN}/a1e040f2-a609-4dc4-9885-02dc7bb7a685.jpg` },
  level_3:     { detail: "Бронзовый атлет! Третий уровень покорён — путь наверх открыт.", img: `${CDN}/d1d124a7-244b-4f6c-9635-c73b1feb7f99.jpg` },
  level_5:     { detail: "Серебряный чемпион! Пятый уровень — ты в элите.", img: `${CDN}/fabeba60-8eb8-4302-b928-a951c07e2c44.jpg` },
  level_10:    { detail: "Золотой император! Десятый уровень — ты на вершине мира!", img: `${CDN}/f759223f-27b0-455d-bfe0-c3ea31fc6129.jpg` },
  spend_10:    { detail: "Первые покупки сделаны! Умеешь не только зарабатывать, но и тратить с умом.", img: `${CDN}/058724d8-184b-4073-b348-97f7b4e20991.jpg` },
  spend_30:    { detail: "Пиратский клад! 30 звёзд потрачено — ты знаешь толк в сокровищах.", img: `${CDN}/d6679c93-24ce-4b0f-9b43-27201448e133.jpg` },
  reward_1:    { detail: "Первый подарок самому себе! Ты заслужил эту награду честным трудом.", img: `${CDN}/44f07e19-bacb-4aac-8e9c-dfc27b927afb.jpg` },
  reward_3:    { detail: "Три награды в коллекции! Настоящий ценитель и коллекционер.", img: `${CDN}/07752691-adc8-4dca-aef3-58821504048d.jpg` },
  streak_3:    { detail: "Три дня без перерыва! Огонь горит — не останавливайся!", img: `${CDN}/bf49eb43-bf1e-4ade-8b50-242d0eed3649.jpg` },
  streak_7:    { detail: "Целая неделя подряд! Невероятная сила воли — ты супергерой!", img: `${CDN}/58299370-04a1-42aa-a634-32fb0e35bc8f.jpg` },
};

// Объединяем базовые данные с деталями для отображения у ребёнка
const ACHIEVEMENTS = Object.fromEntries(
  Object.entries(ACHIEVEMENTS_MAP).map(([id, base]) => [
    id,
    { ...base, ...ACHIEVEMENT_DETAILS[id as AchievementId] },
  ])
) as Record<AchievementId, { emoji: string; title: string; desc: string; detail: string; img: string }>;

const ALL_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];

type Props = { unlockedIds: AchievementId[] };

export function AchievementGrid({ unlockedIds }: Props) {
  const [selected, setSelected] = useState<AchievementId | null>(null);
  const selectedAch = selected ? ACHIEVEMENTS[selected] : null;
  const isUnlocked = selected ? unlockedIds.includes(selected) : false;

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {ALL_IDS.map(id => {
          const a = ACHIEVEMENTS[id];
          const unlocked = unlockedIds.includes(id);
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl text-center transition-all active:scale-95 ${unlocked ? "bg-white shadow-sm" : "bg-gray-50 opacity-40"}`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden">
                <img
                  src={a.img}
                  alt={a.title}
                  className={`w-full h-full object-cover ${unlocked ? "" : "grayscale"}`}
                  loading="lazy"
                />
              </div>
              <p className="text-[9px] font-bold text-gray-600 leading-tight">{a.title}</p>
            </button>
          );
        })}
      </div>

      {selected && selectedAch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className={`relative h-48 ${isUnlocked ? "" : "grayscale"}`}>
              <img src={selectedAch.img} alt={selectedAch.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-2xl font-black">{selectedAch.emoji} {selectedAch.title}</p>
                <p className="text-sm opacity-80 font-bold">{selectedAch.desc}</p>
              </div>
            </div>
            <div className="p-5">
              {isUnlocked ? (
                <div className="flex items-start gap-3">
                  <span className="text-3xl">✅</span>
                  <div>
                    <p className="font-black text-green-600 text-sm mb-1">Получено!</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedAch.detail}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔒</span>
                  <div>
                    <p className="font-black text-gray-400 text-sm mb-1">Ещё не получено</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{selectedAch.detail}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-black text-sm active:scale-95 transition-transform"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type UnlockProps = { achievementId: AchievementId; onClose: () => void };

export function AchievementUnlockModal({ achievementId, onClose }: UnlockProps) {
  const ach = ACHIEVEMENTS[achievementId];
  if (!ach) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-6 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
        style={{ animation: "achBounce 0.6s ease" }}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg" style={{ animation: "achShine 2s infinite" }}>
            НОВАЯ АЧИВКА!
          </span>
        </div>
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl pt-4">
          <div className="relative h-44 mx-4 rounded-2xl overflow-hidden">
            <img src={ach.img} alt={ach.title} className="w-full h-full object-cover" style={{ animation: "achZoom 0.8s ease" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-3xl font-black text-white drop-shadow-lg" style={{ animation: "achSlide 0.6s ease 0.3s both" }}>
                {ach.emoji} {ach.title}
              </p>
            </div>
          </div>
          <div className="p-5 text-center">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{ach.detail}</p>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-black text-sm active:scale-95 transition-transform shadow-lg"
            >
              Круто! 🎉
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes achBounce { 0%{transform:scale(0.3) translateY(40px);opacity:0} 60%{transform:scale(1.08) translateY(-5px);opacity:1} 100%{transform:scale(1) translateY(0)} }
        @keyframes achZoom { 0%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes achSlide { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes achShine { 0%,100%{opacity:1} 50%{opacity:0.7} }
      `}</style>
    </div>
  );
}

export default AchievementGrid;