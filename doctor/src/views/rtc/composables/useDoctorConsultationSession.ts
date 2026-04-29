import DingRTC, {
  type CameraVideoTrack,
  type CameraVideoTrackConfig,
  type DingRTCClient,
  type MicrophoneAudioTrack,
  type RemoteAudioTrack,
  type RemoteUser
} from 'dingrtc'
import { ElMessageBox } from 'element-plus'
import { computed, ref, shallowRef, triggerRef } from 'vue'
import { closeVideoSubtitle, openVideoSubtitle } from '@/api/video'
import {
  closeLocalTrack,
  createConsultationClients,
  joinConsultationChannels,
  mergeRemoteUsers,
  publishTracksToPrimaryChannel,
  registerConsultationAsr,
  stopRemoteTracks,
  subscribeConsultationStreams,
  unpublishTracksFromPrimaryChannel
} from '../services/consultation-rtc'
import type {
  ConsultationChannelContext,
  ConsultationLeaveOptions,
  ConsultationParticipantView,
  ConsultationSubtitleBinding,
  ConsultationTrackStats,
  PatientConsultationJoinParams
} from '../types'

let autoplayFailedHandlerBound = false
const CAMERA_STORAGE_KEY = 'doctor.consultation.cameraDeviceId'
const CAMERA_VIDEO_CONFIG: Omit<CameraVideoTrackConfig, 'deviceId'> = {
  dimension: 'VD_1280x720',
  frameRate: 17,
  optimizationMode: 'detail'
}

interface StoredCameraSelection {
  deviceId: string
  label: string
  groupId: string
}

const buildSubtitleTaskId = (channelId: string, sourceLanguage: string) => {
  return `rtc_${sourceLanguage}_${channelId}_${Date.now()}`
}

const readStoredCameraSelection = (): StoredCameraSelection | null => {
  try {
    const rawValue = window.localStorage.getItem(CAMERA_STORAGE_KEY)

    if (!rawValue) {
      return null
    }

    try {
      const parsedValue = JSON.parse(rawValue) as Partial<StoredCameraSelection>
      return {
        deviceId: parsedValue.deviceId || '',
        label: parsedValue.label || '',
        groupId: parsedValue.groupId || ''
      }
    } catch {
      return {
        deviceId: rawValue,
        label: '',
        groupId: ''
      }
    }
  } catch {
    return null
  }
}

const saveStoredCameraSelection = (device: MediaDeviceInfo) => {
  try {
    const payload: StoredCameraSelection = {
      deviceId: device.deviceId || '',
      label: device.label || '',
      groupId: device.groupId || ''
    }
    window.localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    undefined
  }
}

const buildCameraVideoConfig = (deviceId?: string): CameraVideoTrackConfig => {
  return {
    ...CAMERA_VIDEO_CONFIG,
    ...(deviceId ? { deviceId } : {})
  }
}

const resolveStoredCameraDeviceId = (
  devices: MediaDeviceInfo[],
  selection: StoredCameraSelection | null
) => {
  if (!selection) {
    return ''
  }

  const matchedDevice =
    devices.find((device) => selection.deviceId && device.deviceId === selection.deviceId) ||
    devices.find((device) => selection.groupId && device.groupId === selection.groupId) ||
    devices.find((device) => selection.label && device.label === selection.label)

  return matchedDevice?.deviceId || ''
}

