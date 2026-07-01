---
title: ai-software-engineering-backend 学习路线
date: 2026-06-30 16:00:00
tags:
  - 学习
  - 后端
---

# ai-software-engineering-backend 学习路线

> 重点目录：`/home/ykj/ai-software-engineering-backend/app`

这份文档按“请求链路 + 功能模块”来学习项目，不再把接口说明追加到最后，而是把每个接口、Service、模型、任务、AI 流程的具体实现融合到对应章节中。

---

## 1. 先建立项目整体认知

### 目标

理解这是一个基于 FastAPI 的 AI 后端服务，核心能力包括：

1. 用户认证：登录、JWT、API Key。
2. 会话聊天：普通聊天、插件聊天、widget 聊天、Skills 聊天。
3. 数据管理：conversation、message、attachment、excel_file。
4. 文档处理：附件上传、SFS 文档解析、目录生成、后台深度分析。
5. AI 代码生成：旧版 `CodeGenPipeline` 和新版 `Skills` 架构。
6. 测试用例生成：上传 docx/xlsx，后台生成 Excel 测试用例。
7. RAG/API 检索：代码生成时检索参考代码和 API。
8. Spinner 转换：Markdown 表格说明转 Matrix Table CSV。

### 应用入口：`app/main.py`

`app/main.py` 是整个服务启动入口，主要做 4 件事：

1. 创建 FastAPI 应用。
2. 初始化日志和 Skills。
3. 注册 CORS 中间件。
4. 注册所有 API 路由。

#### FastAPI 创建逻辑

`create_app()` 创建 FastAPI 实例：

- `title=settings.PROJECT_NAME`
- `version=settings.VERSION`
- `openapi_url="/api/openapi.json"`
- `docs_url="/api/docs"`
- `lifespan=lifespan`

服务启动时，如果直接执行该文件，会通过 uvicorn 启动：

- host：`0.0.0.0`
- port：`8000`
- reload：`True`
- log_level：来自 `settings.LOG_LEVEL`

#### lifespan 启动逻辑

应用启动时会执行：

1. `AppLogger().setup()` 初始化日志。
2. 尝试导入 `SkillRegistry`。
3. 调用 `SkillRegistry.load_builtin_skills()` 预加载内置 Skills。
4. 打印已加载 Skills 名称。
5. 如果加载失败，只打印 warning，不阻止应用启动。

#### 路由注册总览

| 路由前缀 | 文件 | 功能 |
|---|---|---|
| `/api/auth` | `app/apis/auth.py` | 登录、token、登出、access codes |
| `/api/user` | `app/apis/user.py` | 当前用户信息、刷新 API Key |
| `/api/conversation` | `app/apis/conversation.py` | 会话增删改查 |
| `/api/message` | `app/apis/message.py` | 消息增删改查 |
| `/api/chat` | `app/apis/chat.py` | 普通聊天、插件聊天、Skills 聊天 |
| `/api/attachment` | `app/apis/attachment.py` | 附件上传、下载、删除、SFS 分析 |
| `/api/excel` | `app/apis/excel_file.py` | Excel 文件 CRUD、WebSocket 协同 |
| `/api/test/generate-test-cases` | `app/apis/test_cases.py` | 测试用例生成任务 |
| `/api/spinner` | `app/apis/spinner.py` | Markdown 转 Matrix Table CSV |

### 配置中心：`app/core/config.py`

学习时重点关注：

1. 数据库连接：同步和异步数据库 URI。
2. JWT：`SECRET_KEY`、`ALGORITHM`、token 过期时间。
3. OpenAI/WOKAAI：模型地址、模型名、API Key、temperature、max_tokens。
4. Redis：测试用例任务和可能的缓存依赖。
5. 文件目录：上传目录、生成目录、临时目录、模板文件目录。
6. RAG/API 索引目录：代码生成阶段会用到。

### 鉴权核心：`app/core/security.py`

#### 密码处理

- 使用 passlib 的 bcrypt。
- `get_password_hash(password)`：生成密码哈希。
- `verify_password(plain_password, hashed_password)`：校验明文密码和哈希是否匹配。

#### JWT 处理

- `create_access_token(data={"user_id": user.id})`：生成 access token。
- `create_refresh_token(data={"user_id": user.id})`：生成 refresh token。
- 两者都会写入 `exp` 过期时间。
- `decode_token(token)`：校验签名和过期时间。
- token 过期返回 401：`Token 已过期`。
- token 无效返回 401：`无效的 Token`。

#### 当前用户识别

`get_current_user_id()` 是很多 API 的鉴权依赖：

1. 从 `Authorization: Bearer <token>` 读取 token。
2. 调用 `decode_token()` 解码。
3. 从 payload 读取 `user_id`。
4. 如果缺少 `user_id`，返回 401。
5. 成功时把 `user_id` 注入到 API 函数参数中。

### 数据库 Session：`app/db/session.py`

项目同时提供同步和异步 session。

#### 同步 engine

- 使用 `settings.SQLALCHEMY_DATABASE_URI`。
- `pool_recycle=3600`。
- `pool_pre_ping=True`。
- `echo=True`，会打印 SQL。

#### 异步 engine

- 使用 `settings.ASYNC_SQLALCHEMY_DATABASE_URI`。
- `async_sessionmaker(..., expire_on_commit=False)`。
- `get_async_session()` 是 API 层常用依赖。

`get_async_session()` 的执行逻辑：

1. 创建 `AsyncSession`。
2. yield 给 API 使用。
3. 如果 API 过程中异常，rollback。
4. finally close。

### 需要弄清楚的问题

- 服务启动后注册了哪些 API？
- 请求如何从 `main.py` 进入 `apis`？
- API 层如何通过 Depends 注入用户和数据库？
- 配置项从哪里读取？哪些必须放在 `.env`？
- 哪些接口需要 JWT？哪些接口公开？哪些接口使用 API Key？

---

## 2. 学习 API 层：请求从哪里进入

### 目录

`app/apis/`

API 层主要负责：

1. 定义路由路径和 HTTP 方法。
2. 接收请求参数。
3. 注入当前用户和数据库 session。
4. 调用 Service。
5. 将结果包装成响应。
6. 将异常转换为 HTTP 状态码。

---

### 2.1 认证接口：`app/apis/auth.py`

#### `POST /api/auth/login` 用户登录

该接口兼容 JSON 和表单两种登录方式。

请求格式：

1. JSON：`Content-Type: application/json`
   - `username`
   - `password`
2. 表单：`Content-Type: application/x-www-form-urlencoded`
   - `username`
   - `password`

实现流程：

1. API 依赖 `get_credentials(request)` 解析用户名密码。
2. 如果是 JSON，读取 body 后用 `LoginRequest` 校验。
3. 如果是表单，读取 form，并检查字段是否存在。
4. 如果 content type 不支持，返回 415。
5. 调用 `AuthService.handle_login_async(session, username, password)`。
6. service 查询 `User.username == username`。
7. 调用 `verify_password()` 校验密码。
8. 校验失败返回 401。
9. 成功时生成 access token 和 refresh token。
10. 返回 `ResponseWrapper[LoginData]`。

返回数据包括：

- `access_token`
- `refresh_token`
- `user_id`
- `username`
- `real_name`

#### `POST /api/auth/token` OAuth2 登录

实现流程：

1. 使用 FastAPI 的 `OAuth2PasswordRequestForm` 解析表单。
2. 调用同一个 `AuthService.handle_login_async()`。
3. 成功时直接返回 `LoginData`，不包 `ResponseWrapper`。
4. 适合 Swagger Authorize 或 OAuth2 客户端。

