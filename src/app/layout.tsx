import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FinPublish - Premium Financial CMS & Insights',
  description: 'Real-time stock data, interactive valuation models, and analytical newsletters.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FinPublish
              </span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Market Feed
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Author CMS
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} FinPublish. All rights reserved. Real-time insights, analytics, and rich valuation CMS.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
