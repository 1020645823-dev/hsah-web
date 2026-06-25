# Hyperscaler Asset Hub — Web页面原型设计方案

## 1. 项目概述

### 1.1 项目定位
**Hyperscaler Asset Hub** 是 Accenture AI & Data 实践的场景化原型与 Demo 演示中心。它集中展示 Accenture 在 Hyperscaler（AWS / Azure / GCP）生态中孵化的 AI 解决方案原型、可复用的数据架构资产、以及行业场景化 Demo。该平台面向客户决策者、技术架构师与业务负责人，目标是通过沉浸式体验加速从概念到商业价值的认知转化。

### 1.2 设计目标
- **品牌一致性**：深度融入 Accenture 视觉 DNA（深靛蓝紫色调、glassmorphism 质感、几何精确性）
- **视觉冲击力**：营造"技术领导力"的第一印象，摒弃传统企业门户的沉闷感
- **沉浸式体验**：让访客在浏览 Demo 时感受到"触手可及的未来"
- **功能完整性**：覆盖从发现、探索到深度交互的全链路
- **可扩展性**：支持持续增长的资产库与多角色访问需求

### 1.3 用户角色
| 角色 | 核心需求 | 典型场景 |
|------|----------|----------|
| 客户高管 (C-Suite) | 快速了解业务价值与竞争优势 | 查看行业解决方案概览与 ROI 数据 |
| 技术架构师 | 深入理解技术架构与实现细节 | 浏览架构图、技术栈说明、部署指南 |
| 业务负责人 | 发现可落地的场景化应用 | 按行业/场景筛选 Demo，观看演示视频 |
| 销售/交付团队 | 快速找到匹配客户需求的资产 | 搜索特定关键词，获取销售材料 |
| 生态合作伙伴 | 了解集成能力与联合方案 | 查看 API 文档、集成指南 |

---

## 2. 品牌设计系统 (Design System)

### 2.1 色彩体系

#### 主色调 (Primary Palette)
| Token | Hex | 用途 |
|-------|-----|------|
| Deep Indigo | `#1C1967` | 品牌主色，导航栏背景、关键标题、按钮 |
| Periwinkle | `#D4DAF5` | 辅助色，次级背景、hover状态、高亮区域 |
| Electric Purple | `#7B3FF2` | CTA 按钮、交互强调、数据可视化强调色 |
| Accent Magenta | `#C026D3` | 渐变端点、特殊标注、动态元素 |

#### 中性色 (Neutral Palette)
| Token | Hex | 用途 |
|-------|-----|------|
| Void Black | `#0A0A0F` | 页面主背景（深色模式），营造深邃空间感 |
| Surface Dark | `#12121A` | 卡片背景、面板底色 |
| Surface Mid | `#1E1E2E` | 悬浮卡片、模态框背景 |
| Border Subtle | `#2A2A3C` | 分割线、边框 |
| Text Primary | `#F0F0F5` | 主要文字，高对比度 |
| Text Secondary | `#8B8BA3` | 次要文字、描述文本 |
| Text Tertiary | `#5A5A72` | 占位符、禁用状态 |

#### 渐变体系 (Gradients)
```css
/* Hero 区域渐变背景 */
--gradient-hero: linear-gradient(135deg, #1C1967 0%, #3D348B 40%, #7B3FF2 100%);

/* 卡片光泽效果 */
--gradient-card-shine: linear-gradient(180deg, rgba(212,218,245,0.08) 0%, rgba(212,218,245,0.02) 100%);

/* 动态数据流 */
--gradient-data-flow: linear-gradient(90deg, #7B3FF2 0%, #C026D3 50%, #7B3FF2 100%);

/* 状态指示 - 成功 */
--gradient-success: linear-gradient(135deg, #10B981 0%, #059669 100%);

/* 状态指示 - 警告 */
--gradient-warning: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
```

### 2.2 字体系统

#### 字体家族
```css
/* 英文 Display / 标题 */
--font-display: 'Graphik', 'Inter', -apple-system, sans-serif;

/* 中文 Display / 标题 */
--font-display-zh: 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;

/* 正文 / 界面元素 */
--font-body: 'Inter', 'PingFang SC', -apple-system, sans-serif;

/* 代码 / 数据 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

#### 字号层级 (Type Scale)
| Token | 桌面端 | 移动端 | 字重 | 行高 | 字间距 |
|-------|--------|--------|------|------|--------|
| Display | 72px | 40px | 700 | 1.1 | -0.02em |
| H1 | 56px | 32px | 700 | 1.15 | -0.02em |
| H2 | 40px | 28px | 600 | 1.2 | -0.01em |
| H3 | 28px | 22px | 600 | 1.3 | 0 |
| H4 | 20px | 18px | 500 | 1.4 | 0 |
| Body Large | 18px | 16px | 400 | 1.6 | 0 |
| Body | 16px | 14px | 400 | 1.6 | 0 |
| Caption | 14px | 12px | 500 | 1.4 | 0.02em |
| Overline | 12px | 11px | 600 | 1.2 | 0.08em |
| Data | 48px | 32px | 700 | 1.0 | -0.03em |
| Code | 14px | 13px | 400 | 1.5 | 0 |

### 2.3 间距系统 (Spacing)
基于 8px 网格系统：
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### 2.4 圆角系统 (Border Radius)
```css
--radius-sm: 6px;    /* 按钮、标签、小卡片 */
--radius-md: 12px;   /* 标准卡片 */
--radius-lg: 20px;   /* 大卡片、模态框 */
--radius-xl: 28px;   /* Hero 卡片、特殊容器 */
--radius-full: 9999px; /* 胶囊按钮、头像 */
```

### 2.5 阴影与光效
```css
/* 卡片阴影 - 悬浮前 */
--shadow-card: 0 4px 24px rgba(28, 25, 103, 0.12);

/* 卡片阴影 - 悬浮后 */
--shadow-card-hover: 0 8px 40px rgba(123, 63, 242, 0.2);

/* 紫色辉光 - CTA 元素 */
--glow-purple: 0 0 40px rgba(123, 63, 242, 0.4);

/* 玻璃拟态背景 */
--glass-bg: rgba(18, 18, 26, 0.7);
--glass-border: 1px solid rgba(212, 218, 245, 0.12);
--glass-backdrop: blur(24px) saturate(180%);

/* 内发光 - 输入框聚焦 */
--inner-glow: inset 0 0 0 2px rgba(123, 63, 242, 0.5);
```

### 2.6 动效系统 (Motion)
```css
/* 缓动函数 */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out: cubic-bezier(0.45, 0.05, 0.55, 0.95);

/* 时长令牌 */
--duration-fast: 150ms;      /* hover、聚焦 */
--duration-normal: 300ms;    /* 状态切换 */
--duration-slow: 500ms;      /* 页面过渡 */
--duration-dramatic: 800ms;  /* Hero 入场 */

/* 预设动画 */
/* Fade In Up */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale In */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Slide In Right */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(60px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Pulse Glow */
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(123, 63, 242, 0.3); }
  50% { box-shadow: 0 0 40px rgba(123, 63, 242, 0.6); }
}

/* Float */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

---

## 3. 全局组件 (Global Components)

### 3.1 导航栏 (Global Navigation)

**布局结构：**
- 固定顶部，高度 72px，滚动时背景从透明过渡到 `--glass-bg` + `--glass-backdrop`
- 左侧：Accenture Logo（白色版本）+ "Hyperscaler Asset Hub" 文字标识
- 中间：主导航项（Assets, Scenarios, Architecture, Insights, Community）
- 右侧：搜索图标 + 语言切换 + "Get in Touch" CTA 按钮

**交互行为：**
- 滚动超过 100px 后，导航栏添加底部阴影并启用毛玻璃背景
- 导航项 hover 时显示 2px 紫色下划线动画（宽度从 0% 到 100%）
- 移动端：汉堡菜单展开为全屏覆盖层，带有渐变色背景

**视觉规范：**
```
背景：transparent → rgba(10, 10, 15, 0.8) + backdrop-filter: blur(20px)
文字：#F0F0F5，font-weight: 500，letter-spacing: 0.02em
CTA 按钮：bg: #7B3FF2，color: #FFF，border-radius: 9999px，padding: 10px 24px
CTA hover：box-shadow: 0 0 20px rgba(123, 63, 242, 0.5)，transform: translateY(-1px)
```

### 3.2 搜索组件 (Global Search)

**触发方式：**
- 点击导航栏搜索图标
- 快捷键 Cmd/Ctrl + K

**UI 结构：**
- 居中模态框，宽度 720px，border-radius: 20px
- 顶部输入框，placeholder: "Search assets, scenarios, architectures..."
- 实时搜索建议，按类别分组（Assets / Scenarios / Architecture Patterns）
- 最近搜索记录
- 快捷键提示（↑↓ 导航，Enter 选择，Esc 关闭）

**视觉规范：**
```
背景：--glass-bg + backdrop-filter: blur(32px)
边框：1px solid rgba(212, 218, 245, 0.15)
输入框：bg transparent, border-bottom: 1px solid #2A2A3C
聚焦状态：border-color: #7B3FF2 + 底部紫色光晕
```

### 3.3 页脚 (Footer)

**布局结构：**
- 四列布局（桌面端），单列堆叠（移动端）
- 第一列：Accenture Logo + 品牌描述 + 社交图标
- 第二列：Platform（Browse Assets, Scenario Library, Architecture Hub, API Reference）
- 第三列：Resources（Documentation, Case Studies, Blog, Community）
- 第四列：Company（About Accenture, Careers, Contact, Privacy）
- 底部栏：版权信息 + 法律链接 + "Powered by Accenture AI & Data" 标识

**视觉规范：**
```
背景：#12121A
顶部边框：1px solid #2A2A3C
列标题：color: #F0F0F5, font-weight: 600, font-size: 14px, letter-spacing: 0.05em
链接：color: #8B8BA3, hover: #D4DAF5 + translateX(4px) 过渡动画
社交图标：32px 圆形按钮, bg: #1E1E2E, hover: bg: #7B3FF2
```

### 3.4 玻璃拟态卡片 (Glassmorphism Card)

**基础样式：**
```css
.glass-card {
  background: rgba(18, 18, 26, 0.6);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(212, 218, 245, 0.1);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.3s var(--ease-out-expo);
}

.glass-card:hover {
  background: rgba(18, 18, 26, 0.8);
  border-color: rgba(123, 63, 242, 0.3);
  box-shadow: 0 8px 40px rgba(123, 63, 242, 0.15);
  transform: translateY(-4px);
}
```

### 3.5 数据指标卡片 (Stat Card)

**结构：**
- 大型数字（font-size: 48px, font-weight: 700, color: #F0F0F5）
- 指标标签（font-size: 14px, color: #8B8BA3）
- 趋势指示器（+12% 绿色箭头 或 -5% 红色箭头）
- 底部装饰线（渐变紫色）

### 3.6 徽章/标签 (Badge)

**类型：**
```
云厂商标签：
- AWS: bg: #FF990020, border: #FF9900, text: #FF9900
- Azure: bg: #0078D420, border: #0078D4, text: #0078D4
- GCP: bg: #4285F420, border: #4285F4, text: #4285F4

行业标签：
- bg: rgba(123, 63, 242, 0.15), border: rgba(123, 63, 242, 0.4), text: #D4DAF5

技术标签：
- bg: rgba(192, 38, 211, 0.15), border: rgba(192, 38, 211, 0.4), text: #C026D3

状态标签：
- Live: bg: rgba(16, 185, 129, 0.15), text: #10B981
- Preview: bg: rgba(245, 158, 11, 0.15), text: #F59E0B
- Coming Soon: bg: rgba(139, 139, 163, 0.15), text: #8B8BA3
```

---

## 4. 页面架构 (Page Architecture)

### 4.1 站点地图 (Sitemap)

