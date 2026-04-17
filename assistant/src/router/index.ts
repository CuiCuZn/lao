import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import i18n from '@/locales'

export const assistantHomePath = '/assistant/workbench'

const assistantRoutes: Array<RouteRecordRaw> = [
  {
    path: assistantHomePath,
    name: 'AssistantWorkbench',
    component: () => import('@/views/workbench/index.vue'),
    meta: {
      title: 'route.workbench',
      descriptionKey: 'assistant.workbench.description'
    }
  },
  {
    path: '/assistant/patient-identify',
    name: 'AssistantPatientIdentify',
    component: () => import('@/views/patient-identify/index.vue'),
    meta: {
      title: 'route.patientIdentify',
      descriptionKey: 'assistant.patientIdentify.description'
    }
  },
  {
    path: '/assistant/intake',
    name: 'AssistantIntake',
    component: () => import('@/views/intake/index.vue'),
    meta: {
      title: 'route.intake',
      descriptionKey: 'assistant.intake.description'
    }
  },
  {
    path: '/assistant/video-guide',
    name: 'AssistantVideoGuide',
    component: () => import('@/views/video-guide/index.vue'),
    meta: {
      title: 'route.videoGuide',
      descriptionKey: 'assistant.videoGuide.description'
    }
  },
  {
    path: '/assistant/patient/waiting',
    name: 'AssistantPatientWaiting',
    component: () => import('@/views/patient/waiting.vue'),
    meta: {
      title: 'route.patientWaiting',
      descriptionKey: 'assistant.patientVideo.waiting.description'
    }
  },
  {
    path: '/assistant/patient/consultation',
    name: 'AssistantPatientConsultation',
    component: () => import('@/views/patient/consultation.vue'),
    meta: {
      title: 'route.patientConsultation',
      descriptionKey: 'assistant.patientVideo.consultation.description'
    }
  },
  {
    path: '/assistant/doctor-select',
    name: 'AssistantDoctorSelect',
    component: () => import('@/views/doctor-select/index.vue'),
    meta: {
      title: 'route.doctorSelect',
      descriptionKey: 'assistant.doctorSelect.description'
    }
  }
]

export const constantRoutes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: assistantHomePath
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
    path: '/assistant',
    redirect: assistantHomePath
  },
  ...assistantRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

router.afterEach((to) => {
  const appTitle = import.meta.env.VITE_APP_TITLE || i18n.global.t('menu.assistantSystem')
  if (typeof to.meta.title === 'string' && to.meta.title.length > 0) {
    const pageTitle = to.meta.title.includes('.') ? i18n.global.t(to.meta.title) : to.meta.title
    document.title = `${pageTitle} - ${appTitle}`
  } else {
    document.title = appTitle
  }
})

export default router
