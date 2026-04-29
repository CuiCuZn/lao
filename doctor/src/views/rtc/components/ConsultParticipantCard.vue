<template>
  <div
    ref="containerRef"
    :class="[
      'consult-participant-card',
      compact ? 'is-compact' : 'is-featured',
      hasTrack ? 'is-video-ready' : 'is-placeholder',
      speaking ? 'is-speaking' : ''
    ]"
  >
    <div v-if="!hasTrack" class="placeholder-pattern" />

    <div v-if="showStatus && (badge || muted)" class="participant-overlay">
      <span v-if="badge" class="participant-badge">{{ badge }}</span>
      <span v-if="muted" class="participant-muted">{{ t('doctorVideo.consultation.muted') }}</span>
    </div>

    <div v-if="!hasTrack" class="avatar-shell">
      <div class="avatar-text">{{ avatarText }}</div>
      <p class="avatar-name">{{ userName }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CameraVideoTrack, LocalVideoTrack, RemoteVideoTrack } from 'dingrtc'

interface Props {
  userName: string
  track?: CameraVideoTrack | LocalVideoTrack | RemoteVideoTrack | null
  muted?: boolean
  compact?: boolean
  speaking?: boolean
  badge?: string
  mirror?: boolean
  showStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  track: null,
  muted: false,
  compact: false,
  speaking: false,
  badge: '',
  mirror: false,
  showStatus: true
})

const { t } = useI18n()
const containerRef = ref<HTMLDivElement | null>(null)
const hasTrack = computed(() => Boolean(props.track))

const clearRenderedVideos = (container: HTMLDivElement | null) => {
  if (!container) {
    return
  }

  container.querySelectorAll('video').forEach((video) => video.remove())
}

const avatarText = computed(() => {
  const trimmed = props.userName?.trim()
  return trimmed ? trimmed.slice(0, 1) : '?'
})

watch(
  () => [containerRef.value, props.track, props.compact, props.mirror] as const,
  ([container, track, compact, mirror], previous = [null, null, false, false] as const) => {
    const [previousContainer, previousTrack] = previous

    if (previousTrack && previousContainer && previousTrack !== track) {
      // @ts-ignore
      if (typeof previousTrack.stopPlay === 'function') {
        // @ts-ignore
        previousTrack.stopPlay()
      } else {
        previousTrack.stop(previousContainer)
      }
      clearRenderedVideos(previousContainer)
    }

    if (!track && container) {
      clearRenderedVideos(container)
    }

    if (!container || !track) {
      return
    }

    track.play(container, {
      fit: compact ? 'cover' : 'contain',
      mirror
    })
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (containerRef.value && props.track) {
    // @ts-ignore
    if (typeof props.track.stopPlay === 'function') {
      // @ts-ignore
      props.track.stopPlay()
    } else {
      props.track.stop(containerRef.value)
    }
  }

  clearRenderedVideos(containerRef.value)
})
</script>

<style scoped lang="scss">
.consult-participant-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(180deg, #f7fbff 0%, #eef4ff 100%);
  border: 1px solid rgba(57, 111, 226, 0.18);
  box-shadow: 0 18px 38px rgba(66, 89, 132, 0.1);
  isolation: isolate;

  :deep(video) {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #0d1728;
  }
}

.is-featured {
  width: 100%;
  height: 100%;
  min-height: 440px;
}

.is-compact {
  width: 100%;
  height: 124px;
  border-radius: 16px;
}

.is-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.is-speaking {
  box-shadow:
    0 0 0 2px rgba(57, 190, 120, 0.36),
    0 24px 48px rgba(57, 190, 120, 0.16);
}

.placeholder-pattern {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 22% 18%, rgba(103, 162, 255, 0.22), transparent 18%),
    radial-gradient(circle at 78% 22%, rgba(114, 230, 205, 0.2), transparent 20%),
    radial-gradient(circle at 48% 78%, rgba(123, 162, 255, 0.18), transparent 24%);
}

.participant-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #edf5ff;
  text-shadow: 0 2px 12px rgba(18, 35, 69, 0.4);
}

.is-placeholder .participant-overlay {
  color: #335486;
  text-shadow: none;
}

.participant-badge,
.participant-muted {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  border-radius: 999px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
}

.participant-badge {
  background: rgba(56, 100, 215, 0.88);
}

.participant-muted {
  background: rgba(213, 82, 90, 0.86);
}

.is-placeholder .participant-badge {
  background: rgba(67, 111, 214, 0.12);
  color: #2e5cbc;
}

.avatar-shell {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.avatar-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  border: 6px solid #ffffff;
  background: #b3d1fb;
  color: #2f5bb7;
  font-size: 50px;
  font-weight: 700;
  box-shadow: 0 18px 44px rgba(71, 103, 164, 0.18);
}

.avatar-name {
  margin: 0;
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(74, 78, 89, 0.72);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}

.is-compact .avatar-shell {
  gap: 10px;
}

.is-compact .avatar-text {
  width: 66px;
  height: 66px;
  border-width: 4px;
  font-size: 24px;
}

.is-compact .avatar-name {
  padding: 6px 10px;
  font-size: 12px;
}

.is-video-ready {
  background: #0d1728;
}

@media (max-width: 900px) {
  .is-featured {
    min-height: 380px;
  }
}
</style>
