import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { AppRouteRecord } from '@/api/types'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index.vue'

const modules = import.meta.glob('../views/**/*.vue')

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const sidebarRoutes = ref<any[]>([])

  const generateRoutes = async (): Promise<RouteRecordRaw[]> => {
    const response = await getRouters()
    const rawRoutes = Array.isArray(response.data) ? response.data : []
    const accessRoutes = filterAsyncRouter(rawRoutes)

    routes.value = accessRoutes
    sidebarRoutes.value = accessRoutes

    return accessRoutes
  }

  const resetRoutes = () => {
    routes.value = []
    sidebarRoutes.value = []
  }

  return {
    routes,
    sidebarRoutes,
    generateRoutes,
    resetRoutes
  }
})

function filterAsyncRouter(asyncRouterMap: AppRouteRecord[]) {
  return asyncRouterMap.filter((route) => {
    const currentRoute = route as Record<string, any>

    if (typeof currentRoute.component === 'string') {
      if (currentRoute.component === 'Layout') {
        currentRoute.component = Layout
      } else if (currentRoute.component === 'ParentView') {
        currentRoute.component = Layout
      } else {
        const viewPath = normalizeViewPath(currentRoute.component)
        currentRoute.meta = { ...(currentRoute.meta || {}), viewPath }
        currentRoute.component = loadView(viewPath)
      }
    }

    if (Array.isArray(currentRoute.children) && currentRoute.children.length > 0) {
      currentRoute.children = filterAsyncRouter(currentRoute.children as AppRouteRecord[])
    }

    return true
  }) as unknown as RouteRecordRaw[]
}

function normalizeViewPath(view: string) {
  return view.startsWith('/') ? view.slice(1) : view
}

export const loadView = (view: string) => {
  for (const path in modules) {
    const normalizedPath = path.split('views/')[1].split('.vue')[0]
    if (normalizedPath === view) {
      return () => modules[path]()
    }
  }

  return () => import('@/views/placeholder/index.vue')
}
