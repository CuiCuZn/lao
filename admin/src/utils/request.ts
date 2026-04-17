import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import { generateAesKey, encryptWithAes, encryptBase64 } from '@/utils/crypto'
import { encrypt as rsaEncrypt } from '@/utils/jsencrypt'

// 标记是否正在显示重新登录对话框，避免并发请求时重复弹出
let isReloginShow = false

/**
 * 后端约定的加密头字段
 */
const encryptHeader = 'encrypt-key'

/**
 * 封装 Axios 请求类
 * @module Request
 */
class Request {
  private instance: AxiosInstance

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 1. 设置全局 content-language 请求头
        const storedLang = localStorage.getItem('lang')
        const currentLang = storedLang === 'lo' ? 'lo' : 'zh-cn'
        if (storedLang !== currentLang) {
          localStorage.setItem('lang', currentLang)
        }
        const langMap: Record<string, string> = {
          'zh-cn': 'zh_CN',
          'lo': 'lo_LA'
        }
        config.headers['content-language'] = langMap[currentLang] || 'zh_CN'

        // 2. 注入 Token
        const token = getToken()
        if (token) {
          config.headers['Authorization'] = 'Bearer ' + token
        }
        
        // 3. 注入客户端 ID (Header 注入)
        const clientId = import.meta.env.VITE_APP_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e'
        config.headers['clientid'] = clientId

        // 4. 接口参数加密处理
        // 获取自定义加密标志
        const headers = config.headers as any
        const isEncrypt = headers.isEncrypt === 'true' || headers.isEncrypt === true

        if (import.meta.env.VITE_APP_ENCRYPT === 'true' && isEncrypt) {
          if (config.method === 'post' || config.method === 'put') {
            const aesKey = generateAesKey()
            
            // RSA 加密 AES 密钥放入请求头
            const encryptedKey = rsaEncrypt(encryptBase64(aesKey))
            if (encryptedKey) {
              config.headers[encryptHeader] = encryptedKey
            }

            // 对请求体进行加密
            let data = config.data
            if (data !== undefined && data !== null) {
              // 将对象转为 JSON 字符串后再进行 AES 加密
              const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data)
              const encryptedData = encryptWithAes(dataStr, aesKey)
              
              // 关键：将加密后的密文覆盖原始数据
              // 此时 config.data 是一个字符串
              config.data = encryptedData
              
              // 强制指定为 application/json 格式
              config.headers['Content-Type'] = 'application/json;charset=utf-8'
            }
          }
        }

        // 移除自定义标志，避免发送给后端
        delete headers.isEncrypt
        delete headers.isToken

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data } = response
        const code = data.code || 200
        if (code === 401) {
          if (!isReloginShow) {
            isReloginShow = true
            removeToken()
            location.reload() // 通过刷新触发 permission.ts 跳转到登录页并清除 Pinia
          }
          return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
        } else if (code !== 200) {
          ElMessage.error(data.msg || 'Error')
          return Promise.reject(new Error(data.msg || 'Error'))
        }
        return data
      },
      (error) => {
        const { message } = error
        if (message === 'Network Error') {
          ElMessage.error('后端接口连接异常')
        } else if (message.includes('timeout')) {
          ElMessage.error('系统接口请求超时')
        } else {
          ElMessage.error(message || '系统异常')
        }
        return Promise.reject(error)
      }
    )
  }

  public request(config: AxiosRequestConfig): Promise<any> {
    return this.instance.request(config)
  }

  public get(url: string, params?: any): Promise<any> {
    return this.instance.get(url, { params })
  }

  public post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.instance.post(url, data, config)
  }
}

export default new Request({
  baseURL: import.meta.env.VITE_API_URL || '/lao-api',
  timeout: 50000
})
