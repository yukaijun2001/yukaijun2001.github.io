# Yukai's Blog

基于 ykjBlog（Astro + Tailwind CSS）迁移的个人博客，用于记录后端、系统和 AI 工具的实践笔记。

## 本地开发

```bash
npm install
npm run dev
```

开发服务默认运行在 `http://127.0.0.1:4321/`。

## 构建

```bash
npm run build
npm run preview
```

静态产物生成在 `dist/` 目录。

## 写作

文章位于 `src/content/posts/`，使用 Markdown 编写。每篇文章需要提供以下 frontmatter：

```yaml
---
title: 文章标题
slug: article-slug
date: "2026-07-01T08:00:00+08:00"
excerpt: 文章摘要
category: AI
cover: /images/cover-ai.svg
featured: false
tags:
  - 学习
---
```

站点名称、作者和社交链接在 `src/data/site.ts` 中维护。
