<template>
  <div v-if="modelValue" class="capture-mask" role="presentation" @click.self="closeDialog">
    <section class="capture-dialog" role="dialog" aria-modal="true" aria-labelledby="side-scanner-capture-title">
      <header class="capture-header">
        <div>
          <h2 id="side-scanner-capture-title">{{ t('assistant.aideVideo.consultation.captureTitle') }}</h2>
          <p>{{ deviceLabel }}</p>
        </div>

        <button type="button" class="capture-close" :aria-label="t('common.cancel')" @click="closeDialog">
          <el-icon><close /></el-icon>
        </button>
      </header>

      <div class="capture-body">
        <div class="capture-preview-column">
          <div class="capture-toolbar">
            <div class="capture-resolution-control">
              <span class="capture-toolbar-label">{{ t('assistant.aideVideo.consultation.captureResolution') }}</span>
              <el-select
                v-model="selectedResolutionKey"
                size="small"
                class="capture-resolution-select"
                :disabled="resolutionSelectDisabled"
                :placeholder="t('assistant.aideVideo.consultation.captureResolution')"
                :teleported="false"
                @change="handleResolutionChange"
              >
                <el-option
                  v-for="option in resolutionOptions"
                  :key="option.key"
                  :label="option.label"
                  :value="option.key"
                />
              </el-select>
            </div>
          </div>

          <div class="capture-preview-stage">
            <section
              class="capture-preview"
              :class="{ 'is-empty': streamError || streamLoading, 'is-sideways': previewRotatedSideways }"
              :style="previewFrameStyle"
            >
              <video
                v-show="!draftPhoto && !streamError"
                ref="videoRef"
                autoplay
                playsinline
                muted
                :style="previewMediaStyle"
              />
              <img v-if="draftPhoto" :src="draftPhoto.previewUrl" alt="" />

              <div v-if="streamLoading" class="preview-state">
                {{ t('assistant.aideVideo.consultation.captureStarting') }}
              </div>
              <div v-else-if="streamError" class="preview-state is-error">
                {{ streamError }}
              </div>
            </section>
          </div>

          <div class="capture-local-actions">
            <div class="capture-rotation-controls">
              <el-button size="small" :disabled="rotationControlsDisabled" @click="rotateLeft">
                <el-icon><refresh-left /></el-icon>
                {{ t('assistant.aideVideo.consultation.captureRotate') }}
              </el-button>
              <el-button v-if="showLocalImageUpload" size="small" :disabled="localImageUploadDisabled" @click="openLocalImageUpload">
                <el-icon><upload /></el-icon>
                {{ t('assistant.aideVideo.consultation.captureUploadImageTest') }}
              </el-button>
            </div>

            <div class="capture-photo-actions">
              <template v-if="draftPhoto">
                <el-button :disabled="uploading" @click="retakePhoto">
                  <el-icon><refresh-left /></el-icon>
                  {{ t('assistant.aideVideo.consultation.captureRetake') }}
                </el-button>
                <el-button type="primary" :loading="uploading" @click="confirmPhoto">
                  {{ t('assistant.aideVideo.consultation.captureConfirm') }}
                </el-button>
              </template>

              <template v-else>
                <el-button type="primary" :disabled="captureDisabled" @click="capturePhoto">
                  <el-icon><camera /></el-icon>
                  {{ t('assistant.aideVideo.consultation.capture') }}
                </el-button>
              </template>
            </div>
          </div>
        </div>

        <aside class="capture-photos">
          <div class="capture-photos-header">
            <strong>{{ t('assistant.aideVideo.consultation.captureUploaded') }}</strong>
            <span>{{ uploadedPhotos.length }}/{{ maxCount }}</span>
          </div>

          <el-empty
            v-if="!uploadedPhotos.length"
            class="capture-empty"
            :image-size="72"
            :description="t('assistant.aideVideo.consultation.captureUploadedEmpty')"
          />

          <div v-else class="capture-photo-list">
            <div
              v-for="(photo, index) in uploadedPhotos"
              :key="photo.id"
              class="capture-photo-item"
            >
              <el-image
                class="capture-photo-image"
                :src="photo.previewUrl || photo.fileUrl"
                :preview-src-list="uploadedPhotoPreviewUrls"
                :initial-index="index"
                :z-index="3200"
                fit="cover"
                preview-teleported
                @click.prevent
              />
              <span class="capture-photo-index">{{ index + 1 }}</span>
            </div>
          </div>

          <section v-if="showRecognitionPanel" class="recognition-panel">
            <header class="recognition-header">
              <h3>{{ t('assistant.aideVideo.consultation.recognitionResult') }}</h3>
              <span v-if="recognitionStatusText" class="recognition-status">{{ recognitionStatusText }}</span>
            </header>

            <el-progress
              v-if="recognizing || recognitionProgress > 0"
              class="recognition-progress"
              :percentage="recognitionProgress"
              :format="formatRecognitionProgress"
              :status="recognitionError ? 'exception' : recognitionProgress >= 100 ? 'success' : undefined"
            />

            <p v-if="recognitionError" class="recognition-error">{{ recognitionError }}</p>

            <div v-if="recognitionReports.length" class="recognition-report-list">
              <article v-for="(report, reportIndex) in recognitionReports" :key="resolveReportKey(report, reportIndex)" class="recognition-report">
                <div class="recognition-report-title">
                  <strong>{{ t('assistant.aideVideo.consultation.recognitionReportTitle', { index: reportIndex + 1 }) }}</strong>
                </div>

                <el-table
                  :data="report.items"
                  :row-class-name="getRecognitionRowClassName"
                  size="small"
                  border
                  class="recognition-table"
                >
                  <el-table-column :label="t('assistant.aideVideo.consultation.recognitionItemName')" min-width="150">
                    <template #default="{ row, $index }">
                      <el-input
                        :model-value="row.item_name"
                        size="small"
                        @input="updateItem(reportIndex, $index, 'item_name', $event)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column :label="t('assistant.aideVideo.consultation.recognitionResultValue')" min-width="120">
                    <template #default="{ row, $index }">
                      <el-input
                        :model-value="row.result_value"
                        size="small"
                        @input="updateItem(reportIndex, $index, 'result_value', $event)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column :label="t('assistant.aideVideo.consultation.recognitionReferenceRange')" min-width="140">
                    <template #default="{ row, $index }">
                      <el-input
                        :model-value="row.reference_range"
                        size="small"
                        @input="updateItem(reportIndex, $index, 'reference_range', $event)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column :label="t('assistant.aideVideo.consultation.recognitionUnit')" min-width="100">
                    <template #default="{ row, $index }">
                      <el-input
                        :model-value="row.unit"
                        size="small"
                        @input="updateItem(reportIndex, $index, 'unit', $event)"
                      />
                    </template>
                  </el-table-column>
                </el-table>
              </article>
            </div>
          </section>
        </aside>
      </div>

      <footer class="capture-footer">
        <p>
          {{
            uploadedPhotos.length >= maxCount
              ? t('assistant.aideVideo.consultation.captureLimitReached')
              : t('assistant.aideVideo.consultation.captureHint')
          }}
        </p>

        <div class="capture-actions">
          <el-button
            v-if="recognitionReports.length"
            size="large"
            type="primary"
            :loading="recognitionSaving"
            :disabled="recognizing || recognitionSaving"
            @click="requestSave"
          >
            <el-icon><upload /></el-icon>
            {{ t('assistant.aideVideo.consultation.confirmUpload') }}
          </el-button>
          <el-button
            size="large"
            :loading="recognizing"
            :disabled="recognitionButtonDisabled"
            @click="requestRecognition"
          >
            {{ hasRecognition ? t('assistant.aideVideo.consultation.retryRecognition') : t('assistant.aideVideo.consultation.startRecognition') }}
          </el-button>
        </div>
      </footer>

      <input
        v-if="showLocalImageUpload"
        ref="localImageInputRef"
        class="capture-file-input"
        type="file"
        accept="image/*"
        @change="handleLocalImageChange"
      />
      <canvas ref="canvasRef" class="capture-canvas" aria-hidden="true" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { Camera, Close, RefreshLeft, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface CaptureDevice {
  deviceId: string
  label: string
  groupId?: string
  kind?: string
}

interface CapturePhoto {
  id: string
  name: string
  previewUrl: string
  file: File
  createdAt: number
}

interface UploadedInspectionPhoto {
  id: string
  name: string
  previewUrl: string
  fileUrl: string
  objectName: string
  createdAt: number
}

interface EditableInspectionItem {
  item_name: string
  result_value: string
  reference_range: string
  unit: string
  abnormal_flag: string
  result_status: string
  is_abnormal: boolean
}

interface EditableInspectionReport {
  reportId?: string | number
  batchId?: string | number
  fileUrl?: string
  recognizeStatus?: string | number
  errorMsg?: string
  items: EditableInspectionItem[]
}

interface CaptureResolution {
  width: number
  height: number
  key: string
  label: string
}

interface Props {
  modelValue: boolean
  device: CaptureDevice | null
  uploadedPhotos: UploadedInspectionPhoto[]
  recognitionReports: EditableInspectionReport[]
  maxCount?: number
  uploading?: boolean
  recognizing?: boolean
  recognitionSaving?: boolean
  recognitionProgress?: number
  recognitionStatusText?: string
  recognitionError?: string
  hasRecognition?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 10,
  uploading: false,
  recognizing: false,
  recognitionSaving: false,
  recognitionProgress: 0,
  recognitionStatusText: '',
  recognitionError: '',
  hasRecognition: false
})

