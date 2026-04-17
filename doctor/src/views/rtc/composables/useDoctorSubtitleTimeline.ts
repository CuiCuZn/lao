import type { ASRMessage } from 'dingrtc-asr'
import { ref } from 'vue'
import type {
  ManualTimelineMessageParams,
  SubtitleTimelineItem,
  SubtitleTimelineMessageContext,
  SubtitleTimelineOptions,
  SubtitleTimelineStreamBinding
} from '../types'

type SubtitleFieldProgress = {
  text: string
  timestamp: number
  endTime: number
  isFinal: boolean
}

type SubtitleTimelineFieldProgress = {
  source: SubtitleFieldProgress
  translated: SubtitleFieldProgress
}

export const useDoctorSubtitleTimeline = (options: SubtitleTimelineOptions) => {
  const items = ref<SubtitleTimelineItem[]>([])
  const isPinnedToBottom = ref(true)
  const shouldAutoFollowLatest = ref(true)
  const scrollVersion = ref(0)
  const beginTimeRecordMap = new Map<string, SubtitleTimelineItem>()
  const activeSourceSentenceMap = new Map<string, SubtitleTimelineItem>()
  const speakerSequenceMap = new Map<string, number>()
  const fieldProgressMap = new WeakMap<SubtitleTimelineItem, SubtitleTimelineFieldProgress>()
  const notifiedFinalizedItems = new WeakSet<SubtitleTimelineItem>()
  const unbinders: Array<() => void> = []
  let nextSequence = 0
  let programmaticScrollInProgress = false
  let programmaticScrollTimer: ReturnType<typeof setTimeout> | null = null
  let scrollStateDebounceTimer: ReturnType<typeof setTimeout> | null = null

  const isNearBottom = (scrollContainer: HTMLElement) => {
    const threshold = 80
    return scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <= threshold
  }

  const resolveSpeakerName = (speakerId: string) => {
    if (speakerId === options.getCurrentUserId()) {
      return options.getCurrentUserName() || speakerId
    }

    const matchedUser = options.getRemoteUsers().find((user) => user.userId === speakerId)
    return matchedUser?.userName || speakerId
  }

  const normalizePositiveNumber = (value: unknown) => {
    const normalizedValue = Number(value || 0)

    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
      return 0
    }

    return normalizedValue
  }

  const normalizeTimestamp = (message: ASRMessage) => normalizePositiveNumber(message.timestamp)
  const normalizeBeginTime = (message: ASRMessage) => normalizePositiveNumber(message.beginTime)
  const normalizeEndTime = (message: ASRMessage) => normalizePositiveNumber(message.endTime)

  const logIncomingSubtitleMessage = (
    message: ASRMessage,
    sourceLanguage: string,
    targetLanguage: string
  ) => {
    console.log('[doctor-subtitle-message]', {
      speakerId: message.uid,
      speakerName: resolveSpeakerName(message.uid),
      sourceLanguage,
      targetLanguage,
      translated: Boolean(message.translated),
      sentenceEnd: Boolean(message.sentenceEnd),
      sentenceIndex: normalizeSentenceIndex(message),
      beginTime: normalizeBeginTime(message),
      endTime: normalizeEndTime(message),
      timestamp: normalizeTimestamp(message),
      text: message.sentence?.trim() || '',
      rawMessage: message
    })
  }

  const normalizeSentenceIndex = (message: ASRMessage) => {
    const normalizedValue = Number(message.sentenceIndex)

    if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
      return -1
    }

    return normalizedValue
  }

  const buildBeginTimeKey = (speakerId: string, beginTime: number) => {
    return `utterance_${speakerId}_begin_${beginTime}`
  }

  const buildSourceSentenceKey = (speakerId: string, sentenceIndex: number) => {
    return `utterance_${speakerId}_source_sentence_${sentenceIndex}`
  }

  const buildUtteranceId = (
    message: ASRMessage,
    speakerSequence: number,
    sequence: number,
    sentenceIndex: number,
    beginTime: number
  ) => {
    if (beginTime > 0) {
      return `utterance_${message.uid}_begin_${beginTime}_${speakerSequence}_${sequence}`
    }

    if (sentenceIndex >= 0) {
      return `utterance_${message.uid}_sentence_${sentenceIndex}_${speakerSequence}_${sequence}`
    }

    return `utterance_${message.uid}_timestamp_${normalizeTimestamp(message)}_${speakerSequence}_${sequence}`
  }

  const createEmptyFieldProgress = (): SubtitleFieldProgress => ({
    text: '',
    timestamp: 0,
    endTime: 0,
    isFinal: false
  })

  const ensureFieldProgress = (item: SubtitleTimelineItem) => {
    const existed = fieldProgressMap.get(item)

    if (existed) {
      return existed
    }

    const created: SubtitleTimelineFieldProgress = {
      source: createEmptyFieldProgress(),
      translated: createEmptyFieldProgress()
    }

    fieldProgressMap.set(item, created)
    return created
  }

  const getNextSpeakerSequence = (speakerId: string) => {
    const nextSpeakerSequence = (speakerSequenceMap.get(speakerId) || 0) + 1
    speakerSequenceMap.set(speakerId, nextSpeakerSequence)
    return nextSpeakerSequence
  }

  const deleteMapKeyIfMatched = <T>(map: Map<string, T>, key: string, value: T) => {
    if (map.get(key) === value) {
      map.delete(key)
    }
  }

  const syncBeginTimeAlias = (item: SubtitleTimelineItem) => {
    if (item.beginTime <= 0) {
      return
    }

    beginTimeRecordMap.set(buildBeginTimeKey(item.speakerId, item.beginTime), item)
  }

  const syncSourceSentenceAlias = (item: SubtitleTimelineItem) => {
    if (item.sentenceIndex < 0) {
      return
    }

    const sentenceKey = buildSourceSentenceKey(item.speakerId, item.sentenceIndex)

    if (item.sourceFinal) {
      deleteMapKeyIfMatched(activeSourceSentenceMap, sentenceKey, item)
      return
    }

    activeSourceSentenceMap.set(sentenceKey, item)
  }

  const syncTimelineItemAliases = (item: SubtitleTimelineItem) => {
    syncBeginTimeAlias(item)
    syncSourceSentenceAlias(item)
  }

  const syncFinalState = (item: SubtitleTimelineItem) => {
    const progress = ensureFieldProgress(item)
    item.sourceFinal = progress.source.isFinal
    item.translatedFinal = progress.translated.isFinal
    item.isFinal = item.sourceFinal && item.translatedFinal
    syncSourceSentenceAlias(item)

    if (
      !options.onFinalizedItem ||
      notifiedFinalizedItems.has(item) ||
      !item.sourceFinal ||
      !item.translatedFinal ||
      !item.sourceText.trim() ||
      !item.translatedText.trim()
    ) {
      return
    }

    notifiedFinalizedItems.add(item)
    void options.onFinalizedItem(item)
  }

  const findRecordByBeginTime = (message: ASRMessage) => {
    const beginTime = normalizeBeginTime(message)

    if (beginTime <= 0) {
      return undefined
    }

    const matched = beginTimeRecordMap.get(buildBeginTimeKey(message.uid, beginTime))

    if (!matched) {
      return undefined
    }

    if (message.translated) {
      return matched.translatedFinal ? undefined : matched
    }

    return matched.sourceFinal ? undefined : matched
  }

  const findSourceRecordBySentenceIndex = (message: ASRMessage) => {
    const sentenceIndex = normalizeSentenceIndex(message)

    if (sentenceIndex < 0) {
      return undefined
    }

    return activeSourceSentenceMap.get(buildSourceSentenceKey(message.uid, sentenceIndex))
  }

  const findLatestRecordBySentenceIndex = (speakerId: string, sentenceIndex: number) => {
    for (let index = items.value.length - 1; index >= 0; index -= 1) {
      const item = items.value[index]

      if (item.speakerId === speakerId && item.sentenceIndex === sentenceIndex) {
        return item
      }
    }

    return undefined
  }

  const findAnyRecordBySentenceIndex = (message: ASRMessage) => {
    const sentenceIndex = normalizeSentenceIndex(message)

    if (sentenceIndex < 0) {
      return undefined
    }

    const matched = findLatestRecordBySentenceIndex(message.uid, sentenceIndex)

    if (!matched) {
      return undefined
    }

    if (message.translated) {
      return matched.translatedFinal ? undefined : matched
    }

    return matched.sourceFinal ? undefined : matched
  }

  const findAnyRecordByBeginTime = (message: ASRMessage) => {
    const beginTime = normalizeBeginTime(message)

    if (beginTime <= 0) {
      return undefined
    }

    return beginTimeRecordMap.get(buildBeginTimeKey(message.uid, beginTime))
  }

  const findRecentTranslatableRecord = (message: ASRMessage) => {
    const incomingTime = normalizeBeginTime(message) || normalizeTimestamp(message)
    let matchedItem: SubtitleTimelineItem | undefined
    let bestScore = Number.POSITIVE_INFINITY

    for (let index = items.value.length - 1; index >= 0; index -= 1) {
      const item = items.value[index]

      if (item.speakerId !== message.uid || item.translatedFinal) {
        continue
      }

      const itemTime = item.endTime || item.beginTime || item.timestamp || item.anchorTimestamp
      const delta = incomingTime > 0 && itemTime > 0 ? Math.abs(itemTime - incomingTime) : 999999
      const withinWindow = incomingTime > 0 ? delta <= 8000 : !item.translatedText

      if (!withinWindow) {
        continue
      }

      const score = delta + (item.translatedText ? 100000 : 0)

      if (score < bestScore) {
        bestScore = score
        matchedItem = item
      }
    }

    return matchedItem
  }

  const resolveTimelineItem = (message: ASRMessage) => {
    if (!message.translated) {
      return (
        findRecordByBeginTime(message) ||
        findSourceRecordBySentenceIndex(message) ||
        findAnyRecordBySentenceIndex(message)
      )
    }

    return (
      findRecordByBeginTime(message) ||
      findAnyRecordBySentenceIndex(message) ||
      findRecentTranslatableRecord(message)
    )
  }

  const shouldReplaceFieldText = (previous: SubtitleFieldProgress, message: ASRMessage) => {
    const incomingText = message.sentence?.trim() || ''

    if (!incomingText) {
      return false
    }

    if (!previous.text) {
      return true
    }

    if (incomingText === previous.text) {
      return false
    }

    const incomingIsLonger = incomingText.length > previous.text.length
    const incomingContainsPrevious = incomingText.includes(previous.text)
    const previousContainsIncoming = previous.text.includes(incomingText)
    const incomingTimestamp = normalizeTimestamp(message)
    const incomingEndTime = normalizeEndTime(message)

    if (message.sentenceEnd && !previous.isFinal) {
      return true
    }

    if (incomingIsLonger && incomingContainsPrevious) {
      return true
    }

    if (previousContainsIncoming && !message.sentenceEnd) {
      return false
    }

    if (message.sentenceEnd) {
      return incomingTimestamp >= previous.timestamp || incomingEndTime >= previous.endTime || incomingIsLonger
    }

    return incomingIsLonger && (incomingTimestamp >= previous.timestamp || incomingEndTime >= previous.endTime)
  }

  const applyMessageToField = (item: SubtitleTimelineItem, message: ASRMessage) => {
    const progress = ensureFieldProgress(item)
    const targetField = message.translated ? progress.translated : progress.source
    const normalizedText = message.sentence?.trim() || ''

    if (shouldReplaceFieldText(targetField, message)) {
      targetField.text = normalizedText
      targetField.timestamp = Math.max(targetField.timestamp, normalizeTimestamp(message))
      targetField.endTime = Math.max(targetField.endTime, normalizeEndTime(message))
      targetField.isFinal = targetField.isFinal || message.sentenceEnd

      if (message.translated) {
        item.translatedText = normalizedText
      } else {
        item.sourceText = normalizedText
      }
    } else if (message.sentenceEnd) {
      targetField.timestamp = Math.max(targetField.timestamp, normalizeTimestamp(message))
      targetField.endTime = Math.max(targetField.endTime, normalizeEndTime(message))
      targetField.isFinal = true
    }

    syncFinalState(item)
  }

  const sortTimelineItems = () => {
    if (items.value.length <= 1) {
      return
    }

    items.value = [...items.value].sort((left, right) => {
      const anchorDelta = left.anchorTimestamp - right.anchorTimestamp

      if (anchorDelta !== 0) {
        return anchorDelta
      }

      return left.sequence - right.sequence
    })
  }

  const createTimelineItem = ({
    message,
    sourceLanguage,
    targetLanguage
  }: SubtitleTimelineMessageContext): SubtitleTimelineItem => {
    const sequence = nextSequence++
    const speakerSequence = getNextSpeakerSequence(message.uid)
    const beginTime = normalizeBeginTime(message)
    const sentenceIndex = message.translated ? -1 : normalizeSentenceIndex(message)
    const timestamp = normalizeTimestamp(message) || beginTime || Date.now()

    const created: SubtitleTimelineItem = {
      id: buildUtteranceId(message, speakerSequence, sequence, sentenceIndex, beginTime),
      speakerId: message.uid,
      speakerName: resolveSpeakerName(message.uid),
      side: message.uid === options.getCurrentUserId() ? 'self' : 'remote',
      messageType: 'subtitle',
      sourceText: '',
      translatedText: '',
      sourceLanguage,
      targetLanguage,
      timestamp,
      anchorTimestamp: timestamp,
      beginTime,
      endTime: normalizeEndTime(message),
      sentenceIndex,
      sequence,
      speakerSequence,
      sourceFinal: false,
      translatedFinal: false,
      isFinal: false
    }

    ensureFieldProgress(created)
    syncTimelineItemAliases(created)
    items.value = [...items.value, created]
    sortTimelineItems()
    scrollVersion.value++
    return created
  }

  const appendManualMessage = ({
    speakerId,
    speakerName,
    side,
    messageType = 'manual',
    sourceText,
    translatedText,
    sourceLanguage = 'cn',
    targetLanguage = 'lo',
    timestamp
  }: ManualTimelineMessageParams) => {
    const normalizedSourceText = sourceText.trim()
    const normalizedTranslatedText = translatedText.trim()

    if (!normalizedSourceText || !normalizedTranslatedText) {
      return undefined
    }

    const sequence = nextSequence++
    const speakerSequence = getNextSpeakerSequence(speakerId)
    const anchorTimestamp = normalizePositiveNumber(timestamp) || Date.now()

    const created: SubtitleTimelineItem = {
      id: `${messageType}_${speakerId}_${anchorTimestamp}_${sequence}`,
      speakerId,
      speakerName: speakerName.trim() || resolveSpeakerName(speakerId),
      side,
      messageType,
      sourceText: normalizedSourceText,
      translatedText: normalizedTranslatedText,
      sourceLanguage,
      targetLanguage,
      timestamp: anchorTimestamp,
      anchorTimestamp,
      beginTime: anchorTimestamp,
      endTime: anchorTimestamp,
      sentenceIndex: -1,
      sequence,
      speakerSequence,
      sourceFinal: true,
      translatedFinal: true,
      isFinal: true
    }

    const progress = ensureFieldProgress(created)
    progress.source = {
      text: normalizedSourceText,
      timestamp: anchorTimestamp,
      endTime: anchorTimestamp,
      isFinal: true
    }
    progress.translated = {
      text: normalizedTranslatedText,
      timestamp: anchorTimestamp,
      endTime: anchorTimestamp,
      isFinal: true
    }

    items.value = [...items.value, created]
    sortTimelineItems()
    scrollVersion.value++
    return created
  }

  const appendHistoryMessage = (payload: ManualTimelineMessageParams) => {
    return appendManualMessage(payload)
  }

  const ensureTimelineItem = ({
    message,
    sourceLanguage,
    targetLanguage
  }: SubtitleTimelineMessageContext) => {
    const existed = resolveTimelineItem(message)

    if (existed) {
      if (existed.beginTime <= 0) {
        existed.beginTime = normalizeBeginTime(message)
      }

      if (!message.translated && existed.sentenceIndex < 0) {
        existed.sentenceIndex = normalizeSentenceIndex(message)
      }

      syncTimelineItemAliases(existed)
      return existed
    }

    if (message.translated && normalizeBeginTime(message) <= 0) {
      return undefined
    }

    return createTimelineItem({
      message,
      sourceLanguage,
      targetLanguage
    })
  }

  const upsertDraftMessage = ({
    message,
    sourceLanguage,
    targetLanguage
  }: SubtitleTimelineMessageContext) => {
    const item = ensureTimelineItem({
      message,
      sourceLanguage,
      targetLanguage
    })

    if (!item) {
      return
    }

    item.speakerName = resolveSpeakerName(message.uid)
    item.timestamp = Math.max(item.timestamp || 0, normalizeTimestamp(message))
    item.sourceLanguage = sourceLanguage
    item.targetLanguage = targetLanguage

    if (item.beginTime <= 0) {
      item.beginTime = normalizeBeginTime(message)
    }

    item.endTime = Math.max(item.endTime || 0, normalizeEndTime(message))

    if (!message.translated && item.sentenceIndex < 0) {
      item.sentenceIndex = normalizeSentenceIndex(message)
    }

    applyMessageToField(item, message)
    syncTimelineItemAliases(item)
    sortTimelineItems()
    scrollVersion.value++
  }

  const finalizeSentence = (message: ASRMessage) => {
    const beginTime = normalizeBeginTime(message)
    const sentenceIndex = normalizeSentenceIndex(message)
    const item =
      findAnyRecordByBeginTime(message) ||
      (!message.translated && sentenceIndex >= 0
        ? findLatestRecordBySentenceIndex(message.uid, sentenceIndex)
        : findRecentTranslatableRecord(message))

    if (!item) {
      return
    }

    item.endTime = Math.max(item.endTime || 0, normalizeEndTime(message))

    if (!item.beginTime && beginTime > 0) {
      item.beginTime = beginTime
    }

    applyMessageToField(item, {
      ...message,
      sentence: message.sentence || (message.translated ? item.translatedText : item.sourceText),
      sentenceEnd: true
    })
    syncTimelineItemAliases(item)
    sortTimelineItems()
    scrollVersion.value++
  }

  const unbindAll = () => {
    while (unbinders.length) {
      const unbind = unbinders.pop()
      unbind?.()
    }
  }

  const bindAsrStreams = (bindings: SubtitleTimelineStreamBinding[]) => {
    unbindAll()

    bindings.forEach((binding) => {
      if (!binding.asr) {
        return
      }

      const handler = (message: ASRMessage) => {
        // 这里只注释不删除
        // logIncomingSubtitleMessage(message, binding.sourceLanguage, binding.targetLanguage)
        upsertDraftMessage({
          message,
          sourceLanguage: binding.sourceLanguage,
          targetLanguage: binding.targetLanguage
        })
      }

      binding.asr.on('message', handler)
      unbinders.push(() => {
        binding.asr?.off('message', handler)
      })
    })
  }

  const clearTimeline = () => {
    unbindAll()
    beginTimeRecordMap.clear()
    activeSourceSentenceMap.clear()
    speakerSequenceMap.clear()
    items.value = []
    isPinnedToBottom.value = true
    shouldAutoFollowLatest.value = true
    scrollVersion.value = 0
    nextSequence = 0
    programmaticScrollInProgress = false
    if (programmaticScrollTimer) {
      clearTimeout(programmaticScrollTimer)
      programmaticScrollTimer = null
    }
    if (scrollStateDebounceTimer) {
      clearTimeout(scrollStateDebounceTimer)
      scrollStateDebounceTimer = null
    }
  }

  const updateScrollState = (scrollContainer: HTMLElement | null) => {
    if (!scrollContainer) {
      return
    }

    // Ignore scroll events generated by our own programmatic scrollTo.
    // During a smooth-scroll animation the intermediate positions are
    // nowhere near the bottom, which used to flip shouldAutoFollowLatest
    // to false and permanently break auto-scroll.
    if (programmaticScrollInProgress) {
      return
    }

    // Debounce: only evaluate the final resting position after the user
    // stops scrolling (or after a native smooth-scroll finishes).
    if (scrollStateDebounceTimer) {
      clearTimeout(scrollStateDebounceTimer)
    }

    scrollStateDebounceTimer = setTimeout(() => {
      scrollStateDebounceTimer = null
      if (!scrollContainer) {
        return
      }
      const pinned = isNearBottom(scrollContainer)
      isPinnedToBottom.value = pinned
      shouldAutoFollowLatest.value = pinned
    }, 120)
  }

  const markProgrammaticScroll = (scrollContainer: HTMLElement | null) => {
    programmaticScrollInProgress = true

    if (programmaticScrollTimer) {
      clearTimeout(programmaticScrollTimer)
    }

    // Estimate the smooth-scroll duration. Most browsers finish in
    // ~300-500ms. We use a generous timeout so that scroll events
    // fired during the animation are ignored.
    const distance = scrollContainer
      ? scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight
      : 0
    const timeout = Math.min(Math.max(distance * 1.2, 300), 800)

    programmaticScrollTimer = setTimeout(() => {
      programmaticScrollInProgress = false
      programmaticScrollTimer = null

      // After the scroll finishes, verify we actually ended up near
      // the bottom (which should always be the case for programmatic).
      if (scrollContainer && isNearBottom(scrollContainer)) {
        isPinnedToBottom.value = true
        shouldAutoFollowLatest.value = true
      }
    }, timeout)
  }

  const scrollToLatest = (scrollContainer: HTMLElement | null, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollContainer) {
      return
    }

    markProgrammaticScroll(scrollContainer)

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior
    })
    isPinnedToBottom.value = true
    shouldAutoFollowLatest.value = true
  }

  const scrollToLatestIfNeeded = (
    scrollContainer: HTMLElement | null,
    behavior: ScrollBehavior = 'smooth'
  ) => {
    if (!shouldAutoFollowLatest.value) {
      return
    }

    scrollToLatest(scrollContainer, behavior)
  }

  return {
    items,
    isPinnedToBottom,
    shouldAutoFollowLatest,
    scrollVersion,
    appendHistoryMessage,
    appendManualMessage,
    bindAsrStreams,
    upsertDraftMessage,
    finalizeSentence,
    clearTimeline,
    updateScrollState,
    scrollToLatest,
    scrollToLatestIfNeeded,
    resolveSpeakerName
  }
}
