import { createVideoRoom, notifyDoctor } from '@/api/video'

interface AideVideoRoomDoctorParams {
  patientId: string
  caseId: string
  doctorId: string
  consultationLang?: 'lo' | 'cn'
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const buildVideoRoomRequest = (params: AideVideoRoomDoctorParams) => {
  const { patientId, caseId, doctorId } = params
  const normalizedPatientId = takeOptionalText(patientId)
  const normalizedCaseId = takeOptionalText(caseId)
  const normalizedDoctorId = takeOptionalText(doctorId)
  const consultationLang = params.consultationLang || 'lo'

  if (!normalizedPatientId || !normalizedCaseId || !normalizedDoctorId) {
    throw new Error('missingParams')
  }

  return {
    patientId: normalizedPatientId,
    caseId: normalizedCaseId,
    userId: normalizedDoctorId,
    consultationLang
  }
}

export const createAideVideoRoom = async (params: AideVideoRoomDoctorParams) => {
  const requestData = {
    ...buildVideoRoomRequest(params),
    channelType: (params.consultationLang === 'cn' ? 1 : 2) as 1 | 2
  }
  const roomResponse = await createVideoRoom(requestData)
  const roomId = takeOptionalText(roomResponse?.data)

  if (!roomId) {
    throw new Error('missingRoomId')
  }

  return roomId
}

export const notifyAideVideoRoomDoctor = async (params: AideVideoRoomDoctorParams) => {
  await notifyDoctor(buildVideoRoomRequest(params))
}