const RESOLUTION_CANDIDATES = [
  [3840, 3104],
  [3840, 2160],
  [3264, 2448],
  [2592, 1944],
  [1920, 1080]
] as const
const PREFERRED_RESOLUTION_KEY = '1920x1080'
const DEFAULT_CAPTURE_ROTATION = 270
const FIXED_RESOLUTION_OPTIONS = RESOLUTION_CANDIDATES.map(([width, height]) => ({
  width,
  height,
  key: `${width}x${height}`,
  label: `${width} x ${height}`
}))

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'update:recognitionReports', value: EditableInspectionReport[]): void
  (event: 'capture-confirm', value: CapturePhoto): void
  (event: 'recognize'): void
  (event: 'save'): void
}>()

const { t } = useI18n()
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const localImageInputRef = ref<HTMLInputElement | null>(null)
const activeStream = ref<MediaStream | null>(null)
const streamLoading = ref(false)
const streamError = ref('')
const draftPhoto = ref<CapturePhoto | null>(null)
const resolutionOptions = ref<CaptureResolution[]>(FIXED_RESOLUTION_OPTIONS)
const selectedResolutionKey = ref(PREFERRED_RESOLUTION_KEY)
const currentResolution = ref<CaptureResolution | null>(null)
const resolutionChanging = ref(false)
const captureRotation = ref<0 | 90 | 180 | 270>(DEFAULT_CAPTURE_ROTATION)
let streamRequestId = 0

