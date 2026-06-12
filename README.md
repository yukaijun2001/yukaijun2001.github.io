# yukaijun.github.io
ykj的博客

## 内容维护

网站内容集中在 `src/content.js`：

- 修改个人简介：编辑 `profile`
- 新增技术栈：在 `stackSection.items` 数组里追加一项
- 新增项目经历：在 `projectsSection.items` 数组里追加一项

页面结构在 `index.html`，样式在 `src/styles.css`，交互逻辑在 `src/main.js`。

当前站点使用 hash 路由，适合直接部署到 GitHub Pages：

- `#/profile`：个人简介
- `#/stack`：技术栈
- `#/stack/fastapi`：FastAPI 技术专题
- `#/stack/langgraph`：LangGraph 技术专题
- `#/stack/agent`：Agent 技术专题
- `#/projects`：项目经历
