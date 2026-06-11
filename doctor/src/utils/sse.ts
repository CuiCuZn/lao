export interface SseMessage {
  event: string;
  id?: string;
  data: string;
}

interface ConnectSseOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onOpen?: (response: Response) => void;
  onMessage?: (message: SseMessage) => void;
  onHeartbeat?: (message: SseMessage) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

const SSE_LOG_PREFIX = '[doctor-sse]'

export function connectSse(url: string, options: ConnectSseOptions = {}) {
  const controller = new AbortController()
  const relayAbort = () => controller.abort()

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort()
    } else {
      options.signal.addEventListener('abort', relayAbort)
    }
  }

  const finished = startStream(url, controller, options).finally(() => {
    options.signal?.removeEventListener('abort', relayAbort)
  })

  return {
    close: () => controller.abort(),
    finished
  }
}

async function startStream(url: string, controller: AbortController, options: ConnectSseOptions) {
  try {
    logSse('connect', { url })

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...(options.headers || {})
      },
      credentials: 'include',
      signal: controller.signal
    })

    if (!response.ok || !response.body) {
      throw new Error(`SSE request failed with status ${response.status}`)
    }

    logSse('open', {
      url,
      status: response.status,
      statusText: response.statusText
    })
    options.onOpen?.(response)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let separatorIndex = buffer.indexOf('\n\n')

      while (separatorIndex !== -1) {
        const block = buffer.slice(0, separatorIndex).trim()
        buffer = buffer.slice(separatorIndex + 2)
        if (block) {
          const message = parseSseBlock(block)
          const heartbeat = isHeartbeatBlock(message, block)
          logSseBlock(message, block, heartbeat)
          if (heartbeat) {
            options.onHeartbeat?.(message)
          }
          if (message.data) {
            options.onMessage?.(message)
          }
        }
        separatorIndex = buffer.indexOf('\n\n')
      }
    }

    if (buffer.trim()) {
      const message = parseSseBlock(buffer.trim())
      const heartbeat = isHeartbeatBlock(message, buffer.trim())
      logSseBlock(message, buffer.trim(), heartbeat)
      if (heartbeat) {
        options.onHeartbeat?.(message)
      }
      if (message.data) {
        options.onMessage?.(message)
      }
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      const normalizedError = normalizeError(error)
      logSse('error', {
        message: normalizedError.message
      })
      options.onError?.(normalizedError)
    } else {
      logSse('aborted')
    }
  } finally {
    logSse('close')
    options.onClose?.()
  }
}

function parseSseBlock(block: string): SseMessage {
  const lines = block.split('\n')
  const dataLines: string[] = []
  let event = 'message'
  let id = ''

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue
    }

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1).trimStart()

    if (field === 'event') {
      event = value || event
    } else if (field === 'id') {
      id = value
    } else if (field === 'data') {
      dataLines.push(value)
    }
  }

  return {
    event,
    id: id || undefined,
    data: dataLines.join('\n')
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error
  }

  return new Error(typeof error === 'string' ? error : 'Unknown SSE error')
}

function isHeartbeatBlock(message: SseMessage, block: string) {
  const normalizedEvent = message.event.toLowerCase()
  const normalizedData = message.data.toLowerCase()

  if (normalizedEvent.includes('heartbeat') || normalizedEvent.includes('ping') || normalizedEvent.includes('pong')) {
    return true
  }

  if (normalizedData.includes('heartbeat') || normalizedData.includes('ping') || normalizedData.includes('pong')) {
    return true
  }

  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.length > 0 && lines.every((line) => line.startsWith(':'))
}

function logSseBlock(message: SseMessage, block: string, heartbeat = isHeartbeatBlock(message, block)) {
  if (heartbeat) {
    return
  }

  const payload = {
    event: message.event,
    id: message.id,
    data: message.data,
    raw: block
  }

  logSse('message', payload)
}

function logSse(event: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`${SSE_LOG_PREFIX} ${event}`)
    return
  }

  console.log(`${SSE_LOG_PREFIX} ${event}`, payload)
}