```
Hyperscaler Asset Hub
├── Home (Landing Page)
│   ├── Hero Section
│   ├── Featured Assets
│   ├── Scenario Categories
│   ├── Impact Metrics
│   ├── Latest Additions
│   └── CTA Section
│
├── Assets (Asset Library)
│   ├── Asset Grid/List View
│   ├── Filters (Cloud / Industry / Tech / Status)
│   ├── Asset Detail Page
│   │   ├── Hero Preview
│   │   ├── Overview
│   │   ├── Architecture Diagram
│   │   ├── Technical Specs
│   │   ├── Demo Video
│   │   ├── Deployment Guide
│   │   └── Related Assets
│   └── Compare Assets
│
├── Scenarios (Scenario Hub)
│   ├── Industry Verticals
│   ├── Use Case Categories
│   ├── Scenario Detail Page
│   │   ├── Business Context
│   │   ├── Solution Architecture
│   │   ├── Interactive Demo
│   │   ├── ROI Calculator
│   │   └── Implementation Roadmap
│   └── Scenario Builder
│
├── Architecture (Architecture Center)
│   ├── Patterns Library
│   ├── Reference Architectures
│   ├── Architecture Detail Page
│   │   ├── Diagram Viewer
│   │   ├── Component Breakdown
│   │   ├── Cost Estimator
│   │   └── Deployment Templates
│   └── Architecture Comparison
│
├── Insights (Knowledge Hub)
│   ├── Blog / Articles
│   ├── Case Studies
│   ├── Whitepapers
│   ├── Webinars
│   └── Analyst Reports
│
├── Community
│   ├── Forum
│   ├── Events Calendar
│   ├── Contributors
│   └── Submit Asset
│
├── Admin Console (管理后台)
│   ├── Asset Management (资产管理)
│   │   ├── Asset List (资产列表)
│   │   ├── Asset Editor (资产编辑器)
│   │   ├── Asset Configuration (资产配置)
│   │   └── Asset Version History (资产版本历史)
│   ├── User Management (用户管理)
│   │   ├── User List (用户列表)
│   │   ├── User Invitation (用户邀请)
│   │   └── User Activity Log (用户活动日志)
│   ├── Role & Permission (角色权限)
│   │   ├── Role Definitions (角色定义)
│   │   ├── Permission Matrix (权限矩阵)
│   │   └── Access Policies (访问策略)
│   └── System Settings (系统设置)
│       ├── Asset Type Configuration (资产类型配置)
│       ├── Category Management (分类管理)
│       └── Global Settings (全局设置)
│
├── Auth (认证中心)
│   ├── Login (登录)
│   ├── Password Reset (密码重置)
│   ├── Forgot Password (忘记密码)
│   └── Profile Settings (个人设置)
│
└── About
    ├── Platform Overview
    ├── Team
    ├── Partners (Hyperscalers)
    └── Contact
```

### 4.2 页面清单

| 页面 | 类型 | 优先级 | 描述 |
|------|------|--------|------|
| Home | 落地页 | P0 | 主入口，展示平台价值与精选内容 |
| Asset Library | 列表页 | P0 | 完整的资产浏览与筛选体验 |
| Asset Detail | 详情页 | P0 | 单个资产的全面展示与交互 |
| Scenario Hub | 列表页 | P0 | 按行业/场景组织的解决方案展示 |
| Scenario Detail | 详情页 | P0 | 场景化方案的详细说明与 Demo |
| Architecture Center | 列表页 | P1 | 参考架构与模式库 |
| Architecture Detail | 详情页 | P1 | 架构详情与交互式图表 |
| Insights Hub | 列表页 | P1 | 知识内容聚合中心 |
| Article Detail | 详情页 | P1 | 文章/案例详情 |
| Community | 社区页 | P2 | 社区互动与贡献入口 |
| About | 信息页 | P2 | 平台介绍与团队信息 |
| Submit Asset | 表单页 | P2 | 资产提交流程 |
| Login | 认证页 | P0 | 用户登录认证入口 |
| Password Reset | 认证页 | P0 | 密码重置流程 |
| Forgot Password | 认证页 | P0 | 忘记密码流程 |
| Profile Settings | 设置页 | P1 | 个人资料与偏好设置 |
| Admin Dashboard | 管理页 | P1 | 管理后台总览仪表盘 |
| Asset Management | 管理页 | P1 | 资产CRUD管理列表 |
| Asset Editor | 管理页 | P1 | 资产创建/编辑表单向导 |
| Asset Configuration | 管理页 | P1 | 资产元数据与内容配置面板 |
| User Management | 管理页 | P1 | 用户列表、邀请、编辑管理 |
| Role & Permission | 管理页 | P1 | 角色定义与RBAC权限矩阵配置 |
| Access Policies | 管理页 | P1 | 细粒度访问策略（ID/类别维度） |

---

## 5. 页面详细设计 (Page Specifications)

---

### 5.1 首页 (Home / Landing Page)

#### 整体布局
全页深色主题，单页长滚动体验。每个 Section 之间以 96-128px 间距分隔。背景采用微妙的渐变动画（紫色靛蓝渐变缓慢漂移），营造"活"的界面感受。

#### Section 1: Hero

**布局：**
- 全视口高度（100vh），内容垂直水平居中
- 背景：动态粒子网络 + 渐变叠加（#0A0A0F → #1C1967 → #0A0A0F）
- 粒子效果：WebGL 实现的紫色发光粒子网络，缓慢漂移，鼠标交互产生涟漪

**内容层次：**
```
[Overline] "ACCENTURE AI & DATA" — 12px, letter-spacing: 0.15em, color: #7B3FF2

[Headline] "Architect the Future" — Display (72px), 渐变文字效果
                                                      "with AI on Hyperscale"
                                                      
[Subheadline] "Explore battle-tested prototypes, reference architectures, and "
              "scenario-driven demos across AWS, Azure, and Google Cloud." — Body Large (18px), color: #8B8BA3, max-width: 640px

[CTA Group]
  Primary: "Explore Assets" — 紫色胶囊按钮, bg: #7B3FF2, 带脉冲高光动画
  Secondary: "Watch Demo" — 透明按钮, 带播放图标, border: 1px solid rgba(212,218,245,0.3)

[Stats Bar] 水平排列三个数据指标
  "150+ Solution Assets" | "12 Industries" | "3 Hyperscaler Partners"
  font: Data (48px), 数字带有渐变色彩效果
```

**动效：**
- 页面加载时：Overline → Headline → Subheadline → CTA → Stats 依次淡入上滑（stagger: 150ms）
- 背景粒子：持续缓慢漂移，鼠标移动时产生力场效果
- CTA 按钮：每 3 秒一次微妙的辉光脉冲

#### Section 2: Cloud Partner Bar

**布局：**
- 高度：120px，全宽
- 背景：#12121A，顶部和底部 1px 边框 #2A2A3C

**内容：**
```
[Label] "POWERED BY HYPERSCALE" — Overline 样式, 居中

[Logo Row] 三个云厂商 Logo 水平排列, 间距 80px
  AWS (白色版本) | Azure (白色版本) | Google Cloud (白色版本)
  每个 Logo 带有 hover 效果：opacity 0.5 → 1.0 + scale 1.05
```

#### Section 3: Featured Assets

**布局：**
- 标题区左对齐，右侧 "View All →" 链接
- 下方：3 列网格布局，间距 24px
- 每张卡片占据约 1/3 宽度

**卡片结构 (Asset Card)：**
```
┌─────────────────────────────────────┐
│ [Preview Image / GIF]               │
│ 16:10 比例, 渐变占位背景             │
│ 右上角: [Status Badge] [Cloud Badge]│
├─────────────────────────────────────┤
│ [Industry Tag]  [Tech Tag]          │
│                                     │
│ Asset Title — H4 (20px), 2行截断    │
│                                     │
│ Brief description... Body (14px),   │
│ 3行截断, color: #8B8BA3            │
├─────────────────────────────────────┤
│ 👁 1.2k views   ⏱ 5 min demo        │
└─────────────────────────────────────┘
```

**卡片样式：**
- 使用 Glassmorphism Card 组件
- 预览区：深色渐变背景 + 资产预览图（hover 时 scale 1.05）
- 悬浮时整个卡片上移 4px + 紫色阴影

**标题区：**
```
[H2] "Featured Assets" — 渐变文字（#F0F0F5 → #D4DAF5）
[Link] "View All Assets →" — color: #7B3FF2, hover 时右箭头移动 4px
```

#### Section 4: Scenario Categories

**布局：**
- 标题居中
- 6 张场景分类卡片，2 行 × 3 列网格
- 每张卡片带有图标、标题、描述和资产数量

**分类卡片：**
```
┌──────────────────────────────────────┐
│                                      │
│      [Icon — 48px, 渐变紫色]         │
│                                      │
│   Financial Services                 │
│   ─────────────────                  │
│   Risk analytics, fraud detection,   │
│   algorithmic trading solutions      │
│                                      │
│   24 Assets  →                       │
└──────────────────────────────────────┘
```

**分类列表：**
1. Financial Services（金融服务）— 图标：折线图
2. Healthcare & Life Sciences（医疗健康）— 图标：DNA 螺旋
3. Manufacturing（制造业）— 图标：齿轮组
4. Retail & Consumer（零售消费）— 图标：购物车
5. Energy & Utilities（能源公用事业）— 图标：闪电
6. Public Sector（公共部门）— 图标：建筑群

**卡片背景：**
- 默认：半透明深色 + 微妙渐变
- Hover：边框变为紫色渐变 + 图标放大 1.1 倍

#### Section 5: Impact Metrics

**布局：**
- 全宽区域，背景为紫色渐变（#1C1967 → #3D348B）
- 内容区最大宽度 1200px，居中
- 4 个指标水平排列

**内容：**
```
[Overline] "PLATFORM IMPACT" — color: rgba(255,255,255,0.6)

[H2] "Driving Real Results" — color: #FFF

[Metrics Grid]
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    150+      │     45%      │     3x       │    12        │
│  AI Assets   │  Faster to   │  ROI Multi-  │  Industries  │
│  Deployed    │  Production  │  plier       │  Served      │
└──────────────┴──────────────┴──────────────┴──────────────┘

[CTA] "Explore Case Studies →" — 白色边框按钮, hover: 白色背景 + 紫色文字
```

**指标样式：**
- 数字：72px, font-weight: 700, 白色
- 数字加载动画：从 0 计数到目标值，持续 2 秒
- 标签：16px, rgba(255,255,255,0.7)

#### Section 6: Latest Additions

**布局：**
- 与 Featured Assets 类似的水平滚动卡片列表
- 左侧标题区，右侧横向滚动卡片
- 带有 "← →" 导航按钮

**卡片结构：**
```
横向卡片（宽图 + 右侧信息）：
┌───────────────────────────────────────────────────────┐
│ ┌──────────────┐  [NEW Badge]                          │
│ │              │  [Cloud Badge] [Industry Badge]        │
│ │  Preview     │                                      │
│ │  Image       │  Asset Title — H3                     │
│ │  (Square)    │                                      │
│ │              │  Description text... — Body           │
│ │              │                                      │
│ │              │  Added 2 days ago • 8 min read        │
│ └──────────────┘                                      │
└───────────────────────────────────────────────────────┘
```

#### Section 7: CTA Section

**布局：**
- 居中，大间距上下
- 背景：径向渐变（中心 #1C1967，边缘 #0A0A0F）

**内容：**
```
[H2] "Ready to Transform Your Business?" — 渐变文字

[Body] "Connect with our AI & Data specialists to discuss your"
       "specific requirements and discover the right solutions." — Body Large, #8B8BA3

[CTA Group]
  Primary: "Schedule a Demo" — 大号紫色胶囊按钮, padding: 16px 40px
  Secondary: "Contact Sales" — 边框按钮
```

**装饰元素：**
- 两侧各有一个模糊的紫色光斑（类似散景效果）
- 底部有细密的网格线纹理

---

### 5.2 资产库页面 (Asset Library)

