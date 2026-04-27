<template>
  <aside class="consult-subtitle-panel">
    <div class="panel-header">
      <div class="title-group">
        <div class="icon-box">
          <el-icon><chat-dot-round /></el-icon>
        </div>

        <div>
          <p class="eyebrow">{{ t('doctorVideo.consultation.subtitleTitle') }}</p>
          <h2 class="title">{{ t('doctorVideo.consultation.subtitleRecord') }}</h2>
        </div>
      </div>

      <div class="status-group">
        <span class="status-tag" :class="loading ? 'is-loading' : error ? 'is-error' : 'is-ready'">
          {{ loading ? t('doctorVideo.consultation.subtitleStarting') : error ? t('doctorVideo.consultation.subtitleRetryNeeded') : t('doctorVideo.consultation.subtitleReady') }}
        </span>

        <button
          type="button"
          class="language-toggle"
          :class="{ 'is-active': showBilingual }"
          role="switch"
          :aria-checked="showBilingual"
          @click="toggleBilingual"
        >
          <span class="language-toggle-copy">
            <span class="language-toggle-label">{{ t('doctorVideo.consultation.originalLanguage') }}</span>
          </span>
          <span class="language-toggle-track">
            <span class="language-toggle-thumb" />
          </span>
        </button>

        <button v-if="error" type="button" class="retry-button" @click="onRetry">
          <el-icon><refresh-right /></el-icon>
          <span>{{ t('doctorVideo.consultation.retrySubtitle') }}</span>
        </button>
      </div>
    </div>

    <div v-if="error" class="panel-notice">{{ error }}</div>

    <div v-if="items.length" ref="timelineListRef" class="timeline-list" @scroll="handleScroll">
      <article
        v-for="item in items"
        :key="item.id"
        :class="['timeline-row', item.side === 'self' ? 'is-self' : 'is-remote']"
      >
        <div class="message-card">
          <div class="message-meta">
            <span class="speaker-name">{{ item.speakerName }}</span>
            <span class="message-time">{{ formatTime(item.anchorTimestamp) }}</span>
          </div>

          <div
            :class="[
              'message-bubble',
              item.side === 'self' ? 'bubble-self' : 'bubble-remote',
              !showBilingual ? 'message-bubble--translated-only' : ''
            ]"
          >
            <div v-if="showBilingual && item.sourceText" class="message-section">
              <p class="section-title">{{ formatLanguageLabel(item.sourceLanguage) }}</p>
              <p class="message-text">{{ item.sourceText }}</p>
            </div>

            <div v-if="showBilingual && item.sourceText && item.translatedText" class="message-divider" />

            <div
              v-if="showBilingual ? item.translatedText : true"
              :class="['message-section', !showBilingual ? 'message-section--translated-only' : '']"
            >
              <p v-if="showBilingual" class="section-title section-title--translated">{{ t('doctorVideo.consultation.translation') }}</p>
              <p
                :class="[
                  'message-text',
                  'translated-text',
                  !showBilingual && isSingleLanguageDisplayPending(item) ? 'message-text--pending' : ''
                ]"
              >
                {{ resolveDisplayText(item) }}
              </p>
            </div>

            <span v-if="!item.isFinal" class="draft-tag">{{ t('doctorVideo.consultation.recognizing') }}</span>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty-state">
      <p>{{ t('doctorVideo.consultation.subtitleEmptyTitle') }}</p>
      <p>{{ t('doctorVideo.consultation.subtitleEmptyDescription') }}</p>
    </div>

    <div class="composer-panel">
      <textarea
        class="composer-input"
        :value="chatDraft || ''"
        :placeholder="chatPlaceholder || t('doctorVideo.consultation.chatPlaceholder')"
        :disabled="chatInputDisabled"
        @input="handleChatInput"
        @keydown.enter.exact.prevent="handleChatSend"
      />

      <div class="composer-footer">
        <p v-if="chatStatusText" class="composer-status">{{ chatStatusText }}</p>

        <button
          type="button"
          class="send-button"
          :disabled="sendDisabled"
          @click="handleChatSend"
        >
          <el-icon><Position /></el-icon>
          <span>
            {{
              chatSending
                ? t('doctorVideo.consultation.chatSending')
                : t('doctorVideo.consultation.chatSend')
            }}
          </span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ChatDotRound, Position, RefreshRight } from '@element-plus/icons-vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SubtitleTimelineItem } from '../types'

interface Props {
  items: SubtitleTimelineItem[]
  loading: boolean
  error: string
  onRetry: () => void | Promise<void>
  updateScrollState: (scrollContainer: HTMLElement | null) => void
  scrollToLatestIfNeeded: (scrollContainer: HTMLElement | null, behavior?: ScrollBehavior) => void
  scrollVersion: number
  chatDraft?: string
  chatPlaceholder?: string
  chatSending?: boolean
  chatInputDisabled?: boolean
  chatSendDisabled?: boolean
  chatStatusText?: string
  onChatInput?: (value: string) => void
  onChatSend?: () => void | Promise<void>
}

