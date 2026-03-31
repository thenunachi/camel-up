import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    api.get("/auth/profile")
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="ml-[60px] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, finished, in_progress } = data;
  const joinDate = new Date(data.user.created_at).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  return (
    <>
      <Head><title>{data.user.username} — KindleRead</title></Head>
      <div className="ml-[60px] min-h-screen">
        <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 space-y-8">

          {/* ── Profile header ── */}
          <div className="glass border border-white/8 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-amber-500/30 flex-shrink-0">
              {data.user.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{data.user.username}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{data.user.email}</p>
              <p className="text-gray-600 text-xs mt-1">Member since {joinDate}</p>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition"
            >
              ← Library
            </Link>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              value={stats.books_completed}
              label="Books Finished"
              color="text-green-400"
              icon="✅"
            />
            <StatCard
              value={stats.books_in_progress}
              label="In Progress"
              color="text-amber-400"
              icon="📖"
            />
            <StatCard
              value={formatWords(stats.total_words_read)}
              label="Words Read"
              color="text-violet-400"
              icon="💬"
            />
          </div>

          {/* ── Completed books ── */}
          {finished.length > 0 && (
            <section>
              <SectionLabel icon="🏆" label="Books Completed" count={finished.length} />
              <div className="space-y-3">
                {finished.map((book) => (
                  <BookProgressRow key={book.book_id} book={book} />
                ))}
              </div>
            </section>
          )}

          {/* ── In progress ── */}
          {in_progress.length > 0 && (
            <section>
              <SectionLabel icon="🔖" label="Currently Reading" count={in_progress.length} />
              <div className="space-y-3">
                {in_progress.map((book) => (
                  <BookProgressRow key={book.book_id} book={book} />
                ))}
              </div>
            </section>
          )}

          {finished.length === 0 && in_progress.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📚</p>
              <p className="font-medium text-gray-400">No reading history yet</p>
              <p className="text-sm mt-1">Start reading a book to track your progress here.</p>
              <Link href="/" className="inline-block mt-5 btn-primary px-6 py-2.5">Browse Library</Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function StatCard({ value, label, color, icon }) {
  return (
    <div className="glass border border-white/8 rounded-2xl p-5 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SectionLabel({ icon, label, count }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span>{icon}</span>
      <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function BookProgressRow({ book }) {
  const isFinished = book.percent_complete >= 99;
  const [imgError, setImgError] = useState(false);
  const showCover = book.cover_url && !imgError;

  return (
    <Link href={`/reader/${book.book_id}`}>
      <div className="glass border border-white/8 rounded-xl p-4 flex items-center gap-4 hover:border-white/15 transition group">
        {/* Mini cover */}
        <div
          className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg"
          style={{ boxShadow: `0 4px 12px ${book.cover_color}44` }}
        >
          {showCover ? (
            <img src={book.cover_url} alt={book.title} onError={() => setImgError(true)} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${book.cover_color}dd, ${book.cover_color}88)` }}
            >
              {book.title[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm line-clamp-1 group-hover:text-amber-300 transition-colors">
            {book.title}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">{book.author}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${book.percent_complete}%`, backgroundColor: book.cover_color }}
              />
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: book.cover_color }}>
              {Math.round(book.percent_complete)}%
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 text-right">
          {isFinished ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              ✓ Finished
            </span>
          ) : (
            <span className="text-xs text-amber-400 font-medium">
              {book.last_read
                ? new Date(book.last_read).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatWords(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
