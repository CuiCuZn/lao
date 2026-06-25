<template>
  <div class="login-container">
    <!-- 装饰圆环 -->
    <div class="decor-circle decor-circle--tr"></div>
    <div class="decor-circle decor-circle--bl"></div>

    <!-- 语言切换 - 不要删除，后续可能恢复多语言切换功能，仅注释屏蔽
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
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    -->

    <!-- 左侧品牌区 -->
    <div class="brand">
      <div class="brand-logo">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <rect x="0" y="0" width="72" height="72" rx="18" fill="rgba(255,255,255,.12)" />
          <rect x="19" y="31" width="34" height="10" rx="5" fill="#fff" />
          <rect x="31" y="19" width="10" height="34" rx="5" fill="#fff" />
        </svg>
      </div>
      <h1>{{ t('login.brandTitle') }}</h1>
      <p>{{ t('login.brandSub1') }}<br />{{ t('login.brandSub2') }}</p>
    </div>

    <!-- 右侧登录卡片 -->
    <div class="login-box">
      <h2>{{ t('login.welcome') }}</h2>
      <p class="sub">{{ t('login.subTitle') }}</p>

      <el-form
        ref="loginRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        hide-required-asterisk
        class="login-form"
        @submit.prevent
      >
        <!-- 租户选择器 -->
        <el-form-item v-if="tenantEnabled" prop="tenantId" :label="t('login.tenant')" class="form-group">
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

        <!-- 账号 -->
        <el-form-item prop="username" :label="t('login.account')" class="form-group">
          <div class="input-box" :class="{ error: fieldError.username }">
            <el-icon class="input-icon"><User /></el-icon>
            <el-input
              v-model="loginForm.username"
              type="text"
              :placeholder="t('login.inputUsername')"
              autocomplete="off"
              class="transparent-input"
              @keyup.enter="handleLogin"
              @input="fieldError.username = false"
            />
          </div>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password" :label="t('login.passwordLabel')" class="form-group">
          <div class="input-box" :class="{ error: fieldError.password || !!passwordErrorMsg }">
            <el-icon class="input-icon"><Lock /></el-icon>
            <el-input
              v-model="loginForm.password"
              :type="pwdVisible ? 'text' : 'password'"
              :placeholder="t('login.inputPassword')"
              autocomplete="off"
              class="transparent-input"
              @keyup.enter="handleLogin"
              @input="clearPasswordError"
            />
            <button type="button" class="toggle-pwd" @click="pwdVisible = !pwdVisible">
              <el-icon v-if="pwdVisible"><Hide /></el-icon>
              <el-icon v-else><View /></el-icon>
            </button>
          </div>
          <div v-if="passwordErrorMsg" class="form-error show">{{ passwordErrorMsg }}</div>
        </el-form-item>

        <!-- 记住账号 -->
        <div class="extra">
          <el-checkbox v-model="loginForm.rememberMe">{{ t('login.rememberAccount') }}</el-checkbox>
        </div>

        <!-- 登录按钮 -->
        <el-form-item class="submit-item">
          <button type="button" class="btn" :class="{ 'is-loading': loading }" :disabled="loading" @click.prevent="handleLogin">
            <span v-if="!loading">{{ t('login.loginBtn') }}</span>
            <span v-else>{{ t('login.loggingIn') }}</span>
          </button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 底部版权 - 不要删除，后续可能恢复版权信息，仅注释屏蔽
    <div class="login-footer">
      <span>Copyright © 2026 Lao Online Clinic All Rights Reserved.</span>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, Lock, ArrowDown, View, Hide } from '@element-plus/icons-vue'
import { to } from 'await-to-js'
import { useUserStore } from '@/stores/user'
import { getTenantList } from '@/api/login'
import type { LoginData, TenantVO } from '@/api/types'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { locale, t } = useI18n()

/** 密码可见性切换 */
const pwdVisible = ref(false)

/** 字段错误态（用于驱动 input-box 的红色边框） */
const fieldError = reactive<{ username: boolean; password: boolean }>({
  username: false,
  password: false
})

/** 密码错误提示文案（后端登录失败时显示） */
const passwordErrorMsg = ref('')

/**
 * 计算当前显示的语言名称
 * @property currentLangName
 */