export const useDoctorConsultationSession = () => {
  const joining = ref(false)
  const joined = ref(false)
  const supported = ref(true)
  const subtitleLoading = ref(false)
  const subtitleError = ref('')
  const connectionError = ref('')
  const cameraDevices = ref<MediaDeviceInfo[]>([])
  const selectedCameraId = ref('')
  const rememberedCameraAvailable = ref(false)
  const cameraDeviceLoading = ref(false)
  const cameraSwitching = ref(false)

  const primaryClient = shallowRef<DingRTCClient | null>(null)
  const secondaryClient = shallowRef<DingRTCClient | null>(null)
  const cameraTrack = shallowRef<CameraVideoTrack | null>(null)
  const micTrack = shallowRef<MicrophoneAudioTrack | null>(null)
  const primaryMcuAudioTrack = shallowRef<RemoteAudioTrack | null>(null)
  const secondaryMcuAudioTrack = shallowRef<RemoteAudioTrack | null>(null)
  const primaryRemoteUsers = ref<any[]>([])
  const secondaryRemoteUsers = ref<any[]>([])
  const speakers = ref<string[]>([])
  const trackStatsMap = ref(new Map<string, ConsultationTrackStats>())
  const publishedTrackIds = ref(new Set<string>())
  const primaryAsr = shallowRef<ConsultationSubtitleBinding['asr']>(null)
  const secondaryAsr = shallowRef<ConsultationSubtitleBinding['asr']>(null)
  const primaryTaskId = ref('')
  const secondaryTaskId = ref('')
  const channelContext = ref<ConsultationChannelContext | null>(null)
  const teardownInProgress = ref(false)

  const bindAutoplayFailedHandler = () => {
    if (autoplayFailedHandlerBound) {
      return
    }

    autoplayFailedHandlerBound = true

    DingRTC.on('autoplay-failed', (track: any) => {
      ElMessageBox.confirm('由于浏览器自动播放限制，请点击确认后开始播放音频。', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          track.play()
        })
        .catch(() => undefined)
    })
  }

  const replaceTrackStatsMap = (updater: (map: Map<string, ConsultationTrackStats>) => void) => {
    const nextMap = new Map(trackStatsMap.value)
    updater(nextMap)
    trackStatsMap.value = nextMap
  }

  const updatePublishedTrackIds = (trackIds: string[], action: 'add' | 'remove') => {
    const nextSet = new Set(publishedTrackIds.value)

    trackIds.forEach((trackId) => {
      if (action === 'add') {
        nextSet.add(trackId)
      } else {
        nextSet.delete(trackId)
      }
    })

    publishedTrackIds.value = nextSet
  }

  const allUsers = computed(() => {
    const localChannelContext = channelContext.value
    const remoteUsers = mergeRemoteUsers(primaryRemoteUsers.value, secondaryRemoteUsers.value)

    if (!localChannelContext) {
      return remoteUsers
    }

    const localUser = {
      userId: localChannelContext.userId,
      userName: localChannelContext.userName,
      videoTrack: cameraTrack.value,
      auxiliaryTrack: null,
      audioTrack: micTrack.value,
      hasAudio: Boolean(micTrack.value),
      hasVideo: Boolean(cameraTrack.value),
      hasAuxiliary: false,
      audioMuted: !(micTrack.value?.enabled && !micTrack.value?.muted),
      videoMuted: !(cameraTrack.value?.enabled && !cameraTrack.value?.muted),
      auxiliaryMuted: true
    } as unknown as RemoteUser

    return [localUser, ...remoteUsers]
  })

  const updateTrackStats = (uid?: string) => {
    const localChannelContext = channelContext.value

    if (!localChannelContext) {
      return
    }

    const targetUserId = uid || localChannelContext.userId
    const user = allUsers.value.find((item) => item.userId === targetUserId)

    replaceTrackStatsMap((nextMap) => {
      if (!user) {
        nextMap.delete(targetUserId)
        return
      }

      const hasAudio = Boolean(user.hasAudio)
      const hasCamera = Boolean(user.hasVideo)
      const hasScreen = Boolean(user.hasAuxiliary)

      nextMap.set(user.userId, {
        mic: hasAudio && !user.audioMuted,
        screen: hasScreen && !user.auxiliaryMuted,
        camera: hasCamera && !user.videoMuted,
        hasCamera,
        hasScreen,
        subscribedCamera: Boolean(user.videoTrack),
        subscribedScreen: Boolean(user.auxiliaryTrack)
      })
    })
  }

  const applyRemoteUserInfoUpdate = (
    uid: string,
    msg: 'mute-audio' | 'mute-video' | 'unmute-audio' | 'unmute-video'
  ) => {
    replaceTrackStatsMap((nextMap) => {
      const previousStats = nextMap.get(uid) || {}
      const updatedStats = { ...previousStats }

      if (msg === 'mute-video') {
        updatedStats.camera = false
      }

      if (msg === 'unmute-video') {
        updatedStats.camera = true
        updatedStats.hasCamera = true
      }

      if (msg === 'mute-audio') {
        updatedStats.mic = false
      }

      if (msg === 'unmute-audio') {
        updatedStats.mic = true
      }

      nextMap.set(uid, updatedStats)
    })
  }

  const applyRemotePublishState = (uid: string, published: boolean, auxiliary?: boolean) => {
    replaceTrackStatsMap((nextMap) => {
      const previousStats = nextMap.get(uid) || {}
      const updatedStats = { ...previousStats }

      if (auxiliary) {
        updatedStats.screen = published
        updatedStats.hasScreen = published

        if (!published) {
          updatedStats.subscribedScreen = false
        }
      } else {
        updatedStats.camera = published
        updatedStats.hasCamera = published

        if (!published) {
          updatedStats.subscribedCamera = false
        }
      }

      nextMap.set(uid, updatedStats)
    })
  }

  const syncRemoteUsers = () => {
    if (primaryClient.value) {
      primaryRemoteUsers.value = [...primaryClient.value.remoteUsers]
    }

    if (secondaryClient.value) {
      secondaryRemoteUsers.value = [...secondaryClient.value.remoteUsers]
    }
  }

  const shouldManageSubtitleTasks = () => {
    return mergeRemoteUsers(primaryRemoteUsers.value, secondaryRemoteUsers.value).length === 0
  }

  const stopSubtitleTasks = async () => {
    const localChannelContext = channelContext.value

    if (!localChannelContext) {
      return
    }

    if (!shouldManageSubtitleTasks()) {
      primaryTaskId.value = ''
      secondaryTaskId.value = ''
      return
    }

    const tasks: Promise<unknown>[] = []

    if (primaryTaskId.value && localChannelContext.primaryChannelId) {
      tasks.push(
        closeVideoSubtitle({
          channelId: localChannelContext.primaryChannelId,
          taskId: primaryTaskId.value
        }).catch(() => undefined)
      )
    }

    if (secondaryTaskId.value && localChannelContext.secondaryChannelId) {
      tasks.push(
        closeVideoSubtitle({
          channelId: localChannelContext.secondaryChannelId,
          taskId: secondaryTaskId.value
        }).catch(() => undefined)
      )
    }

    await Promise.all(tasks)
    primaryTaskId.value = ''
    secondaryTaskId.value = ''
  }

  const cleanupSubtitle = async () => {
    try {
      await primaryAsr.value?.setEnabled(false)
    } catch {
      undefined
    }

    try {
      await secondaryAsr.value?.setEnabled(false)
    } catch {
      undefined
    }
  }

  const destroyLocalTracks = () => {
    closeLocalTrack(cameraTrack.value)
    closeLocalTrack(micTrack.value)
    cameraTrack.value = null
    micTrack.value = null
    publishedTrackIds.value = new Set()
  }

  const destroyRemoteTracks = () => {
    stopRemoteTracks(primaryRemoteUsers.value)
    stopRemoteTracks(secondaryRemoteUsers.value)
    primaryMcuAudioTrack.value?.stopPlay?.()
    secondaryMcuAudioTrack.value?.stopPlay?.()
    primaryRemoteUsers.value = []
    secondaryRemoteUsers.value = []
    primaryMcuAudioTrack.value = null
    secondaryMcuAudioTrack.value = null
  }

  const resetRuntimeState = () => {
    speakers.value = []
    trackStatsMap.value = new Map()
    primaryAsr.value = null
    secondaryAsr.value = null
    channelContext.value = null
    subtitleError.value = ''
    subtitleLoading.value = false
    joining.value = false
    joined.value = false
  }

  const bindCameraTrackEnded = (track: CameraVideoTrack) => {
    track.on('track-ended', () => {
      if (cameraTrack.value !== track) {
        return
      }

      cameraTrack.value = null
      triggerRef(cameraTrack)
      updateTrackStats()
    })
  }

  const assignCameraTrack = (track: CameraVideoTrack) => {
    cameraTrack.value = track
    bindCameraTrackEnded(track)
    triggerRef(cameraTrack)
  }

  const loadCameraDevices = async () => {
    cameraDeviceLoading.value = true

    try {
      const devices = await DingRTC.getCameras()
      cameraDevices.value = devices

      const storedCameraId = resolveStoredCameraDeviceId(devices, readStoredCameraSelection())
      const preferredCameraId = selectedCameraId.value || storedCameraId
      const preferredDeviceExists = devices.some((device) => device.deviceId === preferredCameraId)
      rememberedCameraAvailable.value = Boolean(storedCameraId)
      selectedCameraId.value = preferredDeviceExists ? preferredCameraId : devices[0]?.deviceId || ''

      return devices
    } finally {
      cameraDeviceLoading.value = false
    }
  }

  const selectCamera = (deviceId: string) => {
    selectedCameraId.value = deviceId

    const selectedDevice = cameraDevices.value.find((device) => device.deviceId === deviceId)
    if (selectedDevice) {
      saveStoredCameraSelection(selectedDevice)
    }
  }

  const leaveConsultationRoom = async (options: ConsultationLeaveOptions = {}) => {
    if (teardownInProgress.value) {
      return
    }

    teardownInProgress.value = true

    await cleanupSubtitle()
    await stopSubtitleTasks()

    primaryClient.value?.removeAllListeners()
    secondaryClient.value?.removeAllListeners()

    destroyLocalTracks()
    destroyRemoteTracks()

    try {
      primaryAsr.value?.detach()
    } catch {
      undefined
    }

    try {
      secondaryAsr.value?.detach()
    } catch {
      undefined
    }

    try {
      primaryClient.value?.leave()
    } catch {
      undefined
    }

    try {
      secondaryClient.value?.leave()
    } catch {
      undefined
    }

    primaryClient.value = null
    secondaryClient.value = null

    if (!options.keepConnectionError) {
      connectionError.value = ''
    }

    resetRuntimeState()
    teardownInProgress.value = false
  }

  const bindClientEvents = () => {
    const activePrimaryClient = primaryClient.value
    const activeSecondaryClient = secondaryClient.value

    if (!activePrimaryClient || !activeSecondaryClient) {
      return
    }

    activePrimaryClient.removeAllListeners()
    activeSecondaryClient.removeAllListeners()

    activePrimaryClient.on('user-published', (user, mediaType, auxiliary) => {
      syncRemoteUsers()
      updateTrackStats(user.userId)

      if (mediaType !== 'video') {
        return
      }

      activePrimaryClient
        .subscribe(user.userId, 'video', auxiliary)
        .then(() => {
          syncRemoteUsers()
          updateTrackStats(user.userId)
          applyRemotePublishState(user.userId, true, auxiliary)
        })
        .catch(() => undefined)
    })

    activePrimaryClient.on('user-unpublished', (user, mediaType, auxiliary) => {
      syncRemoteUsers()
      updateTrackStats(user.userId)

      if (mediaType === 'video') {
        applyRemotePublishState(user.userId, false, auxiliary)
      }
    })

    activePrimaryClient.on('user-joined', (user) => {
      syncRemoteUsers()
      updateTrackStats(user.userId)
    })

    activePrimaryClient.on('user-left', (user) => {
      replaceTrackStatsMap((nextMap) => {
        nextMap.delete(user.userId)
      })
      syncRemoteUsers()
    })

    activePrimaryClient.on('user-info-updated', (uid, msg) => {
      syncRemoteUsers()
      updateTrackStats(uid)
      applyRemoteUserInfoUpdate(uid, msg)
    })

    activePrimaryClient.on('volume-indicator', (uids: string[]) => {
      speakers.value = uids
    })

    activePrimaryClient.on('connection-state-change', async (current, _, reason) => {
      if (current !== 'disconnected' || teardownInProgress.value) {
        return
      }

      if (reason && reason !== 'leave') {
        connectionError.value = String(reason)
      }

      await leaveConsultationRoom({
        keepConnectionError: true
      })
    })

    activeSecondaryClient.on('user-published', (user, mediaType, auxiliary) => {
      syncRemoteUsers()
      updateTrackStats(user.userId)

      if (mediaType !== 'video') {
        return
      }

      activeSecondaryClient
        .subscribe(user.userId, 'video', auxiliary)
        .then(() => {
          syncRemoteUsers()
          updateTrackStats(user.userId)
          applyRemotePublishState(user.userId, true, auxiliary)
        })
        .catch(() => undefined)
    })

    activeSecondaryClient.on('user-unpublished', (user, mediaType, auxiliary) => {
      syncRemoteUsers()
      updateTrackStats(user.userId)

      if (mediaType === 'video') {
        applyRemotePublishState(user.userId, false, auxiliary)
      }
    })

    activeSecondaryClient.on('user-joined', (user) => {
      syncRemoteUsers()
      updateTrackStats(user.userId)
    })

    activeSecondaryClient.on('user-left', (user) => {
      replaceTrackStatsMap((nextMap) => {
        nextMap.delete(user.userId)
      })
      syncRemoteUsers()
    })

    activeSecondaryClient.on('user-info-updated', (uid, msg) => {
      syncRemoteUsers()
      updateTrackStats(uid)
      applyRemoteUserInfoUpdate(uid, msg)
    })

    activeSecondaryClient.on('connection-state-change', async (current, _, reason) => {
      if (current !== 'disconnected' || teardownInProgress.value) {
        return
      }

      if (reason && reason !== 'leave') {
        connectionError.value = String(reason)
      }

      await leaveConsultationRoom({
        keepConnectionError: true
      })
    })
  }

  const prepareLocalTracks = async (deviceId = selectedCameraId.value) => {
    if (cameraTrack.value && micTrack.value) {
      return
    }

    try {
      const [nextCameraTrack, nextMicTrack] = (await DingRTC.createMicrophoneAndCameraTracks(
        buildCameraVideoConfig(deviceId),
        {}
      )) as [CameraVideoTrack, MicrophoneAudioTrack]

      if (!cameraTrack.value) {
        assignCameraTrack(nextCameraTrack)
      } else {
        closeLocalTrack(nextCameraTrack)
      }

      if (!micTrack.value) {
        micTrack.value = nextMicTrack
        micTrack.value.on('track-ended', () => {
          micTrack.value = null
          updateTrackStats()
        })
        triggerRef(micTrack)
      } else {
        closeLocalTrack(nextMicTrack)
      }
    } catch {
      // Ignore if device access fails initially
    }
  }

  const publishLocalTracks = async () => {
    const tracksToPublish: Array<CameraVideoTrack | MicrophoneAudioTrack> = []

    if (cameraTrack.value?.enabled) {
      tracksToPublish.push(cameraTrack.value)
    }

    if (micTrack.value?.enabled) {
      tracksToPublish.push(micTrack.value)
    }

    if (!tracksToPublish.length || !primaryClient.value) {
      return
    }

    await publishTracksToPrimaryChannel(primaryClient.value, tracksToPublish)
    updatePublishedTrackIds(tracksToPublish.map((track) => track.getTrackId()), 'add')
    updateTrackStats()
  }

  const ensureLocalTracks = async () => {
    await prepareLocalTracks()
    await publishLocalTracks()
  }

  const enterConsultationRoom = async (params: PatientConsultationJoinParams) => {
    joining.value = true
    connectionError.value = ''
    supported.value = DingRTC.checkSystemRequirements()

    if (!supported.value) {
      joining.value = false
      throw new Error('当前浏览器暂不支持音视频通话')
    }

    bindAutoplayFailedHandler()

    const clients = createConsultationClients()
    primaryClient.value = clients.primaryClient
    secondaryClient.value = clients.secondaryClient

    try {
      const joinResult = await joinConsultationChannels(
        clients.primaryClient,
        clients.secondaryClient,
        params
      )

      channelContext.value = {
        appId: params.appId,
        appKey: params.appKey,
        userId: params.userId,
        userName: params.userName,
        baseChannelName: params.channelName,
        primaryChannelId: joinResult.primaryChannelId,
        secondaryChannelId: joinResult.secondaryChannelId,
        language: params.language,
        secondaryLanguage: joinResult.secondaryLanguage,
        token: joinResult.primaryTokenResult.token
      }

      primaryRemoteUsers.value = [...joinResult.primaryResult.remoteUsers]
      secondaryRemoteUsers.value = [...joinResult.secondaryResult.remoteUsers]

      bindClientEvents()

      await subscribeConsultationStreams(clients.primaryClient, clients.secondaryClient, {
        primaryResult: joinResult.primaryResult,
        secondaryResult: joinResult.secondaryResult,
        onPrimaryAudioTrack: (track) => {
          primaryMcuAudioTrack.value = track
        },
        onSecondaryAudioTrack: (track) => {
          secondaryMcuAudioTrack.value = track
        },
        onPrimaryRemoteUsersChanged: (users) => {
          primaryRemoteUsers.value = users
        },
        onSecondaryRemoteUsersChanged: (users) => {
          secondaryRemoteUsers.value = users
        },
        onPrimaryTrackStatsNeeded: (uid) => {
          updateTrackStats(uid)
        },
        onSecondaryTrackStatsNeeded: (uid) => {
          updateTrackStats(uid)
        }
      })

      const asrRegistrationResult = registerConsultationAsr(
        clients.primaryClient,
        clients.secondaryClient,
        params.language
      )

      primaryAsr.value = asrRegistrationResult.primaryAsr
      secondaryAsr.value = asrRegistrationResult.secondaryAsr

      await ensureLocalTracks()
      joined.value = true
      subtitleError.value = ''
      updateTrackStats()
    } catch (error) {
      await leaveConsultationRoom()
      throw error
    } finally {
      joining.value = false
    }
  }

  const bootstrapSubtitle = async () => {
    const localChannelContext = channelContext.value

    if (!localChannelContext || !primaryAsr.value || !secondaryAsr.value) {
      subtitleError.value = '字幕引擎尚未初始化，请重新进入房间后重试。'
      return
    }

    subtitleLoading.value = true
    subtitleError.value = ''

    try {
      primaryAsr.value.setCurrentTranslateLanguages([localChannelContext.secondaryLanguage, 'source'])
      secondaryAsr.value.setCurrentTranslateLanguages([localChannelContext.language, 'source'])
      const startTasks: Promise<unknown>[] = []

      if (shouldManageSubtitleTasks()) {
        if (!primaryTaskId.value) {
          const nextPrimaryTaskId = buildSubtitleTaskId(
            localChannelContext.primaryChannelId,
            localChannelContext.language
          )
          startTasks.push(
            openVideoSubtitle({
              channelId: localChannelContext.primaryChannelId,
              taskId: nextPrimaryTaskId,
              sourceLanguage: localChannelContext.language
            }).then(() => {
              primaryTaskId.value = nextPrimaryTaskId
            })
          )
        }

        if (!secondaryTaskId.value) {
          const nextSecondaryTaskId = buildSubtitleTaskId(
            localChannelContext.secondaryChannelId,
            localChannelContext.secondaryLanguage
          )
          startTasks.push(
            openVideoSubtitle({
              channelId: localChannelContext.secondaryChannelId,
              taskId: nextSecondaryTaskId,
              sourceLanguage: localChannelContext.secondaryLanguage
            }).then(() => {
              secondaryTaskId.value = nextSecondaryTaskId
            })
          )
        }
      }

      const settledTasks = await Promise.allSettled(startTasks)

      await Promise.allSettled([
        primaryAsr.value.setEnabled(true),
        secondaryAsr.value.setEnabled(true)
      ])

      if (settledTasks.some((item) => item.status === 'rejected')) {
        subtitleError.value = '字幕服务启动部分失败，可稍后点击重试字幕。'
      }
    } catch {
      subtitleError.value = '字幕服务暂时不可用，可稍后重试。'
    } finally {
      subtitleLoading.value = false
    }
  }

  const toggleCamera = async () => {
    const activePrimaryClient = primaryClient.value

    if (!activePrimaryClient) {
      return
    }

    if (!cameraTrack.value) {
      const track = await DingRTC.createCameraVideoTrack(buildCameraVideoConfig(selectedCameraId.value))

      assignCameraTrack(track)

      await publishTracksToPrimaryChannel(activePrimaryClient, [track])
      updatePublishedTrackIds([track.getTrackId()], 'add')
      updateTrackStats()
      return
    }

    const track = cameraTrack.value
    const trackId = track.getTrackId()
    const isPublished = publishedTrackIds.value.has(trackId)

    if (track.enabled) {
      if (isPublished) {
        await unpublishTracksFromPrimaryChannel(activePrimaryClient, [track])
        updatePublishedTrackIds([trackId], 'remove')
      }

      await track.setEnabled(false)
    } else {
      await track.setEnabled(true)

      if (!isPublished) {
        await publishTracksToPrimaryChannel(activePrimaryClient, [track])
        updatePublishedTrackIds([trackId], 'add')
      }
    }

    triggerRef(cameraTrack)
    updateTrackStats()
  }

  const switchCamera = async (deviceId: string) => {
    const normalizedDeviceId = deviceId.trim()

    if (!normalizedDeviceId) {
      return
    }

    if (normalizedDeviceId === selectedCameraId.value) {
      selectCamera(normalizedDeviceId)
      return
    }

    cameraSwitching.value = true

    try {
      const activePrimaryClient = primaryClient.value
      const track = cameraTrack.value

      if (!track) {
        const nextTrack = await DingRTC.createCameraVideoTrack(buildCameraVideoConfig(normalizedDeviceId))
        assignCameraTrack(nextTrack)
        selectCamera(normalizedDeviceId)

        if (activePrimaryClient && nextTrack.enabled) {
          await publishTracksToPrimaryChannel(activePrimaryClient, [nextTrack])
          updatePublishedTrackIds([nextTrack.getTrackId()], 'add')
        }

        updateTrackStats()
        return
      }

      const shouldRepublishAfterSwitch = Boolean(track.enabled && activePrimaryClient)
      const previousTrackId = track.getTrackId()
      const wasPublished = publishedTrackIds.value.has(previousTrackId)

      if (!track.enabled) {
        await track.setDevice(normalizedDeviceId)
        selectCamera(normalizedDeviceId)
        triggerRef(cameraTrack)
        updateTrackStats()
        return
      }

      await track.setDevice(normalizedDeviceId)
      selectCamera(normalizedDeviceId)
      triggerRef(cameraTrack)

      const nextTrackId = track.getTrackId()
      if (shouldRepublishAfterSwitch && wasPublished && nextTrackId !== previousTrackId) {
        updatePublishedTrackIds([previousTrackId], 'remove')
        updatePublishedTrackIds([nextTrackId], 'add')
      }

      updateTrackStats()
    } finally {
      cameraSwitching.value = false
    }
  }

  const toggleMic = async () => {
    const activePrimaryClient = primaryClient.value

    if (!activePrimaryClient) {
      return
    }

    if (!micTrack.value) {
      const track = await DingRTC.createMicrophoneAudioTrack({})

      micTrack.value = track
      track.on('track-ended', () => {
        micTrack.value = null
        updateTrackStats()
      })
      triggerRef(micTrack)

      await publishTracksToPrimaryChannel(activePrimaryClient, [track])
      updatePublishedTrackIds([track.getTrackId()], 'add')
      updateTrackStats()
      return
    }

    const track = micTrack.value
    const trackId = track.getTrackId()
    const isPublished = publishedTrackIds.value.has(trackId)

    if (track.enabled) {
      if (isPublished) {
        await unpublishTracksFromPrimaryChannel(activePrimaryClient, [track])
        updatePublishedTrackIds([trackId], 'remove')
      }

      await track.setEnabled(false)
    } else {
      await track.setEnabled(true)

      if (!isPublished) {
        await publishTracksToPrimaryChannel(activePrimaryClient, [track])
        updatePublishedTrackIds([trackId], 'add')
      }
    }

    triggerRef(micTrack)
    updateTrackStats()
  }

  const cameraEnabled = computed(() => Boolean(cameraTrack.value?.enabled && !cameraTrack.value?.muted))
  const micEnabled = computed(() => Boolean(micTrack.value?.enabled && !micTrack.value?.muted))
  const subtitleBindings = computed<ConsultationSubtitleBinding[]>(() => {
    const localChannelContext = channelContext.value

    if (!localChannelContext) {
      return []
    }

    return [
      {
        asr: primaryAsr.value,
        sourceLanguage: localChannelContext.language,
        targetLanguage: localChannelContext.secondaryLanguage
      },
      {
        asr: secondaryAsr.value,
        sourceLanguage: localChannelContext.secondaryLanguage,
        targetLanguage: localChannelContext.language
      }
    ]
  })

  const resolveRenderableTrack = (user: RemoteUser) => {
    const trackStats = trackStatsMap.value.get(user.userId)

    if (trackStats?.camera && user.videoTrack) {
      return user.videoTrack
    }

    if (trackStats?.screen && user.auxiliaryTrack) {
      return user.auxiliaryTrack
    }

    return null
  }

  const remoteParticipants = computed<ConsultationParticipantView[]>(() => {
    const localChannelContext = channelContext.value

    if (!localChannelContext) {
      return []
    }

    return mergeRemoteUsers(primaryRemoteUsers.value, secondaryRemoteUsers.value)
      .filter((user) => user.userId !== localChannelContext.userId)
      .map((user) => ({
        userId: user.userId,
        userName: user.userName || user.userId,
        track: resolveRenderableTrack(user),
        muted: !trackStatsMap.value.get(user.userId)?.mic,
        speaking: speakers.value.includes(user.userId),
        placeholderBadge: ''
      }))
  })

  const featuredParticipant = computed<ConsultationParticipantView>(() => {
    const participantWithTrack = remoteParticipants.value.find((participant) => participant.track)

    if (participantWithTrack) {
      return participantWithTrack
    }

    return remoteParticipants.value[0] || {
      userId: 'placeholder',
      userName: '等待患者接入',
      track: null,
      muted: true,
      speaking: false,
      placeholderBadge: '等待接入'
    }
  })

  const extraParticipants = computed(() => {
    return remoteParticipants.value.filter(
      (participant) => participant.userId !== featuredParticipant.value.userId
    )
  })

  const localPreviewTrack = computed(() => {
    return cameraEnabled.value ? cameraTrack.value : null
  })

  return {
    joining,
    joined,
    supported,
    subtitleLoading,
    subtitleError,
    connectionError,
    cameraDevices,
    selectedCameraId,
    rememberedCameraAvailable,
    cameraDeviceLoading,
    cameraSwitching,
    cameraEnabled,
    micEnabled,
    subtitleBindings,
    channelContext,
    allUsers,
    remoteParticipants,
    featuredParticipant,
    extraParticipants,
    bindAutoplayFailedHandler,
    loadCameraDevices,
    selectCamera,
    switchCamera,
    prepareLocalTracks,
    localPreviewTrack,
    enterConsultationRoom,
    bootstrapSubtitle,
    cleanupSubtitle,
    leaveConsultationRoom,
    toggleCamera,
    toggleMic
  }
}
