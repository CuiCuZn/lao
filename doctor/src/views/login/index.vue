<template>
  <div class="doctor-login">
    <div class="login-shell">
      <section class="login-visual" :style="{ backgroundImage: visualBackground }">
        <div class="login-visual__content">
          <div class="visual-brand">
            <span class="visual-brand__screen">
              <span class="visual-brand__cross"></span>
            </span>
            <span class="visual-brand__stand"></span>
          </div>
          <h1>{{ t('login.visualTitle') }}</h1>
          <div class="visual-pill">{{ t('login.visualBadge') }}</div>
          <p>{{ t('login.visualCaption') }}</p>
        </div>
      </section>

      <section class="login-panel">
        <div class="login-panel__inner">
          <div class="login-panel__header">
            <h2>{{ t('login.accountLoginTitle') }}</h2>

            <el-dropdown @command="handleSetLanguage">
              <button type="button" class="language-button">
                <span class="language-button__icon">
                  <el-icon><Connection /></el-icon>
                </span>
                <span>{{ currentLangName }}</span>
                <el-icon class="language-button__arrow"><ArrowDown /></el-icon>
              </button>

              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="zh-cn">{{ t('language.zhCn') }}</el-dropdown-item>
                  <el-dropdown-item command="lo">{{ t('language.lo') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <el-form
            ref="loginRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            hide-required-asterisk
            class="login-form"
          >
            <el-form-item
              v-if="tenantEnabled"
              prop="tenantId"
              :label="t('login.tenantLabel')"
              class="form-item"
            >
              <el-select
                v-model="loginForm.tenantId"
                filterable
                :placeholder="t('login.selectTenant')"
                class="form-control"
              >
                <el-option
                  v-for="item in tenantList"
                  :key="item.tenantId"
                  :label="item.companyName"
                  :value="item.tenantId"
                />
              </el-select>
            </el-form-item>

            <el-form-item prop="username" :label="t('login.usernameLabel')" class="form-item">
              <el-input
                v-model="loginForm.username"
                type="text"
                size="large"
                auto-complete="off"
                :placeholder="t('login.inputUsername')"
                class="form-control"
              />
            </el-form-item>

            <el-form-item prop="password" :label="t('login.passwordLabel')" class="form-item">
              <el-input
                v-model="loginForm.password"
                type="password"
                size="large"
                auto-complete="off"
                :placeholder="t('login.inputPassword')"
                class="form-control"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <div class="remember-row">
              <el-checkbox v-model="loginForm.rememberMe">{{ t('login.rememberMe') }}</el-checkbox>
            </div>

            <el-button :loading="loading" size="large" type="primary" class="submit-btn" @click.prevent="handleLogin">
              <span v-if="!loading">{{ t('login.loginBtn') }}</span>
              <span v-else>{{ t('login.loggingIn') }}</span>
            </el-button>
          </el-form>

          <div class="login-panel__footer">
            <p>{{ t('login.footerNotice') }}</p>
            <p>{{ t('login.footerSupport') }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown, Connection } from '@element-plus/icons-vue'
import { to } from 'await-to-js'
import type { FormInstance } from 'element-plus'
import type { LoginData, TenantVO } from '@/api/types'
import { getTenantList } from '@/api/login'
import { useUserStore } from '@/stores/user'
import loginMedicalVisual from '@/assets/login_bg.png'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { locale, t } = useI18n()

const visualBackground = computed(() => `url(${loginMedicalVisual})`)

const currentLangName = computed(() => {
  const map: Record<string, string> = {
    'zh-cn': t('language.zhCn'),
    lo: t('language.lo')
  }
  return map[locale.value] || t('language.zhCn')
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
.doctor-login {
  display: flex;
  min-height: 100vh;
  min-height: 100svh;
  align-items: center;
  justify-content: center;
  // padding: 36px 24px;
  background:
    radial-gradient(circle at 14% 16%, rgba(74, 132, 240, 0.15), transparent 26%),
    radial-gradient(circle at 88% 14%, rgba(96, 160, 255, 0.12), transparent 22%),
    linear-gradient(180deg, #eef4ff 0%, #edf3ff 42%, #f4f7fd 100%);
  position: relative;
}

.login-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.14fr) minmax(0, 1fr);
  width: min(1120px, 100%);
  min-height: 640px;
  border: 1px solid rgba(219, 229, 245, 0.95);
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 28px 80px rgba(53, 92, 156, 0.16);
}

.login-visual {
  position: relative;
  overflow: hidden;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-sizing: border-box;
}


.login-visual::after {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(180deg, rgba(13, 53, 136, 0.14), rgba(18, 88, 214, 0.12)),
    radial-gradient(circle at 74% 22%, rgba(255, 255, 255, 0.14), transparent 18%),
    radial-gradient(circle at 18% 78%, rgba(255, 255, 255, 0.12), transparent 24%);
}

.login-visual__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  text-align: center;
}

.visual-brand {
  position: relative;
  display: inline-flex;
  width: 66px;
  height: 78px;
  align-items: center;
  justify-content: center;
  margin-bottom: 26px;
}

.visual-brand__screen {
  position: relative;
  display: inline-flex;
  width: 66px;
  height: 62px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 16px 32px rgba(15, 56, 143, 0.22);
}

.visual-brand__screen::before {
  position: absolute;
  inset: 15px 16px 18px;
  border-radius: 8px;
  content: '';
  background: linear-gradient(180deg, #4f85ec 0%, #3d70da 100%);
}

.visual-brand__cross {
  position: relative;
  z-index: 1;
  width: 18px;
  height: 18px;
}

.visual-brand__cross::before,
.visual-brand__cross::after {
  position: absolute;
  inset: 0;
  margin: auto;
  border-radius: 999px;
  content: '';
  background: #ffffff;
}

.visual-brand__cross::before {
  width: 18px;
  height: 4px;
}

.visual-brand__cross::after {
  width: 4px;
  height: 18px;
}

.visual-brand__stand {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 20px;
  height: 12px;
  transform: translateX(-50%);
}

.visual-brand__stand::before,
.visual-brand__stand::after {
  position: absolute;
  left: 50%;
  content: '';
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
}

.visual-brand__stand::before {
  top: 0;
  width: 6px;
  height: 10px;
  border-radius: 3px;
}

.visual-brand__stand::after {
  bottom: 0;
  width: 22px;
  height: 4px;
  border-radius: 999px;
}

.login-visual h1 {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 52px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.04em;
}

.visual-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #2566d4;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
}

.login-visual p {
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 18px;
  line-height: 1.75;
  letter-spacing: 0.08em;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 32px;
  background: #edf3ff;
}

.login-panel__inner {
  width: min(366px, 100%);
}

.login-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 48px;
}

.login-panel__header h2 {
  margin: 0;
  color: #111111;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}

.language-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 38px;
  padding: 0 14px;
  border: 1px solid #d3d7e0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #4f5967;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}

.language-button:hover {
  border-color: #9ebaf3;
  color: #2566d4;
  background: #ffffff;
}

.language-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.language-button__arrow {
  color: #8d98aa;
  font-size: 12px;
}

.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: 18px;
}

.form-control {
  width: 100%;
}

.remember-row {
  margin: 2px 0 24px;
}

.submit-btn {
  width: 100%;
  min-height: 46px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
}

.login-panel__footer {
  margin-top: 74px;
  text-align: center;
}

.login-panel__footer p {
  margin: 0;
  color: #afb4c1;
  font-size: 12px;
  line-height: 1.7;
}

.login-form :deep(.el-form-item__label) {
  padding-bottom: 10px;
  color: #757f90;
  font-size: 13px;
  line-height: 1.2;
}

.login-form :deep(.el-input__wrapper),
.login-form :deep(.el-select__wrapper) {
  min-height: 46px;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #dfe4ee inset;
}

.login-form :deep(.el-input__wrapper.is-focus),
.login-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #2566d4 inset;
}

