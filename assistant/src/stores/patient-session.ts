import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPatientDetail } from '@/api/patient'

type PatientDetailRecord = Record<string, unknown> | null

export const usePatientSessionStore = defineStore('patient-session', () => {
  const patientId = ref('')
  const patientDetail = ref<PatientDetailRecord>(null)
  const doctorId = ref('')
  const doctorName = ref('')
  const doctorGoodAt = ref('')
  const caseId = ref<string | number | undefined>(undefined)
  const videoId = ref<string | number | undefined>(undefined)
  const roomId = ref('')
  const loading = ref(false)
  const error = ref('')

  const resetVideoContext = () => {
    doctorId.value = ''
    doctorName.value = ''
    doctorGoodAt.value = ''
    caseId.value = undefined
    videoId.value = undefined
    roomId.value = ''
  }

  const setCaseId = (nextCaseId?: string | number) => {
    caseId.value = nextCaseId
  }

  const syncPatientById = async (nextPatientId: string) => {
    patientId.value = nextPatientId
    resetVideoContext()
    loading.value = true
    error.value = ''

    try {
      const response = await getPatientDetail(nextPatientId)
      patientDetail.value = (response?.data || null) as PatientDetailRecord
      const nextCaseId = response?.data?.caseId
      if (nextCaseId !== undefined && nextCaseId !== null && String(nextCaseId).trim() !== '') {
        caseId.value = nextCaseId as string | number
      }
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
    doctorName?: string
    goodAt?: string
    caseId?: string | number
    videoId?: string | number
    roomId: string
  }) => {
    patientId.value = payload.patientId
    doctorId.value = payload.doctorId
    doctorName.value = payload.doctorName !== undefined ? payload.doctorName : doctorName.value
    doctorGoodAt.value = payload.goodAt !== undefined ? payload.goodAt : doctorGoodAt.value
    caseId.value = payload.caseId
    videoId.value = payload.videoId
    roomId.value = payload.roomId
  }

  const setDoctorInfo = (payload: { doctorId?: string; doctorName?: string; goodAt?: string }) => {
    if (payload.doctorId !== undefined) {
      doctorId.value = payload.doctorId
    }

    if (payload.doctorName !== undefined) {
      doctorName.value = payload.doctorName
    }

    if (payload.goodAt !== undefined) {
      doctorGoodAt.value = payload.goodAt
    }
  }

  const setPatientDetail = (nextPatientId: string, detail: PatientDetailRecord) => {
    patientId.value = nextPatientId
    patientDetail.value = detail
    const nextCaseId = detail?.caseId
    if (nextCaseId !== undefined && nextCaseId !== null && String(nextCaseId).trim() !== '') {
      caseId.value = nextCaseId as string | number
    }
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
    doctorName,
    doctorGoodAt,
    caseId,
    videoId,
    roomId,
    loading,
    error,
    syncPatientById,
    setCaseId,
    setPatientDetail,
    setPatientDetailError,
    setDoctorInfo,
    setVideoRoomContext,
    resetVideoContext
  }
})
