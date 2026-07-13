import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

export type Article = {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  updated?: string;
  readTime: string;
  category: string;
  tags: string[];
  cover: string;
  featured: boolean;
  href: string;
};

const estimateReadTime = (body: string) => {
  const characters = body.replace(/\s/g, "").length;
  return `${Math.max(1, Math.ceil(characters / 500))} 分钟阅读`;
};

export const toArticle = (post: PostEntry): Article => ({
  ...post.data,
  readTime: estimateReadTime(post.body ?? ""),
  href: `/posts/${post.data.slug}`
});

export const getArticles = async () => {
  const posts = await getCollection("posts");
  return posts.map(toArticle).sort((a, b) => b.date.localeCompare(a.date));
};

export const getTaxonomy = (articles: Article[]) => {
  const categoryCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const article of articles) {
    categoryCounts.set(article.category, (categoryCounts.get(article.category) ?? 0) + 1);
    for (const tag of article.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  const categories = [...categoryCounts.entries()].map(([name, count]) => ({
    name,
    count,
    description: name === "AI" ? "RAG、模型应用与 AI 工程实践" : "后端服务、系统设计与工程化实践"
  }));
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

  return { categories, tags };
};