#### `POST /api/auth/refresh` 刷新 access token

实现流程：

1. 先通过 `get_current_user_id` 校验当前 token。
2. 调用 `AuthService.handle_refresh(user_id)`。
3. 重新生成 access token。
4. 返回 `{"access_token": new_token}`。

注意：当前实现不是使用 refresh token 换 access token，而是用当前 access token 续签。

#### `POST /api/auth/logout` 登出

实现流程：

1. 依赖 `get_current_user_id` 校验登录态。
2. 服务端不维护 token blacklist。
3. 直接返回成功。
4. 前端需要自行丢弃 token。

#### `GET /api/auth/codes` 获取 Access Codes

实现流程：

1. 获取当前用户 ID。
2. 调用 `AuthService.handle_access_codes_async()`。
3. 查询 `AccessCode.user_id == user_id`。
4. 返回该用户的所有 access code 字符串。

---

### 2.2 用户接口：`app/apis/user.py`

#### `GET /api/user/info` 获取当前用户信息

实现流程：

1. token 解析出 `user_id`。
2. 调用 `UserService.async_get_user_info(session, user_id)`。
3. 查询 `User.id == user_id`。
4. 如果用户不存在，返回 `code=1`。
5. 如果存在，返回：
   - `desc`
   - `home_path`
   - `real_name`
   - `user_id`
   - `username`
   - `api_key`

#### `POST /api/user/refresh_api_key/{user_id}` 刷新 API Key

实现流程：

1. 从路径参数读取 `user_id`。
2. 调用 `UserService.refresh_api_key(session, user_id)`。
3. 查询用户。
4. 使用 `secrets.token_hex(16)` 生成 `sk-xxx` 格式 API Key。
5. 最多重试 3 次处理唯一键冲突。
6. 写入 `user.api_key`。
7. commit 后返回新 API Key。

注意：该接口当前没有 `get_current_user_id` 鉴权依赖，路径中传哪个用户 ID 就刷新哪个用户的 key，这是学习时要特别注意的权限风险点。

---

### 2.3 会话接口：`app/apis/conversation.py`

#### `GET /api/conversation/info/{conversation_id}` 获取会话详情

实现流程：

1. 从 path 获取 `conversation_id`。
2. 从 token 获取 `user_id`。
3. 调用 `ConversationService.async_get()`。
4. 查询条件：
   - 会话 ID 匹配。
   - 用户 ID 匹配。
   - `visibility == private`。
5. 查不到返回 404。
6. 查到后转成 `ConversationRead` 返回。

#### `GET /api/conversation/list` 分页获取会话

查询参数：

- `page`：默认 1。
- `per_page`：默认 10，最大 1000。

实现流程：

1. 统计当前用户会话总数。
2. 用 `math.ceil(total / per_page)` 计算总页数。
3. 按 `created_at.desc()` 排序。
4. 使用 offset 和 limit 分页。
5. 返回 `Pagination[ConversationRead]`。

#### `POST /api/conversation/create` 创建会话

实现流程：

1. 请求体使用 `ConversationCreate`。
2. service 构建 `Conversation(user_id=user_id, **data.model_dump())`。
3. add、commit、refresh。
4. 返回新会话。

#### `PUT /api/conversation/update/{conversation_id}` 更新会话

实现流程：

1. 查询会话并校验归属。
2. 不存在或已软删返回 404。
3. 遍历 `data.model_dump(exclude_unset=True)`。
4. 对传入字段逐个 `setattr()`。
5. commit 后返回更新结果。

#### `DELETE /api/conversation/delete/{conversation_id}` 软删除会话

实现流程：

1. 使用 `selectinload(Conversation.messages)` 预加载消息。
2. 查询会话并校验归属。
3. 不存在或已删除返回 404。
4. 调用 `await conv.soft_delete_async()`。
5. `SoftDeleteMixin` 设置 `deleted_at`，并递归处理子对象。
6. commit 后返回成功。

---

### 2.4 消息接口：`app/apis/message.py`

#### `GET /api/message/info/{message_id}` 获取消息详情

实现流程：

1. 根据 `message_id` 和当前 `user_id` 查询消息。
2. 不存在返回 404。
3. 存在返回 `MessageRead`。

#### `GET /api/message/list` 获取会话消息

查询参数：

- `conversation_id`：必填。
- `page`：默认 1。
- `per_page`：默认 10，最大 1000。

实现流程：

1. 统计当前用户在指定会话下的消息总数。
2. 查询消息列表。
3. 当前异步实现按 `created_at` 倒序排序。
4. 返回分页结果。

#### `POST /api/message/create` 创建消息

实现流程：

1. 请求体是 `MessageCreate`。
2. 字段包括：
   - `conversation_id`
   - `content`
   - `type`
   - `json_data`
   - `tool`
   - `tool_args`
   - `extra`
3. service 构建 `Message(user_id=user_id, **data.model_dump())`。
4. add、commit、refresh。
5. 返回 `MessageRead`。

#### `PUT /api/message/update/{message_id}` 更新消息

实现流程：

1. 请求体是 `MessageUpdate`。
2. 当前只允许更新 `content` 和 `extra`。
3. 先校验消息归属。
4. 不存在或已删除返回 404。
5. 逐字段更新并提交。

#### `DELETE /api/message/delete/{message_id}` 软删除消息

实现流程：

1. 查询消息并预加载 `Message.attachments`。
2. 校验归属。
3. 调用 `await msg.soft_delete_async()`。
4. commit 后返回成功。

---

### 2.5 附件接口：`app/apis/attachment.py`

#### `GET /api/attachment/info/{attachment_id}` 获取附件详情

实现流程：

1. 调用 `AttachmentService.get(session, attachment_id, user_id)`。
2. 先按附件 ID 查询附件。
3. 不存在返回 404。
4. 如果传入 user_id，则 join `Attachment.users` 校验用户是否有权限访问该附件。
5. 无权限返回 403。
6. 返回附件信息。

#### `DELETE /api/attachment/delete/{attachment_id}` 删除附件

实现流程：

1. 复用 `AttachmentService.get()` 校验附件存在和权限。
2. 调用 `await att.soft_delete_async(recursive=False)`。
3. commit。
4. 返回 HTTP 204。

#### `POST /api/attachment/upload` 上传附件

表单字段：

- `conversation_id`：必填。
- `tool`：可选。
- `extra`：可选 JSON 字符串。
- `file`：必填。

API 实现流程：

1. 如果传入 `extra`，用 `json.loads(extra)` 解析。
2. JSON 解析失败返回 400。
3. 调用 `AttachmentService.upload()`。
4. service 返回附件和自动创建的 message_id。
5. 如果 `tool == MessageTool.sfs_analyze`，调用 `SfsAnalyzeHandler.sfs_analyze()`。
6. SFS 分析立即生成 catalog，并启动后台深度处理任务。
7. API 创建一条 tool 消息，`json_data={"catalog": catalog}`。
8. 返回 `AttachmentRead`，并填充 `message_id`。

Service 上传流程：

1. 校验用户存在。
2. 校验 conversation 存在且属于当前用户。
3. 构建一条用户文件消息：`File {filename} uploaded`。
4. 计算上传文件 MD5。
5. 按 hash 查询附件，包含软删除记录。
6. 如果附件已存在：
   - 磁盘文件不存在则重新保存。
   - 恢复软删除。
   - 关联当前用户。
   - 关联新消息。
   - commit 后返回已有附件。
7. 如果附件不存在：
   - 保存上传文件到磁盘。
   - 创建 Attachment。
   - 记录 filename、mimetype、url、hash、size、extra。
   - 关联用户和消息。
   - commit 后返回新附件。
