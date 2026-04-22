<template>
  <!-- ElConfigProvider 用于全局配置，包含语言设置 -->
  <el-config-provider :locale="elLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const { locale } = useI18n()

/**
 * 根据当前 i18n 语言切换 Element Plus 的内置语言包
 * @property elLocale
 */
const elLocale = computed(() => {
  if (locale.value === 'en') {
    return en
  }

  if (locale.value === 'lo') {
    return zhCn
  }

  return zhCn
})

watchEffect(() => {
  document.documentElement.lang = locale.value
})
</script>

<style>
/* 全局基础样式 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
</style>
