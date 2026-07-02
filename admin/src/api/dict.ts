import request from '@/utils/request'
import { DictDataVO, ResponseData } from './types'

export interface DictTypeQuery {
  dictName?: string
  dictType?: string
  status?: string
  params?: {
    beginTime?: string
    endTime?: string
  }
  pageNum: number
  pageSize: number
}

export interface DictTypeVO {
  dictId: number
  dictName: string
  dictType: string
  status: string
  remark?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
}

export interface DictTypePageResult {
  code: number
  msg: string
  total: number
  rows: DictTypeVO[]
}

export interface DictTypeResult {
  code: number
  msg: string
  data: DictTypeVO
}

export function listDictType(query: DictTypeQuery): Promise<DictTypePageResult> {
  return request.get('/system/dict/type/list', query)
}

export function getDictType(dictId: number): Promise<DictTypeResult> {
  return request.get(`/system/dict/type/${dictId}`)
}

export function addDictType(data: Partial<DictTypeVO>): Promise<DictTypeResult> {
  return request.post('/system/dict/type', data)
}

export function updateDictType(data: Partial<DictTypeVO>): Promise<DictTypeResult> {
  return request.put('/system/dict/type', data)
}

export function delDictType(dictIds: string): Promise<any> {
  return request.delete(`/system/dict/type/${dictIds}`)
}

export function refreshCache(): Promise<any> {
  return request.delete('/system/dict/type/refreshCache')
}

export interface DictDataQuery {
  dictLabel?: string
  dictType: string
  status?: string
  pageNum: number
  pageSize: number
  params?: Record<string, any>
}

export interface DictDataPageResult {
  code: number
  msg: string
  total: number
  rows: DictDataVO[]
}

export interface DictDataResult {
  code: number
  msg: string
  data: DictDataVO
}

export function listDictData(query: { dictType: string; pageNum?: number; pageSize?: number }): Promise<DictDataPageResult> {
  return request.get('/system/dict/data/list', query)
}

export function listDictDataPage(query: DictDataQuery): Promise<DictDataPageResult> {
  return request.get('/system/dict/data/list', query)
}

export function listDictDataByType(dictType: string): Promise<ResponseData<DictDataVO[]>> {
  return request.get(`/system/dict/data/type/${dictType}`)
}

export function getDictData(dictCode: number): Promise<DictDataResult> {
  return request.get(`/system/dict/data/${dictCode}`)
}

export function addDictData(data: Partial<DictDataVO>): Promise<DictDataResult> {
  return request.post('/system/dict/data', data)
}

export function updateDictData(data: Partial<DictDataVO>): Promise<DictDataResult> {
  return request.put('/system/dict/data', data)
}

export function delDictData(dictCodes: string): Promise<any> {
  return request.delete(`/system/dict/data/${dictCodes}`)
}