const deviceLabel = computed(() => props.device?.label || t('assistant.aideVideo.consultation.captureDeviceMissing'))
const uploadedPhotoPreviewUrls = computed(() => props.uploadedPhotos.map((photo) => photo.previewUrl || photo.fileUrl))
const currentVideoTrack = computed(() => activeStream.value?.getVideoTracks()[0] || null)
const showLocalImageUpload = import.meta.env.DEV
const resolutionSelectDisabled = computed(() => {
  return Boolean(
    streamLoading.value ||
      resolutionChanging.value ||
      !currentVideoTrack.value?.applyConstraints
  )
})
const rotationControlsDisabled = computed(() => Boolean(streamLoading.value || streamError.value || draftPhoto.value || !activeStream.value))
const localImageUploadDisabled = computed(() => {
  return Boolean(
    props.uploadedPhotos.length >= props.maxCount ||
      props.uploading ||
      props.recognizing ||
      props.recognitionSaving ||
      draftPhoto.value
  )
})
const previewMediaRotation = computed(() => (draftPhoto.value ? 0 : captureRotation.value))
const previewRotatedSideways = computed(() => captureRotation.value === 90 || captureRotation.value === 270)
const previewSourceRatio = computed(() => {
  const width = currentResolution.value?.width || 16
  const height = currentResolution.value?.height || 9

  return {
    source: `${width} / ${height}`,
    frame: previewRotatedSideways.value ? `${height} / ${width}` : `${width} / ${height}`
  }
})
const previewFrameStyle = computed(() => ({
  '--capture-source-ratio': previewSourceRatio.value.source,
  '--capture-preview-ratio': previewSourceRatio.value.frame
}))
const previewMediaStyle = computed(() => ({
  '--capture-media-rotation': `rotate(${previewMediaRotation.value}deg)`
}))
const captureDisabled = computed(() => {
  return Boolean(
    props.uploadedPhotos.length >= props.maxCount ||
      props.uploading ||
      props.recognizing ||
      streamLoading.value ||
      streamError.value ||
      draftPhoto.value ||
      !activeStream.value
  )
})
const recognitionButtonDisabled = computed(() => {
  return Boolean(!props.uploadedPhotos.length || props.uploading || props.recognizing || props.recognitionSaving)
})
const showRecognitionPanel = computed(() => {
  return Boolean(
    props.hasRecognition ||
      props.recognizing ||
      props.recognitionReports.length ||
      props.recognitionProgress > 0 ||
      props.recognitionError
  )
})

