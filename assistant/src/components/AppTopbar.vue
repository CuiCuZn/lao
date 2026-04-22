<template>
  <header class="app-topbar" :class="{ 'is-plain': plain }">
    <div class="brand-block">
      <div class="brand-icon">
        <img :src="brandLogo" alt="logo" class="brand-logo" />
      </div>
      <strong class="brand-title">{{ systemTitle }}</strong>
    </div>

    <div class="topbar-actions">
      <div class="user-brief">
        <div class="user-badge">
          <el-icon><user /></el-icon>
        </div>
        <span class="user-name">{{ displayName }}</span>
      </div>

      <button
        type="button"
        class="logout-btn"
        :aria-label="t('common.logout')"
        :title="t('common.logout')"
        @click="handleLogout"
      >
        <el-icon><switch-button /></el-icon>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { SwitchButton, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import brandLogo from '@/assets/logo.png'

withDefaults(
  defineProps<{
    plain?: boolean
  }>(),
  {
    plain: false
  }
)

const userStore = useUserStore()
const router = useRouter()
const { t } = useI18n()

const systemTitle = computed(() => {
  return t('assistant.systemBrand')
})

const displayName = computed(() => {
  return userStore.nickname || userStore.name || t('menu.assistantPortal')
})

const handleLogout = () => {
  ElMessageBox.confirm(t('logout.confirmText'), t('common.tip'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    await userStore.logout()
    window.location.replace(router.resolve({ path: '/login' }).href)
  })
}
</script>

<style scoped lang="scss">
.app-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 54px;
  padding: 10px 16px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #edf2f7;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.app-topbar.is-plain {
  min-height: 40px;
  padding: 0 18px 0 10px;
  border: none;
  border-bottom: 1px solid rgba(215, 229, 244, 0.9);
  border-radius: 0;
  box-shadow: none;
}

.brand-block {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-title {
  color: #222b38;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-brief,
.logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  border-radius: 16px;
  border: 1px solid #e6edf4;
  background: #ffffff;
  color: #4d5d70;
  font-size: 12px;
  transition: all 0.2s ease;
}

.logout-btn {
  cursor: pointer;
  outline: none;
}

.user-brief:hover,
.logout-btn:hover {
  border-color: #d6e3ee;
  background: #f8fbfd;
}

.user-brief {
  gap: 8px;
  padding: 0 10px 0 6px;
}

.user-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e8f4ff;
  color: #1790dc;
  font-size: 12px;
}

.user-name {
  color: #5b6a7c;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.logout-btn {
  width: 32px;
  padding: 0;
  color: #1fb05c;
  font-size: 16px;
}

.app-topbar.is-plain .topbar-actions {
  gap: 8px;
}

.app-topbar.is-plain .user-brief,
.app-topbar.is-plain .logout-btn {
  min-height: 32px;
  border-radius: 16px;
  border: 1px solid #e6edf4;
  background: #ffffff;
}

@media (max-width: 640px) {
  .app-topbar {
    padding: 10px 12px;
    flex-wrap: wrap;
  }

  .topbar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .brand-title {
    white-space: normal;
  }
}
</style>
