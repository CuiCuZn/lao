<!--
 * @version: 
 * @Author: Cuidezhen
 * @Date: 2026-04-03 10:43:46
 * @LastEditors: Cuidezhen
 * @LastEditTime: 2026-06-01 10:47:48
 * @company: 医视界
 * @FilePath: \lao\admin\src\layout\index.vue
 * @Descripttion: 
 * @Edit Record: 
-->
<template>
  <div class="app-wrapper">
    <!-- 侧边菜单栏 -->
    <sidebar class="sidebar-container" />

    <div class="main-container">
      <!-- 顶部状态/导航栏 -->
      <app-header />

      <!-- 内容主体区域 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import AppHeader from './components/Header.vue'

/**
 * 后台系统主页面布局组件
 * @module Layout
 */
</script>

<style scoped>
.app-wrapper {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  background-color: #304156;
  transition: width 0.3s;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.app-main {
  flex: 1;
  min-height: 0;
  padding: 10px;
  /* 内容超出时可竖向滚动，避免遮挡；
     横向不滚动，超出部分由子页面自适应处理。 */
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #f0f2f5;
}

/* 滚动条美化（webkit 内核；不生效也不影响功能） */
.app-main::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.app-main::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
.app-main::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
.app-main::-webkit-scrollbar-track {
  background: transparent;
}

/* 页面切换动画 */
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
</style>