8. 如果并发导致 `IntegrityError`：
   - rollback。
   - 删除刚保存的临时文件。
   - 重新查询已有附件。
   - 走已有附件关联逻辑。

#### `GET /api/attachment/download/{attachment_id}` 下载附件

实现流程：

1. 校验附件存在和用户权限。
2. 检查 `att.url` 是否存在于磁盘。
3. 文件不存在返回 404。
4. 使用 `FileResponse` 返回文件。
5. `media_type` 使用附件 mimetype。
6. 下载文件名使用附件 filename。

---

### 2.6 聊天接口：`app/apis/chat.py`

#### `POST /api/chat/` 普通登录态聊天

实现流程：

1. 请求体是 `MessageCreate`。
2. 依赖 token 获取 `user_id`。
3. 注入数据库 session。
4. 调用 `ChatService.chat(session, user_id, msg)`。
5. 返回 `StreamingResponse`。
6. media type 是 `text/event-stream;charset=utf-8`。

ChatService 会进一步分流：

| 条件 | 方法 | 作用 |
|---|---|---|
| `msg.type == MessageType.json` | `chat_json()` | 分阶段代码生成 |
| `msg.tool == MessageTool.sfs_select` | `sfs_select()` | 基于 SFS 章节代码生成 |
| 其他 | 普通聊天 | 保存用户消息、调用 LLM、保存 assistant 消息 |

#### `POST /api/chat/v1/chat_demo` 公开插件聊天

实现流程：

1. 不需要登录。
2. 读取原始 JSON body。
3. 调用 `ChatService.plugin_chat_pipeline(body)`。
4. 兼容 OpenAI Chat Completions 风格请求。
5. 使用旧版 `CodeGenRouterStage` 做任务路由。
6. 返回 OpenAI 风格 SSE chunk。

#### `POST /api/chat/v1/chat_widget` API Key 插件聊天

实现流程：

1. 从请求头读取 `Authorization`。
2. 要求格式是 `Bearer sk-xxx`。
3. 提取 api key。
4. 调用 `UserService.verify_api_key(session, api_key)`。
5. 查询 `User.api_key == api_key`。
6. 无效返回 403。
7. 有效后复用 `plugin_chat_pipeline(body)`。

#### `POST /api/chat/v1/chat_skills` Skills 新版聊天

实现流程：

1. 不走登录态。
2. 读取 OpenAI 风格 JSON body。
3. 调用 `ChatService.plugin_chat_pipeline_skills(body)`。
4. 使用 Planner + Skills + Executor。
5. 支持跨轮次 memory。
6. 支持返回 tool_calls，并等待插件执行工具后继续。

---

### 2.7 Excel 接口：`app/apis/excel_file.py`

#### `POST /api/excel/create` 创建 Excel 文件记录

实现流程：

1. 请求体是 `ExcelFileCreate`。
2. 调用 `ExcelFileService.async_create()`。
3. service 把 `data`、`extra` 等非字符串字段序列化成 JSON 字符串。
4. 写入当前 `user_id`。
5. 创建 `ExcelFile` 记录。
6. commit 后返回 `ExcelFileRead`。

#### `GET /api/excel/list` 分页获取 Excel 文件

实现流程：

1. 查询当前用户且 `is_deleted == False` 的文件。
2. 统计 total。
3. 按 `updated_at.desc()` 排序。
4. offset + limit 分页。
5. 返回 `Pagination[ExcelFileRead]`。

#### `GET /api/excel/{file_id}` 获取详情

1. 按 `id/user_id/is_deleted=False` 查询。
2. 不存在返回 404。
3. 存在返回详情。

#### `PUT /api/excel/{file_id}` 更新 Excel 文件

1. 先查询并校验归属。
2. 不存在返回 404。
3. 只更新请求体中实际传入的字段。
4. `data`、`extra` 会转为 JSON 字符串。
5. commit 后返回更新结果。

#### `DELETE /api/excel/{file_id}` 删除 Excel 文件

1. 查询文件并校验归属。
2. 将 `is_deleted` 设置为 True。
3. commit 后返回成功。

#### `WebSocket /api/excel/ws/{file_id}` 协同同步

实现流程：

1. `ConnectionManager.active_connections` 按 file_id 保存 WebSocket 列表。
2. 新连接 accept 后加入列表。
3. 收到文本后广播给同一 file_id 下除发送者外的其他连接。
4. 断开时移除连接。
5. 如果该 file_id 下无连接，删除 key。

---

### 2.8 测试用例接口：`app/apis/test_cases.py`

#### `POST /api/test/generate-test-cases/create` 创建任务

实现流程：

1. 当前用户 ID 作为 owner。
2. `TestCasesService.create(owner=str(user_id))` 生成任务。
3. task_id 格式是 `task_{uuid}`。
4. 初始状态是 `uploading`。
5. 进度是 0。
6. 保存到 Redis hash。
7. 设置 24 小时过期。
8. 返回 task_id。

#### `POST /api/test/generate-test-cases/upload` 上传任务文件

实现流程：

1. 表单包含 `task_id` 和 file。
2. 从 Redis 获取任务。
3. 任务不存在返回 404。
4. owner 不匹配返回 403。
5. 只允许 `.docx` 和 `.xlsx`。
6. 保存到 `UPLOAD_FOLDER_PATH/{task_id}.{suffix}`。
7. docx 设置 `docx_path`。
8. xlsx 设置 `xlsx_path`。
9. 两类文件都上传后状态变为 `ready`。
10. 返回当前任务是否 ready。

#### `POST /api/test/generate-test-cases/process/{task_id}` 开始处理

实现流程：

1. 查询任务并校验 owner。
2. 要求任务 ready。
3. 未 ready 返回 400。
4. 更新进度为 0。
5. 用 `BackgroundTasks` 启动 `long_task(task_id)`。
6. 返回 202。

#### `POST /api/test/generate-test-cases/regenerate/{task_id}/{filename}` 重新生成

实现流程：

1. 查询任务并校验 owner。
2. 根据生成文件名反查原始用例名。
3. 找不到返回 404。
4. 启动 `regenerate_long_task(task_id, case_name)`。
5. 后台复用原 prompts_payload 和 case_steps，只生成指定用例。

#### `GET /api/test/generate-test-cases/status/{task_id}` 查询状态

返回 Redis 中任务状态：

- `status`
- `progress`
- `process_msg`
- `file_list`
- `created_at`
- `updated_at`
- `completed_at`

#### `GET /api/test/generate-test-cases/download/{task_id}/{filename}` 下载结果

实现流程：

1. 查询任务。
2. 任务不存在或 owner 不匹配，返回 404。
3. 要求 filename 存在于 `task.file_list`。
4. 文件路径是 `GENERATED_FILES_FOLDER_PATH/{task_id}/{filename}`。
5. 用 `FileResponse` 返回。

---

### 2.9 Spinner 接口：`app/apis/spinner.py`

#### `POST /api/spinner/generate-text`

请求体：

```json
{
  "content": "Markdown 文本"
}
```

实现流程：

1. 接收 Markdown 文本。
2. 内置一段 MatrixOne / ENOVIA Table CSV 生成 instruction。
3. 返回 OpenAI 风格 streaming。
4. 先发送 start chunk。
5. 调用外部服务 `http://spinner-service:31418/generate`。
6. payload 包含 instruction、input、max_new_tokens、temperature、top_p 等。
7. 从响应 JSON 读取 `response`。
8. `generate_csv_string()` 将模型输出按行写入单列 CSV。
9. 每一行作为 `delta.content` 返回。
10. 异常时返回 error chunk。
11. 最后发送 stop chunk 和 `[DONE]`。

