# 老挝在线诊疗系统 - 多端并列工程

本项目由三个完全独立的子工程组成，每个工程拥有独立的依赖管理、构建配置和路由系统。

## 核心项目
- **`/admin` (管理端)**：后台管理系统，包含医生账号管理、科室管理、就诊记录等。
- **`/doctor` (医生端)**：医生工作台，包含视频问诊、接诊记录等。
- **`/assistant` (医助端)**：医助/患者端，包含患者识别、信息录入、视频导诊等。

## 技术栈 (各端统一)
- **Vue 3** + **Vite** + **TypeScript**
- **Pinia** + **Vue Router**
- **Element Plus** (支持 中文/英文/老挝语)
- **Axios** (各端独立封装)
- **vue-i18n** (多语言支持)

## 启动说明
由于各端项目独立，需要进入对应目录进行依赖安装和启动：

### 管理端 (Admin)
```bash
cd admin
npm install
npm run dev
```

### 医生端 (Doctor)
```bash
cd doctor
npm install
npm run dev
```

### 医助端 (Assistant)
```bash
cd assistant
npm install
npm run dev
```

## 目录结构
```text
/lao
├── admin/        # 管理端独立工程
├── doctor/       # 医生端独立工程
└── assistant/    # 医助端独立工程
```

各子目录中均已完成基础路由与三语切换配置，支持直接开始具体功能开发。
