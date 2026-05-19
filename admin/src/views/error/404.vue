<template>
  <div class="errPage-container">
    <el-result icon="warning" title="404" :sub-title="t('error.notFoundDesc')">
      <template #extra>
        <el-button type="primary" @click="$router.push('/')">{{ t('common.backHome') }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.errPage-container {
  padding: 100px;
}
</style>
