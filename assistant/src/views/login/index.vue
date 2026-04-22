<template>
  <div class="assistant-login">
    <div class="login-shell">
      <section class="login-visual" :style="{ backgroundImage: visualBackground }">
        <div class="login-visual__content">
          <h1>{{ t('login.visualTitle') }}</h1>
          <p>{{ t('login.visualSubtitle') }}</p>
        </div>

        <div class="login-visual__features">
          <article v-for="item in visualFeatures" :key="item.text" class="visual-feature">
            <span class="visual-feature__icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <span class="visual-feature__text">{{ item.text }}</span>
          </article>
        </div>
      </section>

      <section class="login-card">
        <div class="login-card__header">
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
                <el-dropdown-item command="en">{{ t('language.en') }}</el-dropdown-item>
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
          <el-form-item v-if="tenantEnabled" prop="tenantId" :label="t('login.tenantLabel')" class="form-item">
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
              show-password
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

        <div class="login-card__footer">
          <p>{{ t('login.footerNotice') }}</p>
          <p>{{ t('login.footerSupport') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown, Connection, DataAnalysis, Document, Files, VideoCamera } from '@element-plus/icons-vue'
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

const featureIcons = [
  markRaw(Document),
  markRaw(VideoCamera),
  markRaw(DataAnalysis),
  markRaw(Files)
]

const visualBackground = computed(
  () => `url(${loginMedicalVisual})`
)

const currentLangName = computed(() => {
  const map: Record<string, string> = {
    'zh-cn': t('language.zhCn'),
    lo: t('language.lo'),
    en: t('language.en')
  }
  return map[locale.value] || t('language.zhCn')
})

const visualFeatures = computed(() => [
  { icon: featureIcons[0], text: t('login.features.archive') },
  { icon: featureIcons[1], text: t('login.features.remote') },
  { icon: featureIcons[2], text: t('login.features.device') },
  { icon: featureIcons[3], text: t('login.features.records') }
])

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
  username: import.meta.env.DEV ? 'liuzhushou' : '',
  password: import.meta.env.DEV ? '000000' : '',
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

const handleSetLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('lang', lang)
  location.reload()
}

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return
    }

    loading.value = true

    if (loginForm.value.rememberMe) {
      localStorage.setItem('assistant_tenantId', String(loginForm.value.tenantId || ''))
      localStorage.setItem('assistant_username', String(loginForm.value.username || ''))
      localStorage.setItem('assistant_password', String(loginForm.value.password || ''))
      localStorage.setItem('assistant_rememberMe', 'true')
    } else {
      localStorage.removeItem('assistant_tenantId')
      localStorage.removeItem('assistant_username')
      localStorage.removeItem('assistant_password')
      localStorage.removeItem('assistant_rememberMe')
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
  if (localStorage.getItem('assistant_rememberMe') === 'true') {
    loginForm.value.tenantId = localStorage.getItem('assistant_tenantId') || '000000'
    loginForm.value.username = localStorage.getItem('assistant_username') || ''
    loginForm.value.password = localStorage.getItem('assistant_password') || ''
    loginForm.value.rememberMe = true
  }
}

onMounted(() => {
  initTenantList()
  restoreLoginData()
})
</script>

<style scoped lang="scss">
.assistant-login {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #eef4ff 0%, #edf3ff 38%, #f6f9ff 100%);
  isolation: isolate;
}

.assistant-login::before {
  position: absolute;
  inset: 0;
  z-index: -2;
  content: '';
  background:
    radial-gradient(circle at 14% 16%, rgba(74, 132, 240, 0.18), transparent 28%),
    radial-gradient(circle at 84% 12%, rgba(69, 149, 255, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(237, 244, 255, 0.9));
}

.assistant-login::after {
  position: absolute;
  left: -8%;
  right: -8%;
  bottom: -18%;
  z-index: -1;
  height: 44%;
  content: '';
  opacity: 0.7;
  background:
    radial-gradient(circle, rgba(61, 133, 255, 0.3) 0 1px, transparent 1.2px) 0 0 / 11px 11px,
    linear-gradient(180deg, rgba(116, 177, 255, 0.12), rgba(116, 177, 255, 0));
  transform: perspective(680px) rotateX(72deg) scale(1.35);
  mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.96), rgba(0, 0, 0, 0.42), transparent 92%);
}

