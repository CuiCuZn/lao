<template>
  <el-date-picker
    :model-value="modelValue"
    type="daterange"
    range-separator="-"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :value-format="valueFormat"
    :size="size"
    :disabled="disabled"
    :clearable="clearable"
    unlink-panels
    style="width: 260px"
    @update:model-value="handleChange"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 双值数组 [start, end]，格式由 valueFormat 决定 */
    modelValue?: [string, string] | []
    startPlaceholder?: string
    endPlaceholder?: string
    /** 输出值格式，默认 YYYY-MM-DD */
    valueFormat?: string
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    clearable?: boolean
  }>(),
  {
    startPlaceholder: '',
    endPlaceholder: '',
    valueFormat: 'YYYY-MM-DD',
    size: 'default',
    disabled: false,
    clearable: true
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: [string, string] | []): void
  (e: 'change', val: [string, string] | []): void
}>()

const handleChange = (val: [string, string] | []) => {
  emit('update:modelValue', val || [])
  emit('change', val || [])
}
</script>

<style scoped>
:deep(.el-range-editor) {
  width: 100%;
}
</style>
