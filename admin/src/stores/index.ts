import { defineStore } from 'pinia'

const supportedLocales = ['zh-cn', 'lo', 'en'] as const
type SupportedLocale = typeof supportedLocales[number]
const resolveStoredLanguage = (): SupportedLocale => {
  const storedLang = localStorage.getItem('lang')
  return supportedLocales.includes(storedLang as SupportedLocale) ? (storedLang as SupportedLocale) : 'zh-cn'
}

/**
 * 核心全局状态管理
 * @module useAppStore
 */
export const useAppStore = defineStore('app', {
  state: () => ({
    // 全局语言设置
    language: resolveStoredLanguage(),
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
     * @param {SupportedLocale} lang
     */
    setLanguage(lang: SupportedLocale) {
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
