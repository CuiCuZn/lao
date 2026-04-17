import request from '@/utils/request'
import type { DepartmentListResponse, DoctorListResponse } from './types'

export function listDepartment(): Promise<DepartmentListResponse> {
  return request.get('/department/list')
}

export function listDepartmentDoctors(departmentId: string | number): Promise<DoctorListResponse> {
  return request.get(`/department/doctorList/${departmentId}`)
}
