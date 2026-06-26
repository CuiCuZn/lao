<!--
 * @version: 
 * @Author: Cuidezhen
 * @Date: 2026-06-22 11:42:24
 * @LastEditors: Cuidezhen
 * @LastEditTime: 2026-06-23 10:00:00
 * @company: 医视界
 * @FilePath: \lao\admin\src\views\log\index.vue
 * @Descripttion: 日志管理（操作日志 / 登录日志）
 * @Edit Record: 
-->
<template>
  <div class="log-container">
    <el-tabs v-model="activeTab" class="log-tabs" @tab-change="onTabChange">
      <!-- 操作日志 -->
      <el-tab-pane :label="t('log.tabOperate')" name="operate" class="log-tab-pane">
        <div v-show="activeTab === 'operate'" class="tab-content">
          <OperLogPanel v-if="loadedOperate" />
        </div>
      </el-tab-pane>

      <!-- 登录日志 -->
      <el-tab-pane :label="t('log.tabLogin')" name="login" class="log-tab-pane">
        <div v-show="activeTab === 'login'" class="tab-content">
          <LoginLogPanel v-if="loadedLogin" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import OperLogPanel from './components/OperLogPanel.vue'
import LoginLogPanel from './components/LoginLogPanel.vue'

const { t } = useI18n()

// 当前激活的 tab：operate 操作日志 / login 登录日志
const activeTab = ref<'operate' | 'login'>('operate')
// 面板懒加载（首次切到该 tab 才渲染）
const loadedOperate = ref(true)
const loadedLogin = ref(false)

/**
 * tab 切换：首次切到对应 tab 时渲染面板
 */
const onTabChange = (name: string | number) => {
  if (name === 'operate') loadedOperate.value = true
  if (name === 'login') loadedLogin.value = true
}
</script>

<style lang="scss" scoped>
.log-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 让 tabs 占满整个页面 */
.log-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 24px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
}

/* tab 面板占满高度，内容区可滚动 */
.log-tab-pane {
  height: 100%;
}

/* tab 内容占满 */
.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
}
</style>
