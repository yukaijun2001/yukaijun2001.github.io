import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.string(),
    updated: z.string().optional(),
    excerpt: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string(),
    featured: z.boolean().default(false)
  })
});

export const collections = { posts };
