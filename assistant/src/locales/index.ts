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
  legacy: false,
  locale: resolveLocale(),
  fallbackLocale: 'zh-cn',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    'zh-cn': zhCn,
    lo
  }
})

export default i18n
