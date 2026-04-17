<template>
  <aside class="sidebar">
    <el-scrollbar class="menu-scroll">
      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        text-color="#6d7f92"
        active-text-color="#1d74ff"
        router
      >
        <template v-for="menu in permissionStore.sidebarRoutes" :key="menu.path">
          <template v-if="getShowingChildConfig(menu).isSingle">
            <el-menu-item
              v-if="!menu.hidden"
              :index="resolvePath(menu.path, getShowingChildConfig(menu).child.path)"
            >
              <el-icon v-if="getIcon(getShowingChildConfig(menu).child.meta?.icon || menu.meta?.icon)">
                <component :is="getIcon(getShowingChildConfig(menu).child.meta?.icon || menu.meta?.icon)" />
              </el-icon>
              <span>{{ resolveTitle(getShowingChildConfig(menu).child.meta?.title) }}</span>
            </el-menu-item>
          </template>

          <el-sub-menu v-else-if="!menu.hidden" :index="menu.path">
            <template #title>
              <el-icon v-if="getIcon(menu.meta?.icon)">
                <component :is="getIcon(menu.meta?.icon)" />
              </el-icon>
              <span>{{ resolveTitle(menu.meta?.title) }}</span>
            </template>

            <el-menu-item
              v-for="child in (menu.children || []).filter((item: any) => !item.hidden)"
              :key="child.path"
              :index="resolvePath(menu.path, child.path)"
            >
              <el-icon v-if="getIcon(child.meta?.icon)">
                <component :is="getIcon(child.meta?.icon)" />
              </el-icon>
              <span>{{ resolveTitle(child.meta?.title) }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePermissionStore } from '@/stores/permission'

const { t, te } = useI18n()
const route = useRoute()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.path)

const resolveTitle = (title?: string) => {
  if (!title) {
    return t('placeholder.pageTitle')
  }
  if (title.includes('.') && te(title)) {
    return t(title)
  }
  return title
}

const resolvePath = (parentPath: string, childPath: string) => {
  if (!childPath) return parentPath
  if (childPath.startsWith('/')) return childPath
  if (parentPath === '/') return `/${childPath}`.replace(/\/+/g, '/')
  return `${parentPath}/${childPath}`.replace(/\/+/g, '/')
}

const getIcon = (iconName?: string) => {
  if (!iconName) return ''
  const iconMap: Record<string, string> = {
    system: 'Setting',
    peoples: 'User',
    list: 'List',
    nested: 'Operation',
    dashboard: 'Monitor',
    monitor: 'Monitor',
    user: 'User',
    doctor: 'User',
    workbench: 'Monitor',
    guide: 'Compass',
    record: 'Document',
    video: 'VideoCamera',
    bug: 'Warning'
  }

  return iconMap[iconName] || iconName
}

function getShowingChildConfig(parent: any) {
  if (!parent.children || parent.children.length === 0) {
    return { isSingle: true, child: { ...parent, path: '' } }
  }

  const showingChildren = parent.children.filter((item: any) => !item.hidden)

  if (showingChildren.length === 1 && !parent.alwaysShow && parent.path === '/') {
    return { isSingle: true, child: showingChildren[0] }
  }

  if (showingChildren.length === 0) {
    return { isSingle: true, child: { ...parent, path: '' } }
  }

  return { isSingle: false, child: null }
}
</script>

<style scoped lang="scss">
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px 10px 14px 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 251, 255, 0.98) 100%);
  border-right: 1px solid rgba(224, 233, 245, 0.9);
  box-shadow: 12px 0 28px rgba(15, 23, 42, 0.035);
}

.menu-scroll {
  flex: 1;
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

:deep(.el-menu) {
  border: none;
  padding-top: 4px;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 44px;
  margin: 4px 4px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: #1d74ff !important;
  background: #f2f7ff !important;
}

:deep(.el-menu-item.is-active) {
  color: #1d74ff !important;
  background: linear-gradient(135deg, #eef5ff 0%, #e4f0ff 100%) !important;
  box-shadow: inset 3px 0 0 #2a7fff;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  font-size: 16px;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: auto;
  margin-left: 10px;
}
</style>
