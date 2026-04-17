import MD5 from 'crypto-js/md5'

const RTC_SERVER_DOMAIN = '/api-rtc'

const getRtcEnv = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return new URLSearchParams(window.location.search).get('env') || ''
}

const formatQuery = (params?: Record<string, unknown>) => {
  if (!params) {
    return ''
  }

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const rtcRequest = async <T>(
  method: 'GET' | 'POST',
  url: string,
  params?: Record<string, unknown>,
  headers: Record<string, string> = {}
) => {
  const response = await fetch(`${url}${method === 'GET' ? formatQuery(params) : ''}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: method === 'POST' ? JSON.stringify(params || {}) : undefined
  })

  const payload = response.ok ? await response.json() : await response.text()

  if (!response.ok) {
    throw new Error(typeof payload === 'string' ? payload : 'RTC request failed')
  }

  if (payload?.code && payload.code !== 200) {
    throw new Error(payload.msg || 'RTC request failed')
  }

  return payload?.data as T
}

export const getRtcChannelToken = async (
  userId: string,
  channelId: string,
  _appId?: string,
  _appKey?: string
) => {
  const token = await rtcRequest<string>('GET', `${RTC_SERVER_DOMAIN}/api/v1/room/login`, {
    channel_id: channelId,
    user_id: userId
  })

  return {
    token
  }
}

export const startRtcSubtitle = async (
  appId: string,
  channelId: string,
  sourceLanguage: string,
  functionNumber: number
) => {
  const headers = {
    'DingRTC-Signature': MD5(appId).toString()
  }

  return rtcRequest<{ taskId: string }>('POST', `${RTC_SERVER_DOMAIN}/api/v1/subtitle/start`, {
    appId,
    channelId,
    env: getRtcEnv(),
    function: functionNumber,
    channel_id: channelId,
    source_language: sourceLanguage,
    task_id: 'rtc'
  }, headers)
}

export const stopRtcSubtitle = async (
  appId: string,
  channelId: string,
  sourceLanguage: string,
  taskId: string
) => {
  const headers = {
    'DingRTC-Signature': MD5(appId).toString()
  }

  return rtcRequest<unknown>('POST', `${RTC_SERVER_DOMAIN}/api/v1/subtitle/end`, {
    appId,
    channelId,
    env: getRtcEnv(),
    function: 1,
    taskId,
    channel_id: channelId,
    source_language: sourceLanguage,
    task_id: taskId
  }, headers)
}