#### 整体布局
```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [H1] Asset Library                              [View Toggle]│
│  [Subheader] Discover production-ready...                     │
│                                                               │
├──────────┬────────────────────────────────────────────────────┤
│          │  [Filter Bar: Cloud ☁ | Industry 🏭 | Tech ⚙ |    │
│ Filters  │              Status ● | Sort ↕ ]                    │
│ Sidebar  ├────────────────────────────────────────────────────┤
│          │                                                    │
│ Cloud    │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ ┌──────┐ │  │  Card 1  │  │  Card 2  │  │  Card 3  │         │
│ │ AWS  │ │  └──────────┘  └──────────┘  └──────────┘         │
│ │ Azure│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ │ GCP  │ │  │  Card 4  │  │  Card 5  │  │  Card 6  │         │
│ └──────┘ │  └──────────┘  └──────────┘  └──────────┘         │
│          │                                                    │
│ Industry │  [Load More Button / Infinite Scroll Trigger]      │
│ ┌──────┐ │                                                    │
│ │ Fin  │ │  ┌──────────┬──────────┬──────────┬──────────┐     │
│ │ Health│ │  │ Page 1  │  Page 2  │  Page 3  │  ...     │     │
│ │ Mfg  │ │  └──────────┴──────────┴──────────┴──────────┘     │
│ └──────┘ │                                                    │
│          │                                                    │
├──────────┴────────────────────────────────────────────────────┤
│  Footer                                                       │
└──────────────────────────────────────────────────────────────┘
```

#### 页面头部
```
[H1] "Asset Library" — 渐变文字
[Subheader] "Discover production-ready AI prototypes, reference architectures, "
            "and reusable data platform components." — Body Large, #8B8BA3

[View Toggle]
  Grid View（默认）— 图标按钮, 激活状态: bg #7B3FF2
  List View — 图标按钮
```

#### 筛选栏 (Filter Bar)
横向排列的筛选器组：
```
[Cloud Filter] 下拉选择
  选项: All Clouds, AWS, Azure, Google Cloud, Multi-Cloud
  
[Industry Filter] 下拉选择
  选项: All Industries, Financial Services, Healthcare, Manufacturing, Retail, Energy, Public Sector

[Technology Filter] 多选下拉
  选项: Generative AI, Machine Learning, Computer Vision, NLP, Data Engineering, Analytics

[Status Filter] 分段控制器
  选项: All | Live | Preview | Coming Soon

[Sort] 下拉
  选项: Newest First, Most Popular, A-Z, Last Updated
```

筛选器视觉：
```
默认状态：bg: transparent, border: 1px solid #2A2A3C, border-radius: 9999px
激活状态：bg: rgba(123, 63, 242, 0.15), border: 1px solid #7B3FF2
```

#### 左侧筛选面板 (Desktop)
折叠式筛选面板，包含：
- Cloud Provider（复选框列表）
- Industry Vertical（复选框列表）
- Technology Stack（可展开/折叠）
- Deployment Status（单选按钮）
- Complexity Level（滑动条：Beginner → Expert）

#### 资产卡片网格 (Asset Cards)

**网格视图 (Grid View)：**
- 3 列布局（桌面），2 列（平板），1 列（手机）
- 卡片间距 24px

**列表视图 (List View)：**
- 单列，每张卡片水平布局
- 左侧预览图（固定宽度 240px），右侧详细信息

**资产卡片详细结构：**
```
┌─────────────────────────────────────┐
│ [Preview Area]                      │
│                                     │
│   [Play Button Overlay - 视频Demo]  │
│   [GIF Preview / Screenshot]        │
│                                     │
│  ┌──────────┐ ┌──────────┐         │
│  │ AWS Badge│ │Live Badge│         │
│  └──────────┘ └──────────┘         │
├─────────────────────────────────────┤
│                                     │
│ [Industry] Financial Services       │
│                                     │
│ [Title] Real-Time Fraud Detection   │
│         with Generative AI          │
│                                     │
│ [Description] End-to-end solution   │
│ for detecting anomalous transaction │
│ patterns using LLM-powered...       │
│                                     │
├─────────────────────────────────────┤
│ [Tech Tags] GenAI • Python • AWS    │
├─────────────────────────────────────┤
│ 👁 2.4k views  ♥ 156 saves  ⏱ 8min │
└─────────────────────────────────────┘
```

#### 空状态 (Empty State)
当筛选无结果时：
```
[Icon] 搜索图标 + 斜杠 — 48px, #5A5A72
[Title] "No assets found" — H3, #8B8BA3
[Description] "Try adjusting your filters or search for something different." — Body
[CTA] "Clear All Filters" — 边框按钮
```

---

### 5.3 资产详情页 (Asset Detail)

#### 整体布局
```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Breadcrumb] Assets / Financial Services / Fraud Detection   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [Hero Preview Area — 16:9 Video/GIF Player]           │   │
│  │                                                       │   │
│  │   [Play/Pause Controls] [Fullscreen Button]           │   │
│  │                                                       │   │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │   │ AWS Badge│ │Live Badge│ │Fin Badge │             │   │
│  │   └──────────┘ └──────────┘ └──────────┘             │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
├──────────────┬────────────────────────────────────────────────┤
│              │                                                │
│ Sidebar      │  [Title] Real-Time Fraud Detection             │
│ (Sticky)     │  [Subtitle] End-to-end solution...             │
│              │                                                │
│ Quick Info   │  [Tab Navigation]                              │
│ ┌──────────┐ │  Overview | Architecture | Demo | Deploy Guide │
│ │ Cloud:   │ │                                                │
│ │ AWS      │ ├────────────────────────────────────────────────┤
│ │          │ │                                                │
│ │ Industry:│ │ [Tab Content Area]                             │
│ │ Financial│ │                                                │
│ │          │ │ OVERVIEW TAB:                                  │
│ │ Tech:    │ │ - Business Problem description                 │
│ │ GenAI,   │ │ - Solution Overview                            │
│ │ Python   │ │ - Key Features list                            │
│ │          │ │ - Business Value / ROI metrics                 │
│ │ Status:  │ │ - Screenshots gallery                          │
│ │ Live     │ │                                                │
│ │          │ │ ARCHITECTURE TAB:                              │
│ │ Author:  │ │ - Interactive architecture diagram             │
│ │ Accenture│ │ - Component breakdown                          │
│ │ AI Team  │ │ - Data flow description                        │
│ │          │ │ - Cost estimate                                │
│ │ Updated: │ │                                                │
│ │ 2 days   │ │ DEMO TAB:                                      │
│ │ ago      │ │ - Embedded interactive demo                    │
│ └──────────┘ │ - Step-by-step walkthrough                     │
│              │ - Try it yourself CTA                          │
│ Actions      │                                                │
│ [Launch Demo]│ DEPLOY GUIDE TAB:                              │
│ [Download]   │ - Prerequisites                                │
│ [Share]      │ - Step-by-step deployment                      │
│ [Bookmark]   │ - Infrastructure as Code                       │
│              │ - Configuration details                        │
│              │                                                │
│              ├────────────────────────────────────────────────┤
│              │                                                │
│              │ [Related Assets Section]                       │
│              │ 3 cards horizontal scroll                      │
│              │                                                │
├──────────────┴────────────────────────────────────────────────┤
│  Footer                                                       │
└──────────────────────────────────────────────────────────────┘
```

#### Hero 预览区
- 16:9 比例，最大高度 560px
- 支持视频播放（MP4/WebM）或 GIF 预览
- 播放控制栏：播放/暂停、进度条、音量、全屏
- 标签叠加在左下角
- 底部渐变遮罩（透明 → #0A0A0F）确保文字可读

#### 侧边栏 (Sticky Sidebar)
固定在视口顶部（在导航栏下方），滚动时保持可见。

**快速信息面板：**
```
┌──────────────┐
│ QUICK INFO   │
├──────────────┤
│ Cloud        │
│ [AWS Logo]   │
│ Amazon Web   │
│ Services     │
├──────────────┤
│ Industry     │
│ Financial    │
│ Services     │
├──────────────┤
│ Technology   │
│ • GenAI      │
│ • Python     │
│ • Amazon     │
│   Bedrock    │
│ • Amazon     │
│   Neptune    │
├──────────────┤
│ Status       │
│ ● Live       │
├──────────────┤
│ Complexity   │
│ ████████░░   │
│ Advanced     │
├──────────────┤
│ Author       │
│ [Avatar]     │
│ Accenture AI │
│ & Data Team  │
├──────────────┤
│ Last Updated │
│ 2 days ago   │
├──────────────┤
│ License      │
│ MIT          │
└──────────────┘

┌──────────────┐
│ ACTIONS      │
├──────────────┤
│ [Launch Demo]│ ← bg: #7B3FF2, 大号按钮
│ [Download]   │ ← 边框按钮, 带下载图标
│ [Share]      │ ← 图标按钮组
│ [Bookmark]   │
└──────────────┘
```

#### Tab 导航
```
[Overview] [Architecture] [Demo] [Deployment Guide] [Changelog]

样式:
- 容器: border-bottom: 2px solid #2A2A3C
- Tab: padding: 16px 24px, color: #8B8BA3
- Active: color: #F0F0F5, border-bottom: 2px solid #7B3FF2
- Hover: color: #D4DAF5
```

#### Overview Tab 内容
```
[H3] Business Problem
[Body] 描述该资产解决的具体业务挑战...

[H3] Solution Overview
[Body] 解决方案的高层次描述...

[Feature List — 图标 + 文字]
✓ Real-time processing with sub-100ms latency
✓ LLM-powered anomaly explanation generation
✓ Multi-model ensemble for 99.7% accuracy
✓ Pre-built connectors for core banking systems
✓ Explainable AI with regulatory audit trails

[H3] Business Value
[Stats Grid]
┌─────────────┬─────────────┬─────────────┐
│  45%        │  $2.5M      │  6 weeks    │
│  Reduction  │  Annual     │  Time to    │
│  in fraud   │  savings    │  value      │
│  losses     │  per client │             │
└─────────────┴─────────────┴─────────────┘

[H3] Screenshots
[Image Gallery — 可点击放大]
```

#### Architecture Tab 内容
```
[H3] Reference Architecture

[Interactive Diagram]
- 可缩放的架构图
- 悬停组件显示详情 tooltip
- 点击组件展开详细信息面板

[Component Breakdown Table]
┌──────────────┬──────────────┬──────────────────┐
│ Component    │ Service      │ Purpose          │
├──────────────┼──────────────┼──────────────────┤
│ API Gateway  │ Amazon API   │ Entry point for  │
│              │ Gateway      │ fraud check API  │
├──────────────┼──────────────┼──────────────────┤
│ Inference    │ Amazon       │ LLM inference    │
│ Engine       │ Bedrock      │ for anomaly      │
│              │              │ detection        │
├──────────────┼──────────────┼──────────────────┤
│ ...          │ ...          │ ...              │
└──────────────┴──────────────┴──────────────────┘

[Cost Estimate]
Estimated monthly cost: $3,200 - $5,800
[View Detailed Breakdown →]
```

#### Demo Tab 内容
```
[H3] Interactive Demo

[Embedded Demo Frame]
- iframe 嵌入交互式 Demo
- 带加载状态（骨架屏 → Demo 内容）
- 支持全屏模式

[Walkthrough Steps]
Step 1: Upload sample transaction data
Step 2: Configure detection parameters
Step 3: Run real-time analysis
Step 4: Review AI-generated insights

[CTA] "Try it Yourself →" — 紫色按钮，跳转到沙箱环境
```

---

### 5.4 场景中心页面 (Scenario Hub)

#### 整体布局
不同于 Asset Library 的网格布局，Scenario Hub 采用行业垂直导航优先的布局。

