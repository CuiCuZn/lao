import { defineStore } from 'pinia'

/**
 * 核心全局状态管理
 * @module useAppStore
 */
export const useAppStore = defineStore('app', {
  state: () => ({
    // 全局语言设置
    language: localStorage.getItem('lang') === 'lo' ? 'lo' : 'zh-cn',
    // 侧边栏折叠状态
    sidebarOpened: true,
    // 用户信息预留
    user: {
      name: 'Admin',
      role: 'admin'
    }
  }),
  actions: {
    /**
     * 切换语言并存储到本地
     * @method setLanguage
     * @param {string} lang
     */
    setLanguage(lang: string) {
      this.language = lang
      localStorage.setItem('lang', lang)
    },
    /**
     * 切换侧边栏状态
     * @method toggleSidebar
     */
    toggleSidebar() {
      this.sidebarOpened = !this.sidebarOpened
    }
  }
})
