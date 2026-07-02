<template>
  <div class="sidebar">
    <div class="logo">
      <p style="font-size: 16px; font-weight: bold;color: #fff;">{{ t('menu.brand') }}</p>
    </div>

    <el-menu
      :default-active="activeMenu"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <SidebarMenuItem
        v-for="(menu, index) in permissionStore.sidebarRoutes"
        :key="index"
        :item="menu"
        :base-path="'/'">
      </SidebarMenuItem>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePermissionStore } from '@/stores/permission'
import SidebarMenuItem from './SidebarMenuItem.vue'

const { t } = useI18n()
const route = useRoute()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => {
  return route.path
})
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
