import router from './router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import i18n from '@/locales'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login']

router.beforeEach(async (to) => {
  NProgress.start()

  if (getToken()) {
    if (to.path === '/login') {
      NProgress.done()
      return { path: '/' }
    }

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    if (userStore.roles.length === 0) {
      try {
        await userStore.getInfo()
        const accessRoutes = await permissionStore.generateRoutes()
        accessRoutes.forEach((route) => {
          router.addRoute(route)
        })
        if (!router.hasRoute('DoctorCatchAll')) {
          router.addRoute({
            path: '/:pathMatch(.*)*',
            name: 'DoctorCatchAll',
            redirect: '/404'
          })
        }

        if (to.path === '/') {
          const firstPath = getFirstRoutePath(accessRoutes)
          if (firstPath) {
            return { path: firstPath, replace: true }
          }
          return { path: '/404', replace: true }
        }

        return { ...to, replace: true }
      } catch (error) {
        await userStore.logout(false)
        permissionStore.resetRoutes()
        ElMessage.error(error instanceof Error ? error.message : i18n.global.t('message.authCheckFailed'))
        NProgress.done()
        return { path: '/login', query: { redirect: to.fullPath } }
      }
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

function getFirstRoutePath(routes: any[]): string {
  for (const route of routes) {
    if (route.hidden) {
      continue
    }

    if (Array.isArray(route.children) && route.children.length > 0) {
      const child = route.children.find((item: any) => !item.hidden)
      if (child) {
        return resolvePath(route.path, child.path)
      }
    }

    if (route.path && route.path !== '/') {
      return route.path
    }
  }

  return ''
}

function resolvePath(parentPath: string, childPath: string) {
  if (!childPath) {
    return parentPath
  }
  if (childPath.startsWith('/')) {
    return childPath
  }
  if (parentPath === '/') {
    return `/${childPath}`.replace(/\/+/g, '/')
  }
  return `${parentPath}/${childPath}`.replace(/\/+/g, '/')
}
