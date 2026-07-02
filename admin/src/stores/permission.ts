import { defineStore } from 'pinia'
import { ref } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index.vue'
import ParentView from '@/layout/components/ParentView.vue'

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

    // 深拷贝原始数据，一份用于生成路由（filterAsyncRouter会修改对象），一份用于构建侧边栏
    const rawRoutesCopy = JSON.parse(JSON.stringify(rawRoutes))

    // 转换后端数据为 Vue Router 格式（保留原结构用于 router.addRoute）
    const dynamicRoutes = filterAsyncRouter(rawRoutes)

    // 拍平后的副本仅用于侧边栏展示（只去掉最外层 Layout 壳，保留二级菜单结构）
    sidebarRoutes.value = buildSidebarRoutes(rawRoutesCopy)

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
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.redirect === 'noRedirect' || route.redirect === '') {
      delete route.redirect
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children)
    }
    return true
  })
}

/**
 * 构建侧边栏菜单路由
 * 规则：
 * 1. 去掉最外层的 Layout 壳（path 为 '/' 的顶层容器）
 * 2. 再去掉一层容器路由（如"医院管理"这种 ParentView 分组壳），将其子菜单提升到顶层
 * 3. 更深层级保持原有嵌套结构，不再扁平化（尊重 alwaysShow 配置）
 * 4. 正确拼接绝对路径
 */
function buildSidebarRoutes(routes: any[]): any[] {
  const result: any[] = []

  for (const route of routes) {
    if (route.hidden) continue

    const isRootShell = route.path === '/' && route.children && route.children.length

    if (isRootShell) {
      for (const child of route.children) {
        if (child.hidden) continue
        addMenuToResult(result, child, '/')
      }
    } else {
      addMenuToResult(result, route, '')
    }
  }
  return result
}

/**
 * 将一个路由节点添加到结果中：如果它是容器路由（ParentView/无组件/有children但redirect=noRedirect），
 * 则将其子节点直接加入结果（多跳一层）；否则直接构建菜单节点加入。
 * 只处理一层，不递归扁平化更深层级。
 */
function addMenuToResult(result: any[], route: any, parentPath: string) {
  const isContainer = isContainerRoute(route)

  if (isContainer && route.children && route.children.length) {
    const containerPath = resolveRoutePath(route.path, parentPath)
    for (const grandChild of route.children) {
      if (grandChild.hidden) continue
      result.push(buildMenuNode(grandChild, containerPath))
    }
  } else {
    result.push(buildMenuNode(route, parentPath))
  }
}

/**
 * 判断一个路由是否是"容器壳"路由（自身不渲染实际页面，仅用于菜单分组）
 * 条件：有children 且 满足以下任一：
 *   - component 是 ParentView
 *   - redirect 是 'noRedirect'（后端用来标记纯分组）
 *   - 没有 component（纯路由分组）
 */
function isContainerRoute(route: any): boolean {
  if (!route.children || !route.children.length) return false
  const comp = route.component
  const redirect = route.redirect
  if (comp === 'ParentView') return true
  if (redirect === 'noRedirect') return true
  if (!comp) return true
  return false
}

/**
 * 解析路由路径为绝对路径
 */
function resolveRoutePath(routePath: string, parentPath: string): string {
  if (!routePath) return parentPath || '/'
  if (routePath.startsWith('/')) return routePath
  if (parentPath === '/') return '/' + routePath
  if (parentPath) return (parentPath + '/' + routePath).replace(/\/+/g, '/')
  return '/' + routePath
}

/**
 * 递归构建菜单节点
 * @param route 当前路由原始数据
 * @param parentPath 父级的已解析绝对路径（如 '/admin'），空字符串表示顶层且自身路径可能已是绝对的
 */
function buildMenuNode(route: any, parentPath: string): any {
  const node: any = {
    path: resolveRoutePath(route.path || '', parentPath),
    hidden: route.hidden || false,
    alwaysShow: route.alwaysShow || false,
    meta: { ...(route.meta || {}) }
  }

  if (route.children && route.children.length) {
    node.children = route.children
      .filter((c: any) => !c.hidden)
      .map((c: any) => buildMenuNode(c, node.path))
  }

  return node
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
