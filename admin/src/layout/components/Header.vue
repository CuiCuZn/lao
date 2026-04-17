<template>
  <div class="header">
    <div class="breadcrumb">{{ t('menu.adminSystem') }}</div>

    <div class="right-menu">
      <!-- 语言选择器 -->
      <el-dropdown @command="handleSetLanguage">
        <span class="el-dropdown-link">
          {{ currentLangName }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-cn">中文</el-dropdown-item>
            <el-dropdown-item command="lo">ພາສາລາວ (Lao)</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 用户头像与操作菜单 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="avatar-wrapper">
          <el-avatar
            :size="30"
            :src="userStore.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'"
          />
          <span class="user-name">{{ userStore.nickname || userStore.name }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">{{ t('menu.profile') }}</el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <span>{{ t('common.logout') }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const { locale, t } = useI18n()
const userStore = useUserStore()
const router = useRouter()

/**
 * 侧边栏/顶栏命令处理
 * @method handleCommand
 * @param {string} command
 */
const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm(t('logout.confirmText'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }).then(async () => {
      await userStore.logout()
      location.href = '/login' // 强制刷新清除所有状态
    })
  } else if (command === 'profile') {
    // 预留跳转个人中心
  }
}

/**
 * 计算当前显示的语言名称
 * @property currentLangName
 */
const currentLangName = computed(() => {
  const map: Record<string, string> = {
    'zh-cn': '中文',
    lo: 'ພາສາລາວ'
  }
  return map[locale.value] || '中文'
})

/**
 * 语言切换处理器
 * @method handleSetLanguage
 * @param {string} lang - 目标语言代码 (zh-cn/lo)
 */
const handleSetLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('lang', lang)
  location.reload() // 建议刷新以完整应用所有多语言设置（包括 Element Plus）
}
</script>

<style scoped lang="scss">
.header {
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.breadcrumb {
  font-weight: bold;
  font-size: 16px;
}
.right-menu {
  display: flex;
  align-items: center;
}
.avatar-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-left: 15px;
  .user-name {
    margin-left: 8px;
    font-size: 14px;
    color: #666;
  }
}
.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-right: 15px;
}
</style>
