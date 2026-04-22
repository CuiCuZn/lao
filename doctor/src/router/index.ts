import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'
import i18n from '@/locales'

/**
 * 静态路由（不需要权限即可访问）
 */
export const constantRoutes: Array<RouteRecordRaw> = [
  {
    path: '/redirect',
    component: Layout,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: 'route.login' }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: 'route.notFound' }
  },
  {
    path: '/',
    component: Layout,
  },
  {
    path: '/doctor-rtc',
    component: Layout,
    children: [
      {
        path: '',
        name: 'DoctorRtc',
        component: () => import('@/views/rtc/index.vue'),
        meta: { title: 'route.doctorRtc' }
      }
    ]
  }
]

export const dynamicRoutes: Array<RouteRecordRaw> = []

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASIC_URL),
  routes: constantRoutes,
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

router.afterEach((to) => {
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Doctor Workbench'
  if (typeof to.meta.title === 'string' && to.meta.title.length > 0) {
    const pageTitle = to.meta.title.includes('.') ? i18n.global.t(to.meta.title) : to.meta.title
    document.title = `${pageTitle} - ${appTitle}`
  } else {
    document.title = appTitle
  }
})

export default router
