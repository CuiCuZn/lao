import router from './router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { assistantHomePath } from '@/router'
import i18n from '@/locales'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login']
const requiredRole = 'assistant_doctor'

const resolveLoginRedirect = (redirect: unknown) => {
  if (typeof redirect !== 'string') {
    return '/'
  }

  const normalizedRedirect = redirect.trim()
  if (!normalizedRedirect.startsWith('/') || normalizedRedirect.startsWith('//') || normalizedRedirect.startsWith('/login')) {
    return '/'
  }

  return normalizedRedirect
}

router.beforeEach(async (to) => {
  NProgress.start()

  if (getToken()) {
    if (to.path === '/login') {
      NProgress.done()
      return { path: resolveLoginRedirect(to.query.redirect), replace: true }
    }

    const userStore = useUserStore()

    if (userStore.roles.length === 0) {
      try {
        await userStore.getInfo()
        if (!userStore.roles.includes(requiredRole)) {
          await userStore.logout(false)
          ElMessage.error(i18n.global.t('message.noPermission'))
          NProgress.done()
          return { path: '/login' }
        }

        if (to.path === '/') {
          return { path: assistantHomePath, replace: true }
        }

        return { ...to, replace: true }
      } catch (error) {
        await userStore.logout(false)
        const message = error instanceof Error ? error.message : i18n.global.t('message.authCheckFailed')
        ElMessage.error(message)
        NProgress.done()
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    if (!userStore.roles.includes(requiredRole)) {
      await userStore.logout(false)
      ElMessage.error(i18n.global.t('message.noPermission'))
      NProgress.done()
      return { path: '/login' }
    }

    if (to.matched.length === 0) {
      NProgress.done()
      return { path: '/404', replace: true }
    }

    return true
  }

  if (whiteList.includes(to.path)) {
    return true
  }

  NProgress.done()
  return { path: '/login', query: { redirect: to.fullPath } }
})

router.afterEach(() => {
  NProgress.done()
})
