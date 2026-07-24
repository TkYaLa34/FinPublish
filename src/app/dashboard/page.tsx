"use client";

import React, { useState, useEffect } from 'react';
import { Editor } from '@/components/editor/editor';
import { ValuationCard } from '@/components/finance/valuation-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FinancialData } from '@/types/finance';
import { Article } from '@/types/article';
import { Edit, Eye, Plus, Check, Loader2, RefreshCw } from 'lucide-react';

export default function AuthorDashboard() {
  const [tickers, setTickers] = useState<FinancialData[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedTickerSymbol, setSelectedTickerSymbol] = useState<string>('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Financial Analysis');
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [financeRes, articlesRes] = await Promise.all([
        fetch('/api/finance'),
        fetch('/api/articles')
      ]);
      const financeData = await financeRes.json();
      const articlesData = await articlesRes.json();

      setTickers(financeData);
      setArticles(articlesData);

      if (financeData && financeData.length > 0) {
        setSelectedTickerSymbol(financeData[0].symbol);
      }
    } catch (err) {
      console.error('Error loading dashboard datasets:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) {
      setSubmitMessage('Please fill out all fields before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          published,
          category,
          authorId: 'mock-author'
        }),
      });

      if (res.ok) {
        setSubmitMessage('Article published and saved successfully!');
        setTitle('');
        setSlug('');
        setContent('');
        setCategory('Financial Analysis');
        setPublished(false);
        loadData();
      } else {
        const err = await res.json();
        setSubmitMessage(`Failed to save: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSubmitMessage('Failed to make API request.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTicker = tickers.find(t => t.symbol === selectedTickerSymbol);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Author CMS Editor</h1>
            <p className="text-slate-500 text-sm">Write, review, and distribute quantitative newsletters</p>
          </div>
          <Button onClick={loadData} variant="secondary" size="sm" className="inline-flex items-center space-x-1">
            <RefreshCw className="w-4 h-4" />
            <span>Sync</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Compose New Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePublish} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Analysis Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. NVIDIA Q3 Earnings"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="nvidia-q3-earnings"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-md outline-none focus:border-blue-500 bg-slate-50 transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Value Investing, Tech, etc."
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Content Body (Markdown Supported)</label>
                <Editor value={content} onChange={setContent} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="published-checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="published-checkbox" className="text-sm font-medium text-slate-700">
                    Publish immediately (make visible in main feed)
                  </label>
                </div>

                <Button type="submit" disabled={submitting} className="px-6">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Analysis'}
                </Button>
              </div>

              {submitMessage && (
                <div className={`p-4 rounded-md text-sm font-medium ${
                  submitMessage.includes('success')
                    ? 'bg-green-50 text-green-800 border border-green-100'
                    : 'bg-red-50 text-red-800 border border-red-100'
                }`}>
                  {submitMessage}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">My Published Newsletters ({articles.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {articles.map((art) => (
              <div key={art.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{art.title}</h4>
                  <p className="text-xs text-slate-400">/{art.slug} • {art.category || 'Analysis'} • Created {new Date(art.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    art.published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {art.published ? 'Published' : 'Draft'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setTitle(art.title);
                    setSlug(art.slug);
                    setContent(art.content);
                    setCategory(art.category || 'Financial Analysis');
                    setPublished(art.published);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Widget Previewer</h2>
          <p className="text-xs text-slate-500">Pick a stock widget to format or review before pasting in newsletters</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Select Target Asset</label>
            <select
              value={selectedTickerSymbol}
              onChange={(e) => setSelectedTickerSymbol(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm outline-none focus:border-blue-500"
            >
              {tickers.map(t => (
                <option key={t.symbol} value={t.symbol}>{t.symbol} - {t.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-400 mb-3 font-semibold uppercase">Live CMS Render View</p>
            {selectedTicker ? (
              <ValuationCard {...selectedTicker} />
            ) : (
              <div className="h-48 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                No stock loaded
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-800 space-y-1">
            <p className="font-bold">Author Tip:</p>
            <p>You can reference metrics in your markdown post. For example, mention Apple&apos;s PE ratio is <span className="font-semibold">{tickers.find(t => t.symbol === 'AAPL')?.peRatio || '28.4'}</span>!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
