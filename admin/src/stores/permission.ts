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

    // 转换后端数据为 Vue Router 格式（保留原结构用于 router.addRoute）
    const dynamicRoutes = filterAsyncRouter(rawRoutes)

    // 拍平后的副本仅用于侧边栏展示（去掉外层分组壳）
    sidebarRoutes.value = flattenSingleChildRoutes(JSON.parse(JSON.stringify(dynamicRoutes)))

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
 * 拍平路由中的"外层分组壳"
 * 典型场景：后端返回 [医院管理 → [工作台, 医生管理, ...]]，希望直接展示成 [工作台, 医生管理, ...]
 * 规则：只要父级有可见子项就拍平（去掉父级壳），子项提升到同级。
 * 忽略 alwaysShow：因为本系统菜单只有一个外层分组，统一不要这层壳。
 * @param routes
 */
function flattenSingleChildRoutes(routes: any[]): any[] {
  const result: any[] = []
  for (const route of routes) {
    if (route.hidden) continue

    // 递归先处理子路由
    if (route.children && route.children.length) {
      route.children = flattenSingleChildRoutes(route.children)
    }

    const visibleChildren = (route.children || []).filter((c: any) => !c.hidden)

    // 有可见子项：去掉父级壳，子项提升到同级
    if (visibleChildren.length === 1) {
      result.push(mergeParentToChild(route, visibleChildren[0]))
      continue
    }
    if (visibleChildren.length > 1) {
      for (const child of visibleChildren) {
        result.push(mergeParentToChild(route, child))
      }
      continue
    }

    // 没有子项：保持原样
    result.push(route)
  }
  return result
}

/**
 * 将父级信息合并到子级，修正 path（拼接父路径）
 */
function mergeParentToChild(parent: any, child: any) {
  const merged: any = {
    ...child,
    meta: { ...(parent.meta || {}), ...(child.meta || {}) }
  }
  // 路径处理：子路径以 / 开头视为绝对路径，否则拼接父路径
  const childPath = child.path || ''
  if (childPath.startsWith('/')) {
    merged.path = childPath
  } else if (parent.path && parent.path !== '/') {
    merged.path = (parent.path + '/' + childPath).replace(/\/+/g, '/')
  } else {
    merged.path = '/' + childPath
  }
  return merged
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
