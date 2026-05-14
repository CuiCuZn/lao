import type { ConsultationMessageType } from '../types'

export interface ConsultationHistoryItem {
  messageType: ConsultationMessageType
  isDoctor: 0 | 1 | 2
  contentCn: string
  contentLo: string
  timestamp: number
  sequence: number
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const takeOptionalTimestamp = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const normalizedValue = String(value).trim()
  if (!normalizedValue) {
    return 0
  }

  const numericValue = Number(normalizedValue)
  if (Number.isFinite(numericValue)) {
    return numericValue
  }

  const parsedTimestamp = Date.parse(normalizedValue)
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0
}

const resolveHistoryMessageType = (
  record: Record<string, unknown>,
  fallbackType?: ConsultationMessageType
): ConsultationMessageType => {
  const explicitType = takeOptionalText(record.messageType || record.type || record.recordType).toLowerCase()

  if (explicitType.includes('manual') || explicitType.includes('chat') || explicitType.includes('written')) {
    return 'manual'
  }

  if (explicitType.includes('subtitle') || explicitType.includes('record')) {
    return 'subtitle'
  }

  if (record.contentCn !== undefined || record.contentLo !== undefined) {
    return 'manual'
  }

  if (record.recordCn !== undefined || record.recordLo !== undefined) {
    return 'subtitle'
  }

  return fallbackType || 'subtitle'
}

const resolveHistoryDoctorFlag = (record: Record<string, unknown>): 0 | 1 | 2 | null => {
  const directValue = record.isDoctor ?? record.is_doctor ?? record.fromDoctor ?? record.doctor

  if (typeof directValue === 'number') {
    return directValue === 0 || directValue === 1 || directValue === 2 ? directValue : null
  }

  if (typeof directValue === 'boolean') {
    return directValue ? 0 : 1
  }

  if (typeof directValue === 'string') {
    const normalizedValue = directValue.trim().toLowerCase()

    if (normalizedValue === '0' || normalizedValue === 'doctor' || normalizedValue === 'true') {
      return 0
    }

    if (normalizedValue === '1' || normalizedValue === 'patient' || normalizedValue === 'false') {
      return 1
    }

    if (normalizedValue === '2' || normalizedValue === 'aide' || normalizedValue === 'assistant') {
      return 2
    }
  }

  const roleValue = takeOptionalText(record.role || record.speakerRole || record.senderRole).toLowerCase()

  if (roleValue.includes('doctor')) {
    return 0
  }

  if (roleValue.includes('patient')) {
    return 1
  }

  if (roleValue.includes('aide') || roleValue.includes('assistant')) {
    return 2
  }

  return null
}

const resolveHistoryTexts = (record: Record<string, unknown>) => {
  let contentCn =
    takeOptionalText(record.contentCn) ||
    takeOptionalText(record.recordCn) ||
    takeOptionalText(record.cn)
  let contentLo =
    takeOptionalText(record.contentLo) ||
    takeOptionalText(record.recordLo) ||
    takeOptionalText(record.lo)

  if (contentCn && contentLo) {
    return {
      contentCn,
      contentLo
    }
  }

  const sourceText = takeOptionalText(record.sourceText)
  const translatedText = takeOptionalText(record.translatedText)
  const sourceLanguage = takeOptionalText(record.sourceLanguage).toLowerCase()
  const targetLanguage = takeOptionalText(record.targetLanguage).toLowerCase()

  if (sourceText && translatedText) {
    if (sourceLanguage === 'cn' || sourceLanguage === 'zh' || sourceLanguage === 'zh-cn') {
      contentCn = sourceText
      contentLo = translatedText
    } else if (sourceLanguage === 'lo' || sourceLanguage === 'lao') {
      contentCn = translatedText
      contentLo = sourceText
    } else if (targetLanguage === 'cn' || targetLanguage === 'zh' || targetLanguage === 'zh-cn') {
      contentCn = translatedText
      contentLo = sourceText
    } else if (targetLanguage === 'lo' || targetLanguage === 'lao') {
      contentCn = sourceText
      contentLo = translatedText
    }
  }

  return {
    contentCn,
    contentLo
  }
}

