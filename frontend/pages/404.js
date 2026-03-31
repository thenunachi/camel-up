import Link from "next/link";
import Head from "next/head";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page Not Found — KindleRead</title>
      </Head>
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">📭</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
          <Link href="/" className="btn-primary px-6 py-2.5 text-base">
            ← Back to Library
          </Link>
        </div>
      </div>
    </>
  );
}
