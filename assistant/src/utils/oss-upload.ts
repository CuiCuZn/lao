import OSS from 'ali-oss'
import { getOssSts } from '@/api/oss'
import type { OssStsData } from '@/api/types'

export interface OssUploadFile {
  file: File
  name: string
}

export interface BuildOssObjectNameOptions {
  folder?: string
  caseId?: string | number
  videoId?: string | number
  createdAt?: number
  index: number
  fileName: string
}

export interface UploadConsultationCaptureOptions {
  caseId?: string | number
  videoId?: string | number
  files: OssUploadFile[]
}

export interface ConsultationCaptureUploadResult {
  objectName: string
  url?: string
}

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

const normalizePathPart = (value: unknown, fallback: string) => {
  const normalizedValue = String(value ?? '').trim()
  return trimSlashes(normalizedValue)
    .replace(/[\\/:*?"<>|#]+/g, '-')
    .replace(/\s+/g, '-')
    || fallback
}

const normalizeFolder = (folder: string | undefined) => {
  const normalizedFolder = trimSlashes(String(folder ?? '').trim())
  return normalizedFolder ? `${normalizedFolder}/` : ''
}

const normalizeFileName = (fileName: string) => {
  return fileName
    .trim()
    .replace(/[\\/:*?"<>|#]+/g, '-')
    .replace(/\s+/g, '-')
    || 'capture.jpg'
}

export const buildConsultationCaptureObjectName = (options: BuildOssObjectNameOptions) => {
  const folder = normalizeFolder(options.folder)
  const caseId = normalizePathPart(options.caseId, 'unknown-case')
  const videoId = normalizePathPart(options.videoId, 'unknown-video')
  const timestamp = options.createdAt || Date.now()
  const index = String(options.index + 1).padStart(2, '0')
  const fileName = normalizeFileName(options.fileName)

  return `${folder}assistant/consultation-capture/${caseId}/${videoId}/${timestamp}-${index}-${fileName}`
}

const validateOssSts = (sts: OssStsData | null | undefined) => {
  if (!sts?.accessKeyId || !sts.accessKeySecret || !sts.token || !sts.bucket || !sts.region) {
    throw new Error('Missing OSS STS credentials.')
  }

  return sts
}

const createOssClient = (sts: OssStsData) => {
  return new OSS({
    region: sts.region,
    bucket: sts.bucket,
    accessKeyId: sts.accessKeyId,
    accessKeySecret: sts.accessKeySecret,
    stsToken: sts.token,
    authorizationV4: true
  })
}

export const uploadConsultationCaptureFiles = async (
  options: UploadConsultationCaptureOptions
): Promise<ConsultationCaptureUploadResult[]> => {
  if (!options.files.length) {
    return []
  }

  const sts = validateOssSts((await getOssSts())?.data)
  const client = createOssClient(sts)

  return Promise.all(options.files.map(async (item, index) => {
    const objectName = buildConsultationCaptureObjectName({
      folder: sts.folder,
      caseId: options.caseId,
      videoId: options.videoId,
      createdAt: item.file.lastModified,
      index,
      fileName: item.name
    })
    const result = await client.put(objectName, item.file)

    return {
      objectName,
      url: result.url
    }
  }))
}