---

## 3. 学习数据层：数据库模型、Schema、Session

### 目录

- `app/models/`
- `app/schemas/`
- `app/db/`

### 阅读顺序和重点

1. `app/db/session.py`
   - 看同步 engine、异步 engine。
   - 理解 `get_async_session()` 如何被 API 注入。
2. `app/db/mixins.py`
   - 关注通用字段、软删除逻辑。
   - 会话、消息、附件删除都依赖软删除能力。
3. `app/models/user.py`
   - 用户名、密码哈希、real_name、api_key。
   - 登录和 widget API Key 校验都依赖它。
4. `app/models/access_code.py`
   - `/api/auth/codes` 查询该模型。
5. `app/models/conversation.py`
   - 会话归属用户。
   - 会话可见性。
   - 与 messages 的关系。
6. `app/models/message.py`
   - 聊天主流程核心表。
   - 保存用户消息、assistant 消息、tool 消息、文件消息。
7. `app/models/attachment.py`
   - 文件元信息。
   - hash 去重。
   - 与用户、消息多对多关联。
8. `app/models/excel_file.py`
   - Excel 文件数据记录。
   - 使用 `is_deleted` 手动软删除。
9. `app/models/enums.py`
   - `MessageRole`
   - `MessageType`
   - `MessageStatus`
   - `MessageTool`
   - `ConversationVisibility`
10. `app/schemas/*.py`
   - API 请求体和响应体。
   - 例如 `MessageCreate`、`MessageRead`、`MessageUpdate` 控制消息接口可读写字段。

### Message 模型相关字段理解

学习聊天主链路时重点理解：

- `role`：system/user/assistant/tool。
- `type`：text/image/file/json。
- `status`：received/completed/unknown 等。
- `tool`：none、sfs_analyze、sfs_select 等工具类型。
- `json_data`：存阶段信息、目录、附件映射等结构化数据。
- `tool_args`：工具参数，例如 SFS 选择章节号。
- `extra`：额外扩展字段。
- `model_meta`：普通 LLM 聊天时保存模型参数。
- `reasoning_content`：可保存阶段过程或推理内容。

### 数据层需要掌握的问题

- Model 和 Schema 的边界是什么？
- 哪些字段由 API 请求传入？哪些字段由 Service 自动填充？
- 软删除是通过 `deleted_at` 还是 `is_deleted`？
- 附件如何通过多对多关系关联用户和消息？
- 消息列表为什么异步接口按倒序返回？

---

## 4. 学习 Service 层：业务逻辑主干

### 目录

`app/services/`

Service 层是真正业务逻辑所在。API 层一般只做参数接收、鉴权、异常转换，Service 层负责查库、写库、调用工具和 AI。

---

### 4.1 `auth_service.py`

核心方法：

#### `handle_login_async(session, username, password)`

1. 查询 `User.username == username`。
2. 如果用户不存在，返回 None。
3. 调用 `verify_password()` 校验密码。
4. 密码错误返回 None。
5. 创建 access token。
6. 创建 refresh token。
7. 返回 token 和用户基本信息。

#### `handle_refresh(user_id)`

1. 用 user_id 生成新的 access token。
2. 不查数据库。

#### `handle_access_codes_async(session, user_id)`

1. 查询 `AccessCode.user_id == user_id`。
2. 返回 code 字符串列表。

---

### 4.2 `user_service.py`

核心方法：

#### `async_get_user_info(session, user_id)`

1. 查询 `User.id == user_id`。
2. 不存在返回 None。
3. 存在返回用户信息 dict。

#### `refresh_api_key(session, user_id)`

1. 查询用户。
2. 生成 `sk-xxx` 格式 API Key。
3. 写入用户记录。
4. 处理唯一键冲突，最多重试 3 次。

#### `verify_api_key(session, api_key)`

1. 查询 `User.api_key == api_key`。
2. 用于 `/api/chat/v1/chat_widget`。
3. 查到返回 User，查不到返回 None。

---

### 4.3 `conversation_service.py`

核心方法：

- `async_get()`：按会话 ID、用户 ID、private 可见性查询。
- `async_list_conversations_for_user()`：统计总数并分页查询。
- `async_create()`：创建会话。
- `async_update()`：校验归属后更新传入字段。
- `async_delete()`：预加载 messages 后调用软删除。

需要注意：

1. 查询详情时会限制 `ConversationVisibility.private`。
2. 删除是软删除，不是物理删除。
3. 更新只更新 schema 允许的字段。

---

### 4.4 `message_service.py`

核心方法：

- `async_get()`：按 message_id 和 user_id 查询。
- `async_list_messages_for_conversation()`：按 user_id 和 conversation_id 分页查询。
- `async_create()`：创建消息。
- `async_update()`：只更新 `MessageUpdate` 中允许字段。
- `async_delete()`：预加载 attachments 后软删除。

需要注意：

1. 异步列表接口使用 `desc(Message.created_at)`，新消息在前。
2. 删除消息可能影响关联附件关系，所以预加载 attachments。

---

### 4.5 `attachment_service.py`

核心方法：

#### `get(session, attachment_id, user_id)`

1. 按附件 ID 查询。
2. 不存在返回 404。
3. 如果传入 user_id，则检查附件是否关联该用户。
4. 没有关联返回 403。

#### `upload(session, file, user_id, conversation_id, tool, extra)`

完整实现：

1. 校验 user。
2. 校验 conversation 属于 user。
3. 创建用户文件消息。
4. 计算文件 MD5。
5. 按 hash 查询已有附件，包含软删除。
6. 已存在则恢复、关联用户、关联消息。
7. 不存在则保存文件、创建 Attachment、关联用户和消息。
8. 并发冲突时 rollback，删除临时文件，再复用已有附件。

#### `delete(session, attachment_id, user_id)`

1. 校验附件和权限。
2. 对附件软删除。
3. 不递归删除关联对象。

---

### 4.6 `chat_service.py`

这是项目最核心的 Service，建议结合第 5 节详细学习。

主要能力：

1. `chat()`：登录态聊天总入口。
2. `get_messages()`：组装普通 LLM 上下文。
3. `chat_json()`：分阶段代码生成。
4. `sfs_select()`：基于 SFS 章节选择生成代码。
5. `plugin_chat_pipeline()`：旧插件聊天。
6. `plugin_chat_pipeline_skills()`：新版 Skills 聊天。
7. `build_event_stream()`：构造 SSE。

---

### 4.7 `sfs_analyze.py`

核心职责：把上传的 SFS/需求文档解析为目录和完整文档树。

主要方法：

- `generate_catalog()`：docx 转 HTML，再转文档树，只返回目录。
- `sfs_analyze()`：快速生成目录，并启动后台任务。
- `_process_async()`：后台深度处理，生成完整 JSON 文件。
- `needs_processing()`：判断是否需要处理。
- `is_completed()`：判断后台处理是否完成。
- `get_file_path()`：读取生成的 JSON 路径。

---

### 4.8 `excel_file_service.py`

主要逻辑：

1. 创建 Excel 文件记录。
2. 查询单个文件。
3. 分页查询用户文件。
4. 更新文件内容。
5. 用 `is_deleted=True` 手动软删除。
6. `data` 和 `extra` 如果不是字符串，会序列化成 JSON 字符串保存。

---

### 4.9 `test_cases_service.py`

这是测试用例生成任务的领域对象，状态存在 Redis。

核心字段：

- `task_id`
- `owner`
- `status`
- `progress`
- `process_msg`
- `docx_path`
- `xlsx_path`
- `case_names`
- `prompts_payload`
- `case_steps`
- `file_list`
- `error_log`

