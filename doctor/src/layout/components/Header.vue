<template>
  <header class="header">
    <div class="brand-block">
      <div class="brand-badge">
        <img :src="brandLogo" alt="logo" class="brand-logo" />
      </div>
      <div class="brand-title">{{ t('menu.doctorSystem') }}</div>
    </div>

    <div class="right-menu">
      <el-dropdown trigger="click" @command="handleCommand">
        <button type="button" class="user-card">
          <div class="user-meta">
            <span class="user-name">{{ userStore.nickname || userStore.name }}</span>
            <span class="user-role">{{ userMetaLine }}</span>
          </div>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <span>{{ t('common.logout') }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import brandLogo from '@/assets/logo.png'

const { t } = useI18n()
const userStore = useUserStore()
const router = useRouter()

const userMetaLine = computed(() => {
  const profile = userStore.profile
  const segments = [
    profile?.title || profile?.postName || '',
    profile?.deptName || profile?.departmentName || ''
  ].filter(Boolean)

  if (segments.length > 0) {
    return segments.join(' · ')
  }

  return userStore.roles[0] || t('menu.doctorPortal')
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm(t('logout.confirmText'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }).then(async () => {
      await userStore.logout()
      window.location.replace(router.resolve({ path: '/login' }).href)
    })
  }
}

</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0px 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(14px);
}

.brand-block {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-badge {
  width: 42px;
  height: 42px;
  border-radius: 14px;
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
  color: #14263a;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}

.right-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.user-card {
  border: none;
  outline: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  background: transparent;
}

.user-card:hover {
  background: #f0f6ff;
}

.user-card {
  min-height: 44px;
  padding: 5px 10px 5px 6px;
  gap: 8px;
  border-radius: 14px;
  background: #f8fbff;
}

.user-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #1d2a39;
}

.user-role {
  font-size: 11px;
  color: #718195;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

@media (max-width: 900px) {
  .header {
    height: auto;
    padding: 16px 18px;
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-block {
    width: 100%;
  }

  .right-menu {
    width: 100%;
    justify-content: space-between;
  }

  .user-card {
    flex: 1;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .brand-title {
    font-size: 15px;
  }

  .user-role {
    display: none;
  }
}
</style>
