import DingRTC, {
  type DingRTCClient,
  type LocalTrack,
  type RemoteAudioTrack,
  type RemoteUser,
  type SubscribeParam
} from 'dingrtc'
import ASR from 'dingrtc-asr'
import type {
  ConsultationAsrRegistrationResult,
  ConsultationJoinRoomResult,
  ConsultationLanguage,
  ConsultationRtcClients,
  ConsultationStreamSubscriptionOptions,
  ConsultationTrack,
  PatientConsultationJoinParams,
  RtcChannelTokenResult
} from '../types'
import { getRtcChannelToken } from './rtc-request'

DingRTC.setLogLevel('debug')
DingRTC.setClientConfig({
  simulcast: true,
  highStartBitrate: false
})

const resolveMergedMutedState = (
  mediaSources: Array<{
    hasMedia: boolean
    muted: boolean | undefined
  }>
) => {
  const activeSources = mediaSources.filter((item) => item.hasMedia)

  if (!activeSources.length) {
    return true
  }

  const validFlags = activeSources
    .map((item) => item.muted)
    .filter((item): item is boolean => typeof item === 'boolean')

  if (!validFlags.length) {
    return false
  }

  return validFlags.every(Boolean)
}

const mergeRemoteUser = (primaryUser: any, secondaryUser: any): any => {
  const audioTrack = primaryUser.audioTrack || secondaryUser.audioTrack
  const videoTrack = primaryUser.videoTrack || secondaryUser.videoTrack
  const auxiliaryTrack = primaryUser.auxiliaryTrack || secondaryUser.auxiliaryTrack
  const hasAudio = Boolean(primaryUser.hasAudio || secondaryUser.hasAudio)
  const hasVideo = Boolean(primaryUser.hasVideo || secondaryUser.hasVideo)
  const hasAuxiliary = Boolean(primaryUser.hasAuxiliary || secondaryUser.hasAuxiliary)

  return {
    ...primaryUser,
    ...secondaryUser,
    userId: primaryUser.userId || secondaryUser.userId,
    userName: primaryUser.userName || secondaryUser.userName,
    audioTrack,
    videoTrack,
    auxiliaryTrack,
    hasAudio,
    hasVideo,
    hasAuxiliary,
    audioMuted: resolveMergedMutedState([
      { hasMedia: Boolean(primaryUser.hasAudio), muted: primaryUser.audioMuted },
      { hasMedia: Boolean(secondaryUser.hasAudio), muted: secondaryUser.audioMuted }
    ]),
    videoMuted: resolveMergedMutedState([
      { hasMedia: Boolean(primaryUser.hasVideo), muted: primaryUser.videoMuted },
      { hasMedia: Boolean(secondaryUser.hasVideo), muted: secondaryUser.videoMuted }
    ]),
    auxiliaryMuted: resolveMergedMutedState([
      { hasMedia: Boolean(primaryUser.hasAuxiliary), muted: primaryUser.auxiliaryMuted },
      { hasMedia: Boolean(secondaryUser.hasAuxiliary), muted: secondaryUser.auxiliaryMuted }
    ])
  } as RemoteUser
}

export const mergeRemoteUsers = (primaryUsers: any[], secondaryUsers: any[]) => {
  const mergedUsers = new Map<string, any>()
  const orderedUserIds: string[] = []

  const upsertUser = (user: RemoteUser) => {
    if (!mergedUsers.has(user.userId)) {
      orderedUserIds.push(user.userId)
      mergedUsers.set(user.userId, user)
      return
    }

    mergedUsers.set(user.userId, mergeRemoteUser(mergedUsers.get(user.userId)!, user))
  }

  primaryUsers.forEach(upsertUser)
  secondaryUsers.forEach(upsertUser)

  return orderedUserIds
    .map((userId) => mergedUsers.get(userId))
    .filter((user): user is any => Boolean(user))
}