核心方法：

- `create()`：创建任务并保存 Redis。
- `get()`：从 Redis 恢复任务对象。
- `save()`：保存任务状态，设置 24 小时过期。
- `add_file()`：上传 docx/xlsx，并在两者都存在时设置 ready。
- `update_progress()`：更新进度、状态、错误和新文件。
- `complete()`：任务完成。
- `get_status()`：返回任务状态。
- `get_generated_file()`：校验文件名并返回生成文件路径。

---

## 5. 重点学习聊天主链路

### 核心文件

- `app/apis/chat.py`
- `app/services/chat_service.py`
- `app/utils/ai/openai_client.py`
- `app/models/message.py`
- `app/schemas/message.py`

---

### 5.1 普通登录态聊天：`POST /api/chat/`

请求进入后：

1. API 接收 `MessageCreate`。
2. 通过 `get_current_user_id` 获取当前用户。
3. 注入 `AsyncSession`。
4. 调用 `ChatService.chat()`。
5. 返回 SSE 流。

`ChatService.chat()` 普通聊天流程：

1. 校验 conversation 是否存在且属于当前用户。
2. 保存用户消息：
   - `role = user`
   - `status = received`
   - `visibility = private`
   - 保存 content、type、json_data、tool、tool_args、extra。
3. 调用 `get_messages()` 查询历史上下文。
4. 历史上下文只包含：
   - role 为 system/user/assistant。
   - type 为 text/image。
5. 按创建时间正序排列。
6. 在最前面插入 `settings.OPENAI_SYSTEM_PROMPT`。
7. 初始化 `OpenAIClient`。
8. 调用 `oa.chat(..., stream=True)`。
9. 发送 SSE start。
10. 遍历模型 delta，边返回边累加到 `assistant_full`。
11. 模型结束后保存 assistant 消息。
12. assistant 消息保存：
    - `role = assistant`
    - `type = text`
    - `status = completed`
    - `content = assistant_full`
    - `model_meta = 模型参数`
13. SSE end 返回 assistant 消息 JSON。

### 5.2 SSE 格式

`build_event_stream()` 负责构造 SSE：

```text
event: start
data: xxx
id: conversation_id

```

字段说明：

- `event`：可选，如 start、message、attachment、end、error。
- `data`：必有。
- `retry`：可选。
- `id`：可选，通常是 conversation_id。
- 每个事件以空行结束。

### 5.3 JSON 分阶段代码生成：`chat_json()`

触发条件：`MessageCreate.type == MessageType.json`。

共同流程：

1. 保存用户 JSON 消息。
2. 从 `msg.json_data` 读取 `stage`。
3. 没有 stage 抛错。
4. 使用 `AsyncCtxManager` 保存或加载跨阶段 ctx。
5. 每个阶段调用对应 Stage 的 `run(ctx)`。
6. 每个 chunk 以 SSE `event=message` 返回：
   - `stage`
   - `delta`

支持阶段：

| stage | 功能 |
|---|---|
| `requirement_analysis` | 从最新 SFS 分析附件读取需求并执行需求分析 |
| `requirement_clarification` | 需求澄清 |
| `code_design_draft` | 设计草稿 |
| `code_design_interactive` | 设计交互问答 |
| `code_design_structure` | 架构设计格式化 |
| `logic_code_generation` | 逻辑代码生成，使用 API/RAG 检索 |
| `logic_code_interactive` | 逻辑代码交互修改 |
| `webservice_code_generation` | WebService 代码生成 |
| `webservice_code_interactive` | WebService 交互修改 |
| `frontend_code_generation` | 前端代码生成 |
| `frontend_code_interactive` | 前端交互修改，可读取图片附件 |
| `ref_code_reflect` | 参考代码反思 |
| `artifact_persist` | 保存生成物并转换为附件 |
| `code_fix_interactive` | 代码修复交互 |

### 5.4 SFS 章节选择代码生成：`sfs_select()`

触发条件：`msg.tool == MessageTool.sfs_select`。

流程：

1. 保存一条用户文件消息，tool 为 `sfs_select`。
2. 查询当前会话所有消息，并预加载附件。
3. 从后往前找最近的 `tool=sfs_analyze` 文件消息。
4. 等待该附件的 SFS 后台处理完成。
5. 读取 SFS 生成的文档树 JSON。
6. 如果传入 `tool_args.chapter_numbers`，取对应章节子树。
7. 如果章节号无效，回退到整棵树。
8. 收集图片到临时目录。
9. 初始化 LLM、Embedding、`APISearcher`、`RAGSearcher`。
10. 构建 `CodeGenPipeline`：
    - 需求分析
    - 需求澄清
    - 设计草稿
    - 架构格式化
    - 逻辑代码生成
    - WebService 代码生成
    - 前端代码生成
    - 产物持久化
11. pipeline 每个 stage 的 delta 都用 SSE `event=message` 输出。
12. 成功后创建 assistant JSON 消息。
13. 将 `ctx.artifacts` 文件转成 Attachment。
14. 通过 SSE `event=attachment` 返回附件信息。
15. SSE `event=end` 返回成功。

### 5.5 插件聊天：`plugin_chat_pipeline()`

入口：`POST /api/chat/v1/chat_demo` 和 `POST /api/chat/v1/chat_widget`。

流程：

1. 读取 OpenAI 风格 messages。
2. 对 content 做多模态规范化。
3. 提取当前问题和需求文本。
4. 提取已有设计内容。
5. 创建临时文档树。
6. 初始化 ChatOpenAI、Embedding、APISearcher、RAGSearcher。
7. 创建 `CodeGenRouterStage`。
8. 构造 ctx。
9. 发送 OpenAI 风格 start chunk。
10. 执行 router。
11. 文本 delta 作为 `delta.content` 返回。
12. tool_calls 作为 OpenAI tool_calls 返回。
13. 最后返回 stop chunk 和 `[DONE]`。

### 5.6 Skills 聊天：`plugin_chat_pipeline_skills()`

入口：`POST /api/chat/v1/chat_skills`。

流程：

1. 读取 OpenAI 风格 messages。
2. 多模态规范化，支持 base64 图片和 http 图片链接。
3. 从历史 assistant 的 `# Session id` 中恢复 session_id，或使用 body.session_id。
4. 加载 SQLite 中保存的 Skill memory。
5. 从工具执行结果中提取 read_file、create_new_file、edit_existing_file、terminal 输出，写入 memory。
6. 构造 `SkillContext`。
7. 创建 `TaskPlanner`。
8. 根据当前是否是工具结果返回，调用：
   - `create_plan()`
   - `create_plan_with_context()`
9. 如果 planner 返回 final_response，直接流式返回。
10. 否则创建 task_monitor 和 `SkillExecutor`。
11. 最多执行 5 轮规划。
12. Executor 产生 step_start、step_complete、step_error、step_retry、execution_complete 等事件。
13. ChatService 将事件转成 OpenAI SSE chunk。
14. 如果 step 结果中有 tool_calls：
   - 返回 tool_calls。
   - 保存 pending tool call。
   - 保存 memory。
   - 结束当前请求，等待插件执行工具后继续。
15. 如果无 tool_calls，直接返回 skill 结果。
16. 最后保存 memory，清理 task_monitor，发送 `[DONE]`。

---

## 6. 学习代码生成 Pipeline 旧架构

### 目录

`app/services/code_gen/`

### 6.1 `pipeline.py`

#### `Stage`

所有阶段都继承 `Stage`，必须实现：

- `name`：唯一阶段名。
- `run(ctx)`：异步生成器，持续 yield delta 字符串。

#### `CodeGenPipeline`

