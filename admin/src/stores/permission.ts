import { defineStore } from 'pinia'
import { ref } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index.vue'

// 匹配 views 下的所有 .vue 文件
const modules = import.meta.glob('../views/**/*.vue')

/**
 * 路由权限状态存储
 */
export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const sidebarRoutes = ref<any[]>([])

  /**
   * 设置路由
   */
  const setRoutes = (newRoutes: RouteRecordRaw[]) => {
    routes.value = newRoutes
  }

  /**
   * 生成动态路由
   */
  const generateRoutes = async (): Promise<RouteRecordRaw[]> => {
    const res = await getRouters()
    const rawRoutes = res.data
    
    // 转换后端数据为 Vue Router 格式
    const dynamicRoutes = filterAsyncRouter(rawRoutes)
    
    sidebarRoutes.value = dynamicRoutes
    return dynamicRoutes
  }

  return {
    routes,
    sidebarRoutes,
    generateRoutes,
    setRoutes
  }
})

/**
 * 遍历后台传来的路由字符串，转换为组件对象
 * @param asyncRouterMap 
 */
function filterAsyncRouter(asyncRouterMap: any[]) {
  return asyncRouterMap.filter(route => {
    if (route.component) {
      // Layout 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        // 如果有 ParentView 也可以在此处理，此处暂略
        // route.component = ParentView
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children)
    }
    return true
  })
}

/**
 * 路由组件懒加载
 * @param view 
 */
export const loadView = (view: string) => {
  let res;
  // 兼容后端返回带 / 的路径 (如 /doctor/index)
  const normalizedView = view.startsWith('/') ? view.slice(1) : view;
  
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0];
    if (dir === normalizedView) {
      res = () => modules[path]();
    }
  }
  return res || (() => import('@/views/error/404.vue'));
}
