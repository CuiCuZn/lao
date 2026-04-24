# 管理端 README

管理端是老挝在线诊疗系统的后台管理子项目，面向管理员和运营人员，负责用户登录、菜单权限、医生账号、科室、字典标签、就诊记录和病例详情等后台功能。

## 项目信息

| 项目 | 值 |
| --- | --- |
| npm 包名 | `lao-admin` |
| 开发端口 | `5861` |
| 生产基础路径 | `/admin` |
| 构建输出目录 | `admin/admin/` |
| 技术栈 | Vue 3、Vite、TypeScript、Pinia、Vue Router、Element Plus、vue-i18n |

## 目录结构

```text
admin/
├── src/
│   ├── api/            # 登录、菜单、字典、科室、医生、就诊记录等接口
│   ├── assets/         # 静态资源
│   ├── components/     # 通用业务组件
│   ├── layout/         # 后台布局
│   ├── locales/        # 中文、英文、老挝语语言包
│   ├── router/         # 静态路由与动态路由入口
│   ├── stores/         # 用户、权限、字典等 Pinia 状态
│   ├── styles/         # 全局样式
│   ├── utils/          # 请求、鉴权、加密工具
│   └── views/          # 页面模块
├── .env.development
├── .env.production
├── package.json
├── vite.config.ts
└── README.md
```

## 功能模块

- 登录鉴权：登录页、用户信息、Token 管理、路由守卫。
- 权限菜单：从后端菜单数据生成可访问路由和侧边栏。
- 医生管理：医生账号与基础信息维护。
- 科室管理：科室列表与科室信息维护。
- 字典标签：通用字典数据显示与标签渲染。
- 就诊记录：查询患者就诊记录并查看病例详情。
- 多语言：内置中文、英文、老挝语语言包。

## 环境变量

| 文件 | 用途 |
| --- | --- |
| `.env.development` | 本地开发配置，`VITE_BASIC_URL=/` |
| `.env.production` | 生产构建配置，`VITE_BASIC_URL=/admin` |

主要变量：

- `VITE_APP_TITLE`：应用标题。
- `VITE_BASIC_URL`：路由和静态资源基础路径。
- `VITE_API_URL`：后端接口前缀，当前为 `/lao-api`。
- `VITE_APP_CLIENT_ID`：客户端授权 ID。
- `VITE_APP_ENCRYPT`：接口加密开关。
- `VITE_APP_RSA_PUBLIC_KEY`：接口加密 RSA 公钥。

开发服务会将 `/lao-api` 代理到后端服务，并在转发时移除 `/lao-api` 前缀。

## 安装与启动

```bash
npm install
npm run dev
```

启动后默认访问：

```text
http://localhost:5861
```

## 构建与预览

```bash
npm run build
npm run preview
```

`npm run build` 会先执行 `vue-tsc --noEmit` 类型检查，再执行 `vite build`。生产构建输出到 `admin/admin/`，该目录属于本地构建产物，不提交到 Git。

## 开发注意事项

- 新增页面时优先放在 `src/views/`，通用组件放在 `src/components/`。
- 新增接口时放在 `src/api/`，请求公共逻辑复用 `src/utils/request.ts`。
- 新增可翻译文案时同步维护 `src/locales/lang/zh-cn.ts`、`en.ts`、`lo.ts`。
- 不要提交 `admin/admin/`、`node_modules/`、缓存和日志文件。
