<template>
  <div>
    <template v-for="(item, index) in options">
      <template v-if="item.dictValue === String(value)">
        <span
          v-if="item.listClass === '' || item.listClass === 'default'"
          :key="item.dictValue"
          :class="item.cssClass"
        >{{ item.dictLabel }}</span>
        <el-tag
          v-else
          :key="item.dictValue + ''"
          :disable-transitions="true"
          :type="(item.listClass as any) === 'primary' ? 'primary' : item.listClass"
          :class="item.cssClass"
        >
          {{ item.dictLabel }}
        </el-tag>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DictDataVO } from '@/api/types';

defineProps<{
  options: DictDataVO[];
  value: string | number;
}>();
</script>

<style scoped>
.el-tag + .el-tag {
  margin-left: 10px;
}
</style>
