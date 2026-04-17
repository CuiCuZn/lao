<template>
  <div class="sidebar">
    <div class="logo">
      <p style="font-size: 16px; font-weight: bold;color: #fff;">壮医诊疗管理系统</p>
    </div>

    <el-menu
      :default-active="activeMenu"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <!-- 动态路由展示 -->
      <template v-for="(menu, index) in permissionStore.sidebarRoutes" :key="index">
        <!-- 核心逻辑：判断是否是单级菜单 (RuoYi 风格：Layout 包裹单个子路由且父路径为 /) -->
        <template v-if="getShowingChildConfig(menu).isSingle">
          <el-menu-item 
            v-if="!menu.hidden" 
            :index="resolvePath(menu.path, getShowingChildConfig(menu).child.path)"
          >
            <el-icon v-if="getIcon(getShowingChildConfig(menu).child.meta?.icon || menu.meta?.icon)">
               <component :is="getIcon(getShowingChildConfig(menu).child.meta?.icon || menu.meta?.icon)" />
            </el-icon>
            <span>{{ getShowingChildConfig(menu).child.meta?.title }}</span>
          </el-menu-item>
        </template>

        <!-- 带有子菜单的情况 (多于一个子路由或是文件夹) -->
        <el-sub-menu v-else-if="!menu.hidden" :index="menu.path">
          <template #title>
            <el-icon v-if="getIcon(menu.meta?.icon)">
               <component :is="getIcon(menu.meta.icon)" />
            </el-icon>
            <span>{{ menu.meta?.title }}</span>
          </template>
          
          <el-menu-item 
            v-for="child in menu.children" 
            :key="child.path" 
            :index="resolvePath(menu.path, child.path)"
          >
             <el-icon v-if="getIcon(child.meta?.icon)">
               <component :is="getIcon(child.meta.icon)" />
             </el-icon>
             <span>{{ child.meta?.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePermissionStore } from '@/stores/permission'

const { t } = useI18n()
const route = useRoute()
const permissionStore = usePermissionStore()

/**
 * 侧边栏高亮路径计算
 */
const activeMenu = computed(() => {
  return route.path
})

/**
 * 路径解析，简单拼接
 */
const resolvePath = (parentPath: string, childPath: string) => {
  if (!childPath) return parentPath
  if (childPath.startsWith('/')) return childPath
  if (parentPath === '/') return '/' + childPath
  return (parentPath + '/' + childPath).replace(/\/+/g, '/')
}

/**
 * 图标映射
 */
const getIcon = (iconName: string) => {
  if (!iconName) return ''
  const map: Record<string, string> = {
    'system': 'Setting',
    'peoples': 'User',
    'list': 'List',
    'nested': 'Operation',
    'dashboard': 'Monitor',
    'user': 'User',
    'bug': 'Warning'
  }
  return map[iconName] || iconName
}

/**
 * 获取展示子节点的配置信息 (无副作用函数，防止 Vue 递归更新报错)
 * @param parent 
 */
function getShowingChildConfig(parent: any) {
  // 1. 如果没有子节点，视为单级
  if (!parent.children || parent.children.length === 0) {
    return { isSingle: true, child: { ...parent, path: '' } }
  }

  // 2. 筛选非隐藏的子节点
  const showingChildren = parent.children.filter((item: any) => !item.hidden)

  // 3. 符合 RuoYi 单级菜单条件的：顶级路径为 /，且只有一个子节点，且非 alwaysShow
  if (showingChildren.length === 1 && !parent.alwaysShow && parent.path === '/') {
    return { isSingle: true, child: showingChildren[0] }
  }

  // 4. 如果没有可显示的子节点，展示父节点本身
  if (showingChildren.length === 0) {
    return { isSingle: true, child: { ...parent, path: '' } }
  }

  // 5. 其它情况（多级或文件夹）
  return { isSingle: false, child: null }
}
</script>

<style scoped>
.sidebar {
  height: 100%;
}
.logo {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2b2f3a;
}
.el-menu {
  border: none;
}
</style>