.login-form :deep(.el-input__inner),
.login-form :deep(.el-select__selected-item) {
  color: #2d3648;
  font-size: 14px;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #b8bfcb;
}

.remember-row :deep(.el-checkbox__label) {
  color: #8f97a5;
  font-size: 12px;
}

.remember-row :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #2566d4;
  border-color: #2566d4;
}

@media (max-width: 1080px) {
  .login-visual__content {
    padding-inline: 36px;
  }

  .login-visual h1 {
    font-size: 44px;
  }

  .visual-pill {
    font-size: 17px;
  }

  .login-visual p {
    font-size: 16px;
  }
}

@media (max-width: 900px) {
  .doctor-login {
    padding: 24px 16px;
  }

  .login-shell {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .login-visual {
    min-height: 42vh;
  }

  .login-panel {
    padding: 36px 20px 44px;
  }

  .login-panel__header {
    margin-bottom: 34px;
  }

  .login-panel__footer {
    margin-top: 48px;
  }
}

@media (max-width: 640px) {
  .doctor-login {
    padding: 16px 12px;
  }

  .login-visual__content {
    padding: 40px 24px;
  }

  .visual-brand {
    margin-bottom: 20px;
    transform: scale(0.9);
  }

  .login-visual h1 {
    font-size: 34px;
  }

  .visual-pill {
    min-height: 30px;
    padding-inline: 14px;
    font-size: 14px;
  }

  .login-visual p {
    font-size: 13px;
    letter-spacing: 0.04em;
  }

  .login-panel__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .login-panel__header h2 {
    font-size: 20px;
  }
}
</style>
