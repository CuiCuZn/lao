<template>
  <div class="app-wrapper" :class="{ 'is-rtc-mode': isRtcPage }">
    <app-header class="header-container" />

    <div class="app-body">
      <!-- <sidebar v-if="!isRtcPage" class="sidebar-container" /> -->

      <div class="main-container">
        <div class="app-main">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'
import Sidebar from './components/Sidebar.vue'
import AppHeader from './components/Header.vue'

const ONLINE_STATUS_STORAGE_KEY = 'doctor_workbench_online'
const RELOAD_RESTORE_ONLINE_KEY = 'doctor_reload_restore_online'

const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()
const isRtcPage = computed(() => route.path === '/doctor-rtc')
let isUnloadOfflineRequestSent = false

function isDoctorOnline() {
  const profileOnlineStatus = userStore.profile?.isOnLine
  if (profileOnlineStatus !== undefined && profileOnlineStatus !== null) {
    const resolved = String(profileOnlineStatus) === '1'
    localStorage.setItem(ONLINE_STATUS_STORAGE_KEY, String(resolved))
    return resolved
  }

  const cachedOnlineStatus = localStorage.getItem(ONLINE_STATUS_STORAGE_KEY)
  return cachedOnlineStatus === 'true'
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDoctorOnline()) {
    return
  }

  const message = t('workbench.closeWhileOnlineTip')
  event.preventDefault()
  event.returnValue = message
  return message
}

function handlePageHide() {
  if (!isDoctorOnline() || isUnloadOfflineRequestSent) {
    return
  }

  isUnloadOfflineRequestSent = true
  sessionStorage.setItem(RELOAD_RESTORE_ONLINE_KEY, String(Date.now()))
  localStorage.setItem(ONLINE_STATUS_STORAGE_KEY, 'false')
  userStore.setOnlineStatus(false)

  const token = getToken()
  const langMap: Record<string, string> = {
    'zh-cn': 'zh_CN',
    lo: 'lo_LA'
  }
  const baseUrl = (import.meta.env.VITE_API_URL || '/lao-api').replace(/\/$/, '')

  void fetch(`${baseUrl}/system/user/switch`, {
    method: 'POST',
    keepalive: true,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      clientid: import.meta.env.VITE_APP_CLIENT_ID || '',
      'content-language': langMap[localStorage.getItem('lang') || 'zh-cn'] || 'zh_CN'
    }
  }).catch(() => undefined)
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handlePageHide)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handlePageHide)
})
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(113, 196, 255, 0.16), transparent 24%),
    linear-gradient(180deg, #f6f9fc 0%, #eef4fb 100%);
}

.header-container {
  flex-shrink: 0;
}

.app-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  overflow: hidden;
}

.sidebar-container {
  width: 220px;
  min-width: 220px;
  height: 100%;
  background-color: transparent;
  transition: width 0.3s;
}

.main-container {
  flex: 1;
  min-width: 0;
  display: flex;
  overflow: hidden;
}

.app-wrapper.is-rtc-mode .main-container {
  width: 100%;
}

.app-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  overflow-x: hidden;
  background-color: transparent;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 900px) {
  .main-container {
    padding-right: 12px;
  }

  .app-body {
    flex-direction: column;
  }
}
</style>
