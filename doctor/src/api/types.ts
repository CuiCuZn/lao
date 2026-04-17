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
  isOnLine?: string | number;
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

export interface AppRouteMeta {
  title?: string;
  icon?: string;
  viewPath?: string;
  [key: string]: unknown;
}

export interface AppRouteRecord {
  path: string;
  name?: string;
  hidden?: boolean;
  redirect?: string;
  component?: string;
  alwaysShow?: boolean;
  children?: AppRouteRecord[];
  meta?: AppRouteMeta;
  [key: string]: unknown;
}

export interface PendingConsultation {
  id: string;
  patientName: string;
  queueNo: string;
  complaint: string;
  waitMinutes: number;
  updatedAt: string;
  departmentName: string;
  sourceEvent: string;
  age?: number | string;
  sexText?: string;
  patientId?: string;
  caseId?: string;
  roomId?: string;
  historyIllness?: string;
  previousHistory?: string;
  allergichistory?: string;
  familyhistory?: string;
  raw?: unknown;
}

export type ConsultationMode = 'accept' | 'continue';

export interface ConsultationNavigationContext {
  patientName?: string;
  age?: number | string;
  sexText?: string;
  complaint?: string;
  historyIllness?: string;
  previousHistory?: string;
  allergichistory?: string;
  familyhistory?: string;
  occupation?: string;
  marriage?: string;
  caseId?: string | number;
  videoId?: string | number;
  patientId?: string | number;
  roomId?: string | number;
  consultationMode?: ConsultationMode;
  raw?: unknown;
}

export interface IncompleteConsultation {
  id: string;
  patientName: string;
  displayName?: string;
  projectName: string;
  scheduledAt: string;
  progressText: string;
  caseId?: string | number;
  patientId?: string | number;
  patientSex?: string;
  patientAge?: string | number;
  videoId?: string | number;
  roomId?: string;
  raw?: unknown;
}

export interface DiagnosisStatsData {
  todayReceptionCount?: number;
  pendingReceptionCount?: number;
  monthReceptionCount?: number;
}

export interface DiagnosisStatsResponse {
  code?: number;
  msg?: string;
  data?: DiagnosisStatsData | null;
  [key: string]: unknown;
}

export interface CurrentReceptionItem {
  caseId?: string | number;
  patientName?: string;
  patientSex?: string;
  patientAge?: string | number;
  visitDate?: string;
  diagnosisResult?: string;
  diagnosisStatus?: string;
  [key: string]: unknown;
}

export interface CurrentReceptionListResponse {
  code?: number;
  msg?: string;
  data?: CurrentReceptionItem[] | null;
  [key: string]: unknown;
}

export interface VideoGetTokenParams {
  channelId: string | number;
  userId: string | number;
}

export interface VideoGetTokenResponse {
  code?: number;
  msg?: string;
  data?: string | number | null;
  [key: string]: unknown;
}

export interface VideoGetChannelIdResponse {
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

export interface VideoConversationHistoryResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | unknown[] | null;
  [key: string]: unknown;
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

export interface VideoSaveSubtitleParams {
  videoId: string | number;
  isDoctor: 0 | 1;
  recordCn: string;
  recordLo: string;
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

export interface VideoSaveSubtitleResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | string | null;
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
