import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import '@/styles/index.scss'
import App from './App.vue'
import router from './router'
import i18n from './locales'
import './permission' // 注册路由权限守卫

/**
 * 初始化 Vue 应用实例
 */
const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用 Pinia 状态管理
app.use(createPinia())

// 使用路由
app.use(router)

// 全局引入 Element Plus
app.use(ElementPlus)

// 使用 i18n 多语言
app.use(i18n)

app.mount('#app')