```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [H1] Scenario Hub                           [Scenario Finder]│
│  Industry-specific AI solutions, ready to deploy              │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Industry Navigation — 水平滚动标签栏]                        │
│  All | Financial | Healthcare | Manufacturing | Retail |      │
│  Energy | Public Sector | Telecom | Media                     │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Selected Industry Hero]                                     │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [Industry Icon]  Financial Services                    │   │
│  │                                                       │   │
│  │ [H2] AI Solutions for Financial Services              │   │
│  │ [Body] From risk management to personalized banking... │   │
│  │                                                       │   │
│  │ [Stats: 24 Assets | 8 Use Cases | 3 Reference Arch]  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Use Case Grid — 2列布局]                                    │
│                                                               │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐
│  │ [Use Case Card]             │ │ [Use Case Card]             │
│  │                             │ │                             │
│  │ [Icon] Fraud Detection      │ │ [Icon] Credit Scoring       │
│  │                             │ │                             │
│  │ Real-Time Fraud Detection   │ │ AI-Powered Credit Risk      │
│  │                             │ │ Assessment                  │
│  │ Detect anomalous patterns   │ │ Enhanced credit decisioning │
│  │ in transactions using...    │ │ with alternative data...    │
│  │                             │ │                             │
│  │ [Tags] GenAI | AWS | Real-  │ │ [Tags] ML | Azure | Batch   │
│  │ time                        │ │                             │
│  │                             │ │ 3 Assets →     5 Assets →   │
│  └─────────────────────────────┘ └─────────────────────────────┘
│  ... more cards ...                                           │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  [CTA Banner]                                                 │
│  "Don't see your use case? Let's build it together."          │
│  [Contact Us →]                                               │
└──────────────────────────────────────────────────────────────┘
```

#### 行业导航栏
```
水平滚动标签栏：
- 每个标签：图标 + 行业名称
- 激活状态：bg #7B3FF2, color #FFF
- 未激活：bg transparent, border 1px solid #2A2A3C
- 切换行业时：内容区淡入淡出过渡
```

#### 用例卡片 (Use Case Card)
```
┌─────────────────────────────────────┐
│ [Header Image / Gradient]           │
│                                     │
│ [Icon — 40px, 渐变背景圆形]          │
│                                     │
│ [H3] Use Case Title                 │
│ [Body] Brief description...         │
│                                     │
│ [Tags Row]                          │
│                                     │
│ [Footer]                            │
│ 4 Associated Assets →               │
└─────────────────────────────────────┘
```

---

### 5.5 场景详情页 (Scenario Detail)

#### 整体布局
这是一个沉浸式的场景展示页面，强调业务叙事与技术实现的结合。

```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Scenario Hero Section — 全宽]                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [Background: 行业相关抽象图 + 深色渐变叠加]              │   │
│  │                                                       │   │
│  │ [Breadcrumb] Scenarios / Financial / Fraud Detection  │   │
│  │                                                       │   │
│  │ [H1] Real-Time Fraud Detection                        │   │
│  │      with Generative AI                               │   │
│  │                                                       │   │
│  │ [Subtitle] Reduce fraud losses by 45% with AI-powered │   │
│  │ anomaly detection and explainable decision making     │   │
│  │                                                       │   │
│  │ [Tags] AWS | Financial Services | GenAI | Real-time   │   │
│  │                                                       │   │
│  │ [CTAs] [View Demo] [Download Brief]                   │   │
│  │                                                       │   │
│  │ [Stats Bar] 45% reduction | 99.7% accuracy | <100ms   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Sticky Tab Nav]                                             │
│  Overview | Business Case | Architecture | Live Demo | ROI    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Tab Content Area]                                           │
│                                                               │
│  OVERVIEW TAB:                                                │
│  ┌──────────────────┐ ┌─────────────────────────────────────┐ │
│  │ The Challenge    │ │ [Image: Business problem            │ │
│  │                  │ │  illustration]                      │ │
│  │ Financial fraud  │ │                                     │ │
│  │ costs the global │ │                                     │ │
│  │ banking industry │ │                                     │ │
│  │ $4.5T annually...│ │                                     │ │
│  └──────────────────┘ └─────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────┐ ┌──────────────────┐ │
│  │ [Image: Solution diagram]           │ │ The Solution     │ │
│  │                                     │ │                  │ │
│  │                                     │ │ Our approach     │ │
│  │                                     │ │ combines...      │ │
│  └─────────────────────────────────────┘ └──────────────────┘ │
│                                                               │
│  [Key Capabilities — 3列卡片]                                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │ Real-time     │ │ Explainable   │ │ Adaptive      │       │
│  │ Detection     │ │ AI            │ │ Learning      │       │
│  │               │ │               │ │               │       │
│  │ Sub-100ms     │ │ Regulatory    │ │ Continuously  │       │
│  │ processing... │ │ audit-ready   │ │ improves...   │       │
│  └───────────────┘ └───────────────┘ └───────────────┘       │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  BUSINESS CASE TAB:                                           │
│  [Pain Points — 图标列表]                                      │
│  [ROI Calculator — 交互式滑块]                                 │
│  [Value Drivers — 图表]                                        │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ARCHITECTURE TAB:                                            │
│  [Interactive Architecture Diagram — 可交互的架构图]            │
│  [Component Details — 可展开面板]                               │
│  [Data Flow Animation — 数据流动画]                             │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  LIVE DEMO TAB:                                               │
│  [Interactive Demo Embed — 全宽嵌入]                          │
│  [Step Navigator — 步骤导航器]                                 │
│  [Try Parameters — 参数调节面板]                               │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ROI TAB:                                                     │
│  [Interactive Calculator]                                     │
│  [Assumptions Table]                                          │
│  [Comparison: Before vs After]                                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Related Scenarios — 3列卡片]                                 │
│                                                               │
│  [CTA Banner]                                                 │
│  "Ready to implement? Schedule a deep-dive session."          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### ROI 计算器组件 (ROI Calculator)
```
┌─────────────────────────────────────────────────────┐
│ ROI Calculator                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Slider] Annual Transaction Volume                 │
│  $1M ◄══════════════════════► $1B                   │
│  Current: $100M ──────────── [Input field]          │
│                                                     │
│  [Slider] Current Fraud Rate                        │
│  0.1% ◄═════════════════════► 5%                   │
│  Current: 1.2% ──────────── [Input field]           │
│                                                     │
│  [Slider] Average Transaction Value                 │
│  $10 ◄══════════════════════► $10,000               │
│  Current: $150 ──────────── [Input field]           │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Results Panel — 实时更新]                          │
│                                                     │
│  ┌─────────────────┐ ┌─────────────────┐            │
│  │ Current Loss    │ │ With AI Solution│            │
│  │                 │ │                 │            │
│  │ $1,440,000/yr   │ │ $720,000/yr     │            │
│  │                 │ │                 │            │
│  │ ████████████    │ │ ██████          │            │
│  └─────────────────┘ └─────────────────┘            │
│                                                     │
│  [Highlight Box]                                    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 💰 Potential Annual Savings: $720,000        │    │
│  │ 📉 Fraud Reduction: 50%                      │    │
│  │ ⚡ Payback Period: 4.2 months                │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [CTA] "Get Detailed ROI Report →"                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 交互式架构图组件
```
┌─────────────────────────────────────────────────────┐
│ Architecture Overview                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Toolbar] Zoom: [-] 100% [+] | [Fit] | [Layers ▼] │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │    ┌──────────┐     ┌──────────┐           │   │
│  │    │  Client  │────▶│  API GW  │           │   │
│  │    │  Apps    │     │          │           │   │
│  │    └──────────┘     └────┬─────┘           │   │
│  │                          │                 │   │
│  │                    ┌─────▼─────┐           │   │
│  │                    │  Bedrock  │           │   │
│  │                    │  (LLM)    │           │   │
│  │                    └─────┬─────┘           │   │
│  │                          │                 │   │
│  │    ┌──────────┐     ┌─────▼─────┐         │   │
│  │    │ Neptune  │◀────│  Rules    │         │   │
│  │    │  (Graph) │     │  Engine   │         │   │
│  │    └──────────┘     └───────────┘         │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Legend] ── Data Flow  ── Control Flow  ── Sync   │
│                                                     │
│  [Component Panel — 点击组件显示详情]                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ Amazon Bedrock                              │   │
│  │ ━━━━━━━━━━━━━━                              │   │
│  │ Purpose: LLM inference for anomaly detection │   │
│  │ Model: Claude 3 Sonnet                      │   │
│  │ Cost: ~$0.003/input token                   │   │
│  │ [View Documentation →]                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 5.6 架构中心页面 (Architecture Center)

#### 整体布局
```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [H1] Architecture Center                        [Compare ▼] │
│  Reference architectures and patterns for Hyperscale AI      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Pattern Categories — 卡片网格]                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Data Ingest  │ │ Model Serving│ │ Event-Driven │          │
│  │ & Processing │ │ & Inference  │ │ Architecture │          │
│  │              │ │              │ │              │          │
│  │ 12 Patterns  │ │ 8 Patterns   │ │ 6 Patterns   │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│  ... more categories ...                                      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Reference Architectures — 列表]                              │
│                                                               │
│  [Filter: Cloud | Complexity | Status]                        │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [Icon] Multi-Region Generative AI Platform            │   │
│  │ AWS | Advanced | Live                                  │   │
│  │                                                       │   │
│  │ Enterprise-grade GenAI platform with multi-region...  │   │
│  │                                                       │   │
│  │ [Tags] Bedrock | ECS | S3 | CloudFront | Route53      │   │
│  │ [View Diagram →] [Deploy →]                           │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ... more items ...                                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.7 洞察中心页面 (Insights Hub)

#### 整体布局
```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [H1] Insights                                                │
│  Latest thinking on AI, data, and digital transformation      │
│                                                               │
│  [Category Filter: All | Blog | Case Studies | Whitepapers |  │
│                    Webinars | Analyst Reports]                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Featured Article — 大卡片]                                   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [Large Image — 16:9]                                  │   │
│  │ [Category: Case Study] [Date: Jan 15, 2025]           │   │
│  │                                                       │   │
│  │ [H2] How a Global Bank Reduced Fraud by 60% Using     │   │
│  │ Accenture's GenAI Solution on AWS                     │   │
│  │                                                       │   │
│  │ [Excerpt] A leading global financial institution...   │   │
│  │ [Read More →]                                         │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  [Article Grid — 3列]                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ Article 1│ │ Article 2│ │ Article 3│                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
│  ...                                                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.8 社区页面 (Community)

#### 整体布局
```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [H1] Community                    [Submit Asset →]          │
│  Connect, contribute, and collaborate                         │
│                                                               │
├──────────────┬────────────────────────────────────────────────┤
│              │                                                │
│ [Forum Nav]  │  [Topic List / Discussion Feed]                │
│              │                                                │
│ General      │  [Pinned Topics]                               │
│ Show & Tell  │  ┌───────────────────────────────────────┐    │
│ Architecture │  │ 📌 Welcome to the Community           │    │
│ Data & AI    │  │ [Replies: 45] [Views: 1.2k]           │    │
│ GenAI        │  └───────────────────────────────────────┘    │
│ Help         │                                                │
│ Ideas        │  [Recent Discussions]                          │
│              │  ┌───────────────────────────────────────┐    │
│              │  │ [Avatar] Question about Bedrock...    │    │
│              │  │ by John D. • 2h ago • 3 replies       │    │
│              │  └───────────────────────────────────────┘    │
│              │  ... more ...                                  │
│              │                                                │
│              │  [Contributors Leaderboard]                    │
│              │  ┌─────┬────────────────┬──────────┐          │
│              │  │ #1  │ Sarah Chen     │ 24 assets│          │
│              │  │ #2  │ Mike Ross      │ 18 assets│          │
│              │  │ #3  │ Emma Wilson    │ 15 assets│          │
│              │  └─────┴────────────────┴──────────┘          │
│              │                                                │
├──────────────┴────────────────────────────────────────────────┤
│  [Upcoming Events Section]                                    │
│  [Event Card] [Event Card] [Event Card]                       │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.9 登录认证页面 (Authentication)

#### 5.9.1 登录页 (Login)

