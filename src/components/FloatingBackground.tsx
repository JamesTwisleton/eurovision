export function FloatingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-20 select-none">
      <span className="absolute left-[10%] top-[15%] text-6xl animate-pulse">🇪🇺</span>
      <span className="absolute right-[15%] top-[10%] text-5xl rotate-12">🎤</span>
      <span className="absolute left-[20%] bottom-[20%] text-5xl -rotate-12">🇬🇧</span>
      <span className="absolute right-[25%] bottom-[15%] text-6xl animate-bounce" style={{ animationDuration: '3s' }}>🌟</span>
      <span className="absolute left-[5%] top-[50%] text-4xl rotate-45">🇸🇪</span>
      <span className="absolute right-[5%] top-[40%] text-4xl -rotate-45">🇮🇹</span>
      <span className="absolute left-[40%] top-[5%] text-3xl">🎵</span>
      <span className="absolute right-[45%] bottom-[5%] text-4xl">🎸</span>
      <span className="absolute left-[15%] top-[80%] text-5xl opacity-40">🇺🇦</span>
      <span className="absolute right-[10%] top-[70%] text-5xl rotate-12 opacity-40">💃</span>
      <span className="absolute left-[30%] top-[30%] text-2xl opacity-30">✨</span>
      <span className="absolute right-[35%] top-[60%] text-3xl opacity-30">🔥</span>
    </div>
  );
}
