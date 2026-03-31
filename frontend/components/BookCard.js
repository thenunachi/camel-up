import { useState } from "react";
import Link from "next/link";

export default function BookCard({ book, progress }) {
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
          className="relative rounded-2xl overflow-hidden mb-3 shadow-xl"
          style={{ aspectRatio: "2/3", boxShadow: `0 20px 40px ${book.cover_color}44` }}
        >
          {showCover ? (
            /* Real cover photo */
            <img
              src={book.cover_url}
              alt={book.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            /* Gradient fallback */
            <div
              className="w-full h-full flex flex-col items-center justify-center p-5 text-center"
              style={{ background: `linear-gradient(135deg, ${book.cover_color}ee, ${book.cover_color}88)` }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
              <p className="relative z-10 text-white font-bold text-base leading-snug drop-shadow-lg line-clamp-4 tracking-tight">
                {book.title}
              </p>
              <div className="relative z-10 mt-3 w-8 h-px bg-white/50" />
              <p className="relative z-10 text-white/75 text-xs mt-2 font-medium">{book.author}</p>
            </div>
          )}

          {/* Spine shadow overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/25 pointer-events-none" />

          {/* Hover CTA */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-center pb-4">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 text-gray-900 text-xs font-bold shadow-lg">
                {isFinished ? "Read again →" : hasStarted ? "Continue →" : "Start reading →"}
              </div>
            </div>
          </div>

          {/* Finished badge */}
          {isFinished && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              ✓ Done
            </div>
          )}

          {/* Progress bar at bottom of cover */}
          {hasStarted && !isFinished && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-1 bg-black/40">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${percent}%`, backgroundColor: "rgba(255,255,255,0.9)" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Card info ── */}
        <div className="px-0.5">
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors">
            {book.title}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{book.author}</p>

          {hasStarted ? (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-400">{Math.round(percent)}%</span>
                {lastRead && <span className="text-xs text-gray-600">{lastRead}</span>}
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: book.cover_color }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600 mt-1.5">Not started</p>
          )}
        </div>
      </div>
    </Link>
  );
}