**整体布局：**
- 分屏设计：左侧视觉区（50%）+ 右侧表单区（50%）
- 移动端：全屏表单，顶部小尺寸品牌标识

**左侧视觉区：**
```
背景：渐变动画（#1C1967 → #3D348B → #7B3FF2），叠加粒子网络效果
内容：
  [Logo] Accenture Hyperscaler Asset Hub
  [Tagline] "Empowering Enterprise AI at Scale"
  [Decorative] 3张浮动玻璃卡片（缓慢上下浮动），展示平台统计数据
    - "150+ AI Assets"
    - "45% Faster Deployment"
    - "3 Hyperscaler Partners"
```

**右侧表单区：**
```
居中卡片，最大宽度 440px

[H2] "Welcome Back" — color: #F0F0F5
[Body] "Sign in to access your organization's AI asset library." — #8B8BA3

[Form]
┌─────────────────────────────────────┐
│ Email Address                       │
│ ┌─────────────────────────────────┐ │
│ │ user@company.com                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Password                            │
│ ┌─────────────────────────────────┐ │
│ │ ••••••••              [👁 Toggle]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✓] Remember me for 30 days        │
│                                     │
│ [          Sign In               ]  │ ← bg: #7B3FF2, 全宽
│                                     │
│ ─────────── or ───────────          │
│                                     │
│ [      Sign in with SSO          ]  │ ← 边框按钮, 带公司图标
│                                     │
│ Forgot password? →                  │
│                                     │
└─────────────────────────────────────┘

[Footer] Don't have an account? Contact your administrator
```

**表单交互：**
- 输入框聚焦：紫色内发光边框 + 图标颜色变为 #7B3FF2
- 验证错误：红色边框抖动动画 + 错误提示文字
- 提交中：按钮显示加载旋转器，文字变为 "Signing in..."
- 登录成功：按钮变为绿色勾号，延迟 500ms 后页面过渡

**安全特性：**
- 5次失败登录后启用验证码
- 15分钟内10次失败自动锁定账户15分钟
- 密码输入强度实时指示器
- Session 过期提醒弹窗

---

#### 5.9.2 忘记密码页 (Forgot Password)

**布局：** 与登录页相同的分屏设计

**表单内容：**
```
[H2] "Reset Your Password"
[Body] "Enter your email address and we'll send you a reset link."

[Email Input]
[Submit] "Send Reset Link" — 紫色按钮

成功状态：
┌─────────────────────────────────────┐
│  [✅ Icon — 48px, 绿色]             │
│  Check Your Email                   │
│                                     │
│  We've sent a password reset link   │
│  to user@company.com. The link     │
│  will expire in 1 hour.             │
│                                     │
│  [Resend in 59s] — 倒计时按钮      │
│  [← Back to Login]                 │
└─────────────────────────────────────┘
```

---

#### 5.9.3 密码重置页 (Password Reset)

**布局：** 验证 token 后显示的密码设置表单

**表单内容：**
```
[H2] "Create New Password"
[Body] "Your new password must be different from previous passwords."

[New Password Input]
  [Password Strength Indicator]
  ░░░░░░░░░░
  Weak / Fair / Good / Strong

[Confirm Password Input]

[Submit] "Reset Password" — 紫色按钮
```

---

#### 5.9.4 首次登录密码初始化 (First-Time Setup)

**场景：** 管理员邀请用户后，用户首次登录需要设置密码

**流程：**
```
Step 1: 通过邀请链接进入
  [H2] "Welcome to Asset Hub"
  [Body] "You've been invited by [Admin Name] to join [Organization]."
  [Continue →]

Step 2: 设置密码（同密码重置页）

Step 3: 完善个人信息
  [Profile Photo Upload — 圆形裁剪]
  [Display Name]
  [Job Title]
  [Department] — 下拉选择
  
Step 4: 偏好设置
  [Language] English / 中文 / 日本語
  [Timezone] 自动检测 / 手动选择
  [Notification Preferences] Email / In-app / Both
  
Step 5: 完成
  [🎉 Success Animation]
  "You're all set! Redirecting to the Asset Hub..."
```

---

### 5.10 管理后台 — 资产管理控制台 (Asset Management Console)

**访问控制：** 仅 Admin / Asset Manager 角色可见入口

#### 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation (带 Admin 入口高亮)                        │
├──────────────┬───────────────────────────────────────────────┤
│              │ [Breadcrumb] Admin / Asset Management         │
│              │                                               │
│ Admin        │ [H1] Asset Management        [+ New Asset]   │
│ Sidebar      │ [Stats Bar] 152 Total | 128 Live | 24 Draft │
│ (Collapsible)│                                               │
│              │ [Filter Toolbar]                              │
│ Dashboard    │ ┌──────────┬──────────┬──────────┬──────────┐ │
│ ───────────  │ │Search    │Cloud ▼   │Status ▼  │Sort ▼    │ │
│ Asset Mgmt   │ └──────────┴──────────┴──────────┴──────────┘ │
│ User Mgmt    │                                               │
│ Roles & Perms│ [Data Table — 资产列表]                        │
│ Access Policy├───────────────────────────────────────────────┤
│ Settings     │ ☑ │ Name        │ Cloud │ Status │ Modified  │ │
│              │───────────────────────────────────────────────│ │
│              │ ☑ │ Fraud Det.  │ AWS   │ ● Live │ 2h ago    │ │
│              │ ☑ │ Credit Risk │ Azure │ 🟡 Draft│ 1d ago    │ │
│              │ ☑ │ Supply Chain│ GCP   │ ● Live │ 3d ago    │ │
│              │ ... pagination ...                              │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**Admin Sidebar：**
```
样式：width 240px, bg: #12121A, border-right: 1px solid #2A2A3C

[Brand] Accenture 小Logo + "Admin"

导航项（带图标）：
  📊 Dashboard
  📦 Asset Management ← 当前激活
  👥 User Management
  🛡️ Roles & Permissions
  🔐 Access Policies
  ⚙️ Settings

每个项：
  默认: color: #8B8BA3, hover: #D4DAF5 + bg rgba(255,255,255,0.03)
  激活: color: #F0F0F5 + 左侧3px紫色竖线 + bg rgba(123,63,242,0.08)
```

#### 资产数据表格 (Asset Data Table)

**列定义：**
| 列 | 宽度 | 说明 |
|----|------|------|
| Checkbox | 40px | 批量选择 |
| Name | 弹性 | 资产名称 + 预览缩略图 |
| Cloud | 100px | 云厂商图标标签 |
| Industry | 130px | 行业标签 |
| Status | 100px | Live / Draft / Archived |
| Author | 140px | 创建者头像 + 名称 |
| Modified | 120px | 相对时间 |
| Actions | 100px | 编辑/配置/删除菜单 |

**行交互：**
- Hover：整行背景 #1E1E2E
- 点击行：展开行内详情面板（Quick Preview）
- Status 切换：点击可快速切换 Live/Draft
- 拖拽排序：通过拖拽行柄调整展示顺序

**批量操作栏（选中 ≥2 项时底部弹出）：**
```
┌────────────────────────────────────────────────────┐
│  5 items selected                                  │
│  [Change Status] [Change Cloud] [Assign Owner] [🗑]│
│                               [Clear Selection ✕] │
└────────────────────────────────────────────────────┘
样式：fixed bottom, bg: #1E1E2E, border-top: 1px solid #2A2A3C
```

---

### 5.11 管理后台 — 资产配置编辑器 (Asset Configuration Editor)

这是整个平台最核心的管理功能。资产是一个完整的可配置对象，所有展示内容都通过此编辑器动态管理。

#### 5.11.1 资产对象数据模型 (Asset Object Schema)

```typescript
interface Asset {
  // === 核心标识 ===
  id: string;                    // 唯一ID: "asset-fraud-detection-001"
  slug: string;                  // URL友好标识
  version: number;               // 版本号，每次编辑+1
  createdAt: ISOString;
  updatedAt: ISOString;
  updatedBy: UserRef;
  
  // === 基础元数据 (Basic Metadata) ===
  name: string;                  // 资产名称
  subtitle: string;              // 副标题
  description: string;           // 短描述 (列表展示用)
  longDescription: string;       // 详细描述 (Markdown)
  
  // === 分类配置 (Classification) ===
  cloudProvider: ('aws' | 'azure' | 'gcp' | 'multi')[];
  industry: string[];            // 行业标签ID列表
  technology: string[];          // 技术标签ID列表
  assetType: string;             // 资产类型ID
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'draft' | 'preview' | 'live' | 'archived';
  
  // === 视觉配置 (Visual Configuration) ===
  heroImage: MediaRef;           // Hero大图
  thumbnailImage: MediaRef;      // 列表缩略图
  previewGif: MediaRef;          // GIF预览
  icon: string;                  // Lucide图标名称
  accentColor: string;           // 主题强调色
  
  // === 演示配置 (Demo Configuration) ===
  demoConfig: {
    type: 'embedded' | 'external_link' | 'video_only' | 'none';
    externalUrl?: string;        // 外部Demo链接
    embedFrame?: {
      src: string;               // iframe embed URL
      width: number;
      height: number;
      allowFullscreen: boolean;
    };
    videoConfig?: {
      videoFile: MediaRef;       // 视频文件
      posterImage: MediaRef;     // 封面图
      autoplay: boolean;
      loop: boolean;
      muted: boolean;
    };
    walkthroughSteps: Step[];    // 分步引导
  };
  
  // === 内容区块 (Content Blocks) — 可拖拽排序 ===
  contentBlocks: ContentBlock[];
  
  // === 架构配置 (Architecture Config) ===
  architectureDiagram: {
    image: MediaRef;             // 架构图
    interactive: boolean;        // 是否启用交互
    components: ArchComponent[]; // 组件定义
  };
  
  // === 业务价值 (Business Value) ===
  businessValue: {
    problemStatement: string;    // 业务问题 (Markdown)
    solutionOverview: string;    // 方案概述 (Markdown)
    keyFeatures: Feature[];      // 关键特性列表
    roiMetrics: RoiMetric[];     // ROI指标
    caseStudyRefs: string[];     // 关联案例ID
  };
  
  // === 部署配置 (Deployment Config) ===
  deploymentGuide: {
    prerequisites: string;       // 前置条件 (Markdown)
    steps: DeployStep[];         // 部署步骤
    infrastructureAsCode: {      // IaC文件
      terraform?: MediaRef;
      cloudFormation?: MediaRef;
      armTemplate?: MediaRef;
    };
    costEstimate: CostEstimate;  // 成本估算
  };
  
  // === SEO & 元数据 ===
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: MediaRef;
  };
  
  // === 权限控制 ===
  visibility: 'public' | 'internal' | 'restricted';
  allowedRoles: string[];        // 可访问的角色ID列表
  allowedUsers: string[];        // 可访问的用户ID列表（白名单）
}

// 内容区块联合类型
interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'code' | 'stat_card' | 'comparison' | 'testimonial' | 'cta';
  order: number;
  config: BlockConfig;
  visible: boolean;
}
```

---

#### 5.11.2 配置编辑器界面 (Configuration Editor UI)

**整体布局：**
```
┌──────────────────────────────────────────────────────────────┐
│ [Nav] Admin / Assets / Edit: Fraud Detection          [Save] │
│                                                              │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Config       │  [Form Area — 当前选中Tab的内容]              │
│ Steps        │                                               │
│ (Wizard)     │                                               │
│              │                                               │
│ ① Basic Info │                                               │
│ ② Metadata   │                                               │
│ ③ Visuals    │                                               │
│ ④ Demo       │                                               │
│ ⑤ Content    │                                               │
│ ⑥ Business   │                                               │
│ ⑦ Architecture│                                              │
│ ⑧ Deployment │                                               │
│ ⑨ SEO        │                                               │
│ ⑩ Preview    │                                               │
│              │                                               │
│ [Auto-saved  │                                               │
│  2 min ago]  │                                               │
│              │                                               │
│ [Discard]    │                                               │
│ [Save Draft] │                                               │
│ [Publish →]  │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

**左侧步骤导航器 (Step Navigator)：**
```
每个步骤项：
  [序号圆圈] 步骤名称
  
