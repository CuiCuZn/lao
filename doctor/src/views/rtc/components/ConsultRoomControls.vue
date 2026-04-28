<template>
  <div class="consult-room-controls">
    <button
      v-if="showCamera"
      type="button"
      class="control-button control-button--secondary"
      :class="cameraEnabled ? 'is-active' : 'is-inactive'"
      :disabled="cameraSwitching"
      @click="onToggleCamera"
    >
      <span class="icon-shell">
        <el-icon><video-camera /></el-icon>
      </span>
      <span class="label">{{ cameraEnabled ? t('doctorVideo.consultation.cameraOn') : t('doctorVideo.consultation.cameraOff') }}</span>
    </button>

    <button
      v-if="showCamera && onSwitchCamera"
      type="button"
      class="control-button control-button--secondary is-active"
      :disabled="cameraSwitching"
      @click="onSwitchCamera"
    >
      <span class="icon-shell">
        <el-icon><refresh /></el-icon>
      </span>
      <span class="label">{{ t('doctorVideo.consultation.cameraSwitch') }}</span>
    </button>

    <button
      type="button"
      class="control-button"
      :class="micEnabled ? 'is-active' : 'is-inactive'"
      @click="onToggleMic"
    >
      <span class="icon-shell">
        <el-icon>
          <microphone v-if="micEnabled" />
          <mute-notification v-else />
        </el-icon>
      </span>
      <span class="label">{{ micEnabled ? t('doctorVideo.consultation.micOn') : t('doctorVideo.consultation.micOff') }}</span>
    </button>

    <button type="button" class="control-button control-button--danger" @click="onLeave">
      <span class="icon-shell">
        <el-icon><switch-button /></el-icon>
      </span>
      <span class="label">{{ t('doctorVideo.consultation.leave') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  Microphone,
  MuteNotification,
  Refresh,
  SwitchButton,
  VideoCamera
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

interface Props {
  cameraEnabled: boolean
  micEnabled: boolean
  onToggleCamera: () => void | Promise<void>
  onSwitchCamera?: () => void | Promise<void>
  onToggleMic: () => void | Promise<void>
  onLeave: () => void | Promise<void>
  cameraSwitching?: boolean
  showCamera?: boolean
}

withDefaults(defineProps<Props>(), {
  cameraSwitching: false,
  showCamera: false
})

const { t } = useI18n()
</script>

<style scoped lang="scss">
.consult-room-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.control-button {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 88px;
  border: none;
  padding: 0;
  background: transparent;
  color: #2d4268;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.control-button:hover {
  transform: translateY(-1px);
}

.control-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  box-shadow: 0 14px 28px rgba(66, 90, 136, 0.18);
  font-size: 22px;
}

.label {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.is-active .icon-shell {
  background: linear-gradient(180deg, #ffffff 0%, #eef4ff 100%);
  color: #27406d;
}

.is-inactive {
  color: #d04d4d;
}

.is-inactive .icon-shell {
  background: linear-gradient(180deg, #fff0f0 0%, #ffe0e0 100%);
}

.control-button--secondary {
  opacity: 0.72;
}

.control-button--danger .icon-shell {
  background: linear-gradient(180deg, #f86a6a 0%, #e94a4a 100%);
}

@media (max-width: 900px) {
  .consult-room-controls {
    gap: 14px;
  }

  .icon-shell {
    width: 54px;
    height: 54px;
  }
}
</style>