.login-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.98fr);
  width: min(1120px, 100%);
  min-height: 560px;
  border: 1px solid rgba(220, 230, 244, 0.96);
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 26px 70px rgba(56, 92, 151, 0.16);
}

.login-visual {
  position: relative;
  display: flex;
  min-height: 560px;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px 42px 40px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  color: #ffffff;
}

.login-visual__content,
.login-visual__features {
  position: relative;
  z-index: 1;
}

.login-visual__content {
  max-width: 460px;
  padding-top: 54px;
}

.login-visual__content h1 {
  margin: 0 0 18px;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.02em;
}

.login-visual__content p {
  margin: 0;
  max-width: 440px;
  font-size: 15px;
  line-height: 1.85;
  word-break: break-word;
  color: rgba(255, 255, 255, 0.9);
}

.login-visual__features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 12px;
}

.visual-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.visual-feature__icon {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 14px;
  flex-shrink: 0;
}

.visual-feature__text {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.94);
}

.login-card {
  display: flex;
  flex-direction: column;
  padding: 20px 56px 30px;
  background: #ffffff;
}

.login-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 34px;
}

.login-card__header h2 {
  margin: 0;
  color: #121212;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.language-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  background: #f8f8f8;
  color: #4c5564;
  cursor: pointer;
}

.language-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 14px;
}

.language-button__arrow {
  font-size: 12px;
  color: #9098a8;
}

.login-form {
  margin-top: 12px;
}

.form-item {
  margin-bottom: 16px;
}

.form-control {
  width: 100%;
}

.remember-row {
  margin: 4px 0 22px;
}

.submit-btn {
  width: 100%;
  min-height: 48px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
}

.login-card__footer {
  margin-top: auto;
  padding-top: 34px;
  text-align: center;
}

.login-card__footer p {
  margin: 0;
  color: #a0a8b7;
  font-size: 12px;
  line-height: 1.8;
}

.login-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: #757f90;
  font-size: 12px;
  line-height: 1.2;
}

.login-form :deep(.el-input__wrapper),
.login-form :deep(.el-select__wrapper) {
  min-height: 44px;
  border-radius: 6px;
  box-shadow: 0 0 0 1px #dfe5ef inset;
}

.login-form :deep(.el-input__wrapper.is-focus),
.login-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #2f6cd5 inset;
}

.login-form :deep(.el-input__inner),
.login-form :deep(.el-select__selected-item) {
  color: #2d3648;
  font-size: 14px;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #bcc3cf;
}

.remember-row :deep(.el-checkbox__label) {
  color: #9ca4b2;
  font-size: 12px;
}

@media (max-width: 1024px) {
  .login-card {
    padding: 22px 32px 28px;
  }

  .login-visual {
    padding-inline: 32px;
  }

  .login-visual__content h1 {
    font-size: 40px;
  }
}

@media (max-width: 900px) {
  .assistant-login {
    padding: 24px 16px;
  }

  .assistant-login::after {
    bottom: -26%;
    height: 34%;
  }

  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-visual {
    min-height: 360px;
  }

  .login-card {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .login-visual {
    padding: 28px 22px 24px;
    min-height: 320px;
  }

  .login-visual__content {
    padding-top: 18px;
  }

  .login-visual__content h1 {
    font-size: 34px;
  }

  .login-visual__features {
    grid-template-columns: 1fr;
  }

  .login-card {
    padding: 18px 18px 24px;
  }

  .login-card__header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 26px;
  }

  .login-card__header h2 {
    font-size: 28px;
  }
}
</style>