状态样式：
  已完成: 紫色填充圆圈 ✓, 文字 #F0F0F5
  当前:   紫色边框圆圈(脉冲动画), 文字 #7B3FF2, 背景高亮
  待完成: 灰色边框圆圈, 文字 #5A5A72
  有错误: 红色填充圆圈 !, 文字 #EF4444

底部操作按钮：
  [Discard Changes] — 边框按钮, 灰色
  [Save Draft] — 边框按钮, 紫色
  [Publish Asset] — 填充按钮, 紫色渐变
```

---

**Step ① 基础信息 (Basic Info)：**
```
[Form Section]
┌─────────────────────────────────────────────────────┐
│ Asset Name *                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Real-Time Fraud Detection with Generative AI    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Subtitle                                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Reduce fraud losses by 45% with LLM-powered...  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Short Description *                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ End-to-end fraud detection leveraging...        │ │
│ │ (0/200 characters)                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Slug (Auto-generated)                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ real-time-fraud-detection-generative-ai         │ │
│ └─────────────────────────────────────────────────┘ │
│ [✓ Auto-generate from name]                         │
└─────────────────────────────────────────────────────┘
```

---

**Step ② 元数据分类 (Metadata & Classification)：**
```
┌─────────────────────────────────────────────────────┐
│ Cloud Provider *               [+ Add Multi-Cloud]  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ ☁️ AWS   │ │ ☁️ Azure │ │ ☁️ GCP   │             │
│ │ [✓]      │ │ [  ]     │ │ [  ]     │             │
│ └──────────┘ └──────────┘ └──────────┘             │
│                                                     │
│ Industry Vertical *                                 │
│ [Dropdown — Searchable Multi-select]                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Financial Services ▼                            │ │
│ └─────────────────────────────────────────────────┘ │
│ Selected: [Financial Services ✕] [Banking ✕]       │
│                                                     │
│ Technology Stack                                    │
│ [Tag Input — Type to add]                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ GenAI, Python, Bedrock, Neptune                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Asset Type *                                        │
│ [Segmented Control]                                 │
│ [Solution Prototype] [Reference Arch] [Component]   │
│                                                     │
│ Complexity                                          │
│ ○ Beginner ○ Intermediate ● Advanced ○ Expert       │
│                                                     │
│ Status                                              │
│ ● Draft  ○ Preview  ○ Live  ○ Archived              │
└─────────────────────────────────────────────────────┘
```

---

**Step ③ 视觉配置 (Visual Configuration)：**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│ Hero Image (16:9 recommended)                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │  [Upload Area — Drag & Drop]                    │ │
│ │                                                 │ │
│ │  📤 Drop image here, or click to browse         │ │
│ │  Supports: JPG, PNG, WebP (max 5MB)             │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ [Preview Thumbnail] [Replace] [Remove]              │
│                                                     │
│ Thumbnail Image (1:1 recommended)                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ┌─────┐                                         │ │
│ │ │     │  fraud-detection-thumb.png              │ │
│ │ │ 👁️  │  234 KB • 800×800                      │ │
│ │ └─────┘  [Replace] [Remove]                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Preview GIF / Video                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Video Upload — 或粘贴URL]                      │ │
│ │                                                 │ │
│ │ [▶ Play Preview]  fraud-demo.mp4                │ │
│ │ Duration: 0:45 • 12.4 MB                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Accent Color                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ 🎨 #7B3FF2│ │ Custom   │ │           │             │
│ │  Purple  │ │ Pick     │ │           │             │
│ └──────────┘ └──────────┘ └──────────┘             │
│ [Color Picker — 16色预设 + 自定义]                   │
└─────────────────────────────────────────────────────┘
```

---

**Step ④ 演示配置 (Demo Configuration)：**
```
┌─────────────────────────────────────────────────────┐
│ Demo Type                                           │
│ [Segmented Control]                                 │
│ [Embedded] [External Link] [Video Only] [None]      │
│                                                     │
│ ─── External Link 模式 ───                          │
│ External Demo URL                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://demo.accenture.com/fraud-detection      │ │
│ └─────────────────────────────────────────────────┘ │
│ [Open Link ↗] to verify                           │
│                                                     │
│ ─── Embedded 模式 ───                               │
│ Embed URL (iframe src)                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://sandbox.accenture.com/embed/abc123      │ │
│ └─────────────────────────────────────────────────┘ │
│ Dimensions: [Width: 1280] × [Height: 720]           │
│ [✓] Allow fullscreen                                │
│                                                     │
│ [Live Preview]                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [iframe Preview — 带 sandbox 隔离]               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ─── Video Demo 配置 ───                             │
│ [同 Step ③ Video Upload]                            │
│                                                     │
│ Walkthrough Steps                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Step 1: Upload sample transaction data     [✕]  │ │
│ │ Step 2: Configure detection parameters     [✕]  │ │
│ │ Step 3: Run real-time analysis             [✕]  │ │
│ │ Step 4: Review AI-generated insights       [✕]  │ │
│ │ [+ Add Step]                                      │ │
│ └─────────────────────────────────────────────────┘ │
│ 拖拽排序 ↑↓                                          │
└─────────────────────────────────────────────────────┘
```

---

**Step ⑤ 内容区块编辑器 (Content Blocks Editor)：**

这是最高自由度的配置区域。管理员可以通过拖拽添加、排序、配置各种内容区块。

```
┌─────────────────────────────────────────────────────┐
│ Content Blocks  [+ Add Block]                       │
│                                                     │
│ [Drag Handle] Block 1: Rich Text                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Markdown Editor — 富文本编辑]                   │ │
│ │ ┌─────┬─────┬─────┬─────┬─────┬─────┐         │ │
│ │ │ B   │ I   │  🔗  │  📷  │  📋  │  ≈   │         │ │
│ │ └─────┴─────┴─────┴─────┴─────┴─────┘         │ │
│ │                                                 │ │
│ │  The challenge of fraud detection in modern... │ │
│ │                                                 │ │
│ │  [Formatting: H2, H3, Lists, Code blocks]     │ │
│ └─────────────────────────────────────────────────┘ │
│ [Duplicate] [Delete] [Move ↑] [Move ↓]             │
│                                                     │
│ [Drag Handle] Block 2: Image Gallery               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Image 1 👁️] [Image 2 👁️] [+ Add Image]          │ │
│ │ Layout: [Grid ○] [Carousel ○] [Masonry ●]        │ │
│ │ Caption position: [Below ○] [Overlay ●] [None ○] │ │
│ └─────────────────────────────────────────────────┘ │
│ [Duplicate] [Delete] [Move ↑] [Move ↓]             │
│                                                     │
│ [Drag Handle] Block 3: Stat Cards                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ┌────────────┐ ┌────────────┐ ┌────────────┐   │ │
│ │ │ 45%        │ │ $2.5M      │ │ 6 weeks    │   │ │
│ │ │ Reduction  │ │ Savings    │ │ Time-to-   │   │ │
│ │ │            │ │            │ │ Value      │   │ │
│ │ │ [Edit ✎]   │ │ [Edit ✎]   │ │ [Edit ✎]   │   │ │
│ │ └────────────┘ └────────────┘ └────────────┘   │ │
│ │ [+ Add Stat]                                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [+ Add Block] 底部添加按钮                           │
└─────────────────────────────────────────────────────┘
```

**可添加的区块类型 (Block Types)：**
| 区块类型 | 说明 | 配置选项 |
|----------|------|----------|
| Rich Text | Markdown富文本 | 编辑器工具栏 |
| Image | 单图/画廊 | 布局、裁剪、Caption |
| Video | 视频播放器 | 自动播放、循环、封面 |
| Code | 代码展示 | 语言、高亮主题、复制按钮 |
| Stat Cards | 数据指标卡 | 数字、标签、趋势、图标 |
| Comparison | 前后对比 | Before/After 滑块 |
| Testimonial | 客户评价 | 头像、引言、姓名、职位 |
| CTA | 行动号召 | 按钮文字、链接、样式 |
| Divider | 分隔线 | 线条样式、间距 |
| Table | 数据表格 | 行列数据、排序 |

---

**Step ⑩ 实时预览 (Live Preview)：**

配置完成后的实时预览模式，分屏显示编辑器和预览。

```
┌──────────────────────────────┬──────────────────────────────┐
│ [Editor Panel — 左]          │ [Preview Panel — 右]         │
│                              │                              │
│ [Quick Edit Tabs]            │ [Device Selector]            │
│ Content | Visual | Demo      │ [💻 Desktop] [📱 Mobile]    │
│                              │                              │
│ [可折叠的编辑面板]            │ [Live Preview — iframe]      │
│ 快速修改而不离开预览          │ 实时渲染最终效果              │
│                              │                              │
│ [Reflect Changes] [↻ Refresh]│                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

### 5.12 管理后台 — 用户管理 (User Management)

#### 整体布局
```
┌──────────────────────────────────────────────────────────────┐
│  Global Navigation                                            │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Admin        │ [Breadcrumb] Admin / User Management          │
│ Sidebar      │                                               │
│              │ [H1] User Management        [+ Invite User]   │
│              │                                               │
│              │ ┌──────────┬──────────┬──────────┐            │
│              │ │ 86 Users │ 72 Active│ 4 Pending│            │
│              │ │ Total    │          │ Invites  │            │
│              │ └──────────┴──────────┴──────────┘            │
│              │                                               │
│              │ [Search] [Role ▼] [Status ▼] [Department ▼]   │
│              │                                               │
│              │ ┌─────────────────────────────────────────┐   │
│              │ │ ☑ │ User │ Role │ Dept │ Status │ Actions│   │
│              │ │───┼──────┼──────┼──────┼────────┼───────│   │
│              │ │ ☐ │ John │Admin │ AI   │● Active│⋯⋯⋯    │   │
│              │ │ ☐ │ Sarah│Editor│ Data │● Active│⋯⋯⋯    │   │
│              │ │ ☐ │ Mike │Viewer│ Sales│⏸ Inact.│⋯⋯⋯    │   │
│              │ │ ☐ │ Emma │Viewer│ AI   │🕐 Pend.│⋯⋯⋯    │   │
│              │ └─────────────────────────────────────────┘   │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

#### 邀请用户流程 (Invite User)

```
[Modal Dialog — Invite Users]
┌─────────────────────────────────────────────────────┐
│ Invite New Users                                [✕] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Email Addresses *                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ user1@company.com, user2@company.com            │ │
│ │ (支持批量粘贴，逗号/换行分隔)                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Assign Role *                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Select Role ▼                                   │ │
│ │ ○ Admin — Full platform access                  │ │
│ │ ○ Asset Manager — Manage assets, view users     │ │
│ │ ● Editor — Create/edit assigned assets          │ │
│ │ ○ Viewer — View only (default)                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Department                                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ AI & Data ▼                                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [✓] Send welcome email with setup link              │
│                                                     │
│ Custom Message (optional)                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Welcome to the Asset Hub! Please set up your    │ │
│ │ account using the link below...                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel]               [Send Invitations]           │
└─────────────────────────────────────────────────────┘
```

#### 用户详情弹窗 (User Detail Modal)

```
┌─────────────────────────────────────────────────────┐
│ User Profile                                  [✕]   │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐                                        │
│ │ [Avatar] │  John Doe                              │
│ │   80px   │  john.doe@accenture.com                │
│ │  circle  │  Editor • AI & Data Team               │
│ └──────────┘  Joined: Jan 15, 2025                 │
│                                                     │
│ [Tabs: Overview | Permissions | Activity | Settings]│
│                                                     │
│ Overview Tab:                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Contact Information                             │ │
│ │ Email: john.doe@accenture.com                   │ │
│ │ Department: AI & Data                           │ │
│ │ Job Title: Senior Solutions Architect           │ │
│ │                                                 │ │
│ │ Security                                        │ │
│ │ Last login: 2 hours ago                         │ │
│ │ 2FA: ● Enabled                                  │ │
│ │ Password: Last changed 30 days ago              │ │
│ │                                                 │ │
│ │ Activity Summary                                │ │
│ │ Assets created: 12                              │ │
│ │ Assets edited: 34                               │ │
│ │ Logins this month: 18                           │ │
│ └─────────────────────────────────────────────────┐ │
│                                                     │
│ [Edit Profile] [Reset Password] [Deactivate] [🗑]  │
└─────────────────────────────────────────────────────┘
```

