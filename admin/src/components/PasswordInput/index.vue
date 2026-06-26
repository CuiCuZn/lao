<template>
  <el-input
    :model-value="modelValue"
    :type="visible ? 'text' : 'password'"
    :placeholder="placeholder"
    :size="size"
    :disabled="disabled"
    autocomplete="new-password"
    @update:model-value="handleInput"
  >
    <template #prefix>
      <el-icon><Lock /></el-icon>
    </template>
    <template #suffix>
      <el-icon class="pwd-toggle" @click="visible = !visible">
        <View v-if="visible" />
        <Hide v-else />
      </el-icon>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Lock, View, Hide } from '@element-plus/icons-vue'

defineProps<{
  modelValue: string
  placeholder?: string
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const visible = ref(false)

const handleInput = (val: string) => emit('update:modelValue', val)
</script>

<style scoped>
.pwd-toggle {
  cursor: pointer;
  color: var(--el-text-color-secondary);
}
.pwd-toggle:hover {
  color: var(--el-color-primary);
}
</style>
