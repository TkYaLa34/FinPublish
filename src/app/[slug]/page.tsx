import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ValuationCard } from '@/components/finance/valuation-card';
import { FinancialChart } from '@/components/finance/charts';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

const defaultFinanceData = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 189.84,
    change: 2.34,
    changePercent: 1.25,
    marketCap: 2950000000000,
    peRatio: 28.4,
    dividendYield: 0.51,
    historical: [
      { date: 'Mon', price: 185.2 },
      { date: 'Tue', price: 186.9 },
      { date: 'Wed', price: 184.5 },
      { date: 'Thu', price: 187.5 },
      { date: 'Fri', price: 189.84 },
    ]
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 178.47,
    change: -5.12,
    changePercent: -2.79,
    marketCap: 568000000000,
    peRatio: 45.2,
    dividendYield: 0,
    historical: [
      { date: 'Mon', price: 185.0 },
      { date: 'Tue', price: 182.1 },
      { date: 'Wed', price: 183.5 },
      { date: 'Thu', price: 180.2 },
      { date: 'Fri', price: 178.47 },
    ]
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 415.60,
    change: 4.88,
    changePercent: 1.19,
    marketCap: 3090000000000,
    peRatio: 35.8,
    dividendYield: 0.72,
    historical: [
      { date: 'Mon', price: 408.3 },
      { date: 'Tue', price: 410.5 },
      { date: 'Wed', price: 409.1 },
      { date: 'Thu', price: 412.0 },
      { date: 'Fri', price: 415.60 },
    ]
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 875.12,
    change: 18.54,
    changePercent: 2.16,
    marketCap: 2180000000000,
    peRatio: 72.4,
    dividendYield: 0.02,
    historical: [
      { date: 'Mon', price: 840.1 },
      { date: 'Tue', price: 852.3 },
      { date: 'Wed', price: 848.0 },
      { date: 'Thu', price: 865.2 },
      { date: 'Fri', price: 875.12 },
    ]
  }
];

const mockArticles = [
  {
    id: 'mock-1',
    slug: 'future-of-ai-financial-analysis',
    title: 'The Future of AI-Driven Financial Analysis',
    content: '# The Future of AI-Driven Financial Analysis\n\nArtificial Intelligence is changing the landscape of financial reporting and analysis. In this article, we cover how machine learning is predicting valuation trends and optimizing portfolios.\n\n## 1. Machine Learning in Action\nUsing advanced regression models, analysts can parse balance sheets in milliseconds.\n\n## 2. Benefits for Retail Investors\nWith high-speed CMS systems, retail investors gain access to institutional-grade analytics.',
    published: true,
    category: 'Financial Technology',
    authorId: 'mock-author',
    author: { id: 'mock-author', email: 'jules@finpublish.com', name: 'Jules Dev' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    slug: 'understanding-stock-valuation',
    title: 'Understanding Stock Valuation: Multiples vs Discounted Cash Flow',
    content: '# Understanding Stock Valuation\n\nHow do we determine if a stock is cheap or expensive? We compare Multiples (like P/E or EV/EBITDA) with Discounted Cash Flow (DCF) analyses.\n\n## 1. Relative Valuation\nComparing metrics with peers is fast and highlights relative discounts.\n\n## 2. Intrinsic Valuation\nDCF models represent the true present value of future cash flows.',
    published: true,
    category: 'Value Investing',
    authorId: 'mock-author',
    author: { id: 'mock-author', email: 'jules@finpublish.com', name: 'Jules Dev' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function getArticle(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: { author: true },
    });
    if (article) return article;
  } catch (_error) {
    console.error('Failed to fetch article from database, checking mock data:', _error);
  }
  return mockArticles.find(a => a.slug === slug) || null;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Detect matching stock ticker symbols in content or title
  const normalizedText = (article.title + ' ' + article.content).toUpperCase();
  const matchedStocks = defaultFinanceData.filter(stock =>
    normalizedText.includes(stock.symbol)
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <article className="max-w-3xl mx-auto">
        {/* Navigation Back */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← กลับสู่หน้าหลัก
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-3">
            <span>{article.category || 'Financial Analysis'}</span>
            <span>•</span>
            <span>{new Date(article.createdAt).toLocaleDateString('th-TH')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            {article.title}
          </h1>
          <div className="flex items-center space-x-3 text-sm text-slate-400">
            <span>เขียนโดย: <strong className="text-slate-200">{article.author?.name || 'FinPublish Analyst'}</strong></span>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed space-y-6 whitespace-pre-wrap mb-12">
          {article.content.split('\n').map((para, i) => {
            if (para.startsWith('# ')) {
              return <h1 key={i} className="text-3xl font-extrabold text-white mt-6 mb-3">{para.replace('# ', '')}</h1>;
            }
            if (para.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-bold text-white mt-4 mb-2">{para.replace('## ', '')}</h2>;
            }
            if (para.startsWith('- ') || para.startsWith('* ')) {
              return <li key={i} className="ml-4 list-disc text-slate-300">{para.substring(2)}</li>;
            }
            return <p key={i} className="mb-4 leading-relaxed">{para}</p>;
          })}
        </div>

        {/* Embedded Stock Valuation and Chart Widgets */}
        {matchedStocks.length > 0 && (
          <div className="border-t border-slate-800 pt-8 mt-12 space-y-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-wide">ข้อมูลวิเคราะห์หลักทรัพย์ที่เกี่ยวข้อง (Asset Deep-Dive)</h3>
              <p className="text-xs text-slate-400">เครื่องมือวิเคราะห์จำลองและสถิติย้อนหลังของบริษัทที่ถูกอ้างอิงในบทวิเคราะห์</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {matchedStocks.map(stock => (
                <div key={stock.symbol} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-xl">
                  {/* Valuation Card inside dark page container */}
                  <div className="text-slate-900">
                    <ValuationCard {...stock} />
                  </div>
                  {/* Line Chart showing historical prices */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stock.symbol} Historical Line Chart</h4>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <FinancialChart symbol={stock.symbol} data={stock.historical} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
