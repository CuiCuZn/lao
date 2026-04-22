import router from './router'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useDictStore } from '@/stores/dict'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

// 白名单，不需要登录即可访问
const whiteList = ['/login', '/auth-redirect']

/**
 * 路由守卫逻辑
 */
router.beforeEach(async (to, from) => {
  NProgress.start()

  if (getToken()) {
    if (to.path === '/login') {
      NProgress.done()
      return { path: '/' }
    } else {
      const userStore = useUserStore()
      const permissionStore = usePermissionStore()
      const dictStore = useDictStore()
      
      // 1. 检查是否获取过用户信息
      if (userStore.roles.length === 0) {
        try {
          // 获取用户信息
          await userStore.getInfo()
          
          // 获取并缓存系统必要的字典数据
          // 此处提前加载科室字典：sys_dept 和 职称字典：sys_user_title
          await dictStore.loadDicts(['sys_dept', 'sys_user_title', 'sys_normal_disable'])
          
          // 2. 根据获取的用户信息动态生成可访问路由
          const accessRoutes = await permissionStore.generateRoutes()
          
          // 3. 将动态路由添加到路由器
          accessRoutes.forEach(route => {
            router.addRoute(route)
          })
          
          // 如果当前访问根路径且没有重定向，手动重定向到第一个动态路由的第一个子节点
          if (to.path === '/') {
            const firstRoute = accessRoutes[0];
            if (firstRoute && firstRoute.children && firstRoute.children.length > 0) {
              const fullPath = (firstRoute.path + '/' + firstRoute.children[0].path).replace(/\/+/g, '/');
              return { path: fullPath, replace: true }
            } else {
              return { ...to, replace: true }
            }
          } else {
            return { ...to, replace: true }
          }
        } catch (err) {
          // 获取失败，重置令牌去登录
          await userStore.logout()
          dictStore.clearDict() // 清理字典缓存
          ElMessage.error(err instanceof Error ? err.message : '身份校验失败')
          NProgress.done()
          return {
            path: '/login',
            query: { ...to.query, redirect: to.fullPath }
          }
        }
      } else {
        return true
      }
    }
  } else {
    // 没有 Token
    if (whiteList.indexOf(to.path) !== -1) {
      return true
    } else {
      NProgress.done()
      return {
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      }
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
