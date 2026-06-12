import { profile, projectsSection, stackSection } from "./content.js";

const app = document.querySelector("#app");
const navLinks = Array.from(document.querySelectorAll("[data-route-link]"));

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
};

const createLink = (className, text, href) => {
  const link = createElement("a", className, text);
  link.href = href;
  return link;
};

const formatIndex = (index) => String(index + 1).padStart(2, "0");

const createSectionHeading = ({ eyebrow, title, description }) => {
  const heading = createElement("div", "section-heading");
  heading.append(createElement("p", "eyebrow", eyebrow));
  heading.append(createElement("h1", "", title));
  heading.append(createElement("p", "", description));
  return heading;
};

const renderProfilePage = () => {
  const section = createElement("section", "hero section-shell");
  const copy = createElement("div", "hero-copy");
  const actions = createElement("div", "hero-actions");
  const panel = createElement("aside", "profile-panel");
  const avatar = createElement("img", "avatar");
  const metaList = createElement("dl");

  actions.setAttribute("aria-label", "快捷跳转");
  actions.append(createLink("primary-link", "查看项目", "#/projects"));
  actions.append(createLink("secondary-link", "了解技术栈", "#/stack"));

  copy.append(createElement("p", "eyebrow", "Personal Blog"));
  copy.append(createElement("h1", "", profile.title));
  copy.append(createElement("p", "hero-text", profile.intro));
  copy.append(actions);

  avatar.src = "./public/小鸭.svg";
  avatar.alt = "博客头像";
  panel.setAttribute("aria-label", "个人信息摘要");
  panel.append(avatar);

  profile.meta.forEach((item) => {
    const row = createElement("div");
    row.append(createElement("dt", "", item.label));
    row.append(createElement("dd", "", item.value));
    metaList.append(row);
  });
  panel.append(metaList);

  section.append(copy);
  section.append(panel);
  return section;
};

const renderStackNav = (activeId) => {
  const nav = createElement("div", "stack-jump-nav");
  nav.setAttribute("aria-label", "技术栈子导航");

  stackSection.items.forEach((item) => {
    const link = createLink("stack-jump-link", item.title, `#/stack/${item.id}`);
    link.classList.toggle("active", item.id === activeId);
    nav.append(link);
  });

  return nav;
};

const createStackCard = (item, index) => {
  const card = createElement("article", "stack-card");
  card.append(createElement("span", "card-index", formatIndex(index)));
  card.append(createElement("h3", "", item.title));
  card.append(createElement("p", "", item.description));
  card.append(createLink("inline-link", "进入专题", `#/stack/${item.id}`));
  return card;
};

const renderStackPage = () => {
  const section = createElement("section", "section-shell content-section");
  const stackList = createElement("div", "stack-grid");

  stackSection.items.forEach((item, index) => {
    stackList.append(createStackCard(item, index));
  });

  section.append(
    createSectionHeading({
      eyebrow: "Tech Stack",
      title: "技术栈",
      description: stackSection.description,
    }),
  );
  section.append(renderStackNav());
  section.append(stackList);
  return section;
};

const renderTechDetailPage = (techId) => {
  const item = stackSection.items.find((stackItem) => stackItem.id === techId);

  if (!item) {
    return renderNotFoundPage();
  }

  const section = createElement("section", "section-shell content-section");
  const article = createElement("article", "tech-detail single-tech-detail");
  const heading = createElement("div", "tech-detail-heading");
  const learningBlock = createElement("div", "tech-detail-block");
  const notesBlock = createElement("div", "tech-detail-block");
  const learningList = createElement("ol");
  const notesList = createElement("ul");

  heading.append(createElement("p", "project-type", "技术专题"));
  heading.append(createElement("h1", "", item.title));
  heading.append(createElement("p", "", item.summary));

  learningBlock.append(createElement("h4", "", "学习路径"));
  item.learningPath.forEach((step) => {
    learningList.append(createElement("li", "", step));
  });
  learningBlock.append(learningList);

  notesBlock.append(createElement("h4", "", "教学重点"));
  item.teachingNotes.forEach((note) => {
    notesList.append(createElement("li", "", note));
  });
  notesBlock.append(notesList);

  article.append(heading);
  article.append(learningBlock);
  article.append(notesBlock);

  section.append(createLink("route-back", "返回技术栈", "#/stack"));
  section.append(renderStackNav(item.id));
  section.append(article);
  return section;
};

const renderProjectsPage = () => {
  const section = createElement("section", "section-shell content-section");
  const projectList = createElement("div", "project-list");

  projectsSection.items.forEach((item) => {
    const card = createElement("article", "project-card");
    const heading = createElement("div");
    const highlights = createElement("ul");

    heading.append(createElement("p", "project-type", item.type));
    heading.append(createElement("h3", "", item.title));

    item.highlights.forEach((highlight) => {
      highlights.append(createElement("li", "", highlight));
    });

    card.append(heading);
    card.append(createElement("p", "", item.description));
    card.append(highlights);
    projectList.append(card);
  });

  section.append(
    createSectionHeading({
      eyebrow: "Projects",
      title: "项目经历",
      description: projectsSection.description,
    }),
  );
  section.append(projectList);
  return section;
};

const renderNotFoundPage = () => {
  const section = createElement("section", "section-shell content-section");
  section.append(
    createSectionHeading({
      eyebrow: "Not Found",
      title: "页面不存在",
      description: "这个路由暂时没有对应内容，可以回到首页或技术栈继续浏览。",
    }),
  );
  section.append(createLink("primary-link", "回到首页", "#/profile"));
  return section;
};

const getRoute = () => {
  const route = window.location.hash.replace(/^#/, "") || "/profile";
  return route.startsWith("/") ? route : `/${route}`;
};

const setActiveNav = (route) => {
  navLinks.forEach((link) => {
    const linkRoute = link.dataset.routeLink;
    const isActive =
      route === linkRoute || (linkRoute === "/stack" && route.startsWith("/stack/"));

    link.classList.toggle("active", isActive);
  });
};

const renderRoute = () => {
  const route = getRoute();
  const [, page, techId] = route.split("/");
  let view;

  if (route === "/") {
    window.location.hash = "#/profile";
    return;
  }

  if (page === "profile") {
    view = renderProfilePage();
  } else if (page === "stack" && techId) {
    view = renderTechDetailPage(techId);
  } else if (page === "stack") {
    view = renderStackPage();
  } else if (page === "projects") {
    view = renderProjectsPage();
  } else {
    view = renderNotFoundPage();
  }

  app.replaceChildren(view);
  setActiveNav(route);
  window.scrollTo(0, 0);
};

window.addEventListener("hashchange", renderRoute);
renderRoute();
