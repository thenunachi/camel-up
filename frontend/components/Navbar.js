import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
              <span className="text-sm">📚</span>
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Kindle<span className="text-amber-400">Read</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search books or authors..."
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2 pl-9 text-sm text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white/8 transition"
              />
              <svg className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
          </form>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 hover:border-amber-500/30 hover:bg-white/8 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{user.username}</span>
                </Link>
                <button onClick={logout} className="btn-ghost text-xs">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
                <Link href="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </form>
          {user ? (
            <>
              <div className="flex items-center gap-2 py-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-gray-300">{user.username}</span>
              </div>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full text-left text-sm text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-xl transition">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-sm text-gray-300 hover:text-white py-2 px-3 rounded-xl hover:bg-white/5 transition" onClick={() => setMobileOpen(false)}>Sign in</Link>
              <Link href="/register" className="block text-sm text-white bg-amber-500 hover:bg-amber-400 py-2.5 px-3 rounded-xl text-center font-semibold transition" onClick={() => setMobileOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
