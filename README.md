# 老挝在线诊疗系统

老挝在线诊疗系统是一个多端并列的前端工程集合，包含管理端、医生端和医助/患者端。三个子项目彼此独立维护依赖、路由、构建配置和部署产物，但共享一致的技术栈、接口约定、多语言能力和登录鉴权思路。

## 项目组成

| 子项目 | 目录 | 开发端口 | 生产基础路径 | 构建输出 | 主要用户 |
| --- | --- | --- | --- | --- | --- |
| 管理端 | `admin/` | `5861` | `/admin` | `admin/admin/` | 管理员、运营人员 |
| 医生端 | `doctor/` | `5862` | `/doctor` | `doctor/doctor/` | 医生 |
| 医助端 | `assistant/` | `5863` | `/assistant` | `assistant/assistant/` | 医助、患者导诊场景 |

## 技术栈

- Vue 3、Vite、TypeScript
- Vue Router、Pinia
- Element Plus、Element Plus Icons
- Axios、await-to-js
- vue-i18n，支持中文、英文、老挝语
- crypto-js、jsencrypt，用于接口加密相关能力
- DingRTC、dingrtc-asr，用于医生端和医助/患者端视频问诊与字幕/语音相关场景

## 目录结构

```text
lao/
├── admin/              # 管理端独立工程
│   ├── src/            # 管理端源码
│   ├── admin/          # 管理端 Vite 构建输出，本地保留但不提交
│   └── README.md
├── doctor/             # 医生端独立工程
│   ├── src/            # 医生端源码
│   ├── doctor/         # 医生端 Vite 构建输出，本地保留但不提交
│   └── README.md
├── assistant/          # 医助/患者端独立工程
│   ├── src/            # 医助端源码
│   ├── assistant/      # 医助端 Vite 构建输出，本地保留但不提交
│   └── README.md
├── .gitignore
└── README.md
```

## 环境要求

- Node.js：建议使用当前项目锁文件兼容的 LTS 或团队统一版本。
- npm：三个子项目均包含独立的 `package-lock.json`，建议使用 `npm install` 安装依赖。

每个子项目都是独立 npm 工程，需要进入对应目录分别安装依赖、启动、构建。

## 快速开始

### 管理端

```bash
cd admin
npm install
npm run dev
```

默认访问地址：`http://localhost:5861`

### 医生端

```bash
cd doctor
npm install
npm run dev
```

默认访问地址：`http://localhost:5862`

### 医助端

```bash
cd assistant
npm install
npm run dev
```

默认访问地址：`http://localhost:5863`

## 常用命令

三个子项目的 npm scripts 保持一致：

```bash
npm run dev      # 启动 Vite 开发服务
npm run build    # TypeScript 类型检查并构建生产产物
npm run preview  # 本地预览生产构建结果
```

## 环境变量

三个子项目均使用 `.env.development` 和 `.env.production` 管理运行配置，主要变量包括：

| 变量 | 说明 |
| --- | --- |
| `VITE_APP_TITLE` | 应用标题 |
| `VITE_BASIC_URL` | Vue Router history base 与 Vite base |
| `VITE_API_URL` | 后端接口前缀，当前为 `/lao-api` |
| `VITE_APP_CLIENT_ID` | 客户端授权 ID |
| `VITE_APP_ENCRYPT` | 接口加密开关 |
| `VITE_APP_RSA_PUBLIC_KEY` | 接口加密传输使用的 RSA 公钥 |

开发环境下，Vite 代理会将 `/lao-api` 转发到后端服务。医生端和医助端还包含 `/resource` WebSocket 代理，医助端额外包含 `/api-rtc` RTC 相关代理。

## 功能概览

### 管理端

管理端面向后台管理与运营人员，包含登录鉴权、动态菜单/权限、医生账号管理、科室管理、字典标签、就诊记录和病例详情等能力。

### 医生端

医生端面向医生工作台场景，包含登录鉴权、医生工作台、接诊记录、病例详情、视频问诊、参会人信息、摄像头选择、问诊控制、实时字幕和桌面通知等能力。

### 医助端

医助端面向医助协作和患者导诊场景，包含工作台、患者识别、信息录入、医生选择、候诊、患者视频问诊、待处理记录、历史记录、病例结果和视频导诊等能力。

## 构建与部署

各端生产构建输出目录由对应 `vite.config.ts` 配置：

- 管理端：`admin/admin/`
- 医生端：`doctor/doctor/`
- 医助端：`assistant/assistant/`

这些目录是构建产物，已经在根目录 `.gitignore` 中忽略。构建后文件会保留在本地，但不应提交到 Git 仓库。部署时请使用对应目录中的静态文件，并确保服务器路径与生产环境 `VITE_BASIC_URL` 一致。

## Git 协作约定

- 源码、配置、README、锁文件需要提交。
- `node_modules/`、构建输出、缓存、日志和本地编辑器配置不提交。
- 如果构建产物发生 hash 文件变化，无需纳入提交。
- 提交前建议分别执行三个子项目的 `npm run build`，确认类型检查和生产构建通过。
