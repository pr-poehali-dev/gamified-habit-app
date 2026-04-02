export function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF] px-6">
      <div className="text-5xl mb-4">👨</div>
      <p className="text-[#1E1B4B] font-black text-lg">Загружаем профиль...</p>
      <div className="mt-4 w-8 h-8 border-2 border-[#6B7BFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF]">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-[#1E1B4B] font-bold text-xl mb-2">Что-то пошло не так</p>
      <p className="text-gray-500 text-sm">{msg}</p>
      <p className="text-gray-400 text-xs mt-3">Зайди через @parenttask_bot</p>
    </div>
  );
}