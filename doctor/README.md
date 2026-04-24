# 医生端 README

医生端是老挝在线诊疗系统的医生工作台子项目，面向医生接诊、病例查看和视频问诊场景，包含工作台、接诊记录、病例详情、实时音视频、字幕时间线和问诊控制等能力。

## 项目信息

| 项目 | 值 |
| --- | --- |
| npm 包名 | `lao-doctor` |
| 开发端口 | `5862` |
| 生产基础路径 | `/doctor` |
| 构建输出目录 | `doctor/doctor/` |
| 技术栈 | Vue 3、Vite、TypeScript、Pinia、Vue Router、Element Plus、DingRTC、dingrtc-asr、vue-i18n |

## 目录结构

```text
doctor/
├── src/
│   ├── api/            # 登录、菜单、工作台、患者、记录、视频等接口
│   ├── assets/         # 静态资源
│   ├── components/     # 通用业务组件
│   ├── layout/         # 医生端布局
│   ├── locales/        # 中文、英文、老挝语语言包
│   ├── router/         # 静态路由与动态路由入口
│   ├── stores/         # 用户、权限等 Pinia 状态
│   ├── styles/         # 全局样式
│   ├── utils/          # 请求、鉴权、加密、SSE、桌面通知工具
│   └── views/          # 工作台、视频问诊、登录、错误页等页面
├── .env.development
├── .env.production
├── package.json
├── vite.config.ts
└── README.md
```

## 功能模块

- 登录鉴权：登录页、用户状态、Token 管理、路由守卫。
- 医生工作台：医生接诊入口、待处理事项和病例详情。
- 视频问诊：基于 DingRTC 的问诊房间、参会人展示、摄像头选择、问诊控制。
- 实时字幕：问诊过程中的字幕时间线展示。
- 接诊记录：查询历史接诊和病例记录。
- 桌面通知：使用浏览器通知能力提示医生关注关键事件。
- 多语言：内置中文、英文、老挝语语言包。

## 路由入口

- `/login`：登录页。
- `/`：医生端主布局入口，实际可访问菜单由权限数据控制。
- `/doctor-rtc`：医生视频问诊页。
- `/404`：错误页。

## 环境变量

| 文件 | 用途 |
| --- | --- |
| `.env.development` | 本地开发配置，`VITE_BASIC_URL=/` |
| `.env.production` | 生产构建配置，`VITE_BASIC_URL=/doctor` |

主要变量：

- `VITE_APP_TITLE`：应用标题。
- `VITE_BASIC_URL`：路由和静态资源基础路径。
- `VITE_API_URL`：后端接口前缀，当前为 `/lao-api`。
- `VITE_APP_CLIENT_ID`：客户端授权 ID。
- `VITE_APP_ENCRYPT`：接口加密开关。
- `VITE_APP_RSA_PUBLIC_KEY`：接口加密 RSA 公钥。

开发服务会代理：

- `/lao-api`：后端业务接口，转发时移除 `/lao-api` 前缀。
- `/resource`：WebSocket 资源通道。

## 安装与启动

```bash
npm install
npm run dev
```

启动后默认访问：

```text
http://localhost:5862
```

## 构建与预览

```bash
npm run build
npm run preview
```

`npm run build` 会先执行 `vue-tsc --noEmit` 类型检查，再执行 `vite build`。生产构建输出到 `doctor/doctor/`，该目录属于本地构建产物，不提交到 Git。

## 开发注意事项

- RTC 相关组件集中在 `src/views/rtc/`，包括组件、组合式函数、服务和类型定义。
- 工作台和病例详情集中在 `src/views/workbench/`。
- 新增接口时放在 `src/api/`，请求公共逻辑复用 `src/utils/request.ts`。
- 新增可翻译文案时同步维护 `src/locales/lang/zh-cn.ts`、`en.ts`、`lo.ts`。
- 不要提交 `doctor/doctor/`、`node_modules/`、缓存和日志文件。
