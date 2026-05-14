<template>
  <div v-if="modelValue" class="camera-select-mask" role="presentation" @click.self="closeDialog">
    <section class="camera-select-dialog" role="dialog" aria-modal="true">
      <div class="camera-dialog-body">
        <h2>{{ t('assistant.patientVideo.consultation.cameraSelectTitle') }}</h2>
        <p>{{ t('assistant.patientVideo.consultation.cameraSelectDescription') }}</p>
        <button
          type="button"
          class="camera-refresh-button"
          :disabled="loading"
          @click="$emit('refresh')"
        >
          {{ t('assistant.patientVideo.consultation.cameraRefresh') }}
        </button>
      </div>

      <el-empty
        v-if="!loading && !devices.length"
        :description="t('assistant.patientVideo.consultation.cameraEmpty')"
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
            {{ t('assistant.patientVideo.consultation.cameraCurrent') }}
          </span>
        </label>
      </el-radio-group>

      <div class="camera-dialog-footer">
        <button v-if="!initialRequired" type="button" class="camera-dialog-button camera-dialog-button--ghost" @click="closeDialog">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="camera-dialog-button camera-dialog-button--primary"
          :disabled="!draftDeviceId || !devices.length || loading || switching"
          @click="confirmSelection"
        >
          {{ t('assistant.patientVideo.consultation.cameraConfirm') }}
        </button>
      </div>
    </section>
  </div>
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
  return device.label?.trim() || `${t('assistant.patientVideo.consultation.cameraFallbackName')} ${index + 1}`
}

const handleDeviceChange = (value: string | number | boolean) => {
  draftDeviceId.value = String(value)
}

const closeDialog = () => {
  if (props.initialRequired) {
    return
  }

  emit('update:modelValue', false)
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
.camera-select-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.42);
}

.camera-select-dialog {
  width: min(491px, calc(100vw - 48px));
  border-radius: 14px;
  padding: 30px;
  box-sizing: border-box;
  background: #ffffff;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.camera-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.camera-dialog-body h2 {
  margin: 0;
  color: #2b2f36;
  font-size: 27px;
  font-weight: 500;
  line-height: 1.45;
  text-align: center;
}

.camera-dialog-body p {
  margin: 0;
  color: #6d6d6d;
  font-size: 19px;
  line-height: 1.5;
  text-align: center;
}

.camera-refresh-button {
  align-self: center;
  border: none;
  padding: 0;
  background: transparent;
  color: #409eff;
  font-size: 19px;
  font-weight: 500;
  cursor: pointer;
}

.camera-refresh-button:disabled {
  color: #9dbfe5;
  cursor: not-allowed;
}

.camera-device-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 18px;
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
  font-size: 21px;
  font-weight: 700;
}

.camera-current-tag {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 3px 8px;
  background: rgba(47, 202, 104, 0.12);
  color: #1f9952;
  font-size: 18px;
  font-weight: 700;
}

.camera-dialog-footer {
  display: grid;
  grid-template-columns: repeat(2, 132px);
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
}

.camera-dialog-button {
  height: 52px;
  border: none;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 21px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.camera-dialog-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.camera-dialog-button:disabled {
  cursor: not-allowed;
  opacity: 0.64;
  transform: none;
}

.camera-dialog-button--ghost {
  background: #eeeeee;
  color: #6d6d6d;
}

.camera-dialog-button--primary {
  background: #409eff;
  color: #ffffff;
}

:global(.camera-select-dialog .el-radio__label),
:global(.camera-select-dialog .el-empty__description) {
  font-size: 21px;
}

@media (max-width: 640px) {
  .camera-select-dialog {
    padding: 24px;
  }

  .camera-dialog-body h2 {
    font-size: 26px;
  }

  .camera-dialog-footer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 34px;
  }

  .camera-dialog-button {
    height: 58px;
    font-size: 23px;
  }
}
</style>