执行流程：

1. 初始化时检查 stage name 是否重复。
2. `run(ctx)` 按顺序执行所有 stage。
3. 每个 stage 输出的 delta 包装成 `(stage.name, delta)`。
4. stage 抛异常时记录日志并向上抛。
5. ctx 在所有阶段之间共享。

ctx 常见内容：

- `requirement`
- `image_path_maps`
- `conversation_id`
- `user_id`
- `code_design`
- `artifacts`
- `tokens`

### 6.2 `router.py`

`CodeGenRouterStage` 是旧插件链路的核心。

初始化时创建：

- 需求分析阶段。
- 需求澄清阶段。
- 代码设计阶段。
- 架构格式化阶段。
- 逻辑代码生成阶段。
- WebService 代码生成阶段。
- 前端代码生成阶段。
- 参考代码反思阶段。

Router 还会做多模态消息处理：

1. 支持 OpenAI content list 中的 image_url。
2. 支持字符串中的 base64 图片。
3. 支持 Markdown 图片。
4. 支持 HTML `<img>`。
5. 图片会替换为 `【IMG_1】` 占位符。
6. 图片本体作为 image_url part 传给模型。

### 6.3 Stages 阅读顺序

1. `requirement_analysis.py`：需求分析。
2. `requirement_clarification.py`：需求澄清。
3. `code_design_draft.py`：设计草稿。
4. `code_design_interactive.py`：设计交互。
5. `code_design_structure.py`：架构格式化。
6. `logic_code_generation.py`：逻辑代码生成。
7. `webservice_code_generation.py`：WebService 代码生成。
8. `frontend_code_generation.py`：前端代码生成。
9. `ref_code_reflect.py`：参考代码反思。
10. `artifact_persist.py`：生成物持久化。

### 学习重点

- Stage 如何读写 ctx。
- Stage 如何流式 yield。
- Pipeline 如何顺序执行。
- Router 如何判断当前应该执行哪个阶段。
- API/RAG 检索结果如何进入代码生成 prompt。

---

## 7. 学习 Skills 新架构

### 目录

`app/skills/`

### 7.1 基础结构

#### `base.py`

重点看：

- `Skill`：所有 skill 的基类。
- `SkillContext`：跨 skill 的上下文。
- `SkillResult`：skill 执行结果。
- `SkillStatus`：success/error 等状态。

#### `registry.py`

负责注册和获取 Skills：

1. 启动时扫描 builtin 目录。
2. 加载 skill.yaml。
3. 维护 skill name 到 skill class 的映射。
4. Executor 执行时通过 registry 获取 skill。

#### `skill_loader.py`

负责加载：

- `skill.yaml`
- prompt.md
- skill 描述
- planner 可见的 skill 能力说明

### 7.2 Planner：`planner.py`

核心方法：

#### `build_dynamic_planner_prompt()`

1. 读取 `planner_prompt.md`。
2. 调用 `SkillLoader.build_planner_prompt_section()` 生成可用 Skills 列表。
3. 替换 prompt 中的 `## 可用 Skills` 部分。

#### `create_plan(context)`

1. 根据 `SkillContext` 构造规划 prompt。
2. 摘要最近 10 条消息。
3. 获取最后一条用户输入。
4. 请求 LLM 返回 JSON。
5. 如果 `need_skills=false`，返回 final_response。
6. 如果 `need_skills=true`，解析 plan 数组。
7. 每个 plan step 包含 skill、params、reason、depends_on。

#### `create_plan_with_context(context, session_id)`

用于工具返回后的继续规划：

1. 从 task_monitor 获取任务状态。
2. 加入已完成步骤。
3. 加入已生成文件。
4. 强调不要重复执行已完成 Skills。
5. 根据任务目标继续规划后续步骤。

### 7.3 Executor：`executor.py`

核心流程：

1. 接收 Planner 生成的 plan。
2. 转成 `StepExecution` 列表。
3. 对无需参数的代码生成 Skills 清空 params。
4. 按顺序执行步骤。
5. 执行前检查 depends_on。
6. 从 `SkillRegistry` 获取 skill。
7. 调用 `skill.validate_params()`。
8. 调用 `skill.execute()`。
9. 成功输出 `step_complete`。
10. 失败输出 `step_error`。
11. 未超过重试次数则重试。
12. 重试耗尽后触发 replanner。
13. 最终输出 `execution_complete` 或 `execution_failed`。

### 7.4 内置 Skills 阅读顺序

1. `read_file`：读取文件能力。
2. `create_new_file`：创建文件能力。
3. `edit_existing_file`：编辑文件能力。
4. `terminal_tools`：终端命令能力。
5. `requirement_analysis`：需求分析能力。
6. `code_design`：代码设计能力。
7. `logic_code_generation`：逻辑代码生成能力。
8. `webservice_code_generation`：WebService 生成能力。
9. `frontend_code_generation`：前端代码生成能力。

### 学习重点

- Planner 决定“做什么”。
- Executor 决定“按计划怎么做”。
- Skill 是可插拔能力单元。
- Registry 负责发现、注册、获取 Skill。
- Memory 用于跨轮次保存工具结果和上下文。

---

## 8. 学习 AI 工具与 RAG 检索

### 目录

- `app/utils/ai/`
- `app/utils/ai/rag/`

### 阅读顺序

1. `app/utils/ai/openai_client.py`
   - 普通聊天调用 OpenAI 兼容接口。
   - 支持 stream 返回 delta。
2. `app/utils/ai/prompts.py`
   - 旧 Pipeline 和 Router 用到的提示词。
3. `app/utils/ai/searcher.py`
   - `APISearcher`：检索 API。
   - `RAGSearcher`：检索参考代码。
4. `app/utils/ai/implementation_gpt.py`
   - 测试用例生成使用的 ChatModel。
5. `app/utils/ai/batch_llm_model.py`
   - SFS 或文档处理可能用到批量 LLM。
6. `app/utils/ai/format_tools.py`
   - 格式化辅助工具。

### RAG 子系统阅读顺序

1. `app/utils/ai/rag/main.py`
2. `app/utils/ai/rag/config/config.yaml`
3. `app/utils/ai/rag/src/rag_pipeline.py`
4. `app/utils/ai/rag/src/document_parser.py`
5. `app/utils/ai/rag/src/text_processor.py`
6. `app/utils/ai/rag/src/enhanced_text_processor.py`
7. `app/utils/ai/rag/src/embeddings.py`
8. `app/utils/ai/rag/src/vector_store.py`
9. `app/utils/ai/rag/src/retriever.py`
10. `app/utils/ai/rag/src/query_analyzer.py`
11. `app/utils/ai/rag/src/code_entity_index.py`
12. `app/utils/ai/rag/src/generator.py`

### RAG 在代码生成中的作用

1. 代码生成阶段需要参考已有代码和 API。
2. `APISearcher` 通过 embedding 检索 API 信息。
3. `RAGSearcher` 检索参考代码片段。
4. 检索结果进入 prompt，辅助 LLM 生成更贴近项目规范的代码。

### 学习重点

- 文档如何解析。
- 文本如何切分。
- embedding 如何生成。
- FAISS/vector store 如何保存。
- query 如何检索。
- 检索结果如何进入 LLM prompt。

---

## 9. 学习文档、文件、Excel 工具

### 目录

- `app/utils/document/`
- `app/utils/io/`
- `app/utils/file.py`
- `app/services/excel_file_service.py`

### 9.1 文件工具：`app/utils/file.py`

重点看：

1. 上传文件保存。
2. 文件大小获取。
3. 文件 mimetype 获取。
4. 文件名获取。
5. MD5 计算。
6. 文件删除。