const buildResolution = (width: number, height: number): CaptureResolution => ({
  width,
  height,
  key: `${width}x${height}`,
  label: `${width} x ${height}`
})

const takePositiveNumber = (value: unknown) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

const getTrackResolution = (track: MediaStreamTrack | null): CaptureResolution | null => {
  const settings = track?.getSettings?.()
  const width = takePositiveNumber(settings?.width)
  const height = takePositiveNumber(settings?.height)

  return width && height ? buildResolution(width, height) : null
}

const getVideoResolution = (): CaptureResolution | null => {
  const video = videoRef.value
  const width = takePositiveNumber(video?.videoWidth)
  const height = takePositiveNumber(video?.videoHeight)

  return width && height ? buildResolution(width, height) : null
}

const resetResolutionOptions = () => {
  resolutionOptions.value = FIXED_RESOLUTION_OPTIONS
}

const syncCurrentResolution = () => {
  const nextResolution = getTrackResolution(currentVideoTrack.value) || getVideoResolution()
  currentResolution.value = nextResolution

  if (nextResolution && resolutionOptions.value.some((option) => option.key === nextResolution.key)) {
    selectedResolutionKey.value = nextResolution.key
    return
  }

  if (!resolutionOptions.value.some((option) => option.key === selectedResolutionKey.value)) {
    selectedResolutionKey.value = PREFERRED_RESOLUTION_KEY
  }
}

const applyResolution = async (resolution: CaptureResolution, showError: boolean) => {
  const track = currentVideoTrack.value
  if (!track?.applyConstraints) {
    return false
  }

  resolutionChanging.value = true

  try {
    await track.applyConstraints({
      width: { exact: resolution.width },
      height: { exact: resolution.height }
    })
    await nextTick()
    syncCurrentResolution()
    return true
  } catch (error) {
    console.warn('Failed to apply side scanner resolution.', error)
    syncCurrentResolution()
    if (showError) {
      ElMessage.warning(t('assistant.aideVideo.consultation.captureResolutionChangeFailed'))
    }
    return false
  } finally {
    resolutionChanging.value = false
  }
}

const initializeResolutionControls = async (stream: MediaStream) => {
  const track = stream.getVideoTracks()[0] || null
  resetResolutionOptions()

  if (!track) {
    currentResolution.value = null
    return
  }

  syncCurrentResolution()

  const preferredResolution =
    resolutionOptions.value.find((option) => option.key === PREFERRED_RESOLUTION_KEY) ||
    resolutionOptions.value[0]

  if (preferredResolution && preferredResolution.key !== selectedResolutionKey.value) {
    await applyResolution(preferredResolution, false)
  }
}

const resetResolutionControls = () => {
  resetResolutionOptions()
  selectedResolutionKey.value = PREFERRED_RESOLUTION_KEY
  currentResolution.value = null
  resolutionChanging.value = false
}