export const createConsultationClients = (): ConsultationRtcClients => {
  return {
    primaryClient: DingRTC.createClient(),
    secondaryClient: DingRTC.createClient()
  }
}

export const fetchConsultationTokens = async (
  params: PatientConsultationJoinParams
): Promise<{
  primaryChannelId: string
  secondaryChannelId: string
  secondaryLanguage: ConsultationLanguage
  primaryTokenResult: RtcChannelTokenResult
  secondaryTokenResult: RtcChannelTokenResult
}> => {
  const primaryChannelId = `${params.channelName}_${params.language}`
  const secondaryLanguage = params.language === 'cn' ? 'lo' : 'cn'
  const secondaryChannelId = `${params.channelName}_${secondaryLanguage}`

  let primaryTokenResult: RtcChannelTokenResult
  let secondaryTokenResult: RtcChannelTokenResult

  if (params.token) {
    primaryTokenResult = {
      token: params.token,
      gslb: params.gslb ? [params.gslb] : []
    }
    secondaryTokenResult = {
      token: params.secondaryToken || params.token,
      gslb: params.gslb ? [params.gslb] : []
    }
    // secondaryTokenResult = await getRtcChannelToken(
    //   params.userId,
    //   secondaryChannelId,
    //   params.appId,
    //   params.appKey
    // )
  } else {
    ;[primaryTokenResult, secondaryTokenResult] = await Promise.all([
      getRtcChannelToken(params.userId, primaryChannelId, params.appId, params.appKey),
      getRtcChannelToken(params.userId, secondaryChannelId, params.appId, params.appKey)
    ])
  }

  return {
    primaryChannelId,
    secondaryChannelId,
    secondaryLanguage,
    primaryTokenResult,
    secondaryTokenResult
  }
}

export const joinConsultationChannels = async (
  primaryClient: DingRTCClient,
  secondaryClient: DingRTCClient,
  params: PatientConsultationJoinParams
): Promise<ConsultationJoinRoomResult> => {
  const tokenResult = await fetchConsultationTokens(params)

  if (tokenResult.primaryTokenResult.gslb?.length) {
    DingRTC.setClientConfig({
      gslb: params.gslb || tokenResult.primaryTokenResult.gslb
    })
  }

  const primaryResult = await primaryClient.join({
    appId: params.appId,
    token: tokenResult.primaryTokenResult.token,
    uid: params.userId,
    channel: tokenResult.primaryChannelId,
    userName: params.userName
  })

  const secondaryResult = await secondaryClient.join({
    appId: params.appId,
    token: tokenResult.secondaryTokenResult.token,
    uid: params.userId,
    channel: tokenResult.secondaryChannelId,
    userName: params.userName
  })

  return {
    ...tokenResult,
    primaryResult,
    secondaryResult
  }
}

export const subscribeConsultationStreams = async (
  primaryClient: DingRTCClient,
  secondaryClient: DingRTCClient,
  options: ConsultationStreamSubscriptionOptions
) => {
  const primarySubParams: SubscribeParam[] = [{ uid: 'mcu', mediaType: 'audio', auxiliary: false }]
  const secondarySubParams: SubscribeParam[] = [{ uid: 'mcu', mediaType: 'audio', auxiliary: false }]

  options.primaryResult.remoteUsers.forEach((user) => {
    if (user.hasAuxiliary) {
      primarySubParams.push({ uid: user.userId, mediaType: 'video', auxiliary: true })
    }

    if (user.hasVideo) {
      primarySubParams.push({ uid: user.userId, mediaType: 'video', auxiliary: false })
    }
  })

  options.secondaryResult.remoteUsers.forEach((user) => {
    if (user.hasAuxiliary) {
      secondarySubParams.push({ uid: user.userId, mediaType: 'video', auxiliary: true })
    }

    if (user.hasVideo) {
      secondarySubParams.push({ uid: user.userId, mediaType: 'video', auxiliary: false })
    }
  })

  await Promise.all([
    primaryClient.batchSubscribe(primarySubParams).then((results) => {
      results.forEach(({ error, track, uid }) => {
        if (error) {
          return
        }

        if (track && track.trackMediaType === 'audio') {
          const audioTrack = track as RemoteAudioTrack
          options.onPrimaryAudioTrack(audioTrack)
          audioTrack.play()
          return
        }

        options.onPrimaryRemoteUsersChanged([...primaryClient.remoteUsers])
        options.onPrimaryTrackStatsNeeded(uid)
      })
    }),
    secondaryClient.batchSubscribe(secondarySubParams).then((results) => {
      results.forEach(({ error, track, uid }) => {
        if (error) {
          return
        }

        if (track && track.trackMediaType === 'audio') {
          const audioTrack = track as RemoteAudioTrack
          options.onSecondaryAudioTrack(audioTrack)
          audioTrack.play()
          return
        }

        options.onSecondaryRemoteUsersChanged([...secondaryClient.remoteUsers])
        options.onSecondaryTrackStatsNeeded(uid)
      })
    })
  ])
}

