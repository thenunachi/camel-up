import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const THEMES = {
  light:  { bg: "#ffffff", text: "#1a1a2e", label: "Light",   icon: "☀️" },
  sepia:  { bg: "#f8f4ed", text: "#2d2418", label: "Sepia",   icon: "📜" },
  warm:   { bg: "#1c1510", text: "#e8d5b7", label: "Warm",    icon: "🕯️" },
  dark:   { bg: "#141414", text: "#d4d4d4", label: "Dark",    icon: "🌑" },
  night:  { bg: "#0d1117", text: "#58a6ff", label: "Night",   icon: "🌙" },
};

export default function Reader() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);
  const [currentPercent, setCurrentPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoredScroll, setRestoredScroll] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showControls, setShowControls] = useState(true);

  // Use refs for values that are read inside event handlers
  // so they never go stale without causing effect re-registration
  const saveTimerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const userRef = useRef(user);
  const idRef = useRef(id);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { idRef.current = id; }, [id]);

  // ── Load book + saved progress ───────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setRestoredScroll(false);

    const load = async () => {
      try {
        const { data } = await api.get(`/books/${id}`);
        setBook(data);

        if (user) {
          try {
            const { data: prog } = await api.get(`/progress/${id}`);
            setSavedProgress(prog);
          } catch {
            setSavedProgress({ scroll_position: 0, percent_complete: 0, last_read: null });
          }
        } else {
          setSavedProgress(null);
        }
      } catch {
        setError("Book not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  // ── Restore scroll position after content renders ────────────────────────
  useEffect(() => {
    if (!book || restoredScroll) return;
    if (!savedProgress || savedProgress.percent_complete <= 0) {
      setRestoredScroll(true);
      return;
    }
    // Wait for full DOM paint
    const t = setTimeout(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = (savedProgress.percent_complete / 100) * maxScroll;
      window.scrollTo({ top: target, behavior: "smooth" });
      setCurrentPercent(savedProgress.percent_complete);
      setRestoredScroll(true);
    }, 600);
    return () => clearTimeout(t);
  }, [book, savedProgress, restoredScroll]);

  // ── Save progress to backend ─────────────────────────────────────────────
  const saveProgress = useCallback(async (percent, scrollPos) => {
    if (!userRef.current || !idRef.current) return;
    try {
      await api.post(`/progress/${idRef.current}`, {
        scroll_position: scrollPos,
        percent_complete: percent,
      });
      setSaved(true);
      // Also update the savedProgress state so the header reflects latest
      setSavedProgress(prev => ({
        ...(prev || {}),
        percent_complete: percent,
        scroll_position: scrollPos,
        last_read: new Date().toISOString(),
      }));
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silent — don't interrupt reading
    }
  }, []);

  // ── Scroll listener — registered ONCE, uses refs to avoid stale closures ─
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const percent = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
      setCurrentPercent(percent);

      // Show navbar when scrolling up or near top
      setShowControls(scrollTop < lastScrollYRef.current || scrollTop < 80);
      lastScrollYRef.current = scrollTop;

      // Debounce save — 2 seconds after scroll stops
      if (userRef.current) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          saveProgress(percent, scrollTop);
        }, 2000);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [saveProgress]); // saveProgress is stable (useCallback with no deps)

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f4ed] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 mx-auto mb-4 flex items-center justify-center text-xl animate-pulse">
            📖
          </div>
          <p className="text-gray-500 text-sm">Opening book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-gray-400 mb-5">{error || "Book not found"}</p>
          <Link href="/" className="btn-primary">← Library</Link>
        </div>
      </div>
    );
  }

  const paragraphs = book.content.split("\n").map(p => p.trim()).filter(Boolean);
  const totalMinutes = Math.round(book.total_words / 200);
  const minutesLeft = Math.max(0, Math.round(((100 - currentPercent) / 100) * totalMinutes));

  return (
    <>
      <Head>
        <title>{book.title} — KindleRead</title>
      </Head>

      {/* ── Thin progress bar pinned to very top ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/10">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${currentPercent}%`, backgroundColor: book.cover_color }}
        />
      </div>

      {/* ── Top navbar — auto-hides on scroll down ── */}
      <div
        className={`fixed top-1 left-0 right-0 z-40 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="glass-light border-b border-black/5 shadow-sm px-4 py-2.5 flex items-center justify-between">

          {/* Back */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Library</span>
          </Link>

          {/* Title */}
          <p className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-[180px] sm:max-w-xs">
            {book.title}
          </p>

          {/* Right controls */}
          <div className="flex items-center gap-2.5">

            {/* Font size */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-gray-600">
              <button
                onClick={() => setFontSize(s => Math.max(14, s - 2))}
                className="hover:text-gray-900 transition font-bold text-xs w-5 h-5 flex items-center justify-center"
              >A−</button>
              <div className="w-px h-3 bg-gray-300" />
              <button
                onClick={() => setFontSize(s => Math.min(26, s + 2))}
                className="hover:text-gray-900 transition font-bold text-sm w-5 h-5 flex items-center justify-center"
              >A+</button>
            </div>

            {/* Saved indicator */}
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}

            {!user && (
              <Link href="/login" className="text-xs text-amber-600 hover:underline font-medium">
                Sign in to save
              </Link>
            )}

            {/* % badge */}
            <div
              className="text-xs font-bold px-2.5 py-1 rounded-lg text-white shadow-sm min-w-[42px] text-center"
              style={{ backgroundColor: book.cover_color }}
            >
              {currentPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Reader page ── */}
      <div className="min-h-screen bg-[#f8f4ed]">
        <main className="max-w-[680px] mx-auto px-6 sm:px-10 pt-20 pb-32">

          {/* Book header */}
          <div className="text-center mb-12 pt-6">
            {/* Mini book cover */}
            <div
              className="w-20 h-28 rounded-xl mx-auto mb-5 flex items-center justify-center text-2xl font-bold text-white shadow-2xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${book.cover_color}ee, ${book.cover_color}88)`,
                boxShadow: `0 20px 50px ${book.cover_color}40`,
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/20 rounded-l-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="relative z-10">{book.title[0]}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{book.title}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              by <span className="font-medium text-gray-700">{book.author}</span>
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
              <span>{book.total_words?.toLocaleString()} words</span>
              <span>·</span>
              <span>~{totalMinutes} min read</span>
              {savedProgress?.last_read && (
                <>
                  <span>·</span>
                  <span>
                    Last read{" "}
                    {new Date(savedProgress.last_read).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Progress bar — shows saved progress on load, then live */}
            {(currentPercent > 0 || (savedProgress?.percent_complete > 0)) && (
              <div className="mt-5 max-w-xs mx-auto">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold" style={{ color: book.cover_color }}>
                    {currentPercent}% complete
                  </span>
                  {minutesLeft > 0 && (
                    <span className="text-gray-400">~{minutesLeft} min left</span>
                  )}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${currentPercent}%`, backgroundColor: book.cover_color }}
                  />
                </div>
                {!user && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    <Link href="/login" className="text-amber-600 hover:underline">Sign in</Link> to save your progress
                  </p>
                )}
                {user && savedProgress?.percent_complete > 0 && currentPercent === 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Resuming from {Math.round(savedProgress.percent_complete)}%…
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 border-b-2 border-gray-200" />
          </div>

          {/* ── Book content ── */}
          <article className="reader-content" style={{ fontSize: `${fontSize}px` }}>
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>

          {/* ── End of book ── */}
          <div className="mt-20 pt-12 border-t-2 border-gray-200 text-center">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl shadow-lg"
              style={{ backgroundColor: book.cover_color + "22", border: `2px solid ${book.cover_color}44` }}
            >
              🎉
            </div>
            <h2 className="text-xl font-bold text-gray-900">You finished it!</h2>
            <p className="text-gray-500 text-sm mt-1">{book.title} · {book.author}</p>

            {/* Final progress bar — 100% */}
            <div className="max-w-xs mx-auto mt-5">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: "100%", backgroundColor: book.cover_color }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">100% complete · {totalMinutes} min read</p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition shadow-lg"
            >
              ← Back to Library
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
