import { defineStore } from 'pinia'
import { ref } from 'vue'
import { to } from 'await-to-js'
import { login as loginApi, logout as logoutApi, getInfo as getUserInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { useDictStore } from './dict'
import { LoginData } from '@/api/types'

/**
 * 用户状态存储
 * @module useUserStore
 */
export const useUserStore = defineStore('user', () => {
  const dictStore = useDictStore()
  const token = ref(getToken())
  const name = ref('')
  const nickname = ref('')
  const avatar = ref('')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  /**
   * 登录方法
   * @method login
   * @param {LoginData} userInfo - 登录提交的表单信息
   * @returns {Promise<void>}
   */
  const login = async (userInfo: LoginData): Promise<void> => {
    // 使用 await-to-js 处理异常，类似于 plus-ui-ts 的 coding 方法
    const [err, res] = await to(loginApi(userInfo))
    if (res && res.data) {
      const data = res.data
      setToken(data.access_token) // 写入 cookie
      token.value = data.access_token // 更新 state
      return Promise.resolve()
    }
    return Promise.reject(err)
  }

  /**
   * 获取用户信息
   * @method getInfo
   * @returns {Promise<void>}
   */
  const getInfo = async (): Promise<void> => {
    const [err, res] = await to(getUserInfo())
    if (res && res.data) {
      const data = res.data
      const user = data.user
      name.value = user.userName
      nickname.value = user.nickName
      avatar.value = user.avatar
      roles.value = data.roles || []
      permissions.value = data.permissions || []
      return Promise.resolve()
    }
    return Promise.reject(err)
  }

  /**
   * 注销方法
   * @method logout
   * @returns {Promise<void>}
   */
  const logout = async (): Promise<void> => {
    await logoutApi()
    token.value = ''
    roles.value = []
    permissions.value = []
    removeToken() // 清除 cookie
    dictStore.clearDict() // 清理字典缓存
  }

  return {
    token,
    name,
    nickname,
    avatar,
    roles,
    permissions,
    login,
    getInfo,
    logout
  }
})
