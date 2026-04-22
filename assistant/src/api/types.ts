export interface LoginData {
  tenantId?: string;
  username?: string;
  password?: string;
  rememberMe?: boolean;
  code?: string;
  uuid?: string;
  clientId?: string;
  grantType?: string;
}

export interface LoginResult {
  access_token: string;
}

export interface VerifyCodeResult {
  captchaEnabled: boolean;
  uuid?: string;
  img?: string;
}

export interface TenantVO {
  companyName: string;
  tenantId: string;
}

export interface TenantInfo {
  tenantEnabled: boolean;
  voList: TenantVO[];
}

export interface UserProfile {
  userId?: string | number;
  userName: string;
  nickName: string;
  avatar?: string;
  deptName?: string;
  departmentName?: string;
  title?: string;
  postName?: string;
  phonenumber?: string;
  phoneNumber?: string;
  email?: string;
  sex?: string;
  [key: string]: unknown;
}

export interface UserInfoResult {
  user: UserProfile;
  roles: string[];
  permissions: string[];
}

export type PatientVerifyType = 0 | 1 | 2;

export interface PatientVerifyParams {
  verifyType: PatientVerifyType;
  verifyCode: string;
}

export interface PatientVerifyResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PatientSaveParams {
  patientId?: number;
  patientName: string;
  patientSex: string;
  patientBirthday: string;
  patientIdCard: string;
  patientPhone: string;
  medicalAccount: string;
  address: string;
  caseId?: number;
  mainSuit: string;
  historyIllness: string;
  previousHistory: string;
  allergichistory: string;
  familyhistory: string;
}

export interface PatientSaveResponse {
  code?: number;
  msg?: string;
  data?: {
    patientId?: number | string;
    caseId?: number | string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface PatientDetailResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PatientWsTokenResponse {
  code?: number;
  msg?: string;
  data?: string | null;
  [key: string]: unknown;
}

export interface DepartmentTranslateParams {
  source: string;
  to: string;
  text: string;
}

export interface DepartmentTranslateResponse {
  code?: number;
  msg?: string;
  data?: string | Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface WrittenAddParams {
  caseId: string | number;
  isDoctor: 0 | 1;
  contentCn: string;
  contentLo: string;
}

export interface WrittenAddResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | string | null;
  [key: string]: unknown;
}

export interface DepartmentListResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown>[] | null;
  rows?: Record<string, unknown>[] | null;
  total?: number;
  [key: string]: unknown;
}

export interface CaseRecordListParams {
  searchInfo: string;
  checkInfo: number;
  pageSize: number;
  pageNum: number;
}

export interface CaseRecordItem {
  searchInfo?: string;
  checkInfo?: number;
  contentLanguage?: string;
  caseId?: string | number;
  caseID?: string | number;
  medicalCaseId?: string | number;
  patientId?: string | number;
  patId?: string | number;
  patientNumber?: string;
  patientName?: string;
  patientAge?: string | number;
  patientBirthday?: string;
  patientSex?: string;
  doctorId?: string | number;
  userId?: string | number;
  doctorUserId?: string | number;
  receiveDoctorId?: string | number;
  receptionDoctorId?: string | number;
  attendingDoctorId?: string | number;
  nickName?: string;
  title?: string;
  departmentId?: string | number;
  departmentName?: string;
  roomId?: string | number;
  channelId?: string | number;
  mainSuit?: string;
  status?: string;
  visitDate?: string;
  createTime?: string;
  updateTime?: string;
  registerTime?: string;
  [key: string]: unknown;
}

export interface CaseRecordListResponse {
  total?: number;
  rows?: CaseRecordItem[] | null;
  code?: number;
  msg?: string;
  [key: string]: unknown;
}

export interface CaseDetailResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface DoctorListResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown>[] | null;
  rows?: Record<string, unknown>[] | null;
  total?: number;
  [key: string]: unknown;
}

export interface VideoCreateRoomParams {
  patientId: string | number;
  caseId?: string | number;
  userId?: string | number;
}

export interface VideoGetTokenParams {
  channelId: string | number;
  userId: string | number;
}

export interface VideoOpenSubtitleParams {
  channelId: string;
  taskId: string;
  sourceLanguage: string;
}

export interface VideoCloseSubtitleParams {
  channelId: string;
  taskId: string;
}

export interface VideoCreateRoomResponse {
  code?: number;
  msg?: string;
  data?: string | number | null;
  [key: string]: unknown;
}

export interface VideoGetTokenResponse {
  code?: number;
  msg?: string;
  data?: string | number | null;
  [key: string]: unknown;
}

export interface VideoGetVideoIdResponse {
  code?: number;
  msg?: string;
  data?: string | number | null;
  [key: string]: unknown;
}

export interface VideoSaveSubtitleParams {
  videoId: string | number;
  isDoctor: 0 | 1;
  recordCn: string;
  recordLo: string;
}

export interface VideoSaveSubtitleResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | string | null;
  [key: string]: unknown;
}

export interface VideoOpenSubtitleResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | string | null;
  [key: string]: unknown;
}

export interface VideoCloseSubtitleResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | string | null;
  [key: string]: unknown;
}