附件上传、生成物持久化、文件下载都依赖这些工具。

### 9.2 文档转换

#### `app/utils/document/converter.py`

负责把 docx 转成 HTML。

SFS 分析流程中：

1. `DocxToHtmlConverter(attachment.url)`。
2. `await converter.convert()`。
3. 得到 HTML。

#### `app/utils/document/document_tree.py`

负责文档树：

1. `parse_html_to_tree()`：HTML 转树。
2. `to_dict()`：树转 dict。
3. `serialize_to_json()`：保存完整树。
4. `deserialize_from_json()`：读取完整树。
5. `get_subtree_by_chapter_numbers()`：按章节号取子树。
6. `collect_image()`：收集图片到临时目录。
7. `clear_image_src()`：清理图片路径。

### 9.3 测试用例 IO 工具

#### `app/utils/io/word2json.py`

- 将功能需求 docx 拆分成 JSON。
- 输出 `processed.json`。

#### `app/utils/io/reader.py`

测试用例生成中负责：

1. 读取用例标题。
2. 读取 Excel 关联内容。
3. 构造支持文档 prompt。
4. 获取测试步骤。

#### `app/utils/io/writer.py`

负责把生成的测试用例数据写入 Excel 模板。

### 9.4 Excel 文件业务

`ExcelFileService` 处理数据库中的 Excel 文件记录，不负责 WebSocket 广播。

- create：保存用户 Excel 数据。
- list：分页查询。
- get：详情。
- update：更新 data/extra。
- delete：`is_deleted=True`。

---

## 10. 学习任务与脚本

### 10.1 SFS 后台任务

文件：`app/tasks/sfs_analyze_tasks.py`

作用：

1. 接收 attachment_id。
2. 调用 `SfsAnalyzeHandler._process_async()`。
3. 后台完成完整文档树解析。
4. 更新 attachment.extra 中的状态和 file_path。

### 10.2 测试用例后台任务

文件：`app/tasks/test_case_gen.py`

#### `long_task(task_id)` 主流程

1. 从 Redis 读取任务。
2. 准备路径：上传 docx、上传 xlsx、拆分目录、支持文档目录、模板、生成目录。
3. 创建目录。
4. 调用 `word2json.split_doc()` 拆分需求文档。
5. 读取 `processed.json`。
6. 调用 `reader.read_title()` 获取用例标题。
7. 从用例名中提取 case_id。
8. 调用 `reader.read_related_content()` 读取 Excel 关联内容。
9. 校验所有 case_id 存在。
10. 调用 `reader.create_support_prompts()` 构造多模态 prompt。
11. 调用 `reader.get_test_steps()` 获取测试步骤。
12. 保存 case_names、prompts_payload、case_steps 到 Redis。
13. 初始化两个模型：
    - 元数据模型。
    - 测试步骤模型。
14. 遍历每个用例，调用 `process_single_case()`。
15. 每生成一个 Excel 文件，就更新 progress 和 file_list。
16. 全部完成后调用 `task.complete()`。
17. 异常时写入 error_log。

#### `process_single_case()` 单用例生成

1. 用 meta_gpt 生成元数据。
2. 用 case_gpt 生成操作步骤、测试项、预期结果。
3. 解析模型输出。
4. 合并元数据和测试步骤。
5. 写入 Excel 模板。
6. 返回生成的文件名。

#### `regenerate_long_task(task_id, case_name)`

1. 从 Redis 读取原任务。
2. 找到指定 case_name 的 prompt。
3. 重新调用 `process_single_case()`。
4. 覆盖生成结果。
5. 调用 `task.complete()`。

### 10.3 脚本目录

`app/scripts/` 中的脚本适合辅助学习：

1. `mock_plugin_request.py`：模拟插件请求。
2. `test_planner_only.py`：单独测试 Planner。
3. `test_runner.py`：测试运行入口。
4. `architecture_analysis.md`：架构分析辅助材料。
5. `code_review_report.md`：历史问题辅助材料。

---

## 11. 推荐的实战阅读路线

### 第 1 阶段：跑通 Web 后端认知

阅读顺序：

1. `app/main.py`
2. `app/core/config.py`
3. `app/core/security.py`
4. `app/db/session.py`
5. `app/apis/auth.py`
6. `app/services/auth_service.py`
7. `app/models/user.py`
8. `app/schemas/user.py`

重点跟踪登录请求：

1. 请求进入 `POST /api/auth/login`。
2. `get_credentials()` 解析请求。
3. `AuthService.handle_login_async()` 查用户。
4. `verify_password()` 校验密码。
5. `create_access_token()` 生成 token。
6. API 返回登录结果。

完成后应能回答：

- 一个登录请求如何进入系统？
- token 如何生成和校验？
- 数据库 session 如何注入？
- 哪些接口依赖 `get_current_user_id`？

---

### 第 2 阶段：掌握基础数据接口

阅读顺序：

1. `app/apis/conversation.py`
2. `app/services/conversation_service.py`
3. `app/apis/message.py`
4. `app/services/message_service.py`
5. `app/apis/attachment.py`
6. `app/services/attachment_service.py`

建议按接口调试：

1. 创建会话：`POST /api/conversation/create`。
2. 查询会话列表：`GET /api/conversation/list`。
3. 创建消息：`POST /api/message/create`。
4. 查询消息列表：`GET /api/message/list`。
5. 上传附件：`POST /api/attachment/upload`。
6. 下载附件：`GET /api/attachment/download/{id}`。

完成后应能回答：

- 会话和消息如何关联？
- 附件如何和用户、消息关联？
- 软删除是怎么做的？
- 附件 hash 去重如何实现？

---

### 第 3 阶段：掌握聊天主流程

阅读顺序：

1. `app/apis/chat.py`
2. `app/services/chat_service.py` 的 `chat()`
3. `ChatService.get_messages()`
4. `OpenAIClient.chat()`
5. `app/models/message.py`
6. `app/schemas/message.py`

重点画出普通聊天时序：

1. API 接收 `MessageCreate`。
2. 校验 token。
3. 校验 conversation。
4. 保存用户消息。
5. 查询历史上下文。
6. 调用 LLM stream。
7. SSE 返回 delta。
8. 保存 assistant 消息。
9. SSE 返回 end。

完成后应能回答：

- SSE start、delta、end 在哪里构造？
- 历史消息如何筛选？
- assistant 消息什么时候保存？
- `model_meta` 存了什么？

---

### 第 4 阶段：掌握 SFS 文档分析与分阶段代码生成

阅读顺序：

1. `app/apis/attachment.py`
2. `app/services/sfs_analyze.py`
3. `app/tasks/sfs_analyze_tasks.py`
4. `app/services/chat_service.py` 的 `sfs_select()`
5. `app/services/chat_service.py` 的 `chat_json()`
6. `app/services/code_gen/pipeline.py`
7. `app/services/code_gen/stages/*`

重点流程：

1. 上传附件并传 `tool=sfs_analyze`。
2. API 快速生成 catalog。
3. 后台任务生成完整文档树 JSON。
4. 前端选择章节。
5. `/api/chat/` 传 `tool=sfs_select`。
6. ChatService 读取对应章节。
7. 执行 CodeGenPipeline。
8. 生成 artifacts。
9. artifacts 转 Attachment 返回。

完成后应能回答：

- SFS catalog 和完整树分别什么时候生成？
- 章节选择如何取子树？
- CodeGenPipeline 阶段顺序是什么？
- 生成文件如何变成附件？

---

### 第 5 阶段：掌握插件聊天与 Skills 新架构

阅读顺序：

