import { readonly, ref } from 'vue'
import { getToken } from '@/utils/auth'
import type {
  ConsultationChatConnectionStatus,
  ConsultationChatIncomingMessage,
  ConsultationChatSendParams
} from '../types'

interface ConsultationChatServiceOptions {
  onMessage?: (payload: ConsultationChatIncomingMessage) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
}

const OUTGOING_DEDUP_WINDOW = 3_000

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

const buildOutgoingSignature = (contentCn: string, contentLo: string) => {
  return `${contentCn}__${contentLo}`
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

const resolveChatPayload = (
  envelope: unknown
): {
  contentCn: string
  contentLo: string
  sessionKeys?: string[]
  senderKey?: string
} | null => {
  const normalizedEnvelope = parseJsonIfPossible(envelope)
  const outerRecord = isRecord(normalizedEnvelope) ? normalizedEnvelope : null
  const innerPayload = outerRecord ? parseJsonIfPossible(outerRecord.message) : normalizedEnvelope
  const payloadRecord = isRecord(innerPayload) ? innerPayload : null

  const contentCn =
    takeOptionalText(payloadRecord?.contentCn) ||
    takeOptionalText(payloadRecord?.recordCn) ||
    takeOptionalText(payloadRecord?.source)
  const contentLo =
    takeOptionalText(payloadRecord?.contentLo) ||
    takeOptionalText(payloadRecord?.recordLo) ||
    takeOptionalText(payloadRecord?.translation)

  if (!contentCn || !contentLo) {
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
    contentCn,
    contentLo,
    sessionKeys,
    senderKey
  }
}

export const createDoctorConsultationChatService = (options: ConsultationChatServiceOptions = {}) => {
  const connectionStatus = ref<ConsultationChatConnectionStatus>('idle')
  const socketRef = ref<WebSocket | null>(null)
  let activeConnectionId = 0
  let connectPromise: Promise<void> | null = null
  let manualClose = false
  const recentOutgoingMap = new Map<string, number>()

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

  const connect = async () => {
    if (connectionStatus.value === 'connected' && socketRef.value) {
      return
    }

    if (connectPromise) {
      return connectPromise
    }

    manualClose = false
    connectionStatus.value = 'connecting'
    const connectionId = ++activeConnectionId

    connectPromise = (async () => {
      try {
        const loginToken = takeOptionalText(getToken())

        if (!loginToken) {
          throw new Error('Missing doctor login token.')
        }

        const websocketUrl = resolveWsBaseUrl()
        websocketUrl.searchParams.set('Authorization', `Bearer ${loginToken}`)

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
            resolve()
          })

          socket.addEventListener('message', (event) => {
            void (async () => {
              try {
                pruneRecentOutgoingMap()
                const rawData = event.data instanceof Blob ? await event.data.text() : event.data
                const parsedPayload = resolveChatPayload(rawData)

                if (!parsedPayload) {
                  console.warn('Failed to parse doctor consultation chat websocket payload.', rawData)
                  return
                }

                const signature = buildOutgoingSignature(parsedPayload.contentCn, parsedPayload.contentLo)
                const recentTimestamp = recentOutgoingMap.get(signature)

                if (recentTimestamp && Date.now() - recentTimestamp <= OUTGOING_DEDUP_WINDOW) {
                  recentOutgoingMap.delete(signature)
                  return
                }

                await options.onMessage?.({
                  contentCn: parsedPayload.contentCn,
                  contentLo: parsedPayload.contentLo,
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
            const error = new Error('Doctor consultation chat websocket connection failed.')

            if (!settled) {
              settled = true
              reject(error)
            }

            connectionStatus.value = 'error'
            void emitError(error)
          })

          socket.addEventListener('close', () => {
            socketRef.value = null

            if (!manualClose && connectionId === activeConnectionId) {
              connectionStatus.value = 'error'
            } else if (connectionId === activeConnectionId) {
              connectionStatus.value = 'closed'
            }

            if (!settled) {
              settled = true
              reject(new Error('Doctor consultation chat websocket closed before opening.'))
            }
          })
        })
      } catch (error) {
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
    patientId,
    contentCn,
    contentLo
  }: ConsultationChatSendParams) => {
    const socket = socketRef.value

    if (!socket || connectionStatus.value !== 'connected') {
      throw new Error('Doctor consultation chat websocket is not connected.')
    }

    const normalizedPatientId = takeOptionalText(patientId)
    const normalizedContentCn = takeOptionalText(contentCn)
    const normalizedContentLo = takeOptionalText(contentLo)

    if (!normalizedPatientId || !normalizedContentCn || !normalizedContentLo) {
      throw new Error('Doctor consultation chat payload is incomplete.')
    }

    const payload = {
      sessionKeys: [`patient:${normalizedPatientId}`],
      message: JSON.stringify({
        contentCn: normalizedContentCn,
        contentLo: normalizedContentLo
      })
    }

    recentOutgoingMap.set(
      buildOutgoingSignature(normalizedContentCn, normalizedContentLo),
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
