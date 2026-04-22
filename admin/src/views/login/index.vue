<template>
  <div class="login-container">
    <div class="lang-select">
      <el-dropdown @command="handleSetLanguage">
        <span class="el-dropdown-link">
          {{ currentLangName }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-cn">{{ t('language.zhCn') }}</el-dropdown-item>
            <el-dropdown-item command="lo">{{ t('language.lo') }}</el-dropdown-item>
            <el-dropdown-item command="en">{{ t('language.en') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <div class="title-box">
        <h3 class="title">{{ t('login.title') }}</h3>
      </div>

      <!-- 租户选择器 -->
      <el-form-item v-if="tenantEnabled" prop="tenantId">
        <el-select v-model="loginForm.tenantId" filterable :placeholder="t('login.selectTenant')" style="width: 100%">
          <el-option v-for="item in tenantList" :key="item.tenantId" :label="item.companyName" :value="item.tenantId"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item prop="username">
        <el-input v-model="loginForm.username" type="text" size="large" auto-complete="off" :placeholder="t('login.inputUsername')">
          <template #prefix><el-icon><User /></el-icon></template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          auto-complete="off"
          :placeholder="t('login.inputPassword')"
          @keyup.enter="handleLogin"
        >
          <template #prefix><el-icon><Lock /></el-icon></template>
        </el-input>
      </el-form-item>

      <el-checkbox v-model="loginForm.rememberMe" style="margin: 0 0 25px 0">
        {{ t('login.rememberMe') }}
      </el-checkbox>

      <el-form-item style="width: 100%">
        <el-button :loading="loading" size="large" type="primary" style="width: 100%" @click.prevent="handleLogin">
          <span v-if="!loading">{{ t('login.loginBtn') }}</span>
          <span v-else>{{ t('login.loggingIn') }}</span>
        </el-button>
      </el-form-item>
    </el-form>

    <div class="login-footer">
      <span>Copyright © 2026 Lao Online Clinic All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, Lock, ArrowDown } from '@element-plus/icons-vue'
import { to } from 'await-to-js'
import { useUserStore } from '@/stores/user'
import { getTenantList } from '@/api/login'
import type { LoginData, TenantVO } from '@/api/types'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { locale, t } = useI18n()

/**
 * 计算当前显示的语言名称
 * @property currentLangName
 */
const currentLangName = computed(() => {
  const map: Record<string, string> = {
    'zh-cn': t('language.zhCn'),
    lo: t('language.lo'),
    en: t('language.en')
  }
  return map[locale.value] || t('language.zhCn')
})

/**
 * 语言切换处理器
 * @method handleSetLanguage
 * @param {string} lang
 */
const handleSetLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('lang', lang)
  // 建议刷新以完整应用所有多语言设置
  location.reload()
}

// 监听路由 query 中是否有 redirect 地址
const redirect = ref<string | undefined>(undefined)
watch(() => route.query, (query) => {
  if (query && query.redirect) {
    redirect.value = query.redirect as string
  }
}, { immediate: true })

const getLoginRedirect = () => {
  const redirectPath = redirect.value
  if (!redirectPath || !redirectPath.startsWith('/') || redirectPath.startsWith('/login')) {
    return '/'
  }
  return redirectPath
}

// 1. 响应式表单数据：初始化参考 plus-ui-ts
const loginForm = ref<LoginData>({
  tenantId: '000000',
  username: import.meta.env.DEV ? '医院管理员' : '',
  password: import.meta.env.DEV ? '000000' : '',
  rememberMe: false,
  clientId: import.meta.env.VITE_APP_CLIENT_ID, // 从环境变量读取正确的 Client ID
  grantType: 'password'
})

// 2. 表单校验规则
const loginRules = {
  tenantId: [{ required: true, trigger: 'blur', message: t('login.selectTenant') }],
  username: [{ required: true, trigger: 'blur', message: t('login.inputUsername') }],
  password: [{ required: true, trigger: 'blur', message: t('login.inputPassword') }]
}

const loading = ref(false)
const tenantEnabled = ref(false)
const tenantList = ref<TenantVO[]>([])
const loginRef = ref<FormInstance>()

/**
 * 登录核心逻辑：参考 plus-ui-ts 编写
 * 使用 await-to-js 处理异步异常
 * @method handleLogin
 */
const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      // 记住密码逻辑：写入 localStorage
      if (loginForm.value.rememberMe) {
        localStorage.setItem('admin_tenantId', String(loginForm.value.tenantId))
        localStorage.setItem('admin_username', String(loginForm.value.username))
        localStorage.setItem('admin_password', String(loginForm.value.password))
        localStorage.setItem('admin_rememberMe', String(loginForm.value.rememberMe))
      } else {
        localStorage.removeItem('admin_tenantId')
        localStorage.removeItem('admin_username')
        localStorage.removeItem('admin_password')
        localStorage.removeItem('admin_rememberMe')
      }

      // 调用 Store 的登录 action，应用 plus-ui-ts 的 to 方法进行错误解构
      const [err] = await to(userStore.login(loginForm.value))
      if (!err) {
        // 登录成功后跳转到主页或重定向页
        await router.replace(getLoginRedirect())
      }
      loading.value = false
    }
  })
}

/**
 * 租户列表初始化：对接后端租户开关
 * @method initTenantList
 */
const initTenantList = async () => {
  const [err, res] = await to(getTenantList(false))
  if (res && res.data) {
    const { data } = res
    tenantEnabled.value = data.tenantEnabled
    if (tenantEnabled.value) {
      tenantList.value = data.voList
      if (tenantList.value.length > 0) {
        loginForm.value.tenantId = tenantList.value[0].tenantId
      }
    }
  }
}

/**
 * 恢复记住的登录数据
 * @method getStoredLoginData
 */
const getStoredLoginData = () => {
  const tenantId = localStorage.getItem('admin_tenantId')
  const username = localStorage.getItem('admin_username')
  const password = localStorage.getItem('admin_password')
  const rememberMe = localStorage.getItem('admin_rememberMe')
  if (rememberMe === 'true') {
    loginForm.value.tenantId = tenantId || '000000'
    loginForm.value.username = username || ''
    loginForm.value.password = password || ''
    loginForm.value.rememberMe = true
  }
}

onMounted(() => {
  initTenantList()
  getStoredLoginData()
})
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 背景图设置参考 plus-ui-ts 增强视觉感 */
  background: #f0f2f5 url('https://gw.alipayobjects.com/zos/rmsportal/TVir7p9W8eE.svg') no-repeat center 110px;
  background-size: 100%;
  position: relative;
}

.lang-select {
  position: absolute;
  top: 20px;
  right: 20px;
  cursor: pointer;
  .el-dropdown-link {
    color: #666;
    font-size: 14px;
    display: flex;
    align-items: center;
  }
}

.login-form {
  border-radius: 8px;
  background: #fff;
  width: 400px;
  padding: 35px 35px 15px 35px;
  box-shadow: 0 0 25px #cac6c6;
  
  .title-box {
    margin-bottom: 30px;
    .title {
      text-align: center;
      color: #707070;
      font-size: 24px;
      margin: 0;
    }
  }

  .el-input {
    height: 40px;
  }
}

.login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>