1. `app/apis/chat.py` 的 `/v1/chat_demo`
2. `ChatService.plugin_chat_pipeline()`
3. `app/services/code_gen/router.py`
4. `app/apis/chat.py` 的 `/v1/chat_skills`
5. `ChatService.plugin_chat_pipeline_skills()`
6. `app/skills/planner.py`
7. `app/skills/executor.py`
8. `app/skills/registry.py`
9. `app/skills/builtin/*`

重点对比：

| 架构 | 入口 | 决策方式 | 执行方式 |
|---|---|---|---|
| 旧插件 | `/api/chat/v1/chat_demo` | `CodeGenRouterStage` | 直接执行对应 Stage |
| 新 Skills | `/api/chat/v1/chat_skills` | `TaskPlanner` 生成 plan | `SkillExecutor` 执行 Skill |

完成后应能回答：

- Router 和 Planner 的区别是什么？
- Skill 如何注册和加载？
- Executor 如何处理失败和重试？
- tool_calls 返回后为什么当前请求要结束？
- memory 如何跨轮次保存？

---

### 第 6 阶段：掌握测试用例生成

阅读顺序：

1. `app/apis/test_cases.py`
2. `app/services/test_cases_service.py`
3. `app/tasks/test_case_gen.py`
4. `app/utils/io/word2json.py`
5. `app/utils/io/reader.py`
6. `app/utils/io/writer.py`

重点流程：

1. 创建任务。
2. 上传 docx。
3. 上传 xlsx。
4. 状态变 ready。
5. 调用 process。
6. 后台 long_task 解析文档和用例。
7. LLM 生成元数据和测试步骤。
8. 写入 Excel 模板。
9. 轮询 status。
10. 下载生成文件。

完成后应能回答：

- 任务状态保存在哪里？
- 为什么需要同时上传 docx 和 xlsx？
- `prompts_payload` 和 `case_steps` 分别是什么？
- 单个用例如何重新生成？

---

### 第 7 阶段：掌握 RAG 与代码检索

阅读顺序：

1. `app/utils/ai/searcher.py`
2. `app/utils/ai/rag/src/rag_pipeline.py`
3. `document_parser.py`
4. `text_processor.py`
5. `embeddings.py`
6. `vector_store.py`
7. `retriever.py`
8. 回到代码生成 Stage，看检索结果如何进入 prompt。

完成后应能回答：

- 参考代码如何被索引？
- 查询如何变成向量检索？
- 检索结果如何进入 LLM prompt？
- API 检索和代码检索分别解决什么问题？

---

## 12. 建议画的 4 张图

### 12.1 项目分层图

建议画成：

```text
main.py
  ↓
apis
  ↓
services
  ↓
models / schemas / db
  ↓
utils / tasks / skills
```

### 12.2 普通聊天时序图

```text
Client
  → POST /api/chat/
  → ChatService.chat
  → 保存 user message
  → get_messages 组装上下文
  → OpenAIClient.chat(stream=True)
  → SSE delta
  → 保存 assistant message
  → SSE end
```

### 12.3 代码生成 Pipeline 图

```text
SFS 文档 / 用户需求
  → RequirementAnalysis
  → RequirementClarification
  → CodeDesignDraft
  → ArchDesignFormat
  → LogicCodeGeneration
  → WebserviceCodeGeneration
  → FrontendCodeGeneration
  → ArtifactPersist
  → Attachment
```

### 12.4 Skills 架构图

```text
chat_skills
  → SkillContext
  → TaskPlanner
  → ExecutionPlan
  → SkillExecutor
  → SkillRegistry
  → builtin Skill
  → SkillResult
  → SSE / tool_calls
```

---

## 13. 重点问题清单

学习时建议带着这些问题看代码：

1. `app/main.py` 注册了哪些路由？每个路由对应什么业务？
2. API 层和 Service 层的边界在哪里？
3. `get_current_user_id` 如何从 JWT 中解析用户？
4. `get_async_session` 如何管理 rollback 和 close？
5. 登录接口为什么同时支持 JSON 和 form？
6. `/api/auth/token` 和 `/api/auth/login` 的返回格式有什么差异？
7. `/api/user/refresh_api_key/{user_id}` 为什么存在权限风险？
8. Conversation 的软删除如何级联到 messages？
9. Message 中的 `role/type/status/tool/extra/json_data` 分别有什么作用？
10. 附件上传如何通过 MD5 去重？
11. 附件如何同时关联用户和消息？
12. 普通聊天、插件聊天、Skills 聊天分别走哪些方法？
13. SSE 输出的 start、delta、attachment、end 是在哪里构造的？
14. SFS 文档上传后，catalog 和完整 JSON 分别如何生成？
15. `sfs_select` 如何根据章节号取子树？
16. 旧 `CodeGenPipeline` 和新 `Skills` 架构有什么区别？
17. `Stage.run(ctx)` 中的 ctx 保存了哪些中间结果？
18. Planner 的 prompt 从哪里加载？可用 Skills 从哪里注入？
19. Skill 是如何注册、发现、执行的？
20. Executor 如何处理失败、重试和重新规划？
21. RAG 检索链路如何被代码生成阶段调用？
22. 测试用例生成任务为什么需要 Redis？
23. Excel WebSocket 如何按 file_id 广播？
24. Spinner 接口为什么返回 OpenAI 风格 chunk？
25. 哪些配置项必须在 `.env` 中配置？

---

## 14. 最后建议

这个项目不要从所有文件平均阅读，建议按“请求链路”学习。

### 推荐学习方式

1. 先选一个接口。
2. 从 `app/apis` 找入口。
3. 追到 `app/services`。
4. 再追到 `app/models` 和 `app/schemas`。
5. 如果涉及数据库，追 `app/db/session.py`。
6. 如果涉及 AI，追 `app/utils/ai` 或 `app/services/code_gen`。
7. 如果涉及文件，追 `app/utils/file.py` 和 `app/utils/document`。
8. 如果涉及任务，追 `app/tasks`。

### 推荐调试顺序

1. `POST /api/auth/login`：拿 token。
2. `GET /api/user/info`：验证 token。
3. `POST /api/conversation/create`：创建会话。
4. `GET /api/conversation/list`：确认会话写库。
5. `POST /api/message/create`：测试消息写入。
6. `GET /api/message/list`：确认分页和排序。
7. `POST /api/chat/`：测试普通 SSE 聊天。
8. `POST /api/attachment/upload`：测试附件保存和消息关联。
9. `GET /api/attachment/download/{id}`：测试附件下载。
10. `POST /api/attachment/upload` 且 `tool=sfs_analyze`：测试 SFS 快速目录和后台任务。
11. `POST /api/chat/` 且 `tool=sfs_select`：测试基于 SFS 的代码生成。
12. `POST /api/chat/v1/chat_demo`：测试旧插件代码生成。
13. `POST /api/chat/v1/chat_skills`：测试新版 Planner + Skills。
14. `POST /api/test/generate-test-cases/create`：测试测试用例任务创建。
15. 上传 docx/xlsx，调用 process，轮询 status，最后 download。
16. `POST /api/excel/create/list/update/delete`：测试 Excel CRUD。
17. `WebSocket /api/excel/ws/{file_id}`：测试同文件多连接广播。
18. `POST /api/spinner/generate-text`：测试 Markdown 到 CSV 流式生成。

### 优先掌握三条主线

1. Web 后端主线：`main.py → apis → services → db/models/schemas`。
2. 聊天主线：`chat.py → ChatService → OpenAIClient → SSE → Message`。
3. AI 代码生成主线：`ChatService → CodeGenPipeline / Skills → Stages / builtin skills → RAG/Searcher`。