export const registerConsultationAsr = (
  primaryClient: DingRTCClient,
  secondaryClient: DingRTCClient,
  language: ConsultationLanguage
): ConsultationAsrRegistrationResult => {
  const secondaryLanguage = language === 'cn' ? 'lo' : 'cn'
  const primaryAsr = new ASR()
  const secondaryAsr = new ASR()

  primaryClient.register(primaryAsr)
  secondaryClient.register(secondaryAsr)

  primaryAsr.setCurrentTranslateLanguages([secondaryLanguage, 'source'])
  secondaryAsr.setCurrentTranslateLanguages([language, 'source'])

  return {
    primaryAsr,
    secondaryAsr,
    bindings: [
      {
        asr: primaryAsr,
        sourceLanguage: language,
        targetLanguage: secondaryLanguage
      },
      {
        asr: secondaryAsr,
        sourceLanguage: secondaryLanguage,
        targetLanguage: language
      }
    ]
  }
}

export const publishTracksToPrimaryChannel = async (
  primaryClient: DingRTCClient,
  tracks: ConsultationTrack[]
) => {
  const rawTracks = tracks.filter(Boolean) as ConsultationTrack[]

  if (!rawTracks.length) {
    return
  }

  await primaryClient.publish(rawTracks as LocalTrack[])
}

export const unpublishTracksFromPrimaryChannel = async (
  primaryClient: DingRTCClient,
  tracks: ConsultationTrack[]
) => {
  const rawTracks = tracks.filter(Boolean) as ConsultationTrack[]

  if (!rawTracks.length) {
    return
  }

  await primaryClient.unpublish(rawTracks as LocalTrack[])
}

export const closeLocalTrack = (track: ConsultationTrack | null | undefined) => {
  if (!track) {
    return
  }

  // @ts-ignore
  if ('stopPlay' in track && typeof track.stopPlay === 'function') {
    try {
      // @ts-ignore
      track.stopPlay()
    } catch {
      /* empty */
    }
  } else if ('stop' in track && typeof track.stop === 'function') {
    try {
      track.stop()
    } catch {
      /* empty */
    }
  }

  if ('close' in track) {
    try {
      track.close()
    } catch {
      undefined
    }
  }
}

export const stopRemoteTracks = (users: any[]) => {
  users.forEach((user) => {
    // @ts-ignore
    if (typeof user.videoTrack?.stopPlay === 'function') {
      // @ts-ignore
      user.videoTrack.stopPlay()
    } else {
      user.videoTrack?.stop?.()
    }

    // @ts-ignore
    if (typeof user.auxiliaryTrack?.stopPlay === 'function') {
      // @ts-ignore
      user.auxiliaryTrack.stopPlay()
    } else {
      user.auxiliaryTrack?.stop?.()
    }
  })
}
