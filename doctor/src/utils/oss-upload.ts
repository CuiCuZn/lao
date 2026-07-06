import OSS from 'ali-oss'
import { getOssSts } from '@/api/oss'
import type { OssStsData, OssUploadResult } from '@/api/types'

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

const normalizePathPart = (value: unknown, fallback: string) => {
  const normalizedValue = String(value ?? '').trim()
  return trimSlashes(normalizedValue)
    .replace(/[\\/:*?"<>|#]+/g, '-')
    .replace(/\s+/g, '-')
    || fallback
}

const normalizeFileName = (fileName: string) => {
  return fileName
    .trim()
    .replace(/[\\/:*?"<>|#]+/g, '-')
    .replace(/\s+/g, '-')
    || 'file'
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

export interface UploadFileOptions {
  folder?: string;
  bizId?: string | number;
  prefix?: string;
}

export const uploadToOss = async (
  file: File,
  options: UploadFileOptions = {}
): Promise<OssUploadResult> => {
  const sts = validateOssSts((await getOssSts())?.data)
  const client = createOssClient(sts)

  const rootFolder = normalizePathPart(sts.folder, '')
  const bizFolder = normalizePathPart(options.folder || 'doctor', 'doctor')
  const bizId = options.bizId != null ? normalizePathPart(options.bizId, 'unknown') : ''
  const prefix = options.prefix || String(Date.now())
  const fileName = normalizeFileName(file.name)
  const random = Math.random().toString(36).slice(2, 8)

  const parts = [rootFolder, bizFolder, bizId].filter(Boolean)
  const objectName = `${parts.join('/')}/${prefix}-${random}-${fileName}`
  const result = await client.put(objectName, file)

  return {
    objectName,
    url: result.url,
    name: file.name
  }
}
