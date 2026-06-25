# Hyperscaler Asset Hub

基于 Accenture 风格设计规范的场景化原型与 Demo 演示中心，包含前台全站、管理后台（资产/用户/角色权限/访问策略）、以及独立后端服务。

## 目录

- `web/`：Next.js 14（App Router）前端
- `api/`：FastAPI 后端（PostgreSQL + SQLAlchemy + Alembic）
- `docker-compose.yml`：本地 Postgres 容器编排
- `Kimi_Agent_资产中心配置与权限设计/`：设计规范与参考图

## 本地启动（推荐）

### 1) 启动数据库

```bash
docker compose up -d postgres
```

PostgreSQL 默认映射到主机端口 **5434**（容器内仍为 5432）。
如需更换端口，在 `.env` 中修改 `POSTGRES_PORT` 后重启 compose：

```bash
# .env
POSTGRES_PORT=5435
```

> **注意**：`DATABASE_URL` 中的端口必须与 `.env` 中的 `POSTGRES_PORT` 保持一致。

### 2) 启动后端

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

访问：
- OpenAPI Docs：`http://localhost:8000/docs`
- Health：`http://localhost:8000/health`

### 3) 启动前端

```bash
cd web
npm install
npm run dev
```

访问：`http://localhost:3000`

## 环境变量

复制 `.env.example` 并按说明填写：

```bash
cp .env.example .env
```

前端使用：
- `NEXT_PUBLIC_API_BASE_URL`

后端使用：
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ISSUER`
- `CORS_ORIGINS`

## Docker Compose 服务说明

| 服务 | 镜像 | 容器端口 | 主机端口 | 说明 |
|------|------|---------|---------|------|
| postgres | postgres:16-alpine | 5432 | `${POSTGRES_PORT:-5434}` | 主数据库 |

### 健康检查

PostgreSQL 配置了 `pg_isready` 健康检查：
- 间隔：5 秒
- 超时：5 秒
- 重试：10 次
- 启动宽限期：10 秒

### 卷挂载

| 卷名 | 用途 | 说明 |
|------|------|------|
| `postgres_data` | 数据持久化 | 本地 Docker volume，持久保存数据库数据 |
| `./init-scripts` | 初始化脚本 | 可选：放入 `.sql` 或 `.sh` 脚本，首次启动时自动执行 |

### 常用命令

```bash
# 启动数据库
docker compose up -d postgres

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f postgres

# 停止服务
docker compose down

# 完全清理（包括数据卷）
docker compose down -v
```

## 部署

### 前端（Vercel）

- 设置环境变量 `NEXT_PUBLIC_API_BASE_URL` 指向后端公网地址

### 后端（容器）

- 使用 `api/Dockerfile` 构建镜像并部署到任意容器平台
- 数据库使用托管 PostgreSQL
