<template>
  <el-menu-item
    v-if="isSingle"
    :index="menuIndex"
  >
    <el-icon v-if="icon">
      <component :is="icon" />
    </el-icon>
    <span>{{ displayTitle }}</span>
  </el-menu-item>

  <el-sub-menu
    v-else
    :index="subMenuIndex"
  >
    <template #title>
      <el-icon v-if="icon">
        <component :is="icon" />
      </el-icon>
      <span>{{ item.meta?.title }}</span>
    </template>

    <SidebarMenuItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      :base-path="resolvedPath"
    />
  </el-sub-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SidebarMenuItem from './SidebarMenuItem.vue'

defineOptions({ name: 'SidebarMenuItem' })

const props = defineProps<{
  item: any
  basePath: string
}>()

const resolvePath = (parentPath: string, childPath: string) => {
  if (!childPath) return parentPath
  if (childPath.startsWith('/')) return childPath
  if (parentPath === '/') return '/' + childPath
  return (parentPath + '/' + childPath).replace(/\/+/g, '/')
}

const iconMap: Record<string, string> = {
  system: 'Setting',
  peoples: 'UserFilled',
  list: 'List',
  nested: 'Operation',
  dashboard: 'DataBoard',
  user: 'User',
  bug: 'Warning',
  doctor: 'FirstAidKit',
  dept: 'OfficeBuilding',
  department: 'OfficeBuilding',
  record: 'DocumentChecked',
  prescription: 'Tickets',
  recipe: 'Tickets',
  medicine: 'FirstAidKit',
  patient: 'UserFilled',
  role: 'Avatar',
  log: 'Notebook',
  operlog: 'Notebook',
  syndrome: 'Collection',
  corpus: 'Collection',
  pattern: 'Collection',
  waiting: 'Collection',
  dict: 'CollectionTag',
  dictionary: 'CollectionTag'
}

const getIcon = (route: any) => {
  const iconName = route?.meta?.icon
  if (iconName && iconMap[iconName]) return iconMap[iconName]

  const routeText = [
    route?.path,
    route?.name,
    route?.meta?.title
  ].filter(Boolean).join(' ').toLowerCase()

  if (routeText.includes('prescription') || routeText.includes('处方')) return 'Tickets'
  if (routeText.includes('doctor') || routeText.includes('医师')) return 'FirstAidKit'
  if (routeText.includes('dept') || routeText.includes('科室')) return 'OfficeBuilding'
  if (routeText.includes('record') || routeText.includes('诊疗记录')) return 'DocumentChecked'
  if (routeText.includes('dashboard') || routeText.includes('工作台')) return 'DataBoard'
  if (routeText.includes('patient') || routeText.includes('患者')) return 'UserFilled'
  if (routeText.includes('role') || routeText.includes('角色')) return 'Avatar'
  if (routeText.includes('log') || routeText.includes('日志')) return 'Notebook'
  if (routeText.includes('user') || routeText.includes('用户')) return 'User'
  if (routeText.includes('syndrome') || routeText.includes('证型') || routeText.includes('语料库') || routeText.includes('corpus') || routeText.includes('pattern')) return 'Collection'
  if (routeText.includes('dict') || routeText.includes('字典')) return 'CollectionTag'

  return iconName || ''
}

const visibleChildren = computed(() => {
  return (props.item.children || []).filter((c: any) => !c.hidden)
})

const showingChild = computed(() => {
  if (visibleChildren.value.length === 1 && !props.item.alwaysShow) {
    return visibleChildren.value[0]
  }
  return null
})

const isSingle = computed(() => {
  if (!props.item.children || props.item.children.length === 0) return true
  if (visibleChildren.value.length === 0) return true
  if (visibleChildren.value.length === 1 && !props.item.alwaysShow) return true
  return false
})

const resolvedPath = computed(() => {
  const path = props.item.path || ''
  if (path.startsWith('/')) return path
  if (props.basePath === '/') return '/' + path
  if (props.basePath) return (props.basePath + '/' + path).replace(/\/+/g, '/')
  return path.startsWith('/') ? path : '/' + path
})

const menuIndex = computed(() => {
  if (showingChild.value) {
    return resolvePath(resolvedPath.value, showingChild.value.path)
  }
  return resolvedPath.value
})

const subMenuIndex = computed(() => resolvedPath.value)

const displayTitle = computed(() => {
  if (showingChild.value) {
    return showingChild.value.meta?.title
  }
  return props.item.meta?.title
})

const icon = computed(() => {
  if (showingChild.value) {
    return getIcon(showingChild.value) || getIcon(props.item)
  }
  return getIcon(props.item)
})
</script>
