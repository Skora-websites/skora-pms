"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Search, ArrowRight, ArrowLeft } from "lucide-react";

export default function CertificateSearchPortal() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    router.push(`/verify/certificate/${encodeURIComponent(code.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                SkoraCare
              </span>
              <span className="text-xs uppercase tracking-wider text-emerald-600 font-semibold ml-1.5">
                Verification Portal
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to SkoraCare
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Verify Medical Certificate
            </h1>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Enter the unique verification code or certificate number from the document to validate its authenticity.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. VER-9812-4412 or MC-2026-4412"
                className="w-full px-4 py-3 text-center uppercase tracking-wider font-mono text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
            >
              <Search className="w-4 h-4" /> Verify Document Authenticity <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            For employers, educational institutions, airlines, and insurance partners.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>© 2026 SkoraCare Clinic OS · Digital Health & Practice Management Platform</p>
      </footer>
    </div>
  );
}
