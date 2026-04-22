import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import i18n from '@/locales'
import { getToken, removeToken } from '@/utils/auth'
import { generateAesKey, encryptBase64, encryptWithAes } from '@/utils/crypto'
import { encrypt as rsaEncrypt } from '@/utils/jsencrypt'

let isReloginShow = false
const supportedLocales = ['zh-cn', 'lo', 'en'] as const
type SupportedLocale = typeof supportedLocales[number]

const encryptHeader = 'encrypt-key'

class Request {
  private instance: AxiosInstance

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)

    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const headers = config.headers as any
        const silentError = headers.silentError === true || headers.silentError === 'true'
        const successCodes = (() => {
          const rawSuccessCodes = headers.successCodes

          if (Array.isArray(rawSuccessCodes)) {
            return rawSuccessCodes
              .map((item) => Number(item))
              .filter((item) => Number.isFinite(item))
          }

          if (typeof rawSuccessCodes === 'string') {
            return rawSuccessCodes
              .split(',')
              .map((item) => Number(item.trim()))
              .filter((item) => Number.isFinite(item))
          }

          if (typeof rawSuccessCodes === 'number' && Number.isFinite(rawSuccessCodes)) {
            return [rawSuccessCodes]
          }

          return [200]
        })()
        const storedLang = localStorage.getItem('lang')
        const currentLang = supportedLocales.includes(storedLang as SupportedLocale)
          ? (storedLang as SupportedLocale)
          : 'zh-cn'
        if (storedLang !== currentLang) {
          localStorage.setItem('lang', currentLang)
        }
        const langMap: Record<string, string> = {
          'zh-cn': 'zh_CN',
          lo: 'lo_LA',
          en: 'en_US'
        }
        config.headers['content-language'] = langMap[currentLang] || 'zh_CN'
        ;(config as InternalAxiosRequestConfig & { __silentError?: boolean }).__silentError = silentError
        ;(config as InternalAxiosRequestConfig & { __successCodes?: number[] }).__successCodes = successCodes

        const needsToken = headers.isToken !== false && headers.isToken !== 'false'
        const token = getToken()
        if (needsToken && token) {
          config.headers['Authorization'] = `Bearer ${token}`
        }

        const clientId = import.meta.env.VITE_APP_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e'
        config.headers['clientid'] = clientId

        const isEncrypt = headers.isEncrypt === true || headers.isEncrypt === 'true'
        if (import.meta.env.VITE_APP_ENCRYPT === 'true' && isEncrypt && (config.method === 'post' || config.method === 'put')) {
          const aesKey = generateAesKey()
          const encryptedKey = rsaEncrypt(encryptBase64(aesKey))

          if (encryptedKey) {
            config.headers[encryptHeader] = encryptedKey
          }

          if (config.data !== undefined && config.data !== null) {
            const content = typeof config.data === 'object' ? JSON.stringify(config.data) : String(config.data)
            config.data = encryptWithAes(content, aesKey)
            config.headers['Content-Type'] = 'application/json;charset=utf-8'
          }
        }

        delete headers.isEncrypt
        delete headers.isToken
        delete headers.silentError
        delete headers.successCodes

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data } = response
        const requestConfig = response.config as InternalAxiosRequestConfig & {
          __silentError?: boolean
          __successCodes?: number[]
        }
        const silentError = Boolean(requestConfig.__silentError)
        const successCodes = requestConfig.__successCodes?.length ? requestConfig.__successCodes : [200]
        const responseCode = typeof data?.code === 'number' ? data.code : 200

        if (responseCode === 401) {
          if (!isReloginShow) {
            isReloginShow = true
            removeToken()
            location.reload()
          }
          return Promise.reject(new Error(i18n.global.t('message.sessionExpired')))
        }

        if (!successCodes.includes(responseCode)) {
          if (!silentError) {
            ElMessage.error(data.msg || i18n.global.t('message.systemError'))
          }
          return Promise.reject(new Error(data.msg || i18n.global.t('message.systemError')))
        }

        return data
      },
      (error) => {
        const message = error?.message || ''
        const errorConfig = error?.config as (InternalAxiosRequestConfig & { __silentError?: boolean }) | undefined
        const silentError = Boolean(errorConfig?.__silentError)

        if (!silentError) {
          if (message === 'Network Error') {
            ElMessage.error(i18n.global.t('message.networkError'))
          } else if (message.includes('timeout')) {
            ElMessage.error(i18n.global.t('message.timeout'))
          } else {
            ElMessage.error(message || i18n.global.t('message.systemError'))
          }
        }

        return Promise.reject(error)
      }
    )
  }

  public request(config: AxiosRequestConfig): Promise<any> {
    return this.instance.request(config)
  }

  public get(url: string, params?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.instance.get(url, { ...(config || {}), params })
  }

  public post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.instance.post(url, data, config)
  }
}

export default new Request({
  baseURL: import.meta.env.VITE_API_URL || '/lao-api',
  timeout: 50000
})
