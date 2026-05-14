import type { Router } from 'vue-router'
import { getToken } from '@/utils/auth'
import { connectSse, type SseMessage } from '@/utils/sse'

export interface ConsultationSseContext {
  patientId: string
  caseId: string
  doctorName?: string
}

export interface ConsultationRejectedEvent {
  patientId: string
  caseId: string
  doctorName: string
  payload: Record<string, unknown>
}

export interface ConsultationCompletedEvent {
  patientId: string
  caseId: string
  payload: Record<string, unknown>
}

let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let sseConnection: ReturnType<typeof connectSse> | undefined
let openPromise: Promise<void> | undefined
let rejectOpenPromise: ((error: Error) => void) | undefined
let manualClose = false
let activeStreamId = 0
let reconnectAttempts = 0
let sseOpened = false
let activeConsultationContext: ConsultationSseContext | null = null
let activeRouter: Router | null = null
let lastRejectedEvent: ConsultationRejectedEvent | null = null
let lastCompletedEvent: ConsultationCompletedEvent | null = null
const rejectedListeners = new Set<(event: ConsultationRejectedEvent) => void>()
const completedListeners = new Set<(event: ConsultationCompletedEvent) => void>()
const SSE_OPEN_TIMEOUT = 10_000

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const parseSsePayload = (raw: string): unknown => {
  try {
    const normalizedRaw = raw.replace(
      /("(doctorAideId|doctorAidId|patientId|caseId|videoId)"\s*:\s*)(-?\d{16,})/g,
      '$1"$3"'
    )
    return JSON.parse(normalizedRaw)
  } catch {
    return raw
  }
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isConsultationFinishedPayload = (payload: unknown, expectedCaseId: string): payload is Record<string, unknown> => {
  if (!isObjectRecord(payload)) {
    return false
  }

  const payloadCaseId = normalizeText(payload.caseId)
  const status = Number(payload.status)
  return Boolean(expectedCaseId) && payloadCaseId === expectedCaseId && status === 0
}

const isConsultationRejectedPayload = (payload: unknown, expectedCaseId: string): payload is Record<string, unknown> => {
  if (!isObjectRecord(payload)) {
    return false
  }

  const payloadCaseId = normalizeText(payload.caseId)
  const status = Number(payload.status)
  return Boolean(expectedCaseId) && status === -1 && (!payloadCaseId || payloadCaseId === expectedCaseId)
}

const resolveRejectedDoctorName = (payload: Record<string, unknown>, context: ConsultationSseContext) => {
  return (
    normalizeText(payload.doctorName) ||
    normalizeText(payload.nickName) ||
    normalizeText(payload.userName) ||
    normalizeText(payload.name) ||
    normalizeText(context.doctorName)
  )
}

const handleConsultationCompleted = (payload: Record<string, unknown>, context: ConsultationSseContext) => {
  if (!activeConsultationContext || activeConsultationContext.caseId !== context.caseId) {
    return
  }

  const event: ConsultationCompletedEvent = {
    patientId: context.patientId,
    caseId: context.caseId,
    payload
  }

  lastCompletedEvent = event
  completedListeners.forEach((listener) => listener(event))
}

const handleConsultationRejected = (payload: Record<string, unknown>, context: ConsultationSseContext) => {
  if (!activeConsultationContext || activeConsultationContext.caseId !== context.caseId) {
    return
  }

  const event: ConsultationRejectedEvent = {
    patientId: context.patientId,
    caseId: context.caseId,
    doctorName: resolveRejectedDoctorName(payload, context),
    payload
  }

  lastRejectedEvent = event
  rejectedListeners.forEach((listener) => listener(event))
}

const handleSseMessage = (message: SseMessage) => {
  if (!activeConsultationContext) {
    return
  }

  const payload = parseSsePayload(message.data)
  if (isConsultationRejectedPayload(payload, activeConsultationContext.caseId)) {
    handleConsultationRejected(payload, activeConsultationContext)
    return
  }

  if (isConsultationFinishedPayload(payload, activeConsultationContext.caseId)) {
    handleConsultationCompleted(payload, activeConsultationContext)
  }
}

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
  }
}