const stopActiveStream = () => {
  activeStream.value?.getTracks().forEach((track) => track.stop())
  activeStream.value = null
  resetResolutionControls()

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

const stopStream = () => {
  streamRequestId += 1
  stopActiveStream()
  streamLoading.value = false
}

const startStream = async () => {
  const requestId = streamRequestId + 1
  streamRequestId = requestId
  stopActiveStream()
  streamError.value = ''
  draftPhoto.value = null
  captureRotation.value = DEFAULT_CAPTURE_ROTATION

  if (!props.device?.deviceId) {
    streamError.value = t('assistant.aideVideo.consultation.captureDeviceMissing')
    return
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    streamError.value = t('assistant.aideVideo.consultation.captureUnsupported')
    return
  }

  streamLoading.value = true

  try {
    const nextStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: { exact: props.device.deviceId },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })

    if (requestId !== streamRequestId) {
      nextStream.getTracks().forEach((track) => track.stop())
      return
    }

    activeStream.value = nextStream
    await initializeResolutionControls(nextStream)
    await nextTick()

    if (videoRef.value) {
      videoRef.value.srcObject = nextStream
      await videoRef.value.play().catch(() => undefined)
      syncCurrentResolution()
    }
  } catch (error) {
    console.warn('Failed to start side scanner camera.', error)
    streamError.value = t('assistant.aideVideo.consultation.captureOpenFailed')
  } finally {
    if (requestId === streamRequestId) {
      streamLoading.value = false
    }
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const formatPhotoName = () => {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('')
  return `side-scanner-${stamp}.jpg`
}

const formatLocalImageName = (file: File) => {
  const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : ''
  return `local-upload-${Date.now()}${extension || '.jpg'}`
}

const createPhotoFile = (canvas: HTMLCanvasElement, name: string) => {
  return new Promise<File | null>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null)
        return
      }

      resolve(new File([blob], name, {
        type: blob.type || 'image/jpeg'
      }))
    }, 'image/jpeg', 0.92)
  })
}

const readFileAsDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error || new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
  })
}

const rotateLeft = () => {
  captureRotation.value = ((captureRotation.value + 270) % 360) as 0 | 90 | 180 | 270
}

const handleResolutionChange = async (value: string | number | boolean | undefined) => {
  const resolution = resolutionOptions.value.find((option) => option.key === String(value))
  if (!resolution) {
    syncCurrentResolution()
    return
  }

  await applyResolution(resolution, true)
}

const drawRotatedVideoFrame = (context: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement, width: number, height: number) => {
  const rotation = captureRotation.value
  const sideways = rotation === 90 || rotation === 270
  canvas.width = sideways ? height : width
  canvas.height = sideways ? width : height

  context.save()

  if (rotation === 90) {
    context.translate(canvas.width, 0)
    context.rotate(Math.PI / 2)
  } else if (rotation === 180) {
    context.translate(canvas.width, canvas.height)
    context.rotate(Math.PI)
  } else if (rotation === 270) {
    context.translate(0, canvas.height)
    context.rotate(-Math.PI / 2)
  }

  context.drawImage(video, 0, 0, width, height)
  context.restore()
}

const capturePhoto = async () => {
  if (props.uploadedPhotos.length >= props.maxCount) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureLimitReached'))
    return
  }

  const video = videoRef.value
  const canvas = canvasRef.value

  if (!video || !canvas || !activeStream.value) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureNotReady'))
    return
  }

  const width = video.videoWidth
  const height = video.videoHeight

  if (!width || !height) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureNotReady'))
    return
  }

  const context = canvas.getContext('2d')

  if (!context) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureFailed'))
    return
  }

  drawRotatedVideoFrame(context, video, canvas, width, height)
  const name = formatPhotoName()
  const file = await createPhotoFile(canvas, name)

  if (!file) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureFailed'))
    return
  }

  draftPhoto.value = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    previewUrl: canvas.toDataURL('image/jpeg', 0.92),
    file,
    createdAt: Date.now()
  }
}

