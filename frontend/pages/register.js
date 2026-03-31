import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { setError("Please fill in all fields."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Create Account — KindleRead</title></Head>
      <div className="min-h-screen bg-[#0f0f13] flex flex-col">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-sm">📚</span>
            </div>
            <span className="text-base font-bold text-white">Kindle<span className="text-amber-400">Read</span></span>
          </Link>
        </div>

        <div className="relative flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">Create your account</h1>
              <p className="text-gray-500 text-sm mt-1.5">Start your reading journey today</p>
            </div>

            {error && (
              <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
                <input
                  type="text" name="username" value={form.username} onChange={handleChange}
                  placeholder="bookworm42" className="input-field" autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" className="input-field" autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                <input
                  type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters" className="input-field" autoComplete="new-password"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
