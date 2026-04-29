<template>
  <el-dialog
    :model-value="modelValue"
    width="460px"
    class="camera-select-dialog"
    :title="t('doctorVideo.consultation.cameraSelectTitle')"
    :close-on-click-modal="!initialRequired"
    :close-on-press-escape="!initialRequired"
    :show-close="!initialRequired"
    @update:model-value="handleDialogVisibilityChange"
  >
    <div class="camera-dialog-body">
      <div class="camera-dialog-heading">
        <p>{{ t('doctorVideo.consultation.cameraSelectDescription') }}</p>
        <el-button
          class="camera-refresh-button"
          type="primary"
          link
          :loading="loading"
          @click="$emit('refresh')"
        >
          {{ t('doctorVideo.consultation.cameraRefresh') }}
        </el-button>
      </div>

      <el-empty
        v-if="!loading && !devices.length"
        :description="t('doctorVideo.consultation.cameraEmpty')"
      />

      <el-radio-group
        v-else
        class="camera-device-list"
        :model-value="draftDeviceId"
        @update:model-value="handleDeviceChange"
      >
        <label
          v-for="(device, index) in devices"
          :key="device.deviceId || index"
          class="camera-device-option"
          :class="draftDeviceId === device.deviceId ? 'is-selected' : ''"
        >
          <el-radio :value="device.deviceId">
            <span class="camera-device-name">{{ resolveDeviceLabel(device, index) }}</span>
          </el-radio>
          <span
            v-if="device.deviceId && device.deviceId === selectedDeviceId"
            class="camera-current-tag"
          >
            {{ t('doctorVideo.consultation.cameraCurrent') }}
          </span>
        </label>
      </el-radio-group>
    </div>

    <template #footer>
      <div class="camera-dialog-footer">
        <el-button v-if="!initialRequired" @click="closeDialog">
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :disabled="!draftDeviceId || !devices.length"
          :loading="loading || switching"
          @click="confirmSelection"
        >
          {{ t('doctorVideo.consultation.cameraConfirm') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
  loading?: boolean
  switching?: boolean
  initialRequired?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  switching: false,
  initialRequired: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'confirm', deviceId: string): void
  (event: 'refresh'): void
}>()

const { t } = useI18n()
const draftDeviceId = ref('')

const syncDraftDeviceId = () => {
  if (props.selectedDeviceId) {
    draftDeviceId.value = props.selectedDeviceId
    return
  }

  draftDeviceId.value = props.devices[0]?.deviceId || ''
}

const resolveDeviceLabel = (device: MediaDeviceInfo, index: number) => {
  return device.label?.trim() || `${t('doctorVideo.consultation.cameraFallbackName')} ${index + 1}`
}

const handleDeviceChange = (value: string | number | boolean) => {
  draftDeviceId.value = String(value)
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const handleDialogVisibilityChange = (value: boolean) => {
  if (!value && props.initialRequired) {
    return
  }

  emit('update:modelValue', value)
}

const confirmSelection = () => {
  if (!draftDeviceId.value) {
    return
  }

  emit('confirm', draftDeviceId.value)
}

watch(
  () => [props.modelValue, props.selectedDeviceId, props.devices] as const,
  ([visible]) => {
    if (!visible) {
      return
    }

    syncDraftDeviceId()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.camera-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.camera-dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.camera-dialog-heading p {
  margin: 0;
  color: #5d7192;
  font-size: 14px;
  line-height: 1.6;
}

.camera-refresh-button {
  flex: 0 0 auto;
  font-weight: 700;
}

.camera-device-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.camera-device-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 42px;
  border: 1px solid #d8e4f5;
  border-radius: 8px;
  padding: 0 12px;
  background: #f8fbff;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.camera-device-option:hover,
.camera-device-option.is-selected {
  border-color: #3f7bf4;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(61, 104, 190, 0.1);
}

.camera-device-name {
  color: #253b60;
  font-weight: 700;
}

.camera-current-tag {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 3px 8px;
  background: rgba(47, 202, 104, 0.12);
  color: #1f9952;
  font-size: 11px;
  font-weight: 700;
}

.camera-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