const normalizeHistoryItem = (
  rawItem: unknown,
  sequence: number,
  fallbackType?: ConsultationMessageType
): ConsultationHistoryItem | null => {
  if (!isObjectRecord(rawItem)) {
    return null
  }

  const { contentCn, contentLo } = resolveHistoryTexts(rawItem)
  const isDoctor = resolveHistoryDoctorFlag(rawItem)

  if (!contentCn || !contentLo || isDoctor === null) {
    return null
  }

  return {
    messageType: resolveHistoryMessageType(rawItem, fallbackType),
    isDoctor,
    contentCn,
    contentLo,
    timestamp:
      takeOptionalTimestamp(
        rawItem.timestamp ||
          rawItem.createTime ||
          rawItem.createdAt ||
          rawItem.updateTime ||
          rawItem.beginTime ||
          rawItem.anchorTimestamp
      ) || 0,
    sequence
  }
}

const collectHistoryItems = (
  payload: unknown,
  sequenceOffset = 0,
  fallbackType?: ConsultationMessageType
): ConsultationHistoryItem[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => normalizeHistoryItem(item, sequenceOffset + index, fallbackType))
      .filter((item): item is ConsultationHistoryItem => Boolean(item))
  }

  if (!isObjectRecord(payload)) {
    return []
  }

  const groups: Array<{ items: unknown[]; type?: ConsultationMessageType }> = []
  const subtitleKeys = [
    'subtitleList',
    'subtitles',
    'subtitleRecords',
    'videoRecordList',
    'videoRecords',
    'recordList',
    'records'
  ]
  const manualKeys = [
    'writtenList',
    'writtenRecords',
    'chatList',
    'chatRecords',
    'conversationList',
    'conversations',
    'messageList',
    'messages'
  ]

  subtitleKeys.forEach((key) => {
    if (Array.isArray(payload[key])) {
      groups.push({
        items: payload[key] as unknown[],
        type: 'subtitle'
      })
    }
  })

  manualKeys.forEach((key) => {
    if (Array.isArray(payload[key])) {
      groups.push({
        items: payload[key] as unknown[],
        type: 'manual'
      })
    }
  })

  if (groups.length > 0) {
    let nextSequence = sequenceOffset
    return groups.flatMap((group) => {
      const items = collectHistoryItems(group.items, nextSequence, group.type)
      nextSequence += group.items.length
      return items
    })
  }

  if (Array.isArray(payload.data)) {
    return collectHistoryItems(payload.data, sequenceOffset, fallbackType)
  }

  if (isObjectRecord(payload.data)) {
    return collectHistoryItems(payload.data, sequenceOffset, fallbackType)
  }

  const fallbackListKey = ['list', 'rows', 'items'].find((key) => Array.isArray(payload[key]))
  if (fallbackListKey) {
    return collectHistoryItems(payload[fallbackListKey], sequenceOffset, fallbackType)
  }

  const singleItem = normalizeHistoryItem(payload, sequenceOffset, fallbackType)
  return singleItem ? [singleItem] : []
}

export const normalizeConversationHistory = (payload: unknown) => {
  const normalizedItems = collectHistoryItems(payload)

  if (!normalizedItems.length) {
    return []
  }

  const fallbackBaseTimestamp = Date.now() - normalizedItems.length * 1000

  return normalizedItems
    .map((item, index) => ({
      ...item,
      timestamp: item.timestamp || fallbackBaseTimestamp + index
    }))
    .sort((left, right) => {
      const timestampDelta = left.timestamp - right.timestamp

      if (timestampDelta !== 0) {
        return timestampDelta
      }

      return left.sequence - right.sequence
    })
}
