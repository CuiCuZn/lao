# 医助端 README

医助端是老挝在线诊疗系统的医助/患者导诊子项目，面向患者识别、信息采集、医生选择、候诊、视频导诊和病例结果查看等流程，也承载患者侧视频问诊体验。

## 项目信息

| 项目 | 值 |
| --- | --- |
| npm 包名 | `lao-assistant` |
| 开发端口 | `5863` |
| 生产基础路径 | `/assistant` |
| 构建输出目录 | `assistant/assistant/` |
| 技术栈 | Vue 3、Vite、TypeScript、Pinia、Vue Router、Element Plus、DingRTC、dingrtc-asr、vue-i18n |

## 目录结构

```text
assistant/
├── src/
│   ├── api/            # 登录、患者、科室、记录、视频等接口
│   ├── assets/         # 静态资源
│   ├── components/     # 通用业务组件
│   ├── constants/      # 患者流程相关常量
│   ├── locales/        # 中文、英文、老挝语语言包
│   ├── router/         # 医助端固定路由
│   ├── stores/         # 用户、患者会话等 Pinia 状态
│   ├── styles/         # 全局样式
│   ├── utils/          # 请求、鉴权、加密、SSE、患者通道工具
│   └── views/          # 工作台、患者流程、视频问诊、记录等页面
├── .env.development
├── .env.production
├── package.json
├── vite.config.ts
└── README.md
```

## 功能模块

- 登录鉴权：登录页、用户状态、Token 管理、路由守卫。
- 医助工作台：医助操作入口和流程导航。
- 患者识别：识别或确认患者身份。
- 信息录入：采集患者基础信息和问诊前信息。
- 医生选择：按科室或候诊流程选择医生。
- 候诊与视频问诊：患者候诊页、患者侧问诊房间、参会人展示、摄像头选择、问诊控制。
- 实时字幕：问诊过程中的字幕时间线展示。
- 记录管理：待处理记录、历史记录和病例结果查看。
- 视频导诊：面向患者的导诊视频/流程入口。
- 多语言：内置中文、英文、老挝语语言包。

## 路由入口

- `/login`：登录页。
- `/assistant/workbench`：医助工作台。
- `/assistant/patient-identify`：患者识别。
- `/assistant/intake`：信息录入。
- `/assistant/doctor-select`：医生选择。
- `/assistant/patient/waiting`：患者候诊。
- `/assistant/patient/consultation`：患者侧视频问诊。
- `/assistant/pending-records`：待处理记录。
- `/assistant/records`：历史记录。
- `/assistant/case-result`：病例结果。
- `/assistant/video-guide`：视频导诊。

## 环境变量

| 文件 | 用途 |
| --- | --- |
| `.env.development` | 本地开发配置，`VITE_BASIC_URL=/` |
| `.env.production` | 生产构建配置，`VITE_BASIC_URL=/assistant` |

主要变量：

- `VITE_APP_TITLE`：应用标题。
- `VITE_BASIC_URL`：路由和静态资源基础路径。
- `VITE_API_URL`：后端接口前缀，当前为 `/lao-api`。
- `VITE_APP_CLIENT_ID`：客户端授权 ID。
- `VITE_APP_ENCRYPT`：接口加密开关。
- `VITE_APP_RSA_PUBLIC_KEY`：接口加密 RSA 公钥。

开发服务会代理：

- `/api-rtc`：RTC 相关接口。
- `/lao-api`：后端业务接口，转发时移除 `/lao-api` 前缀。
- `/resource`：WebSocket 资源通道。

## 安装与启动

```bash
npm install
npm run dev
```

启动后默认访问：

```text
http://localhost:5863
```

## 构建与预览

```bash
npm run build
npm run preview
```

`npm run build` 会先执行 `vue-tsc --noEmit` 类型检查，再执行 `vite build`。生产构建输出到 `assistant/assistant/`，该目录属于本地构建产物，不提交到 Git。

## 开发注意事项

- 患者侧视频问诊相关组件集中在 `src/views/patient/consultation/`。
- 患者会话状态集中在 `src/stores/patient-session.ts`。
- 新增接口时放在 `src/api/`，请求公共逻辑复用 `src/utils/request.ts`。
- 新增可翻译文案时同步维护 `src/locales/lang/zh-cn.ts`、`en.ts`、`lo.ts`。
- 不要提交 `assistant/assistant/`、`node_modules/`、缓存和日志文件。
