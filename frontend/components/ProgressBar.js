export default function ProgressBar({ percent = 0, color = "#F59E0B", height = 6, showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="w-full">
      <div
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1">{Math.round(clamped)}% complete</p>
      )}
    </div>
  );
}
