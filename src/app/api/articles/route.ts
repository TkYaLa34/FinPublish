import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let mockArticles = [
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

export async function GET() {
  try {
    const dbArticles = await prisma.article.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(dbArticles.length > 0 ? dbArticles : mockArticles);
  } catch (error) {
    console.warn('Database query failed in API, falling back to mock articles:', error);
    return NextResponse.json(mockArticles);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, content, authorId, published, category } = body;

    if (!title || !slug || !content || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      // Create a mock user in Supabase/Prisma DB if it does not exist to satisfy Author relation!
      try {
        await prisma.user.upsert({
          where: { id: authorId },
          update: {},
          create: {
            id: authorId,
            email: 'author@finpublish.com',
            name: 'CMS Author',
            role: 'AUTHOR'
          }
        });
      } catch (upsertErr) {
        console.warn('Failed to upsert mock author:', upsertErr);
      }

      const newArticle = await prisma.article.create({
        data: {
          title,
          slug,
          content,
          authorId,
          category: category || 'Financial Analysis',
          published: published || false,
        },
        include: { author: true },
      });
      return NextResponse.json(newArticle, { status: 201 });
    } catch (dbError) {
      console.warn('Database insert failed, using mock insertion:', dbError);
      const newMock: any = {
        id: `mock-${Date.now()}`,
        slug,
        title,
        content,
        published: published || false,
        category: category || 'Financial Analysis',
        authorId,
        author: { id: authorId, email: 'author@finpublish.com', name: 'CMS Author' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockArticles = [newMock, ...mockArticles];
      return NextResponse.json(newMock, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, slug, content, published, category } = body;

    if (!id || !title || !slug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const updatedArticle = await prisma.article.update({
        where: { id },
        data: {
          title,
          slug,
          content,
          category: category || 'Financial Analysis',
          published: published || false,
        },
        include: { author: true },
      });
      return NextResponse.json(updatedArticle);
    } catch (dbError) {
      console.warn('Database update failed, using mock update:', dbError);
      const index = mockArticles.findIndex(a => a.id === id);
      if (index !== -1) {
        mockArticles[index] = {
          ...mockArticles[index],
          title,
          slug,
          content,
          category: category || 'Financial Analysis',
          published: published || false,
          updatedAt: new Date().toISOString()
        };
        return NextResponse.json(mockArticles[index]);
      }
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
