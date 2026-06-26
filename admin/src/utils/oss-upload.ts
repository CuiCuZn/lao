import OSS from 'ali-oss'
import { getOssSts } from '@/api/oss'
import type { OssStsData, OssUploadResult } from '@/api/types'

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

/**
 * 规范化路径片段：去除非法字符，空格转连字符
 */
const normalizePathPart = (value: unknown, fallback: string) => {
  const normalizedValue = String(value ?? '').trim()
  return trimSlashes(normalizedValue)
    .replace(/[\\/:*?"<>|#]+/g, '-')
    .replace(/\s+/g, '-')
    || fallback
}

/**
 * 规范化文件名
 */
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
  /** 业务目录，如 avatar / doctor-cert */
  folder?: string
  /** 业务关联 ID（如 userId），用于生成唯一路径 */
  bizId?: string | number
  /** 自定义文件名前缀，默认用时间戳 */
  prefix?: string
}

/**
 * 上传单个文件到 OSS，返回可访问 URL
 * 逻辑：先获取 STS 临时凭证 → 用 ali-oss 直传 → 返回 objectName + url
 *
 * @param file 文件对象
 * @param options 目录/业务 ID 等选项
 */
export const uploadToOss = async (
  file: File,
  options: UploadFileOptions = {}
): Promise<OssUploadResult> => {
  const sts = validateOssSts((await getOssSts())?.data)
  const client = createOssClient(sts)

  const rootFolder = normalizePathPart(sts.folder, '')
  const bizFolder = normalizePathPart(options.folder || 'admin', 'admin')
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
