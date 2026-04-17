<template>
  <div class="err-page-container">
    <el-result icon="warning" title="404" :sub-title="t('error.notFoundDesc')">
      <template #extra>
        <el-button type="primary" @click="$router.push('/')">
          {{ t('common.backHome') }}
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.err-page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}
</style>