const props = defineProps<Props>()
const { t } = useI18n()
const timelineListRef = ref<HTMLDivElement | null>(null)
const showBilingual = ref(false)
const sendDisabled = computed(() => {
  return Boolean(
    props.chatInputDisabled ||
    props.chatSendDisabled ||
    props.chatSending ||
    !props.chatDraft?.trim()
  )
})

const languageLabelMap: Record<string, string> = {
  cn: '中文',
  zh: '中文',
  'zh-cn': '中文',
  lo: 'ລາວ',
  lao: 'ລາວ'
}

const formatLanguageLabel = (languageCode: string) => {
  const normalizedCode = languageCode?.trim().toLowerCase()
  return languageLabelMap[normalizedCode] || languageCode?.toUpperCase() || t('doctorVideo.consultation.sourceText')
}

const toggleBilingual = () => {
  showBilingual.value = !showBilingual.value
}

const hasTranslatedText = (item: SubtitleTimelineItem) => {
  return Boolean(item.translatedText?.trim())
}

const hasSourceText = (item: SubtitleTimelineItem) => {
  return Boolean(item.sourceText?.trim())
}

const isSingleLanguageDisplayPending = (item: SubtitleTimelineItem) => {
  return item.side === 'remote' && !hasTranslatedText(item)
}

const resolveSingleLanguageDisplayText = (item: SubtitleTimelineItem) => {
  if (item.side === 'self') {
    return item.sourceText?.trim() || item.translatedText?.trim() || ''
  }

  if (hasTranslatedText(item)) {
    return item.translatedText
  }

  return t('doctorVideo.consultation.translationPending')
}

const resolveDisplayText = (item: SubtitleTimelineItem) => {
  if (showBilingual.value) {
    return item.translatedText
  }

  if (hasSourceText(item) || hasTranslatedText(item)) {
    return resolveSingleLanguageDisplayText(item)
  }

  return item.side === 'remote' ? t('doctorVideo.consultation.translationPending') : ''
}

const formatTime = (timestamp: number) => {
  if (!timestamp) {
    return '--:--:--'
  }

  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false })
}

const handleScroll = () => {
  props.updateScrollState(timelineListRef.value)
}

const handleChatInput = (event: Event) => {
  const nextValue = (event.target as HTMLTextAreaElement | null)?.value || ''
  props.onChatInput?.(nextValue)
}

const handleChatSend = () => {
  if (sendDisabled.value) {
    return
  }

  void props.onChatSend?.()
}

// Watch the scrollVersion counter instead of a fragile fingerprint string.
// scrollVersion increments on every data mutation in the composable, so
// we never miss a scroll trigger regardless of whether the text content
// actually changed.
watch(
  () => props.scrollVersion,
  async () => {
    await nextTick()
    props.scrollToLatestIfNeeded(timelineListRef.value, props.items.length > 1 ? 'smooth' : 'auto')
  }
)

onMounted(async () => {
  await nextTick()
  props.scrollToLatestIfNeeded(timelineListRef.value, 'auto')
})
</script>

<style scoped lang="scss">
.consult-subtitle-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.96);
  border-right: 1px solid rgba(222, 231, 243, 0.96);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid #dce7f8;
}

.title-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.icon-box {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-top: 2px;
  background: linear-gradient(180deg, #4f86ef 0%, #2f68dd 100%);
  color: #ffffff;
}

.eyebrow {
  margin: 0 0 6px;
  color: #355aa2;
  font-size: 13px;
  font-weight: 700;
}

.title {
  margin: 0;
  color: #16294c;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
}

.status-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.status-tag {
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
}

.is-ready {
  background: #e9faef;
  color: #20a05f;
}

.is-loading {
  background: #edf4ff;
  color: #2565d0;
}

.is-error {
  background: #fff1f1;
  color: #bf4141;
}

.language-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  border: 1px solid rgba(141, 168, 214, 0.58);
  border-radius: 999px;
  padding: 6px 8px 6px 12px;
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.98) 0%, rgba(239, 245, 255, 0.98) 100%);
  color: #20406f;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.language-toggle:hover {
  border-color: rgba(74, 123, 232, 0.62);
  box-shadow: 0 10px 20px rgba(77, 115, 192, 0.12);
}

.language-toggle:focus-visible {
  outline: none;
  border-color: #4a7be8;
  box-shadow: 0 0 0 4px rgba(74, 123, 232, 0.14);
}

.language-toggle.is-active {
  border-color: rgba(56, 120, 230, 0.72);
  background: linear-gradient(180deg, rgba(241, 247, 255, 0.98) 0%, rgba(228, 239, 255, 0.98) 100%);
}

