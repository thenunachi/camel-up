import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";
import AIRecommendations from "../components/AIRecommendations";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { search } = router.query;

  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/books").then(({ data }) => setBooks(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setProgress({}); return; }
    api.get("/progress").then(({ data }) => setProgress(data)).catch(() => setProgress({}));
  }, [user]);

  const filteredBooks = search
    ? books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()))
    : books;

  // Use String() to match JSON string keys from backend
  const getProgress = (bookId) => progress[String(bookId)] || progress[bookId];
  const inProgress = filteredBooks.filter(b => {
    const p = getProgress(b.id)?.percent_complete ?? 0;
    return p > 0 && p < 99;
  });
  const notStarted = filteredBooks.filter(b => {
    const p = getProgress(b.id)?.percent_complete ?? 0;
    return p === 0;
  });
  const finished = filteredBooks.filter(b => (getProgress(b.id)?.percent_complete ?? 0) >= 99);

  const SectionHeading = ({ icon, label }) => (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-base">{icon}</span>
      <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );

  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <div className="shimmer rounded-2xl mb-3" style={{ aspectRatio: "2/3" }} />
          <div className="shimmer h-3 rounded w-3/4 mb-1.5" />
          <div className="shimmer h-2.5 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Head>
        <title>KindleRead — Your Reading Library</title>
        <meta name="description" content="Read books online and track your progress" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>" />
      </Head>

      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {!user && !authLoading ? (
            <div className="flex flex-col items-start gap-5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                5 classic books available
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight">
                Read more.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  Remember more.
                </span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Pick up exactly where you left off. Track your progress. Get AI-powered book suggestions.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/register" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition shadow-xl shadow-amber-500/25 text-sm">
                  Start reading free
                </Link>
                <Link href="/login" className="px-6 py-3 text-gray-400 hover:text-white font-medium rounded-xl transition text-sm border border-white/10 hover:border-white/20 hover:bg-white/5">
                  Sign in →
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Welcome back</p>
              <h1 className="text-3xl font-bold text-white">
                {user?.username ? `${user.username}'s` : "Your"}{" "}
                <span className="text-amber-400">Library</span>
              </h1>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">

        {/* AI Recommendations */}
        <AIRecommendations />

        {/* Search result header */}
        {search && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">Results for</span>
            <span className="font-semibold text-white">"{search}"</span>
            <Link href="/" className="text-amber-500 hover:text-amber-400 transition ml-1 text-xs">× Clear</Link>
          </div>
        )}

        {loading ? <SkeletonGrid /> : (
          <>
            {/* Continue Reading */}
            {user && inProgress.length > 0 && (
              <section>
                <SectionHeading icon="🔖" label="Continue Reading" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {inProgress.map(book => <BookCard key={book.id} book={book} progress={getProgress(book.id)} />)}
                </div>
              </section>
            )}

            {/* Finished */}
            {user && finished.length > 0 && (
              <section>
                <SectionHeading icon="✅" label="Completed" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {finished.map(book => <BookCard key={book.id} book={book} progress={getProgress(book.id)} />)}
                </div>
              </section>
            )}

            {/* All / Not started */}
            <section>
              <SectionHeading
                icon="📖"
                label={user && inProgress.length > 0 ? "Not Started" : "All Books"}
              />
              {filteredBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-4xl mb-4">🔍</p>
                  <p className="text-gray-400">No books found for "{search}"</p>
                  <Link href="/" className="mt-4 text-amber-500 hover:underline text-sm">Clear search</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {(user ? notStarted : filteredBooks).map(book => (
                    <BookCard key={book.id} book={book} progress={getProgress(book.id)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-600">
        📚 KindleRead · Built with Next.js &amp; FastAPI
      </footer>
    </>
  );
}