const currentLangName = computed(() => {
  const map: Record<string, string> = {
    'zh-cn': t('language.zhCn'),
    lo: t('language.lo')
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
watch(
  () => route.query,
  (query) => {
    if (query && query.redirect) {
      redirect.value = query.redirect as string
    }
  },
  { immediate: true }
)

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
  username: import.meta.env.DEV ? 'admin_ceshi' : '',
  password: import.meta.env.DEV ? 'Aa000000!' : '',
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

/** 输入时清空密码错误提示 */
const clearPasswordError = () => {
  if (passwordErrorMsg.value) {
    passwordErrorMsg.value = ''
  }
  if (fieldError.password) {
    fieldError.password = false
  }
}

/**
 * 登录核心逻辑：参考 plus-ui-ts 编写
 * 使用 await-to-js 处理异步异常
 * @method handleLogin
 */
const handleLogin = () => {
  // 提交前重置字段错误态
  fieldError.username = false
  fieldError.password = false
  passwordErrorMsg.value = ''
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
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
      } else {
        // 登录失败：把后端错误显示在密码框下方
        const fallback = t('login.passwordError')
        const rawMsg = (err as { msg?: string; message?: string })?.msg
          || (err as { message?: string })?.message
        passwordErrorMsg.value = rawMsg ? String(rawMsg) : fallback
        fieldError.password = true
      }
      loading.value = false
    } else if (fields) {
      // 校验失败时给对应输入框加红色边框
      if (fields.username) fieldError.username = true
      if (fields.password) fieldError.password = true
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
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(160deg, #0a3d7e 0%, #1565c0 40%, #1e88e5 70%, #1976d2 100%);
}

/* 装饰圆环 */
.decor-circle {
  position: absolute;
  border-radius: 50%;
  border: 50px solid rgba(255, 255, 255, 0.04);
  z-index: 1;
  pointer-events: none;
}
.decor-circle--tr {
  top: -200px;
  right: -200px;
  width: 500px;
  height: 500px;
  border-width: 70px;
}
.decor-circle--bl {
  bottom: -150px;
  left: -150px;
  width: 400px;
  height: 400px;
  border-width: 50px;
}

/* 语言切换 */
.lang-select {
  position: absolute;
  top: 20px;
  right: 28px;
  z-index: 20;
  cursor: pointer;
  .el-dropdown-link {
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    display: flex;
    align-items: center;
    outline: none;
  }
}

/* 品牌区 */
.brand {
  position: absolute;
  left: 20%;
  top: 50%;
  transform: translate(-20%, -55%);
  color: #fff;
  z-index: 2;
  max-width: 480px;
  text-align: center;
}
.brand-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 28px;
}
.brand h1 {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 14px;
}
.brand p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
}

/* 登录卡片 */
.login-box {
  position: absolute;
  right: 100px;
  top: 50%;
  transform: translateY(-50%);
  width: 330px;
  padding: 36px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  z-index: 10;

  h2 {
    font-size: 22px;
    color: #1a1a2e;
    margin-bottom: 8px;
  }
  .sub {
    font-size: 13px;
    color: #999;
    margin-bottom: 28px;
  }
}

.login-form {
  width: 100%;
  /* 覆盖 el-form-item 默认外边距，由 form-group 自行控制 */
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
  /* 让 el-form-item 自带的错误提示在流中显示，不绝对定位、不遮挡下方元素 */
  :deep(.el-form-item__content) {
    position: static;
  }
  :deep(.el-form-item__error) {
    position: static !important;
    display: block;
    padding-top: 4px;
    color: #f56c6c;
    font-size: 12px;
    line-height: 1.4;
  }
}

.form-group {
  width: 100%;
  margin-bottom: 18px;
  :deep(.el-form-item__label) {
    display: block;
    font-size: 13px;
    color: #555;
    margin-bottom: 6px;
    font-weight: 500;
    padding: 0;
    line-height: 1.4;
    height: auto;
  }
  :deep(.el-form-item__content) {
    width: 100%;
    line-height: normal;
  }
}

/* 输入框容器 */
.input-box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 46px;
  padding: 0 16px;
  border: 1.5px solid #e8ecf1;
  border-radius: 10px;
  background: #fafbfc;
  transition: all 0.25s;
  box-sizing: border-box;

  &:focus-within {
    border-color: #1677ff;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.06);
  }
  &.error {
    border-color: #f56c6c;
  }

  .input-icon {
    font-size: 16px;
    color: #bbb;
    flex-shrink: 0;
  }

  /* 让 el-input 透明融入容器并占满剩余空间 */
  .transparent-input,
  :deep(.el-input) {
    flex: 1;
    width: 100%;
    min-width: 0;
  }
  .transparent-input {
    display: flex;
  }
  :deep(.el-input__wrapper) {
    flex: 1;
    width: 100%;
    background: none;
    box-shadow: none !important;
    padding: 0;
    min-height: 0;
  }
  :deep(.el-input__inner) {
    border: none;
    outline: none;
    background: none;
    font-size: 14px;
    color: #333;
    height: 100%;
    width: 100%;
    box-shadow: none !important;
  }
  :deep(.el-input__inner::placeholder) {
    color: #ccc;
  }
}

/* 租户下拉容器 */
.form-control {
  width: 100%;
  display: block;
  :deep(.el-select) {
    width: 100%;
  }
  :deep(.el-select__wrapper) {
    width: 100%;
    height: 46px;
    min-height: 46px;
    border: 1.5px solid #e8ecf1;
    border-radius: 10px;
    background: #fafbfc;
    box-shadow: none !important;
  }
  :deep(.el-select__wrapper.is-focused) {
    border-color: #1677ff;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.06);
  }
}

/* 密码切换按钮 */
.toggle-pwd {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: #bbb;
  transition: color 0.2s;
  &:hover {
    color: #666;
  }
}

/* 密码错误提示 */
.form-error {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 6px;
  display: none;
  line-height: 1.4;
}
.form-error.show {
  display: block;
}

/* 记住账号 */
.extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #888;
  margin: 4px 0 22px;

  :deep(.el-checkbox__label) {
    color: #888;
    font-size: 13px;
    padding-left: 6px;
  }
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #1677ff;
    border-color: #1677ff;
  }
  :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
    color: #1677ff;
  }
}

/* 提交按钮所在的 form-item：不显示默认 label */
.submit-item {
  :deep(.el-form-item__label) {
    display: none;
  }
  margin-bottom: 0;
  width: 100%;
}

/* 登录按钮 */
.btn {
  width: 100%;
  height: 46px;
  background: linear-gradient(135deg, #1677ff, #1565c0);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 1px;
  &:hover:not(.is-loading) {
    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.3);
    transform: translateY(-1px);
  }
  &.is-loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

/* 底部版权 */
.login-footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  line-height: 40px;
  z-index: 5;
}

/* 响应式 */
@media (max-width: 1024px) {
  .brand {
    left: 40px;
    max-width: 340px;
    h1 {
      font-size: 26px;
    }
  }
  .login-box {
    right: 40px;
    width: 330px;
  }
}
@media (max-width: 768px) {
  .brand {
    display: none;
  }
  .login-box {
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    width: 90%;
  }
}
</style>
