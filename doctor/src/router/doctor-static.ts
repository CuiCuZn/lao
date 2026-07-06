import type { RouteRecordRaw } from 'vue-router'

const doctorStaticPages = [
  {
    path: 'workbench',
    name: 'DoctorWorkbench',
    title: 'route.workbench',
    component: () => import('@/views/workbench/index.vue')
  },
  {
    path: 'history',
    name: 'DoctorHistory',
    title: 'route.history',
    component: () => import('@/views/history/index.vue')
  },
  {
    path: 'prescriptions',
    name: 'DoctorPrescriptions',
    title: 'route.prescriptions',
    component: () => import('@/views/prescriptions/index.vue')
  },
  {
    path: 'settings',
    name: 'DoctorSettings',
    title: 'route.settings',
    component: () => import('@/views/settings/index.vue')
  }
]

export const doctorStaticMenuItems = doctorStaticPages.map((item) => ({
  path: `/${item.path}`,
  title: item.title
}))

export const doctorStaticPageRoutes: RouteRecordRaw[] = doctorStaticPages.map((item) => ({
  path: item.path,
  name: item.name,
  component: item.component,
  meta: {
    title: item.title
  }
}))
