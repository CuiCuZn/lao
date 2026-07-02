import request from '@/utils/request'
import axios from 'axios'
import { getToken } from '@/utils/auth'

export interface CorpusQuery {
  corpusType?: string
  subjectType?: string
  categoryCode?: string
  bizLabelCode?: string
  bizTypeCode?: string
  keyword?: string
  status?: string
  beginCreateTime?: string
  endCreateTime?: string
  pageNum: number
  pageSize: number
}

export interface CorpusVO {
  corpusId: number
  corpusType: string
  subjectType: string
  categoryCode: string
  bizLabelCode: string
  bizTypeCode: string
  cnContent: string
  loContent: string
  acupointLocationCn?: string
  acupointLocationLo?: string
  acupointIndicationCn?: string
  acupointIndicationLo?: string
  acupointRetentionTime?: string
  acupointMethodDetail?: string
  acupointMediaUrls?: string
  acupointMediaLabel?: string
  remark?: string
  status: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
}

export interface CorpusForm {
  corpusId?: number
  corpusType: string
  subjectType?: string
  categoryCode?: string
  bizLabelCode?: string
  bizTypeCode?: string
  cnContent?: string
  loContent?: string
  acupointLocationCn?: string
  acupointLocationLo?: string
  acupointIndicationCn?: string
  acupointIndicationLo?: string
  acupointRetentionTime?: string
  acupointMethodDetail?: string
  acupointMediaUrls?: string
  acupointMediaLabel?: string
  remark?: string
  status?: string
}

export interface CorpusPageResult {
  code: number
  msg: string
  total: number
  rows: CorpusVO[]
}

export interface CorpusResult {
  code: number
  msg: string
  data: CorpusVO
}

export const CORPUS_TYPE = {
  HERB: 'HERB',
  WESTERN_DRUG: 'WESTERN_DRUG',
  SYNDROME: 'SYNDROME',
  ADVICE: 'ADVICE',
  CONSULTATION: 'CONSULTATION',
  ACUPOINT: 'ACUPOINT'
} as const

export const SUBJECT_TYPE = {
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT'
} as const

export function listCorpus(query: CorpusQuery): Promise<CorpusPageResult> {
  return request.get('/corpus/list', query)
}

export function getCorpus(corpusId: number): Promise<CorpusResult> {
  return request.get(`/corpus/selectOne/${corpusId}`)
}

export function saveCorpus(data: CorpusForm): Promise<CorpusResult> {
  return request.post('/corpus/save', data)
}

export function removeCorpus(corpusId: number): Promise<any> {
  return request.post(`/corpus/remove/${corpusId}`)
}

function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function exportCorpus(query: Partial<CorpusQuery>, filename: string): Promise<void> {
  const baseURL = import.meta.env.VITE_API_URL || '/lao-api'
  const token = getToken()
  const clientId = import.meta.env.VITE_APP_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e'
  const response = await axios.post(`${baseURL}/corpus/export`, query, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'clientid': clientId,
      'Content-Type': 'application/json;charset=utf-8'
    },
    responseType: 'blob'
  })
  const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadFile(blob, filename)
}

export async function importTemplate(templatePath: string, filename: string): Promise<void> {
  const baseURL = import.meta.env.VITE_API_URL || '/lao-api'
  const token = getToken()
  const clientId = import.meta.env.VITE_APP_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e'
  const response = await axios.post(`${baseURL}${templatePath}`, {}, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'clientid': clientId
    },
    responseType: 'blob'
  })
  const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadFile(blob, filename)
}

export const TEMPLATE_PATHS = {
  WESTERN_DRUG: '/corpus/importTemplate/westernDrug',
  SYNDROME: '/corpus/importTemplate/syndrome',
  HERB: '/corpus/importTemplate/herb',
  ADVICE: '/corpus/importTemplate/advice',
  ACUPOINT: '/corpus/importTemplate/acupoint',
  CONSULTATION_DOCTOR: '/corpus/importTemplate/consultation/doctor',
  CONSULTATION_PATIENT: '/corpus/importTemplate/consultation/patient'
} as const

export interface ImportResult {
  code: number
  msg: string
  totalNum?: number
  successNum?: number
  failNum?: number
}

export async function importData(file: File, corpusType: string, subjectType?: string, updateSupport: boolean = false): Promise<ImportResult> {
  const baseURL = import.meta.env.VITE_API_URL || '/lao-api'
  const token = getToken()
  const clientId = import.meta.env.VITE_APP_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e'
  const formData = new FormData()
  formData.append('file', file)
  formData.append('corpusType', corpusType)
  if (subjectType) {
    formData.append('subjectType', subjectType)
  }
  formData.append('updateSupport', String(updateSupport))
  const response = await axios.post(`${baseURL}/corpus/importData`, formData, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'clientid': clientId,
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}
