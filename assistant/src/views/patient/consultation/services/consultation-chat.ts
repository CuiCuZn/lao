import { readonly, ref } from 'vue'
import { getPatientWsToken } from '@/api/patient'
import type {
  ConsultationChatConnectionStatus,
  ConsultationChatIncomingMessage,
  ConsultationChatRole,
  ConsultationChatSendParams
} from '../types'

interface ConsultationChatServiceOptions {
  onMessage?: (payload: ConsultationChatIncomingMessage) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
}

const OUTGOING_DEDUP_WINDOW = 3_000
const HEARTBEAT_INTERVAL = 10_000
const HEARTBEAT_PAYLOAD = JSON.stringify({ type: 'ping' })

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  const normalizedValue = String(value).trim()
  return normalizedValue || ''
}

const resolveWsBaseUrl = () => {
  const resolvedUrl = new URL('/resource/websocket', window.location.origin)
  resolvedUrl.protocol = resolvedUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return resolvedUrl
}

const buildOutgoingSignature = (contentLo: string, contentCn: string) => {
  return `${contentLo}__${contentCn}`
}

const parseJsonIfPossible = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return value
  }

  try {
    return JSON.parse(trimmedValue)
  } catch {
    return value
  }
}

const resolveChatRole = (value: unknown): ConsultationChatRole | undefined => {
  if (value === 0 || value === 1 || value === 2) {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = value.trim().toLowerCase()
  if (normalizedValue === '0' || normalizedValue === 'doctor') {
    return 0
  }

  if (normalizedValue === '1' || normalizedValue === 'patient') {
    return 1
  }

  if (normalizedValue === '2' || normalizedValue === 'aide' || normalizedValue === 'assistant') {
    return 2
  }

  return undefined
}

const resolveChatPayload = (
  envelope: unknown
): {
  contentLo: string
  contentCn: string
  role?: ConsultationChatRole
  sessionKeys?: string[]
  senderKey?: string
} | null => {
  const normalizedEnvelope = parseJsonIfPossible(envelope)
  const outerRecord = isRecord(normalizedEnvelope) ? normalizedEnvelope : null
  const innerPayload = outerRecord ? parseJsonIfPossible(outerRecord.message) : normalizedEnvelope
  const payloadRecord = isRecord(innerPayload) ? innerPayload : null

  const contentLo =
    takeOptionalText(payloadRecord?.contentLo) ||
    takeOptionalText(payloadRecord?.recordLo) ||
    takeOptionalText(payloadRecord?.source)
  const contentCn =
    takeOptionalText(payloadRecord?.contentCn) ||
    takeOptionalText(payloadRecord?.recordCn) ||
    takeOptionalText(payloadRecord?.translation)

  if (!contentLo || !contentCn) {
    return null
  }

  const sessionKeys = Array.isArray(outerRecord?.sessionKeys)
    ? outerRecord.sessionKeys.filter((item): item is string => typeof item === 'string')
    : undefined

  const senderKey =
    takeOptionalText(outerRecord?.senderKey) ||
    takeOptionalText(outerRecord?.from) ||
    takeOptionalText(payloadRecord?.senderKey)

  return {
    contentLo,
    contentCn,
    role: resolveChatRole(payloadRecord?.role ?? outerRecord?.role),
    sessionKeys,
    senderKey
  }
}

export const createPatientConsultationChatService = (options: ConsultationChatServiceOptions = {}) => {
  const connectionStatus = ref<ConsultationChatConnectionStatus>('idle')
  const socketRef = ref<WebSocket | null>(null)
  let activeConnectionId = 0
  let connectPromise: Promise<void> | null = null
  let manualClose = false
  let heartbeatTimer: number | null = null
  const recentOutgoingMap = new Map<string, number>()

  const stopHeartbeat = () => {
    if (heartbeatTimer === null) {
      return
    }

    window.clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  const startHeartbeat = (socket: WebSocket) => {
    stopHeartbeat()

    heartbeatTimer = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(HEARTBEAT_PAYLOAD)
      }
    }, HEARTBEAT_INTERVAL)
  }

  const pruneRecentOutgoingMap = () => {
    const now = Date.now()
    recentOutgoingMap.forEach((timestamp, signature) => {
      if (now - timestamp > OUTGOING_DEDUP_WINDOW) {
        recentOutgoingMap.delete(signature)
      }
    })
  }

  const emitError = async (error: unknown) => {
    const normalizedError = error instanceof Error ? error : new Error(String(error || 'Unknown chat error'))
    if (options.onError) {
      await options.onError(normalizedError)
    }
  }

  const disconnect = () => {
    manualClose = true
    activeConnectionId += 1
    connectPromise = null
    stopHeartbeat()

    const activeSocket = socketRef.value
    socketRef.value = null

    if (activeSocket) {
      try {
        activeSocket.close()
      } catch {
        undefined
      }
    }

    connectionStatus.value = 'closed'
  }

  const connect = async (patientId: string) => {
    if (connectionStatus.value === 'connected' && socketRef.value) {
      return
    }

    if (connectPromise) {
      return connectPromise
    }

    manualClose = false
    connectionStatus.value = 'connecting'
    const connectionId = ++activeConnectionId
    stopHeartbeat()

    connectPromise = (async () => {
      try {
        const normalizedPatientId = takeOptionalText(patientId)

        if (!normalizedPatientId) {
          throw new Error('Missing patientId for websocket token.')
        }

        const response = await getPatientWsToken(normalizedPatientId)
        const token = takeOptionalText(response?.data)

        if (!token) {
          throw new Error('Missing patient websocket token.')
        }

        const websocketUrl = resolveWsBaseUrl()
        websocketUrl.searchParams.set('Authorization', `Bearer ${token}`)

        await new Promise<void>((resolve, reject) => {
          const socket = new WebSocket(websocketUrl.toString())
          let settled = false

          socketRef.value = socket

          socket.addEventListener('open', () => {
            if (connectionId !== activeConnectionId) {
              socket.close()
              return
            }

            settled = true
            connectionStatus.value = 'connected'
            startHeartbeat(socket)
            resolve()
          })

          socket.addEventListener('message', (event) => {
            void (async () => {
              try {
                pruneRecentOutgoingMap()
                const rawData =
                  event.data instanceof Blob ? await event.data.text() : event.data
                const parsedPayload = resolveChatPayload(rawData)

                if (!parsedPayload) {
                  console.warn('Failed to parse consultation chat websocket payload.', rawData)
                  return
                }

                const signature = buildOutgoingSignature(parsedPayload.contentLo, parsedPayload.contentCn)
                const recentTimestamp = recentOutgoingMap.get(signature)

                if (recentTimestamp && Date.now() - recentTimestamp <= OUTGOING_DEDUP_WINDOW) {
                  recentOutgoingMap.delete(signature)
                  return
                }

                await options.onMessage?.({
                  contentLo: parsedPayload.contentLo,
                  contentCn: parsedPayload.contentCn,
                  role: parsedPayload.role,
                  senderKey: parsedPayload.senderKey,
                  sessionKeys: parsedPayload.sessionKeys,
                  rawEnvelope: rawData
                })
              } catch (error) {
                await emitError(error)
              }
            })()
          })

          socket.addEventListener('error', () => {
            if (connectionId === activeConnectionId) {
              stopHeartbeat()
            }

            const error = new Error(
              `Consultation chat websocket connection failed: ${websocketUrl.toString()}`
            )

            if (!settled) {
              settled = true
              reject(error)
            }

            connectionStatus.value = 'error'
            void emitError(error)
          })

          socket.addEventListener('close', () => {
            if (connectionId === activeConnectionId) {
              stopHeartbeat()
            }

            socketRef.value = null

            if (!manualClose && connectionId === activeConnectionId) {
              connectionStatus.value = 'error'
            } else if (connectionId === activeConnectionId) {
              connectionStatus.value = 'closed'
            }

            if (!settled) {
              settled = true
              reject(
                new Error(
                  `Consultation chat websocket closed before opening: ${websocketUrl.toString()}`
                )
              )
            }
          })
        })
      } catch (error) {
        if (connectionId === activeConnectionId) {
          stopHeartbeat()
        }

        socketRef.value = null
        connectionStatus.value = manualClose ? 'closed' : 'error'
        await emitError(error)
        throw error
      } finally {
        if (connectionId === activeConnectionId) {
          connectPromise = null
        }
      }
    })()

    return connectPromise
  }

  const sendTranslatedMessage = async ({
    doctorId,
    patientId,
    role,
    contentLo,
    contentCn
  }: ConsultationChatSendParams) => {
    const socket = socketRef.value

    if (!socket || connectionStatus.value !== 'connected') {
      throw new Error('Consultation chat websocket is not connected.')
    }

    const normalizedDoctorId = takeOptionalText(doctorId)
    const normalizedPatientId = takeOptionalText(patientId)
    const normalizedRole = resolveChatRole(role)
    const normalizedContentLo = takeOptionalText(contentLo)
    const normalizedContentCn = takeOptionalText(contentCn)

    if (!normalizedDoctorId || normalizedRole === undefined || !normalizedContentLo || !normalizedContentCn) {
      throw new Error('Consultation chat payload is incomplete.')
    }

    const sessionKeys = [`doctor:${normalizedDoctorId}`]
    if (normalizedPatientId) {
      sessionKeys.push(`patient:${normalizedPatientId}`)
    }

    const payload = {
      sessionKeys,
      message: JSON.stringify({
        role: normalizedRole,
        contentLo: normalizedContentLo,
        contentCn: normalizedContentCn
      })
    }

    recentOutgoingMap.set(
      buildOutgoingSignature(normalizedContentLo, normalizedContentCn),
      Date.now()
    )

    socket.send(JSON.stringify(payload))
  }

  return {
    connectionStatus: readonly(connectionStatus),
    connect,
    disconnect,
    sendTranslatedMessage
  }
}