const retakePhoto = () => {
  draftPhoto.value = null
}

const confirmPhoto = () => {
  if (!draftPhoto.value || props.uploading) {
    return
  }

  emit('capture-confirm', draftPhoto.value)
  draftPhoto.value = null
}

const openLocalImageUpload = () => {
  if (localImageUploadDisabled.value) {
    return
  }

  localImageInputRef.value?.click()
}

const handleLocalImageChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file || localImageUploadDisabled.value) {
    return
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureLocalImageOnly'))
    return
  }

  try {
    const previewUrl = await readFileAsDataUrl(file)
    emit('capture-confirm', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: formatLocalImageName(file),
      previewUrl,
      file,
      createdAt: Date.now()
    })
  } catch (error) {
    console.warn('Failed to read local image for side scanner upload.', error)
    ElMessage.warning(t('assistant.aideVideo.consultation.captureLocalImageReadFailed'))
  }
}

const requestRecognition = () => {
  if (!recognitionButtonDisabled.value) {
    emit('recognize')
  }
}

const requestSave = () => {
  if (!props.recognizing && !props.recognitionSaving) {
    emit('save')
  }
}

const formatRecognitionProgress = (percentage: number) => `${Math.round(percentage)}%`

const resolveReportKey = (report: EditableInspectionReport, index: number) => {
  return report.reportId ?? report.fileUrl ?? `${report.batchId || 'report'}-${index}`
}

const getRecognitionRowClassName = ({ row }: { row: EditableInspectionItem }) => {
  return row.is_abnormal ? 'is-abnormal-row' : ''
}

const updateItem = (
  reportIndex: number,
  itemIndex: number,
  key: keyof EditableInspectionItem,
  value: string | boolean
) => {
  const nextReports = props.recognitionReports.map((report, currentReportIndex) => {
    if (currentReportIndex !== reportIndex) {
      return report
    }

    return {
      ...report,
      items: report.items.map((item, currentItemIndex) => (
        currentItemIndex === itemIndex ? { ...item, [key]: value } : item
      ))
    }
  })

  emit('update:recognitionReports', nextReports)
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      void startStream()
    } else {
      stopStream()
      draftPhoto.value = null
    }
  },
  { immediate: true }
)

watch(
  () => props.device?.deviceId,
  () => {
    if (props.modelValue) {
      void startStream()
    }
  }
)

onBeforeUnmount(() => {
  stopStream()
})
</script>

<style scoped lang="scss">
.capture-mask {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(20, 35, 64, 0.34);
}

.capture-dialog {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  width: min(1766px, calc(100vw - 32px));
  height: min(820px, calc(100vh - 32px));
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 20px 50px rgba(38, 58, 96, 0.22);
}

.capture-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid rgba(65, 103, 176, 0.12);
}

.capture-header h2 {
  margin: 0;
  color: #22395f;
  font-size: 24px;
  line-height: 1.25;
}

.capture-header p {
  margin: 6px 0 0;
  color: #6d7d96;
  font-size: 15px;
}

.capture-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #415678;
  font-size: 20px;
  cursor: pointer;
}

.capture-close:hover {
  background: rgba(65, 103, 176, 0.08);
}

.capture-body {
  display: grid;
  grid-template-columns: 450px minmax(0, 1fr);
  gap: 22px;
  min-height: 0;
  overflow: hidden;
  padding: 16px 22px 18px;
}

.capture-preview-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  gap: 10px;
}

.capture-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px 12px;
  min-height: 32px;
}

