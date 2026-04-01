export function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]">
      <div className="text-5xl mb-4 animate-bounce">⭐</div>
      <p className="text-[#2D1B69] font-black text-lg">Загружаем профиль...</p>
      <div className="mt-4 w-8 h-8 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-[#2D1B69] font-bold text-xl mb-2">Что-то пошло не так</p>
      <p className="text-gray-500 text-sm">{msg}</p>
      <p className="text-gray-400 text-xs mt-3">Зайди через @task4kids_bot</p>
    </div>
  );
}
