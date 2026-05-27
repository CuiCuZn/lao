import { createI18n } from 'vue-i18n'
import zhCn from './lang/zh-cn'
import lo from './lang/lo'

const supportedLocales = ['zh-cn', 'lo'] as const
type SupportedLocale = typeof supportedLocales[number]

const resolveLocale = () => {
  const storedLang = localStorage.getItem('lang')
  const locale = supportedLocales.includes(storedLang as SupportedLocale) ? (storedLang as SupportedLocale) : 'lo'

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