.capture-rotation-controls {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.capture-resolution-control {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.capture-toolbar-label {
  flex: none;
  color: #415678;
  font-size: 14px;
  font-weight: 700;
}

.capture-resolution-select {
  width: 136px;
}

.capture-preview-stage {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 540px;
  --capture-preview-height: min(560px, calc(100vh - 260px));
}

.capture-local-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 12px;
  min-height: 44px;
}

.capture-photo-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.capture-preview {
  position: relative;
  width: 100%;
  min-height: var(--capture-preview-height);
  aspect-ratio: var(--capture-preview-ratio, 16 / 9);
  overflow: hidden;
  border-radius: 8px;
  background: #edf3fb;
  border: 1px solid rgba(57, 111, 226, 0.16);
}

.capture-preview.is-sideways {
  flex: none;
  width: auto;
  height: var(--capture-preview-height);
  min-height: 0;
  max-width: 450px;
  aspect-ratio: var(--capture-preview-ratio, 9 / 16);
}

.capture-preview video,
.capture-preview img {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  background: #101a2c;
  transform: translate(-50%, -50%) var(--capture-media-rotation, rotate(0deg));
  transform-origin: center center;
  transition: transform 0.18s ease;
}

.capture-preview.is-sideways video {
  width: var(--capture-preview-height);
  height: auto;
  aspect-ratio: var(--capture-source-ratio, 16 / 9);
}

.capture-preview.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-state {
  padding: 16px;
  color: #415678;
  font-size: 17px;
  text-align: center;
}

.preview-state.is-error,
.recognition-error {
  color: #d04d4d;
}

.capture-photos {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding-right: 2px;
}

.capture-photos-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #22395f;
  font-size: 17px;
}

.capture-photos-header span {
  color: #6d7d96;
  font-size: 15px;
}

.capture-empty {
  flex: 0 0 150px;
  min-height: 0;
  border-radius: 8px;
  background: #f7fbff;
}

.capture-photo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, 136px);
  flex: 0 0 104px;
  align-content: start;
  align-items: start;
  gap: 10px;
  overflow: hidden;
}

.capture-photo-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #edf3fb;
  border: 1px solid rgba(57, 111, 226, 0.14);
  aspect-ratio: 4 / 3;
  color: inherit;
  text-decoration: none;
}

.capture-photo-image {
  width: 100%;
  height: 100%;
}

.capture-photo-index {
  position: absolute;
  left: 6px;
  border-radius: 999px;
  background: rgba(34, 57, 95, 0.76);
  color: #ffffff;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
}

.capture-photo-index {
  top: 6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
}

.recognition-panel {
  flex: 1 1 0;
  min-height: 0;
  margin-top: 16px;
  padding-top: 14px;
  padding-right: 6px;
  overflow: auto;
  border-top: 1px solid rgba(65, 103, 176, 0.12);
  overscroll-behavior: contain;
}

.recognition-header,
.recognition-report-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.recognition-header {
  padding: 14px 0 10px;
}

.recognition-header h3 {
  margin: 0;
  color: #22395f;
  font-size: 18px;
  line-height: 1.35;
}

.recognition-status {
  border-radius: 999px;
  padding: 3px 10px;
  background: #eaf3ff;
  color: #2f6fe4;
  font-size: 13px;
}

.recognition-progress {
  margin-bottom: 10px;
}

.recognition-error {
  margin: 0 0 10px;
  font-size: 14px;
}

.recognition-report-list {
  display: grid;
  gap: 12px;
}

.recognition-report {
  display: grid;
  gap: 8px;
}

.recognition-report-title strong {
  color: #22395f;
  font-size: 15px;
}

.recognition-table {
  width: 100%;
}

.recognition-table :deep(.is-abnormal-row .el-input__inner) {
  color: #d9363e;
  font-weight: 600;
}

.capture-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 22px 18px;
  border-top: 1px solid rgba(65, 103, 176, 0.12);
}

.capture-footer p {
  min-width: 0;
  margin: 0;
  color: #6d7d96;
  font-size: 15px;
}

.capture-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.capture-canvas {
  display: none;
}

.capture-file-input {
  display: none;
}

@media (max-width: 900px) {
  .capture-dialog {
    width: min(720px, calc(100vw - 24px));
  }

  .capture-body {
    grid-template-columns: minmax(0, 1fr);
    overflow: auto;
  }

  .capture-preview-stage {
    min-height: 300px;
    --capture-preview-height: 300px;
  }

  .capture-toolbar {
    justify-content: flex-start;
  }

  .capture-local-actions {
    justify-content: flex-start;
  }

  .capture-photo-actions {
    justify-content: flex-end;
  }

  .capture-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .capture-actions {
    justify-content: flex-end;
  }
}
</style>
