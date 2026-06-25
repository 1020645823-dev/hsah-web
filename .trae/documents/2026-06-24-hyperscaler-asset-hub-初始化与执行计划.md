# Hyperscaler Asset Hub 初始化与执行计划

**目标：**基于设计规范落地 Hyperscaler Asset Hub 的「前台全站 + Admin Console + 权限系统 + 独立后端」的项目初始化、端到端联调与可部署交付。

**整体架构：**
- 前端：Next.js 14（App Router）+ TypeScript + Tailwind CSS + shadcn/ui + Lucide React + Framer Motion（按设计规范实现玻璃拟态、辉光、滚动入场等）。
- 后端：FastAPI + SQLAlchemy 2.x + Alembic + PostgreSQL；提供资产、用户、角色权限、访问策略与权限模拟 API。
- 集成：后端 OpenAPI → 前端生成 TypeScript 类型；前端通过统一 API Client 调用后端。
- 部署：前端部署到 Vercel；后端以容器方式部署（平台待定，但计划提供 Dockerfile/环境变量规范）。

---

## 1. 当前状态分析（基于仓库实际内容）

- 当前仓库仅包含设计规范与视觉参考图：
  - 设计规范：[Hyperscaler_Asset_Hub_Design_Spec.md](file:///Users/weiwei.g.zhang/Documents/hsah/Kimi_Agent_%E8%B5%84%E4%BA%A7%E4%B8%AD%E5%BF%83%E9%85%8D%E7%BD%AE%E4%B8%8E%E6%9D%83%E9%99%90%E8%AE%BE%E8%AE%A1/Hyperscaler_Asset_Hub_Design_Spec.md)
  - 关键页面参考图：`hero_page_visual.png / asset_library_visual.png / asset_detail_visual.png / admin_*`
- 仓库内暂无前端/后端代码、package.json、Python 依赖或 CI 配置。

---

## 2. 范围与决策（已确认）

**范围：**全站（含 P1/P2）+ Admin/RBAC/Access Policies + 独立后端 + PostgreSQL + Email/Password + 2FA + 前端 Vercel 部署。

**视觉策略：**严格按规范实现深靛蓝/电光紫渐变、glassmorphism、辉光与动效体系。

**关键技术决策：**
- 图标库：统一使用 `lucide-react`（与 shadcn/ui 生态一致）。
- 后端形态：独立 FastAPI 服务（与前端分离部署）。
- 数据库：PostgreSQL；迁移使用 Alembic。
- 认证：JWT（access/refresh）+ 密码哈希（bcrypt）+ TOTP（RFC 6238）2FA。

---

## 3. 目标目录结构（初始化后）

```text
hsah/
  web/                      # Next.js 14 前端
  api/                      # FastAPI 后端
  docker-compose.yml        # 本地联调（Postgres + api + web 可选）
  .env.example              # 环境变量示例（前后端分开说明）
  README.md                 # 一键启动、脚本、部署说明
  Kimi_Agent_资产中心配置与权限设计/   # 设计规范与参考图（保留不改）
```

---

## 4. 实施计划（可直接执行的任务清单）

> 说明：以下任务按“先可运行骨架 → 核心链路 → 管理后台/权限 → 全站补齐 → 质量/部署”推进。每个任务都包含明确产物、命令与验收点，执行阶段可逐条勾选。

### Task 1：仓库初始化与开发约定

**目标：**建立 monorepo 基础、统一脚本与开发规范，让 `web` 与 `api` 都能独立启动并联调。

**产物（新增）：**
- `README.md`：启动方式、环境变量、目录说明
- `.env.example`：前后端必需变量说明
- `docker-compose.yml`：本地 Postgres + api（可选 web）
- `.gitignore`：Node/Python/IDE/OS 相关忽略

- [ ] 创建目录 `web/` 与 `api/`
- [ ] 编写 `README.md`，至少包含：
  - `web` 启动、构建、lint
  - `api` 启动、迁移、测试
  - 本地 Postgres（docker-compose）与初始化数据库
- [ ] 创建 `.env.example`（分区说明）：
  - `web`：`NEXT_PUBLIC_API_BASE_URL`
  - `api`：`DATABASE_URL`、`JWT_SECRET`、`JWT_ISSUER`、`CORS_ORIGINS` 等
- [ ] 创建 `docker-compose.yml`：
  - `postgres`（端口、卷、初始库/用户/密码来自 env）
  - `api`（依赖 postgres；映射 8000）
  - （可选）`web`（映射 3000；开发期也可本机启动）
- [ ] 验收：文档中给出一条命令可启动 Postgres + 后端，并通过 `/health` 或 `/docs` 访问成功（执行阶段验证）。

---

### Task 2：前端项目初始化（Next.js 14 + Tailwind + shadcn/ui）

**目标：**创建 Next.js 14 App Router 项目骨架，并将设计规范中的 Token 固化为可复用的 design system。

**产物（新增/修改，位于 `web/`）：**
- `package.json`（Next.js 14 + TS）
- `tailwind.config.ts` / `postcss.config.*`
- `src/app/layout.tsx` / `src/app/page.tsx`
- `src/styles/globals.css`（CSS 变量 + Tailwind 基础）
- `components.json`（shadcn/ui 配置）

- [ ] 使用官方脚手架创建 Next.js 14 App Router + TypeScript 项目（执行阶段运行）
  - 要求：`src/` 目录结构、ESLint 启用、Tailwind 启用
- [ ] 引入字体策略：
  - 英文正文：Inter
  - 中文：PingFang SC 回退
  - 字体加载建议：Next.js `next/font`（执行阶段落地）
- [ ] 将设计规范 Token 写入 `globals.css` 的 `:root`（至少包含颜色、渐变、阴影、动效 token）
  - 参考规范章节：Design System（色彩/字体/间距/圆角/阴影/动效）
- [ ] Tailwind 主题扩展：
  - 通过 `theme.extend.colors` 映射 CSS 变量（保证组件只消费 token，不直接写 hex）
  - 通过 `theme.extend.boxShadow/borderRadius` 映射设计系统
- [ ] 初始化 shadcn/ui（执行阶段）
  - 选择与 Tailwind 配套的 preset
  - 图标库锁定为 `lucide-react`
- [ ] 验收：
  - `web` 本地启动成功
  - 首页渲染基础 Layout（深色背景 + 顶部导航占位）
  - 任意 shadcn 按钮组件可正常显示并使用 token 颜色

---

### Task 3：全局布局与导航（信息架构落地）

**目标：**落地站点地图与全局导航/搜索触发，建立统一的页面壳与路由结构。

**产物（位于 `web/`）：**
- `src/app/(marketing)/page.tsx`（Home）
- `src/app/assets/page.tsx`、`src/app/assets/[slug]/page.tsx`
- `src/app/scenarios/page.tsx`、`src/app/scenarios/[slug]/page.tsx`
- `src/app/architecture/page.tsx`、`src/app/architecture/[slug]/page.tsx`
- `src/app/insights/page.tsx`、`src/app/insights/[slug]/page.tsx`
- `src/app/community/page.tsx`、`src/app/about/page.tsx`
- `src/app/auth/login/page.tsx`、`src/app/auth/forgot-password/page.tsx`、`src/app/auth/reset-password/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/admin/layout.tsx`、`src/app/admin/page.tsx`（Admin Dashboard）
- 全局组件：`src/components/nav/*`、`src/components/search/*`

- [ ] 实现 Global Navigation（规范 3.1）：
  - 滚动 100px 后透明→玻璃背景
  - hover 下划线动画
  - 右侧：搜索入口、语言切换占位、Get in Touch CTA
  - 移动端：汉堡菜单全屏覆盖层
- [ ] 实现 Global Search 交互骨架（规范 3.2）：
  - 点击图标或 Cmd/Ctrl+K 打开对话框
  - 支持输入、最近搜索（本地存储）、建议列表（先用 mock）
- [ ] 建立路由与导航项映射（与规范 Sitemap 一致）
- [ ] 验收：
  - 所有一级路由可访问（即使内容先为骨架/占位）
  - 导航与移动端菜单可用
  - Cmd/Ctrl+K 可打开搜索

---

### Task 4：后端项目初始化（FastAPI + SQLAlchemy + Alembic + Postgres）

**目标：**搭建可运行、可迁移、可测试的后端骨架，为资产与权限系统提供 API 与 OpenAPI 文档。

**产物（位于 `api/`）：**
- `pyproject.toml` 或 `requirements.txt`（二选一，执行时确定并统一）
- `app/main.py`（FastAPI 实例、路由挂载）
- `app/core/config.py`（环境变量配置）
- `app/core/db.py`（SQLAlchemy engine/session）
- `app/models/*`（SQLAlchemy 模型）
- `alembic/` + `alembic.ini`（迁移）
- `app/api/v1/*`（路由）
- `tests/`（pytest）

- [ ] 初始化 FastAPI 工程（Python 版本建议 3.11+）
- [ ] 添加 `/health`、`/version` 基础接口
- [ ] 打通 PostgreSQL 连接（`DATABASE_URL`）
- [ ] 引入 Alembic，并生成第一版迁移（空库也要可迁移）
- [ ] 开启 CORS：
  - 允许 `web` 的开发域名与 Vercel 预览域（通过 env 配置）
- [ ] 验收：
  - `api` 启动后可访问 `/docs`
  - `alembic upgrade head` 可执行且无报错（执行阶段验证）

---

### Task 5：数据模型与权限引擎（按设计规范固化）

**目标：**将设计规范中的 Asset 模型、RBAC 角色体系、Access Policy 规则与“策略优先级评估流程”固化为后端可执行逻辑。

**规范依据：**
- Asset 模型与权限字段：设计规范 5.11（含 `visibility/allowedRoles/allowedUsers` 与 `ContentBlock`）
- 角色与权限矩阵：设计规范 5.13.1
- AccessPolicy 模型与评估流程：设计规范 5.13.2（priority 1-1000、conditions）
- 权限模拟器：设计规范 5.13.3

**后端模型建议（SQLAlchemy）：**
- `User`：email、password_hash、is_active、two_factor_enabled、two_factor_secret（加密存储）
- `Role`：预设与自定义角色
- `Permission`：枚举化（如 `user.view`, `asset.create`, `policy.edit`）
- `RolePermission`：role ↔ permission
- `Group` / `UserGroup`
- `Asset`：核心字段 + 分类字段 + content_blocks（JSONB）+ visibility + allowed_roles/allowed_users（JSONB 或关联表）
- `AccessPolicy`：主体（users/roles/groups）+ resources（assetIds/filters/exclude）+ actions + conditions + priority + enabled

**权限评估函数（核心验收点）：**
- 输入：`user`、`asset`、`requested_action`
- 输出：allow/deny + 命中策略链路（用于 simulator debug）
- 逻辑（按规范流程）：
  1. 基于角色拿到基础权限
  2. 找出所有 enabled 且 subject 匹配用户的策略
  3. 按 priority 从高到低评估资源匹配
  4. 命中策略后合并 actions（或按你们约定的“首命中即返回”策略；执行前需明确）
  5. 校验 conditions（2FA、时间窗口、IP 白名单）

- [ ] 明确并实现“多策略合并”规则（建议在开始编码前写成可测试的规范）：
  - 选项 A：按优先级评估，返回第一条命中策略的 actions（更可预测）
  - 选项 B：按优先级评估，合并所有命中策略 actions（更宽松但可解释性略弱）
  - 该决策将影响前后端行为与 simulator 输出；执行阶段在实现前锁定为代码常量并写测试覆盖
- [ ] 为权限评估写单元测试（pytest），覆盖：
  - priority 覆盖
  - filter 命中与 exclude 命中
  - require2FA 的 allow/deny
  - asset visibility（public/internal/restricted）与白名单/角色名单

---

### Task 6：认证与 2FA（Email/Password + TOTP）

**目标：**实现设计规范中“条件访问 require2FA”的基础能力，并为 Admin Console 提供可用登录态。

**后端接口建议：**
- `POST /api/v1/auth/login`：email/password（若开启 2FA 返回需要二次校验）
- `POST /api/v1/auth/2fa/setup`：生成二维码/secret（首次绑定）
- `POST /api/v1/auth/2fa/verify`：校验 TOTP 并开启 2FA
- `GET /api/v1/auth/me`：当前用户信息（含 roles/groups/2fa 状态）
- `POST /api/v1/auth/logout`（可选：仅刷新 token 或黑名单机制）

**前端页面：**
- `/auth/login`：两步登录（密码 → 2FA code）
- `/profile`：开启/关闭 2FA（关闭需二次确认）

- [ ] 后端：密码哈希（bcrypt）与 JWT 签发/校验中间件
- [ ] 后端：TOTP（例如 `pyotp`）生成与校验
- [ ] 前端：登录页按规范视觉实现（可参考 `admin_*_visual.png` 的表单风格与玻璃拟态）
- [ ] 验收：
  - 未开启 2FA：登录直接获取 token
  - 已开启 2FA：登录需输入 TOTP
  - require2FA 的策略在未通过 2FA 时会拒绝动作

---

### Task 7：资产浏览链路（Home / Asset Library / Asset Detail）

**目标：**实现面向访客/客户的完整浏览体验（筛选、搜索、详情展示、相关资产、视频/架构/部署信息）。

**后端接口建议：**
- `GET /api/v1/assets`：支持 filters（cloud/industry/tech/status/type）、分页、排序、全文搜索
- `GET /api/v1/assets/{slug}`：资产详情（包含 content blocks、deployment、architecture）

**前端实现要点（按规范 5.1/5.2/5.x）：**
- Home：
  - Hero（粒子/渐变/入场动画）
  - Featured Assets、Scenario Categories、Impact Metrics、Latest Additions、CTA
- Asset Library：
  - 侧边栏筛选（桌面）/ 标签筛选（平板）/ 抽屉筛选（移动）
  - 网格/列表切换、排序、分页或无限滚动
- Asset Detail：
  - Hero Preview（image/gif/video）
  - Overview、Architecture、Technical Specs、Demo Video、Deployment Guide、Related Assets

- [ ] 后端：实现资产列表与详情 API（含权限过滤：只返回用户可 view 的资产）
- [ ] 前端：实现 Home、资产列表、资产详情（首版可先覆盖核心区块与动效，细节区块逐步补齐）
- [ ] 验收：
  - 首页动效与视觉符合设计规范（渐变、辉光、入场 stagger）
  - 列表筛选/搜索可用
  - 详情页可展示架构图、代码块、指标卡等内容区块

---

### Task 8：全站 P1/P2 栏目补齐（Scenarios / Architecture / Insights / Community / About）

**目标：**按站点地图补齐栏目页与详情页，并复用统一的内容体系与交互规范。

- [ ] Scenario Hub + Detail：至少实现行业垂直导航、场景详情的 Business Context/Solution Architecture/ROI Calculator（ROI 计算器可先最小实现）
- [ ] Architecture Center + Detail：支持 Mermaid 图渲染与“组件悬停/点击信息面板”的最小交互
- [ ] Insights Hub + Article Detail：内容列表、分类、详情渲染（Markdown）
- [ ] Community：论坛/活动/贡献者的展示型页面（后端先提供最小接口或 mock）
- [ ] About：平台介绍、团队、合作伙伴、联系入口

---

### Task 9：Admin Console（资产管理/配置向导/用户管理/角色权限/策略/模拟器）

**目标：**实现设计规范中 Admin Console 的核心工作流与可视化权限能力。

**页面清单（规范 4.2 与 5.11~5.13）：**
- Admin Dashboard
- Asset Management（列表 CRUD、批量操作）
- Asset Editor（10 步向导 + 自动保存 + 校验）
- User Management（列表、邀请/编辑、Profile Drawer）
- Roles & Permissions（Role Cards + Permission Matrix + 未保存高亮）
- Access Policies（策略卡片列表 + Create Wizard）
- Permission Simulator（模拟用户访问、输出决策链路）

**后端接口建议（v1/admin）：**
- 资产：`/admin/assets` CRUD、发布、版本历史
- 用户：`/admin/users` CRUD、邀请、角色分配、活动日志
- 角色：`/admin/roles` CRUD、权限矩阵保存
- 策略：`/admin/policies` CRUD、duplicate、enable/disable
- 模拟器：`/admin/permissions/simulate`（返回 allow/deny + debug 链路）

- [ ] 前端：实现 Admin Layout（侧边栏 + breadcrumb + 主区）
- [ ] 后端：实现 Admin API（所有写操作需权限校验）
- [ ] 前端：实现 Roles & Permissions 的矩阵编辑（本地 dirty state + 保存）
- [ ] 前端：实现 Access Policies 向导（Who/What/Actions/Conditions/Review）
- [ ] 前端：实现 Permission Simulator（选择用户/资产/动作 → 展示命中策略与链路）
- [ ] 验收：
  - 不同角色登录看到的 Admin 入口与功能受限符合 RBAC
  - 策略优先级能覆盖/解释访问结果
  - Simulator 输出与后端评估结果一致且可复现

---

### Task 10：前后端类型对齐与联调（OpenAPI → TS Types）

**目标：**避免前后端字段漂移，确保“前端 fetch URL 与后端路由定义”一致。

- [ ] 后端：固定 OpenAPI 前缀与版本策略（例如 `/api/v1`）
- [ ] 前端：引入 OpenAPI 类型生成（例如 `openapi-typescript`）并落地生成脚本
- [ ] 前端：封装 API Client：
  - 统一 baseUrl（`NEXT_PUBLIC_API_BASE_URL`）
  - 统一错误处理（401 跳转登录、403 显示无权限）
  - 统一 request id（可选）
- [ ] 验收：
  - 类型生成可执行
  - 核心接口（auth/me、assets list/detail、admin simulate）在 TS 中有类型提示

---

### Task 11：测试、质量与发布准备

**后端测试（pytest）：**
- [ ] auth：登录、2FA、token 校验
- [ ] policy engine：priority、filters、exclude、require2FA、ip/time 条件
- [ ] assets：权限过滤（不可见资产不会出现在列表/详情）

**前端质量：**
- [ ] lint + typecheck + build 全通过
- [ ] a11y 基线（键盘可达、focus 可见、prefers-reduced-motion）

**发布准备：**
- [ ] Vercel：`web` 的环境变量与构建配置文档化
- [ ] 后端：Dockerfile + 启动命令 + 运行所需 env 说明
- [ ] 安全清单：
  - JWT secret 不落库、不入 git
  - password_hash 使用强算法
  - 2FA secret 加密存储（或以 KMS/密钥派生方案封装）

---

## 5. 执行期验证清单（执行阶段逐条跑）

**前端：**
- `web`：`npm run dev` / `npm run lint` / `npm run build`

**后端：**
- `api`：启动服务、访问 `/docs`
- `alembic upgrade head`
- `pytest -q`

**端到端：**
- 访问 Home、Assets 列表/详情
- 登录 + 2FA
- Admin：创建/编辑策略后，用 Simulator 验证访问结果变化

