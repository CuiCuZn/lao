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
            <el-dropdown-item command="zh-cn">中文</el-dropdown-item>
            <el-dropdown-item command="lo">ພາສາລາວ (Lao)</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="login-panel">
      <div class="hero-copy">
        <div class="hero-badge">{{ t('menu.doctorPortal') }}</div>
        <h1>{{ t('login.title') }}</h1>
        <p>{{ t('login.subtitle') }}</p>
      </div>

      <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
        <div class="title-box">
          <h3 class="title">{{ t('common.login') }}</h3>
        </div>

        <el-form-item v-if="tenantEnabled" prop="tenantId">
          <el-select
            v-model="loginForm.tenantId"
            filterable
            :placeholder="t('login.selectTenant')"
            style="width: 100%"
          >
            <el-option
              v-for="item in tenantList"
              :key="item.tenantId"
              :label="item.companyName"
              :value="item.tenantId"
            />
          </el-select>
        </el-form-item>

        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            type="text"
            size="large"
            auto-complete="off"
            :placeholder="t('login.inputUsername')"
          >
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

        <el-checkbox v-model="loginForm.rememberMe" class="remember-me">
          {{ t('login.rememberMe') }}
        </el-checkbox>

        <el-form-item>
          <el-button :loading="loading" size="large" type="primary" class="submit-btn" @click.prevent="handleLogin">
            <span v-if="!loading">{{ t('login.loginBtn') }}</span>
            <span v-else>{{ t('login.loggingIn') }}</span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown, Lock, User } from '@element-plus/icons-vue'
import { to } from 'await-to-js'
import type { FormInstance } from 'element-plus'
import type { LoginData, TenantVO } from '@/api/types'
import { getTenantList } from '@/api/login'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { locale, t } = useI18n()

const currentLangName = computed(() => {
  const map: Record<string, string> = {
    'zh-cn': '中文',
    lo: 'ພາສາລາວ'
  }
  return map[locale.value] || '中文'
})

const handleSetLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('lang', lang)
  location.reload()
}

const redirect = ref<string | undefined>(undefined)
watch(
  () => route.query,
  (query) => {
    if (typeof query.redirect === 'string') {
      redirect.value = query.redirect
    }
  },
  { immediate: true }
)

const loginForm = ref<LoginData>({
  tenantId: '000000',
  username: '',
  password: '',
  rememberMe: false,
  clientId: import.meta.env.VITE_APP_CLIENT_ID,
  grantType: 'password'
})

const loginRules = {
  tenantId: [{ required: true, trigger: 'blur', message: t('login.selectTenant') }],
  username: [{ required: true, trigger: 'blur', message: t('login.inputUsername') }],
  password: [{ required: true, trigger: 'blur', message: t('login.inputPassword') }]
}

const loading = ref(false)
const tenantEnabled = ref(false)
const tenantList = ref<TenantVO[]>([])
const loginRef = ref<FormInstance>()

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return
    }

    loading.value = true

    if (loginForm.value.rememberMe) {
      localStorage.setItem('doctor_tenantId', String(loginForm.value.tenantId || ''))
      localStorage.setItem('doctor_username', String(loginForm.value.username || ''))
      localStorage.setItem('doctor_password', String(loginForm.value.password || ''))
      localStorage.setItem('doctor_rememberMe', 'true')
    } else {
      localStorage.removeItem('doctor_tenantId')
      localStorage.removeItem('doctor_username')
      localStorage.removeItem('doctor_password')
      localStorage.removeItem('doctor_rememberMe')
    }

    const [error] = await to(userStore.login(loginForm.value))
    if (!error) {
      router.push({ path: redirect.value || '/' })
    }

    loading.value = false
  })
}

const initTenantList = async () => {
  const [error, response] = await to(getTenantList(false))
  if (!error && response?.data) {
    tenantEnabled.value = response.data.tenantEnabled
    tenantList.value = response.data.voList || []
    if (tenantEnabled.value && tenantList.value.length > 0 && !loginForm.value.tenantId) {
      loginForm.value.tenantId = tenantList.value[0].tenantId
    }
  }
}

const restoreLoginData = () => {
  if (localStorage.getItem('doctor_rememberMe') === 'true') {
    loginForm.value.tenantId = localStorage.getItem('doctor_tenantId') || '000000'
    loginForm.value.username = localStorage.getItem('doctor_username') || ''
    loginForm.value.password = localStorage.getItem('doctor_password') || ''
    loginForm.value.rememberMe = true
  }
}

onMounted(() => {
  initTenantList()
  restoreLoginData()
})
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(79, 140, 255, 0.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(0, 181, 173, 0.16), transparent 28%),
    linear-gradient(135deg, #eef4ff 0%, #f8fbff 52%, #f4f7fb 100%);
  position: relative;
}

.lang-select {
  position: absolute;
  top: 24px;
  right: 24px;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #516173;
}

.login-panel {
  width: min(960px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 28px;
  align-items: stretch;
}

.hero-copy,
.login-form {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 22px 60px rgba(42, 76, 124, 0.12);
  backdrop-filter: blur(10px);
}

.hero-copy {
  padding: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-copy h1 {
  margin: 16px 0 12px;
  font-size: 34px;
  line-height: 1.2;
  color: #1f2d3d;
}

.hero-copy p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #627385;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(58, 135, 255, 0.1);
  color: #2468d8;
  font-size: 13px;
  font-weight: 600;
}

.login-form {
  padding: 36px 36px 20px;
}

.title-box {
  margin-bottom: 26px;
}

.title {
  margin: 0;
  font-size: 24px;
  color: #1f2d3d;
  text-align: center;
}

.remember-me {
  margin: 4px 0 24px;
}

.submit-btn {
  width: 100%;
  min-height: 44px;
}

@media (max-width: 900px) {
  .login-panel {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 28px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .login-form {
    padding: 28px 24px 18px;
  }
}
</style>
