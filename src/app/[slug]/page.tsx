import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

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
  } catch (error) {
    console.error('Failed to fetch article from database, checking mock data:', error);
  }
  return mockArticles.find(a => a.slug === slug) || null;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

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
        <div className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed space-y-6 whitespace-pre-wrap">
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
      </article>
    </main>
  );
}
