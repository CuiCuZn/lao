import { createI18n } from 'vue-i18n'
import zhCn from './lang/zh-cn'
import lo from './lang/lo'

const resolveLocale = () => {
  const storedLang = localStorage.getItem('lang')
  const locale = storedLang === 'lo' ? 'lo' : 'zh-cn'

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
    lo: lo
  }
})

export default i18n
