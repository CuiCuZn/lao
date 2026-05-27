import { createI18n } from 'vue-i18n'
import zhCn from './lang/zh-cn'
import lo from './lang/lo'

const supportedLocales = ['zh-cn', 'lo'] as const
type SupportedLocale = typeof supportedLocales[number]

const resolveLocale = () => {
  const storedLang = localStorage.getItem('lang')
  const locale = supportedLocales.includes(storedLang as SupportedLocale) ? (storedLang as SupportedLocale) : 'zh-cn'

  if (storedLang !== locale) {
    localStorage.setItem('lang', locale)
  }

  return locale
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: resolveLocale(), // 默认语言
  fallbackLocale: 'zh-cn',
  messages: {
    'zh-cn': zhCn,
    lo
  }
})

export default i18n
