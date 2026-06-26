<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="420px"
    align-center
    :close-on-click-modal="false"
    append-to-body
    class="confirm-dialog"
    @closed="handleClosed"
  >
    <div class="confirm-body">
      <div class="confirm-icon" :class="`confirm-icon--${type}`">
        <el-icon v-if="type === 'warning'"><WarningFilled /></el-icon>
        <el-icon v-else-if="type === 'success'"><CircleCheckFilled /></el-icon>
        <el-icon v-else-if="type === 'danger'"><CircleCloseFilled /></el-icon>
        <el-icon v-else><WarningFilled /></el-icon>
      </div>
      <div class="confirm-content">
        <div v-if="contentTitle" class="confirm-content__title">{{ contentTitle }}</div>
        <div class="confirm-content__message">
          <slot>{{ message }}</slot>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleCancel">{{ cancelText }}</el-button>
      <el-button :type="confirmType" :loading="loading" @click="handleConfirm">{{ confirmText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WarningFilled, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

type ConfirmType = 'warning' | 'success' | 'danger' | 'info'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    /** 图标风格：warning 黄 / success 绿 / danger 红 / info 蓝 */
    type?: ConfirmType
    /** 内容标题（加粗主语，可选） */
    contentTitle?: string
    /** 内容说明文案，与 slot 二选一 */
    message?: string
    confirmText?: string
    cancelText?: string
    /** 确认按钮 loading 态 */
    loading?: boolean
  }>(),
  {
    type: 'warning',
    contentTitle: '',
    message: '',
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const title = computed(() => props.title || t('common.tip'))
const confirmText = computed(() => props.confirmText || t('confirm.confirmBtn'))
const cancelText = computed(() => props.cancelText || t('confirm.cancelBtn'))

// danger 用红色按钮，其余统一主色
const confirmType = computed<'danger' | 'primary'>(() =>
  props.type === 'danger' ? 'danger' : 'primary'
)

const handleConfirm = () => emit('confirm')
const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
const handleClosed = () => emit('cancel')
</script>

<style scoped>
.confirm-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 4px 0;
}
.confirm-icon {
  flex-shrink: 0;
  font-size: 22px;
  line-height: 1;
}
.confirm-icon--warning {
  color: var(--el-color-warning);
}
.confirm-icon--success {
  color: var(--el-color-success);
}
.confirm-icon--danger {
  color: var(--el-color-danger);
}
.confirm-icon--info {
  color: var(--el-color-info);
}
.confirm-content {
  flex: 1;
  min-width: 0;
}
.confirm-content__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}
.confirm-content__message {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  word-break: break-word;
}
</style>
