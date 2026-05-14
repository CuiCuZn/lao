import { createVideoRoom, notifyDoctor } from '@/api/video'

interface AideVideoRoomDoctorParams {
  patientId: string
  caseId: string
  doctorId: string
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const buildVideoRoomRequest = ({ patientId, caseId, doctorId }: AideVideoRoomDoctorParams) => {
  const normalizedPatientId = takeOptionalText(patientId)
  const normalizedCaseId = takeOptionalText(caseId)
  const normalizedDoctorId = takeOptionalText(doctorId)

  if (!normalizedPatientId || !normalizedCaseId || !normalizedDoctorId) {
    throw new Error('missingParams')
  }

  return {
    patientId: normalizedPatientId,
    caseId: normalizedCaseId,
    userId: normalizedDoctorId
  }
}

export const createAideVideoRoom = async (params: AideVideoRoomDoctorParams) => {
  const requestData = buildVideoRoomRequest(params)
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
