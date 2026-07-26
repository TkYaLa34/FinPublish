export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  category?: string | null;
  authorId: string;
  author?: User;
  createdAt: Date | string;
  updatedAt: Date | string;
}