.language-toggle-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  text-align: left;
}

.language-toggle-label {
  color: #5f769d;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
}

.language-toggle-value {
  color: #214171;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.language-toggle-track {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, #c8d6f2 0%, #b3c6e9 100%);
  box-shadow: inset 0 1px 2px rgba(74, 103, 156, 0.16);
  transition: background 0.2s ease;
}

.language-toggle.is-active .language-toggle-track {
  background: linear-gradient(180deg, #4a86ef 0%, #2f68dd 100%);
}

.language-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 3px 8px rgba(51, 75, 123, 0.22);
  transition: transform 0.2s ease;
}

.language-toggle.is-active .language-toggle-thumb {
  transform: translateX(18px);
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(47, 104, 221, 0.12);
  color: #2f68dd;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.panel-notice {
  margin: 14px 18px 0;
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 242, 242, 0.9);
  color: #b94d4d;
  font-size: 13px;
}

.timeline-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 12px 18px 18px;
  scrollbar-gutter: stable;
}

.timeline-list::-webkit-scrollbar {
  width: 7px;
}

.timeline-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(125, 151, 195, 0.5);
}

.timeline-row {
  display: flex;
  margin-bottom: 18px;
}

.is-remote {
  justify-content: flex-start;
}

.is-self {
  justify-content: flex-end;
}

.message-card {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  max-width: 88%;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  padding: 0 6px;
  color: #6f82a1;
  font-size: 12px;
}

.is-self .message-meta {
  justify-content: flex-end;
}

.speaker-name {
  color: #29426f;
  font-weight: 700;
}

.message-bubble {
  position: relative;
  border-radius: 22px;
  padding: 16px 18px 14px;
  box-shadow: 0 12px 28px rgba(80, 104, 150, 0.08);
}

.message-bubble--translated-only {
  padding: 14px 18px 12px;
}

.bubble-remote {
  border-top-left-radius: 10px;
  background: linear-gradient(180deg, #f8f1ff 0%, #f3ebff 100%);
}

.bubble-self {
  border-top-right-radius: 10px;
  background: linear-gradient(180deg, #eef6ff 0%, #dcecff 100%);
}

.message-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-section--translated-only {
  gap: 5px;
}

.message-divider {
  margin: 12px 0;
  border-top: 1px dashed rgba(180, 138, 218, 0.35);
}

.section-title {
  margin: 0;
  color: #8d49ce;
  font-size: 14px;
  font-weight: 700;
}

.section-title--translated {
  color: #4c79c7;
}

.message-text {
  margin: 0;
  color: #26395f;
  font-size: 15px;
  line-height: 1.7;
  word-break: break-word;
}

.translated-text {
  color: #414a72;
}

.message-text--pending {
  color: #7b8cad;
}

.draft-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.62);
  color: #6b80a8;
  font-size: 11px;
  font-weight: 700;
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 18px;
  border: 1px dashed rgba(74, 123, 209, 0.35);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(242, 247, 255, 0.84), rgba(252, 254, 255, 0.98));
  color: #647b9f;
  font-size: 14px;
  text-align: center;
}

.empty-state p {
  margin: 0;
}

.composer-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #dce7f8;
  padding: 16px 18px 18px;
  background: linear-gradient(180deg, rgba(251, 253, 255, 0.98) 0%, rgba(244, 248, 255, 0.98) 100%);
}

.composer-input {
  width: 100%;
  min-height: 88px;
  resize: none;
  border: 1px solid rgba(149, 177, 224, 0.7);
  border-radius: 16px;
  padding: 14px 16px;
  box-sizing: border-box;
  background: #ffffff;
  color: #22365d;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.composer-input:focus {
  border-color: #4a7be8;
  box-shadow: 0 0 0 4px rgba(74, 123, 232, 0.12);
}

.composer-input:disabled {
  cursor: not-allowed;
  background: rgba(241, 245, 252, 0.96);
  color: #8a9bb9;
}

.composer-input::placeholder {
  color: #8ca0c2;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.composer-status {
  margin: 0;
  color: #6981a8;
  font-size: 12px;
  line-height: 1.5;
}

.send-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  align-self: flex-end;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: linear-gradient(180deg, #2f6aec 0%, #2257c7 100%);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(47, 106, 236, 0.22);
}

.send-button:disabled {
  cursor: not-allowed;
  background: linear-gradient(180deg, #b8c8e7 0%, #a4b7db 100%);
  box-shadow: none;
}

@media (max-width: 1180px) {
  .consult-subtitle-panel {
    border-right: none;
    border-bottom: 1px solid rgba(222, 231, 243, 0.96);
  }

  .panel-header {
    align-items: stretch;
  }

  .status-group {
    justify-content: flex-start;
  }
}
</style>
