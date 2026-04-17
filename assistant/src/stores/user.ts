import { defineStore } from 'pinia'
import { ref } from 'vue'
import { to } from 'await-to-js'
import { getInfo as getUserInfo, login as loginApi, logout as logoutApi } from '@/api/login'
import type { LoginData, UserProfile } from '@/api/types'
import { getToken, removeToken, setToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const profile = ref<UserProfile | null>(null)
  const name = ref('')
  const nickname = ref('')
  const avatar = ref('')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  const resetState = () => {
    token.value = ''
    profile.value = null
    name.value = ''
    nickname.value = ''
    avatar.value = ''
    roles.value = []
    permissions.value = []
    removeToken()
  }

  const login = async (userInfo: LoginData): Promise<void> => {
    const [error, response] = await to(loginApi(userInfo))
    if (response?.data?.access_token) {
      setToken(response.data.access_token)
      token.value = response.data.access_token
      return Promise.resolve()
    }
    return Promise.reject(error)
  }

  const getInfo = async (): Promise<void> => {
    const [error, response] = await to(getUserInfo())
    if (response?.data?.user) {
      const data = response.data
      profile.value = data.user
      name.value = data.user.userName
      nickname.value = data.user.nickName
      avatar.value = data.user.avatar || ''
      roles.value = data.roles || []
      permissions.value = data.permissions || []
      return Promise.resolve()
    }
    return Promise.reject(error)
  }

  const logout = async (requestLogout = true): Promise<void> => {
    if (requestLogout) {
      await logoutApi().catch(() => undefined)
    }
    resetState()
  }

  return {
    token,
    profile,
    name,
    nickname,
    avatar,
    roles,
    permissions,
    login,
    getInfo,
    logout,
    resetState
  }
})
