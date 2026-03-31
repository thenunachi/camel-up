import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import BookCard from "../components/BookCard";
import AIRecommendations from "../components/AIRecommendations";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    api.get("/books").then(({ data }) => setBooks(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setProgress({}); return; }
    api.get("/progress").then(({ data }) => setProgress(data)).catch(() => setProgress({}));
  }, [user]);

  // focus=search from sidebar nav
  useEffect(() => {
    if (router.query.focus === "search" && searchRef.current) {
      searchRef.current.focus();
    }
  }, [router.query.focus]);

  const getProgress = (bookId) => progress[String(bookId)] || progress[bookId];

  const filtered = searchQuery
    ? books.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()))
    : books;

  const inProgress = filtered.filter(b => {
    const p = getProgress(b.id)?.percent_complete ?? 0;
    return p > 0 && p < 99;
  });
  const finished = filtered.filter(b => (getProgress(b.id)?.percent_complete ?? 0) >= 99);
  const notStarted = filtered.filter(b => {
    const p = getProgress(b.id)?.percent_complete ?? 0;
    return p === 0;
  });

  const libraryBooks = user
    ? (searchQuery ? filtered : notStarted)
    : filtered;

  return (
    <>
      <Head>
        <title>KindleRead — Your Reading Library</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>" />
      </Head>

      {/* Main layout: sidebar offset + two panels */}
      <div className="ml-[60px] min-h-screen flex">

        {/* ── Left panel: AI Suggestions ── */}
        <div className="hidden lg:flex flex-col w-[360px] xl:w-[400px] flex-shrink-0 border-r border-white/5 h-screen sticky top-0 overflow-y-auto">
          {/* App title */}
          <div className="px-5 pt-6 pb-4 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-base font-bold text-white">Kindle<span className="text-orange-400">Read</span></span>
            </div>
          </div>
          <div className="p-5 flex-1">
            <AIRecommendations />
          </div>

          {/* Auth CTA for guests */}
          {!user && (
            <div className="p-5 border-t border-white/5 flex-shrink-0">
              <div className="rounded-xl bg-orange-500/8 border border-orange-500/15 p-4">
                <p className="text-sm font-semibold text-white mb-1">Track your reading</p>
                <p className="text-xs text-gray-500 mb-3">Sign in to save progress and resume anywhere.</p>
                <div className="flex gap-2">
                  <Link href="/register" className="btn-primary flex-1 text-center text-xs py-2">
                    Get started
                  </Link>
                  <Link href="/login" className="btn-ghost flex-1 text-center text-xs py-2 border border-white/10">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: Library ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Content */}
          <div className="p-5 sm:p-7 space-y-10 pb-20">

            {/* Mobile: AI Suggestions (full component, hidden on desktop where left panel shows it) */}
            <div className="lg:hidden">
              <AIRecommendations />
            </div>

            {/* Library heading + search bar in one row */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="section-label mb-1">Library</p>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  {user ? <>Welcome back, <span className="text-white">{user.username}!</span></> : "Your Library"}
                </h1>
              </div>

              <div className="relative w-full sm:w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search your library…"
                  className="input-dark pl-9 pr-9 py-2 text-sm"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition text-xs"
                  >✕</button>
                ) : (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono pointer-events-none">
                    ⌘K
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : searchQuery && filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <CryingBook />
                <p className="text-gray-300 font-semibold text-lg mt-5">No books found</p>
                <p className="text-gray-500 text-sm mt-1">We couldn&apos;t find anything for &ldquo;{searchQuery}&rdquo;</p>
                <button onClick={() => setSearchQuery("")} className="mt-5 btn-primary text-sm px-5 py-2">
                  Clear search
                </button>
              </div>
            ) : (
              <>
                {/* Continue Reading — horizontal scroll */}
                {user && inProgress.length > 0 && !searchQuery && (
                  <section>
                    <SectionHeading label="Continue Reading" icon="🔖" />
                    <div className="scroll-x flex gap-4 pb-2 -mx-1 px-1">
                      {inProgress.map(book => (
                        <div key={book.id} className="flex-shrink-0 w-[140px] sm:w-[160px]">
                          <BookCard book={book} progress={getProgress(book.id)} compact />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Finished */}
                {user && finished.length > 0 && !searchQuery && (
                  <section>
                    <SectionHeading label="Completed" icon="✅" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4">
                      {finished.map(book => (
                        <BookCard key={book.id} book={book} progress={getProgress(book.id)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Library grid */}
                <section>
                  <SectionHeading
                    label={searchQuery ? `Results for "${searchQuery}"` : user ? "Library" : "All Books"}
                    icon="📚"
                    count={searchQuery ? filtered.length : libraryBooks.length}
                  />
                  {libraryBooks.length === 0 && !searchQuery ? (
                    <div className="text-center py-12 text-gray-600">
                      <p className="text-sm">All books in progress or completed.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4">
                      {(searchQuery ? filtered : libraryBooks).map(book => (
                        <BookCard key={book.id} book={book} progress={getProgress(book.id)} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeading({ label, icon, count }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      {icon && <span className="text-sm">{icon}</span>}
      <span className="section-label">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full ml-1">{count}</span>
      )}
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function CryingBook() {
  return (
    <div style={{ animation: "bookBob 2s ease-in-out infinite" }}>
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Book body */}
        <rect x="18" y="14" width="54" height="58" rx="5" fill="#2a2f45" stroke="#3d4463" strokeWidth="2"/>
        {/* Spine */}
        <rect x="18" y="14" width="10" height="58" rx="3" fill="#1e2235"/>
        {/* Lines on book */}
        <rect x="34" y="28" width="28" height="3" rx="1.5" fill="#3d4463"/>
        <rect x="34" y="36" width="22" height="3" rx="1.5" fill="#3d4463"/>
        <rect x="34" y="44" width="25" height="3" rx="1.5" fill="#3d4463"/>
        {/* Sad face */}
        <circle cx="39" cy="57" r="2.5" fill="#6b7280"/>
        <circle cx="51" cy="57" r="2.5" fill="#6b7280"/>
        {/* Sad mouth */}
        <path d="M37 65 Q45 60 53 65" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* Tear left */}
        <ellipse cx="38" cy="72" rx="2" ry="3.5" fill="#3b82f6" style={{ animation: "tearDrop 1.4s ease-in infinite" }}/>
        {/* Tear right */}
        <ellipse cx="52" cy="75" rx="2" ry="3.5" fill="#3b82f6" style={{ animation: "tearDrop 1.4s ease-in 0.7s infinite" }}/>
      </svg>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="shimmer rounded-xl mb-2" style={{ aspectRatio: "2/3" }} />
          <div className="shimmer h-2.5 rounded w-3/4 mb-1" />
          <div className="shimmer h-2 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
