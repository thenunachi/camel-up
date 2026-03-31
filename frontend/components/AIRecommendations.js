import { useState } from "react";
import { useRouter } from "next/router";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const QUICK_PICKS = [
  { label: "Mystery", emoji: "🔍" },
  { label: "Romance", emoji: "💕" },
  { label: "Sci-Fi", emoji: "🚀" },
  { label: "Fantasy", emoji: "🧙" },
  { label: "History", emoji: "📜" },
  { label: "Self Help", emoji: "💡" },
  { label: "Philosophy", emoji: "🤔" },
  { label: "Adventure", emoji: "🗺️" },
  { label: "Horror", emoji: "👻" },
  { label: "Biography", emoji: "🧑" },
];

export default function AIRecommendations() {
  const { user } = useAuth();
  const router = useRouter();
  const [preference, setPreference] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (label) => {
    setPreference((prev) => {
      const tags = prev.split(",").map((s) => s.trim()).filter(Boolean);
      const next = tags.includes(label) ? tags.filter((t) => t !== label) : [...tags, label];
      return next.join(", ");
    });
    setBooks([]);
    setError("");
  };

  const isActive = (label) => preference.split(",").map((s) => s.trim()).includes(label);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preference.trim()) return;
    setLoading(true);
    setError("");
    setBooks([]);
    try {
      const { data } = await api.post(`/recommend?user_preference=${encodeURIComponent(preference.trim())}`);
      setBooks(data.books || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not get recommendations. Check your GROQ_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glow-violet rounded-2xl glass border border-violet-500/10 p-6 md:p-7">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-base shadow-lg shadow-violet-500/30">
          ✨
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">AI Book Suggestions</h2>
          <p className="text-xs text-gray-500 mt-0.5">Powered by Llama 3.3 · Groq</p>
        </div>
      </div>

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_PICKS.map(({ label, emoji }) => (
          <button
            key={label}
            type="button"
            onClick={() => toggleTag(label)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
              isActive(label)
                ? "bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-500/30"
                : "bg-white/4 text-gray-400 border-white/8 hover:border-violet-500/40 hover:text-violet-300"
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Input + submit */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={preference}
          onChange={(e) => { setPreference(e.target.value); setBooks([]); setError(""); }}
          placeholder='Or type freely: "dark academia, unreliable narrator"'
          style={{ backgroundColor: "#1e1b2e", colorScheme: "dark" }}
          className="flex-1 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
        />
        <button
          type="submit"
          disabled={loading || !preference.trim()}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/30 disabled:text-white/30
            text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap
            shadow-lg shadow-violet-500/20"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Thinking...
            </>
          ) : "✨ Suggest"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Results */}
      {books.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">
            Picks for · {preference}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {books.map((book, i) => (
              <BookSuggestionCard
                key={i}
                book={book}
                index={i}
                user={user}
                onAdded={(newBook) => router.push(`/reader/${newBook.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const CARD_ACCENTS = [
  { border: "border-amber-500/20", bg: "bg-amber-500/5", title: "text-amber-300", btn: "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20" },
  { border: "border-blue-500/20",  bg: "bg-blue-500/5",  title: "text-blue-300",  btn: "bg-blue-500 hover:bg-blue-400 shadow-blue-500/20" },
  { border: "border-emerald-500/20", bg: "bg-emerald-500/5", title: "text-emerald-300", btn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" },
];

function BookSuggestionCard({ book, index, user, onAdded }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);
  const c = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const showCover = book.cover_url && !imgError;

  const handleAdd = async () => {
    if (!user) {
      setError("Sign in to add books to your library.");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const { data } = await api.post("/books/add", {
        title: book.title,
        author: book.author,
        description: book.description,
      });
      setAdded(true);
      setTimeout(() => onAdded(data.book), 800);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add book. Try again.");
      setAdding(false);
    }
  };

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} flex flex-col overflow-hidden`}>
      {/* Cover photo */}
      <div className="relative h-40 w-full flex-shrink-0 overflow-hidden">
        {showCover ? (
          <img
            src={book.cover_url}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-end p-3"
            style={{ background: `linear-gradient(135deg, #2a1f3d, #1a1030)` }}
          >
            <p className={`font-bold text-sm leading-snug ${c.title} drop-shadow`}>{book.title}</p>
          </div>
        )}
        {/* gradient overlay at bottom so text is readable over photo */}
        {showCover && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
            <p className="font-bold text-sm text-white leading-snug drop-shadow line-clamp-2">{book.title}</p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-xs text-gray-500">{book.author}</p>

        <p className="text-xs text-gray-400 leading-relaxed flex-1">{book.description}</p>

        {book.why && (
          <p className="text-xs text-gray-600 italic leading-relaxed border-t border-white/5 pt-2">
            💡 {book.why}
          </p>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleAdd}
          disabled={adding || added}
          className={`w-full py-2 rounded-lg text-xs font-bold text-white transition-all duration-200 shadow-lg flex items-center justify-center gap-1.5
            ${added ? "bg-green-600 shadow-green-600/20" : c.btn} disabled:opacity-60`}
        >
          {added ? (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Added! Opening...
            </>
          ) : adding ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating content...
            </>
          ) : (
            <>+ Add to Library</>
          )}
        </button>
      </div>
    </div>
  );
}