---

### 5.13 管理后台 — 角色与权限管理 (Role & Permission Management)

#### 5.13.1 角色定义 (Role Definitions)

**预设角色体系：**

| 角色 | ID | 描述 | 目标用户 |
|------|-----|------|----------|
| **Super Admin** | `role-super-admin` | 平台超级管理员，拥有所有权限 | 平台所有者 |
| **Admin** | `role-admin` | 管理用户、角色、资产和系统设置 | IT/运营负责人 |
| **Asset Manager** | `role-asset-manager` | 管理资产（CRUD）、查看用户列表 | 资产管理员 |
| **Editor** | `role-editor` | 创建/编辑被授权的资产，查看所有资产 | 解决方案架构师 |
| **Viewer** | `role-viewer` | 仅查看被授权的资产，无编辑权限 | 销售/客户/一般用户 |
| **Guest** | `role-guest` | 仅查看公开资产，需登录 | 外部合作伙伴 |

**角色管理界面：**
```
┌──────────────────────────────────────────────────────────────┐
│ [H1] Roles & Permissions     [+ Create Custom Role]         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Role Cards — 水平排列]                                       │
│                                                               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ 👑 Super     │ │ 🛡️ Admin    │ │ 📦 Asset     │          │
│ │    Admin     │ │              │ │    Manager   │          │
│ │              │ │              │ │              │          │
│ │ 2 users      │ │ 5 users      │ │ 12 users     │          │
│ │ All perms    │ │ Full mgmt    │ │ Asset CRUD   │          │
│ │ [Edit] [🗑]  │ │ [Edit] [🗑]  │ │ [Edit] [🗑]  │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
│ ... more roles ...                                            │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Permission Matrix — 核心区域]                                │
│                                                               │
│                    Super  Admin  Asset  Editor  Viewer         │
│                    Admin         Manager                       │
│ ─────────────────────────────────────────────────────         │
│ User Management                                                        │
│   View users        ✓      ✓      ✓      ─      ─             │
│   Create users      ✓      ✓      ─      ─      ─             │
│   Edit users        ✓      ✓      ─      ─      ─             │
│   Delete users      ✓      ✓      ─      ─      ─             │
│   Invite users      ✓      ✓      ─      ─      ─             │
│ ─────────────────────────────────────────────────────         │
│ Asset Management                                              │
│   View assets       ✓      ✓      ✓      ✓      ✓             │
│   Create assets     ✓      ✓      ✓      ✓      ─             │
│   Edit all assets   ✓      ✓      ✓      ─      ─             │
│   Edit own assets   ✓      ✓      ✓      ✓      ─             │
│   Delete assets     ✓      ✓      ✓      ─      ─             │
│   Publish assets    ✓      ✓      ✓      ─      ─             │
│   Configure assets  ✓      ✓      ✓      ✓      ─             │
│ ─────────────────────────────────────────────────────         │
│ Role Management                                               │
│   View roles        ✓      ✓      ─      ─      ─             │
│   Edit roles        ✓      ✓      ─      ─      ─             │
│   Assign roles      ✓      ✓      ─      ─      ─             │
│ ─────────────────────────────────────────────────────         │
│ System Settings                                               │
│   View settings     ✓      ✓      ─      ─      ─             │
│   Edit settings     ✓      ✓      ─      ─      ─             │
│ ─────────────────────────────────────────────────────         │
│                                                               │
│ [Save Changes]  ← 权限矩阵修改后高亮显示未保存                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**权限矩阵交互：**
- 点击单元格：切换 ✓ / ─
- 整行批量设置：行标题处下拉菜单
- 修改后未保存：单元格边框高亮黄色，底部显示 "Unsaved changes" 提示
- 继承关系：自定义角色可继承预设角色，修改项高亮显示

---

#### 5.13.2 细粒度访问策略 (Access Policies)

这是权限系统最核心的部分，支持从**资产ID维度**和**类别维度**进行管控。

**访问策略模型：**
```typescript
interface AccessPolicy {
  id: string;
  name: string;              // 策略名称: "Financial Services Access"
  description: string;
  priority: number;          // 策略优先级 (高优先覆盖低优先)
  enabled: boolean;
  
  // 策略主体 (Subjects) — 对谁生效
  subjects: {
    users: string[];         // 用户ID列表
    roles: string[];         // 角色ID列表
    groups: string[];        // 用户组ID列表
  };
  
  // 策略资源 (Resources) — 控制哪些资产
  resources: {
    // 按资产ID维度
    assetIds: string[];      // 具体资产ID列表 ["asset-001", "asset-002"]
    
    // 按类别维度
    filters: {
      cloudProviders?: string[];    // ["aws", "azure"]
      industries?: string[];        // ["financial", "healthcare"]
      assetTypes?: string[];        // ["solution", "component"]
      technologies?: string[];      // ["genai", "ml"]
      status?: string[];            // ["live"]
    };
    
    // 排除项 (黑名单)
    excludeAssetIds: string[];
  };
  
  // 策略动作 (Actions) — 允许的操作
  actions: ('view' | 'edit' | 'configure' | 'publish' | 'delete')[];
  
  // 生效条件
  conditions: {
    timeRange?: { start: string; end: string };  // 时间窗口
    ipWhitelist?: string[];                       // IP白名单
    require2FA?: boolean;                         // 是否需要2FA
  };
}
```

**访问策略管理界面：**
```
┌──────────────────────────────────────────────────────────────┐
│ [H1] Access Policies         [+ Create Policy]              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Policy List — 可折叠卡片]                                    │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐    │
│ │ ● Financial Services Access        [Edit] [Duplicate] [🗑]│    │
│ │   Priority: 100 • 24 users • 45 assets               │    │
│ │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │    │
│ │   WHO: Roles [Viewer, Editor] + Users [john@, sarah@]│    │
│ │   WHAT: Industry [Financial] + Cloud [AWS, Azure]    │    │
│ │   EXCEPT: asset-deprecated-001                       │    │
│ │   CAN: View, Edit                                    │    │
│ │   CONDITIONS: Requires 2FA                           │    │
│ └───────────────────────────────────────────────────────┘    │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐    │
│ │ ● Healthcare Assets (Read Only)      [Edit] [Dup] [🗑]│    │
│ │   Priority: 90 • 15 users • 32 assets                │    │
│ │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │    │
│ │   WHO: Role [Viewer] + Group [Healthcare-Team]       │    │
│ │   WHAT: Industry [Healthcare]                        │    │
│ │   CAN: View Only                                     │    │
│ └───────────────────────────────────────────────────────┘    │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐    │
│ │ ● Specific Asset Restriction         [Edit] [Dup] [🗑]│    │
│ │   Priority: 200 (Override) • 3 users • 2 assets      │    │
│ │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │    │
│ │   WHO: Users [external@partner.com]                  │    │
│ │   WHAT: Asset IDs [asset-007, asset-008]             │    │
│ │   CAN: View                                          │    │
│ │   CONDITIONS: IP Whitelist [10.0.0.0/24]            │    │
│ └───────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**创建策略向导 (Create Policy Wizard)：**
```
Step 1: Policy Identity
  [Name] [Description] [Priority Slider 1-1000]

Step 2: Who — 选择策略主体
  [Role Selector] [User Search] [Group Selector]
  
Step 3: What — 选择受控资源
  [Tab: By Category | By Asset ID]
  
  By Category Tab:
    Cloud: [AWS ✓] [Azure ✓] [GCP ✕]
    Industry: [Financial ✓] [Healthcare ✕] ...
    Type: [All]
    Status: [Live ✓] [Preview ✕]
    
  By Asset ID Tab:
    [Search & Select Assets]
    ┌─────────────────────────────────────────┐
    │ [Search...]                             │
    │ ☑ asset-fraud-detection-001             │
    │ ☑ asset-credit-risk-002                 │
    │ ☐ asset-supply-chain-003               │
    │ ☑ asset-kyc-automation-004              │
    └─────────────────────────────────────────┘
    
  Exclude: [asset-deprecated-001]

Step 4: Actions — 允许的操作
  [✓] View  [✓] Edit  [✕] Configure  [✕] Publish  [✕] Delete

Step 5: Conditions (Optional)
  [✓] Require 2FA
  [Time Range] [IP Whitelist]
  
Step 6: Review & Save
  [策略摘要卡片]
  [Save Policy]
```

**权限验证流程 (可视化说明)：**
```
用户请求访问资产 → 系统评估流程:

  ┌─────────────┐
  │ User Request│
  │ View asset-1│
  └──────┬──────┘
         ▼
  ┌──────────────────────────┐
  │ 1. 获取用户所有角色       │
  │    [Viewer, Healthcare]   │
  └──────┬───────────────────┘
         ▼
  ┌──────────────────────────┐
  │ 2. 查找匹配的策略         │
  │    - Policy A: Priority 100
  │    - Policy B: Priority 90
  │    - Policy C: Priority 200
  └──────┬───────────────────┘
         ▼
  ┌──────────────────────────┐
  │ 3. 按优先级排序评估       │
  │    C(200) → A(100) → B(90)│
  └──────┬───────────────────┘
         ▼
  ┌──────────────────────────┐
  │ 4. 资源匹配检查           │
  │    C: assetIds包含? → No  │
  │    A: industry匹配? → Yes │
  │    → 返回允许 actions     │
  └──────┬───────────────────┘
         ▼
  ┌──────────────────────────┐
  │ 5. 条件检查               │
  │    Require 2FA? → Yes     │
  │    User has 2FA? → Yes ✓  │
  └──────┬───────────────────┘
         ▼
  ┌──────────────────────────┐
  │ 6. 最终决策               │
  │    ✅ ALLOW: [View, Edit] │
  └──────────────────────────┘
```

---

#### 5.13.3 权限预览与调试 (Permission Preview & Debug)

管理员可以模拟特定用户查看权限效果：

```
┌─────────────────────────────────────────────────────┐
│ Permission Simulator                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Select User] john.doe@accenture.com ▼             │
│ Role: Editor | Groups: AI-Team, Healthcare         │
│                                                     │
│ Simulate Access to:                                 │
│ [Search Asset...]  asset-fraud-detection-001       │
│                                                     │
│ [Run Simulation]                                    │
│                                                     │
│ Results:                                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✅ Access GRANTED                               │ │
│ │                                                 │ │
│ │ Matched Policies:                               │ │
│ │ • Policy "Financial Services Access" (P:100)   │ │
│ │   → Grants: View, Edit                          │ │
│ │                                                 │ │
│ │ Effective Permissions:                          │ │
│ │ [View ✓] [Edit ✓] [Configure ✕] [Publish ✕]   │ │
│ │                                                 │ │
│ │ Check History:                                  │ │
│ │ 1. Role "Editor" → base perms: [View]          │ │
│ │ 2. Policy A (P:100) → adds: [Edit]             │ │
│ │ 3. No deny rules matched                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Compare with Another User] [Export Report]        │
└─────────────────────────────────────────────────────┘
```

---

## 6. 交互设计 (Interaction Design)

### 6.1 全局交互模式

**滚动行为：**
- 全局启用平滑滚动（smooth scroll）
- 导航栏根据滚动方向自动隐藏/显示（向下滚动隐藏，向上滚动显示）
- 滚动到 Section 时触发元素入场动画