const scheduleReconnect = () => {
  if (manualClose || !activeRouter || !getToken()) {
    return
  }

  clearReconnectTimer()
  reconnectAttempts += 1
  reconnectTimer = setTimeout(() => {
    if (!manualClose && activeRouter && getToken()) {
      void startAssistantConsultationSse(activeRouter).catch(() => undefined)
    }
  }, Math.min(3000 + reconnectAttempts * 1000, 10000))
}

export function setAssistantConsultationSseContext(context: ConsultationSseContext, router: Router) {
  activeConsultationContext = context
  activeRouter = router
  lastRejectedEvent = null
  lastCompletedEvent = null
}

export function clearAssistantConsultationSseContext() {
  activeConsultationContext = null
  lastRejectedEvent = null
  lastCompletedEvent = null
}

export function stopAssistantConsultationSse() {
  manualClose = true
  activeStreamId += 1
  sseOpened = false
  openPromise = undefined
  rejectOpenPromise?.(new Error('sseStopped'))
  rejectOpenPromise = undefined
  clearAssistantConsultationSseContext()
  activeRouter = null
  clearReconnectTimer()
  sseConnection?.close()
  sseConnection = undefined
}

export function startAssistantConsultationSse(router: Router) {
  activeRouter = router

  if (sseOpened) {
    return Promise.resolve()
  }

  if (openPromise) {
    return openPromise
  }

  const token = getToken()
  if (!token) {
    return Promise.reject(new Error('missingToken'))
  }

  manualClose = false
  clearReconnectTimer()
  activeStreamId += 1
  const streamId = activeStreamId

  const langMap: Record<string, string> = {
    'zh-cn': 'zh_CN',
    lo: 'lo_LA',
    en: 'en_US'
  }
  const baseUrl = (import.meta.env.VITE_API_URL || '/lao-api').replace(/\/$/, '')
  const streamUrl = `${baseUrl}/resource/sse`

  openPromise = new Promise<void>((resolve, reject) => {
    rejectOpenPromise = reject
    let openSettled = false
    const settleOpen = () => {
      if (openSettled) {
        return
      }

      openSettled = true
      sseOpened = true
      openPromise = undefined
      rejectOpenPromise = undefined
      window.clearTimeout(openTimer)
      resolve()
    }
    const failOpen = (error: Error, closeConnection = false) => {
      if (openSettled) {
        return
      }

      openSettled = true
      sseOpened = false
      openPromise = undefined
      rejectOpenPromise = undefined
      window.clearTimeout(openTimer)
      reject(error)

      if (closeConnection) {
        sseConnection?.close()
      }
    }
    const openTimer = window.setTimeout(() => {
      if (streamId === activeStreamId && !openSettled) {
        failOpen(new Error('sseOpenTimeout'), true)
      }
    }, SSE_OPEN_TIMEOUT)

    sseConnection = connectSse(streamUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        clientid: import.meta.env.VITE_APP_CLIENT_ID || '',
        'content-language': langMap[localStorage.getItem('lang') || 'lo'] || 'lo_LA'
      },
      onOpen: () => {
        if (streamId !== activeStreamId) return
        reconnectAttempts = 0
        settleOpen()
      },
      onMessage: (message) => {
        if (streamId !== activeStreamId) return
        handleSseMessage(message)
      },
      onError: (error) => {
        if (streamId !== activeStreamId) return
        if (!openSettled) {
          failOpen(error)
        }
      },
      onClose: () => {
        if (streamId !== activeStreamId) return
        sseConnection = undefined
        sseOpened = false
        openPromise = undefined
        rejectOpenPromise = undefined

        if (!manualClose) {
          scheduleReconnect()
        }
      }
    })
  })

  return openPromise
}

export function listenAssistantConsultationRejected(handler: (event: ConsultationRejectedEvent) => void) {
  rejectedListeners.add(handler)

  if (lastRejectedEvent) {
    window.setTimeout(() => {
      if (rejectedListeners.has(handler) && lastRejectedEvent) {
        handler(lastRejectedEvent)
      }
    }, 0)
  }

  return () => {
    rejectedListeners.delete(handler)
  }
}

export function listenAssistantConsultationCompleted(handler: (event: ConsultationCompletedEvent) => void) {
  completedListeners.add(handler)

  if (lastCompletedEvent) {
    window.setTimeout(() => {
      if (completedListeners.has(handler) && lastCompletedEvent) {
        handler(lastCompletedEvent)
      }
    }, 0)
  }

  return () => {
    completedListeners.delete(handler)
  }
}
