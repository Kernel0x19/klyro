export default function EditorLoading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4 bg-(--background)">
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4F6EF7] animate-spin"
          style={{ animationDuration: '800ms' }}
        />
        <div
          className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#8BA4FA] animate-spin"
          style={{ animationDuration: '600ms', animationDirection: 'reverse' }}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-neutral-500 tracking-widest uppercase">
          Klyro
        </span>
        <span className="text-xs text-neutral-600">
          Preparing your workspace...
        </span>
      </div>
    </div>
  )
}
