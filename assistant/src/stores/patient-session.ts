import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPatientDetail } from '@/api/patient'

type PatientDetailRecord = Record<string, unknown> | null

export const usePatientSessionStore = defineStore('patient-session', () => {
  const patientId = ref('')
  const patientDetail = ref<PatientDetailRecord>(null)
  const doctorId = ref('')
  const caseId = ref<string | number | undefined>(undefined)
  const videoId = ref<string | number | undefined>(undefined)
  const roomId = ref('')
  const loading = ref(false)
  const error = ref('')

  const resetVideoContext = () => {
    doctorId.value = ''
    caseId.value = undefined
    videoId.value = undefined
    roomId.value = ''
  }

  const syncPatientById = async (nextPatientId: string) => {
    patientId.value = nextPatientId
    resetVideoContext()
    loading.value = true
    error.value = ''

    try {
      const response = await getPatientDetail(nextPatientId)
      patientDetail.value = (response?.data || null) as PatientDetailRecord
    } catch (err) {
      patientDetail.value = null
      error.value = err instanceof Error ? err.message : ''
    } finally {
      loading.value = false
    }
  }

  const setVideoRoomContext = (payload: {
    patientId: string
    doctorId: string
    caseId?: string | number
    videoId?: string | number
    roomId: string
  }) => {
    patientId.value = payload.patientId
    doctorId.value = payload.doctorId
    caseId.value = payload.caseId
    videoId.value = payload.videoId
    roomId.value = payload.roomId
  }

  const setPatientDetail = (nextPatientId: string, detail: PatientDetailRecord) => {
    patientId.value = nextPatientId
    patientDetail.value = detail
    loading.value = false
    error.value = ''
  }

  const setPatientDetailError = (message: string, nextPatientId?: string) => {
    if (nextPatientId) {
      patientId.value = nextPatientId
    }

    patientDetail.value = null
    loading.value = false
    error.value = message
  }

  return {
    patientId,
    patientDetail,
    doctorId,
    caseId,
    videoId,
    roomId,
    loading,
    error,
    syncPatientById,
    setPatientDetail,
    setPatientDetailError,
    setVideoRoomContext,
    resetVideoContext
  }
})
