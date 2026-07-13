export type Project = {
  name: string;
  description: string;
  stack: string[];
  github: string;
  demo: string;
  image: string;
};

export const siteConfig = {
  name: "Yukai's Blog",
  description: "记录后端、系统和 AI 工具的实践笔记。",
  author: "yukaijun",
  role: "这里主要记录学习和做项目时踩过的坑：后端服务、RAG、自动化测试、工程化，以及把一个想法真正跑起来的过程。",
  socials: {
    github: "https://github.com/yukaijun2001",
    email: "mailto:yukaijun2001@users.noreply.github.com"
  }
};

export const navItems = [
  { label: "首页", href: "/" },
  { label: "文章", href: "/archive" },
  { label: "标签", href: "/tags" },
  { label: "关于", href: "/about" }
];
