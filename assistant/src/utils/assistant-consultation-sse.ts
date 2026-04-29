import type { Router } from 'vue-router'
import { getToken } from '@/utils/auth'
import { broadcastConsultationEnded } from '@/utils/patient-channel'
import { connectSse, type SseMessage } from '@/utils/sse'

interface ConsultationSseContext {
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

let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let sseConnection: ReturnType<typeof connectSse> | undefined
let manualClose = false
let activeStreamId = 0
let reconnectAttempts = 0
let activeConsultationContext: ConsultationSseContext | null = null
let activeRouter: Router | null = null
let lastRejectedEvent: ConsultationRejectedEvent | null = null
const rejectedListeners = new Set<(event: ConsultationRejectedEvent) => void>()
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

const isConsultationFinishedPayload = (payload: unknown, expectedCaseId: string) => {
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

const handleConsultationCompleted = async (context: ConsultationSseContext) => {
  if (!activeConsultationContext || activeConsultationContext.caseId !== context.caseId) {
    return
  }

  stopAssistantConsultationSse()
  broadcastConsultationEnded({
    patientId: context.patientId,
    caseId: context.caseId
  })

  await activeRouter?.push({
    path: '/assistant/case-result',
    query: {
      caseId: context.caseId
    }
  })
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
  stopAssistantConsultationSse()
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
    void handleConsultationCompleted(activeConsultationContext)
  }
}

const scheduleReconnect = () => {
  if (manualClose || !activeConsultationContext) {
    return
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }

  reconnectAttempts += 1
  reconnectTimer = setTimeout(() => {
    if (activeConsultationContext && activeRouter) {
      void startAssistantConsultationSse(activeConsultationContext, activeRouter).catch(() => undefined)
    }
  }, Math.min(3000 + reconnectAttempts * 1000, 10000))
}

export function stopAssistantConsultationSse() {
  manualClose = true
  activeStreamId += 1
  activeConsultationContext = null

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
  }

  sseConnection?.close()
  sseConnection = undefined
}

export function startAssistantConsultationSse(context: ConsultationSseContext, router: Router) {
  stopAssistantConsultationSse()
  lastRejectedEvent = null
  activeConsultationContext = context
  activeRouter = router
  manualClose = false
  activeStreamId += 1
  const streamId = activeStreamId

  const token = getToken()
  const langMap: Record<string, string> = {
    'zh-cn': 'zh_CN',
    lo: 'lo_LA',
    en: 'en_US'
  }
  const baseUrl = (import.meta.env.VITE_API_URL || '/lao-api').replace(/\/$/, '')
  const streamUrl = `${baseUrl}/resource/sse`

  return new Promise<void>((resolve, reject) => {
    let openSettled = false
    const settleOpen = () => {
      openSettled = true
      window.clearTimeout(openTimer)
      resolve()
    }
    const failOpen = (error: Error) => {
      openSettled = true
      window.clearTimeout(openTimer)
      stopAssistantConsultationSse()
      reject(error)
    }
    const openTimer = window.setTimeout(() => {
      if (streamId === activeStreamId && !openSettled) {
        failOpen(new Error('sseOpenTimeout'))
      }
    }, SSE_OPEN_TIMEOUT)

    sseConnection = connectSse(streamUrl, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        clientid: import.meta.env.VITE_APP_CLIENT_ID || '',
        'content-language': langMap[localStorage.getItem('lang') || 'zh-cn'] || 'zh_CN'
      },
      onOpen: () => {
        if (streamId !== activeStreamId) return
        reconnectAttempts = 0
        if (!openSettled) {
          settleOpen()
        }
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
        if (streamId === activeStreamId && !manualClose) {
          scheduleReconnect()
        }
      }
    })
  })
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
