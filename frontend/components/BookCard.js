import { useState } from "react";
import Link from "next/link";

export default function BookCard({ book, progress, compact = false }) {
  const percent = progress?.percent_complete ?? 0;
  const hasStarted = percent > 0;
  const isFinished = percent >= 99;
  const [imgError, setImgError] = useState(false);
  const showCover = book.cover_url && !imgError;

  const lastRead = progress?.last_read
    ? new Date(progress.last_read).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <Link href={`/reader/${book.id}`}>
      <div className="book-card group cursor-pointer">
        {/* ── Book Cover ── */}
        <div
          className="relative rounded-xl overflow-hidden mb-2.5 shadow-lg"
          style={{
            aspectRatio: "2/3",
            boxShadow: `0 8px 24px ${book.cover_color}33`,
          }}
        >
          {showCover ? (
            <img
              src={book.cover_url}
              alt={book.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
              style={{ background: `linear-gradient(135deg, ${book.cover_color}ee, ${book.cover_color}88)` }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />
              <p className="relative z-10 text-white font-bold text-xs leading-snug drop-shadow line-clamp-4 tracking-tight">
                {book.title}
              </p>
              <div className="relative z-10 mt-2 w-6 h-px bg-white/40" />
              <p className="relative z-10 text-white/70 text-[10px] mt-1.5 font-medium">{book.author}</p>
            </div>
          )}

          {/* Spine */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/25 pointer-events-none" />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-end justify-center pb-3">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-gray-900 text-[10px] font-bold shadow">
                {isFinished ? "Read again" : hasStarted ? "Continue" : "Start reading"}
              </div>
            </div>
          </div>

          {/* Finished badge */}
          {isFinished && (
            <div className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
              ✓
            </div>
          )}

          {/* Progress bar */}
          {hasStarted && !isFinished && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${percent}%`, backgroundColor: "rgba(255,255,255,0.85)" }}
              />
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div>
          <h3 className={`font-semibold text-white leading-tight line-clamp-2 group-hover:text-orange-300 transition-colors ${compact ? "text-[11px]" : "text-xs"}`}>
            {book.title}
          </h3>
          {!compact && (
            <p className="text-gray-600 text-[10px] mt-0.5 line-clamp-1">{book.author}</p>
          )}

          {hasStarted && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold" style={{ color: book.cover_color }}>
                  {Math.round(percent)}%
                </span>
                {lastRead && !compact && (
                  <span className="text-[10px] text-gray-600">{lastRead}</span>
                )}
              </div>
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: book.cover_color }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