**页面转场：**
```
页面切换动画：
- 当前页面：opacity 1 → 0, scale 1 → 0.98, duration: 200ms
- 新页面：opacity 0 → 1, scale 0.98 → 1, duration: 300ms, delay: 100ms
- 使用 ease-out-expo 缓动
```

**加载状态：**
```
骨架屏 (Skeleton Screen)：
- 使用脉冲动画的占位块
- 背景渐变 shimmer 效果
- 结构与实际内容一致

加载完成：
- 骨架屏淡出 (200ms)
- 实际内容淡入 + 轻微上移 (300ms)
```

### 6.2 微交互 (Micro-interactions)

**按钮交互：**
```
Hover (150ms):
- transform: translateY(-2px)
- box-shadow: 增加紫色辉光
- 背景色轻微提亮

Active/Press (100ms):
- transform: translateY(0) scale(0.98)
- 阴影收缩

Focus:
- outline: 2px solid #7B3FF2
- outline-offset: 2px
```

**卡片交互：**
```
Hover (300ms):
- transform: translateY(-6px)
- border-color: rgba(123, 63, 242, 0.4)
- box-shadow: 0 12px 48px rgba(123, 63, 242, 0.2)
- 内部预览图 scale(1.05)

Click:
- 轻微按压感 (scale 0.98)
- 导航到详情页
```

**筛选器交互：**
```
展开动画 (300ms):
- 下拉面板从上方滑入 + 淡入
- 使用 ease-out-expo

选项选择:
- 选中项左侧出现紫色圆点
- 计数实时更新，数字滚动动画
```

### 6.3 滚动触发动画 (Scroll Animations)

**Intersection Observer 触发的入场动画：**
```
元素进入视口 20% 时触发：

fadeInUp:
  - 初始: opacity: 0, translateY: 40px
  - 最终: opacity: 1, translateY: 0
  - duration: 600ms
  - easing: ease-out-expo
  - stagger: 100ms (子元素依次延迟)

scaleIn:
  - 初始: opacity: 0, scale: 0.92
  - 最终: opacity: 1, scale: 1
  - duration: 500ms

slideInLeft/Right:
  - 初始: opacity: 0, translateX: ±60px
  - 最终: opacity: 1, translateX: 0
  - duration: 600ms
```

**视差效果 (Parallax)：**
```
Hero 区域背景粒子：
- 鼠标移动产生轻微的力场偏移
- 滚动时粒子层以 0.5x 速度移动（视差）

Decorative Elements：
- 背景装饰形状随滚动缓慢旋转/移动
- 速度: 0.1x - 0.3x
```

### 6.4 响应式断点 (Responsive Breakpoints)

```
Desktop Large: ≥ 1440px
  - 最大内容宽度: 1280px
  - 3列网格
  - 完整侧边栏

Desktop: ≥ 1024px
  - 最大内容宽度: 1200px
  - 3列网格
  - 可折叠侧边栏

Tablet: ≥ 768px
  - 全宽容器 + padding
  - 2列网格
  - 筛选器变为横向滚动标签

Mobile: < 768px
  - 全宽容器 + 16px padding
  - 单列布局
  - 汉堡菜单导航
  - 底部固定操作栏
```

---

## 7. 技术实现建议 (Technical Recommendations)

### 7.1 前端技术栈
```
Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS + CSS Modules

UI Components:
  - shadcn/ui (基础组件)
  - Radix UI (无障碍原语)
  
Animation:
  - Framer Motion (组件动画、页面过渡)
  - GSAP + ScrollTrigger (滚动动画)
  - Three.js / React Three Fiber (Hero 粒子效果)
  
State Management:
  - Zustand (全局状态)
  - React Query (服务端状态)

Search:
  - Algolia DocSearch (即时搜索)

Charts & Visualization:
  - D3.js (自定义数据可视化)
  - Mermaid.js (架构图)
  
Video:
  - React Player (Demo 视频)
```

### 7.2 性能优化
```
图片优化:
  - Next.js Image 组件
  - WebP/AVIF 格式
  - 响应式图片 srcset
  - 懒加载 + blur placeholder

代码分割:
  - 路由级别代码分割
  - 动态导入大型库 (Three.js, D3)

动画性能:
  - 仅使用 transform 和 opacity
  - will-change 属性优化
  - 减少重绘区域

核心指标目标:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
  - FCP < 1.8s
```

### 7.3 可访问性 (Accessibility)
```
WCAG 2.1 AA 合规:
  - 色彩对比度 ≥ 4.5:1 (正文), ≥ 3:1 (大文字)
  - 键盘导航支持
  - ARIA 标签完整
  - 焦点状态可见
  - 屏幕阅读器友好
  - 减少动画偏好支持 (prefers-reduced-motion)
  
深色模式:
  - 默认深色主题
  - 支持系统偏好检测
  - 手动切换开关
```

---

## 8. 设计亮点总结 (Design Highlights)

### 8.1 视觉差异化

| 特性 | 说明 |
|------|------|
| **深空紫色调** | 以 #1C1967 Deep Indigo 为基底，搭配 #7B3FF2 电光紫，营造深邃而充满活力的科技感 |
| **Glassmorphism 系统** | 贯穿全局的毛玻璃效果，增加层次深度与现代质感 |
| **动态粒子 Hero** | WebGL 实现的交互式粒子网络，首屏即产生强烈的视觉冲击 |
| **渐变文字效果** | 关键标题使用紫色渐变填充，增加视觉丰富度 |
| **紫色辉光体系** | 按钮、卡片悬浮时的紫色光晕效果，形成一致的交互反馈语言 |
| **数据流动画** | 架构图中的数据流动画，直观展示系统运作机制 |

### 8.2 交互差异化

| 特性 | 说明 |
|------|------|
| **即时搜索体验** | Cmd+K 全局搜索，实时建议，键盘优先的交互模式 |
| **沉浸式 Demo 嵌入** | 场景详情页直接嵌入交互式 Demo，无需跳转 |
| **交互式 ROI 计算器** | 滑动条实时计算 ROI，数据可视化反馈 |
| **可交互架构图** | 点击组件查看详情，悬停显示技术规格 |
| **滚动叙事** | 长滚动页面的渐进式内容揭示，引导用户深度浏览 |
| **微交互密度** | 每个可交互元素都有精心设计的 hover/active 状态 |

### 8.3 功能完整性

| 模块 | 核心能力 |
|------|----------|
| **Asset Library** | 多维度筛选、网格/列表视图切换、即时搜索、资产对比 |
| **Scenario Hub** | 行业垂直导航、用例卡片、沉浸式场景叙事 |
| **Architecture Center** | 模式库、参考架构、交互式图表、成本估算 |
| **Insights Hub** | 多类型内容聚合、特色文章、分类浏览 |
| **Community** | 论坛讨论、贡献者排行、活动日历、资产提交 |
| **Global Search** | 跨站点搜索、分类建议、最近搜索 |
| **Authentication** | 登录/SSO、密码管理、首次登录引导、安全策略 |
| **Asset Management Console** | 资产CRUD、批量操作、数据表格、快速预览 |
| **Asset Configuration Editor** | 10步配置向导、内容区块编辑器、实时预览、版本控制 |
| **User Management** | 用户邀请、角色分配、活动日志、批量操作 |
| **Role & Permission (RBAC)** | 6级预设角色、可视化权限矩阵、细粒度访问策略 |
| **Access Policies** | 资产ID维度/类别维度双轨管控、优先级策略引擎、权限模拟器 |

### 8.4 数据模型与权限架构亮点

| 特性 | 说明 |
|------|------|
| **完整的 Asset 对象模型** | TypeScript 接口定义，覆盖从核心标识到部署配置的全字段体系，支持版本追踪 |
| **内容区块系统 (Content Blocks)** | 11种可配置区块类型（富文本/图片/视频/代码/指标卡等），拖拽排序，自由组合 |
| **双轨权限管控** | 同时支持资产ID级别的精确控制（白名单）和类别级别的批量控制（过滤器），互为补充 |
| **策略优先级引擎** | 访问策略支持优先级数值（1-1000），高优先策略可覆盖低优先策略，实现灵活的权限编排 |
| **条件访问控制** | 支持时间窗口、IP白名单、2FA要求等附加条件，满足企业安全合规需求 |
| **权限模拟器** | 管理员可模拟任意用户的权限视角，实时查看访问决策路径和匹配的策略链条 |

### 8.5 管理后台设计亮点

| 特性 | 说明 |
|------|------|
| **分屏登录体验** | 左侧动态视觉区（粒子+浮动卡片）+ 右侧纯净表单，兼顾品牌感与功能性 |
| **10步资产配置向导** | 步骤导航器可视化进度，实时自动保存，分步验证减少认知负担 |
| **实时预览模式** | 配置编辑器与预览面板分屏联动，所见即所得，支持桌面/移动端切换 |
| **权限矩阵可视化** | 角色×权限的交叉表格，点击单元格即时切换，未保存变更黄色高亮提示 |
| **访问策略卡片** | 策略规则以可读性强的自然语言卡片展示（WHO/WHAT/CAN/EXCEPT），降低理解成本 |

---

## 9. 附录 (Appendix)

### 9.1 设计 Token 汇总

完整的 CSS 自定义属性列表，便于开发团队直接使用：

```css
:root {
  /* Colors */
  --color-deep-indigo: #1C1967;
  --color-periwinkle: #D4DAF5;
  --color-electric-purple: #7B3FF2;
  --color-accent-magenta: #C026D3;
  --color-void-black: #0A0A0F;
  --color-surface-dark: #12121A;
  --color-surface-mid: #1E1E2E;
  --color-border-subtle: #2A2A3C;
  --color-text-primary: #F0F0F5;
  --color-text-secondary: #8B8BA3;
  --color-text-tertiary: #5A5A72;

  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #1C1967 0%, #3D348B 40%, #7B3FF2 100%);
  --gradient-card-shine: linear-gradient(180deg, rgba(212,218,245,0.08) 0%, rgba(212,218,245,0.02) 100%);

  /* Typography */
  --font-display: 'Graphik', 'Inter', -apple-system, sans-serif;
  --font-body: 'Inter', 'PingFang SC', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --space-unit: 8px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  /* Shadows */
  --shadow-card: 0 4px 24px rgba(28, 25, 103, 0.12);
  --shadow-card-hover: 0 8px 40px rgba(123, 63, 242, 0.2);
  --glow-purple: 0 0 40px rgba(123, 63, 242, 0.4);

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}
```

### 9.2 图标系统 (Iconography)

使用 **Phosphor Icons** 或 **Lucide React** 图标库，风格为 outline/regular，线宽 1.5px。

关键图标映射：
| 场景 | 图标 | 说明 |
|------|------|------|
| 搜索 | MagnifyingGlass | 全局搜索 |
| 云服务 | Cloud | 云相关功能 |
| 架构 | GitBranch | 架构图 |
| AI | Brain | AI 功能标识 |
| 数据 | Database | 数据相关 |
| 行业 | Building | 行业分类 |
| 播放 | Play | 视频/Demo |
| 下载 | Download | 下载功能 |
| 分享 | ShareNetwork | 分享功能 |
| 书签 | Bookmark | 收藏功能 |
| 外部链接 | ArrowUpRight | 外部跳转 |
| 筛选 | Faders | 筛选器 |
| 网格视图 | SquaresFour | 网格视图 |
| 列表视图 | List | 列表视图 |

### 9.3 图片资产指南 (Image Assets)

**图片风格：**
- 采用深色主题友好的科技感图像
- 优先使用抽象几何图形、数据可视化美学
- 人物照片使用专业商务场景，色调偏冷
- 截图使用设备 mockup 框架（暗色背景）

**图片处理：**
- 所有图片添加微妙的紫色色调叠加（multiply/overlay 模式，10-20% 不透明度）
- 使用渐变遮罩确保文字可读性
- 优先使用 WebP/AVIF 格式

---

*Document Version: 1.0*
*Last Updated: 2025-06-24*
*Author: AI Design Specialist*
*Status: Design Specification Complete*
