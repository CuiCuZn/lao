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

export interface DictDataVO {
  dictCode?: number | string;
  dictLabel: string;
  dictValue: string;
  dictType?: string;
  [key: string]: unknown;
}

export interface DictDataListResponse {
  code?: number;
  msg?: string;
  rows?: DictDataVO[] | null;
  data?: DictDataVO[] | null;
  total?: number;
  [key: string]: unknown;
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
  doctorAideId?: string;
  roomId?: string;
  fourApparatusUrl?: string;
  consultationLang?: 'lo' | 'cn';
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
  doctorAideId?: string;
  roomId?: string | number;
  fourApparatusUrl?: string;
  consultationLang?: 'lo' | 'cn';
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
  doctorAideId?: string;
  roomId?: string;
  consultationLang?: 'lo' | 'cn';
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
  data?: {
    channelType?: string | number;
    channelId?: string | number;
    [key: string]: unknown;
  } | string | number | null;
  [key: string]: unknown;
}

export interface VideoRejectResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown> | string | number | null;
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

export interface VideoTimeData {
  videoStartTime?: string | number | null;
  newDate?: string | number | null;
  [key: string]: unknown;
}

export interface VideoTimeResponse {
  code?: number;
  msg?: string;
  data?: VideoTimeData | null;
  [key: string]: unknown;
}

export interface CaseListItem {
  caseId?: string | number;
  departmentName?: string;
  diagnosis?: string;
  therapy?: string;
  date?: string;
  [key: string]: unknown;
}

export interface CaseListResponse {
  code?: number;
  msg?: string;
  data?: CaseListItem[] | null;
  [key: string]: unknown;
}

export interface GenerateMedicalRecordData {
  caseId?: string | number;
  patientId?: string | number;
  mainSuitCn?: string;
  historyIllnessCn?: string;
  previousHistoryCn?: string;
  allergichistoryCn?: string;
  familyhistoryCn?: string;
  mainSuitLo?: string;
  historyIllnessLo?: string;
  previousHistoryLo?: string;
  allergichistoryLo?: string;
  familyhistoryLo?: string;
  status?: string;
  delFlag?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface GenerateMedicalRecordResponse {
  code?: number;
  msg?: string;
  data?: GenerateMedicalRecordData | null;
  [key: string]: unknown;
}

export interface DrugPrescriptionQuery {
  pageNum: number;
  pageSize: number;
  drugName?: string;
  drugModel?: string;
  drugType?: string;
}

export interface DrugPrescriptionDetailVO {
  drugDetailId?: string | number;
  drugId?: string | number;
  drugDetailName?: string;
  drugDetailUnit?: string;
  drugDetailShare?: string;
  delFlag?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface DrugPrescriptionVO {
  drugId?: string | number;
  drugName?: string;
  drugModel?: string;
  drugType?: string;
  drugUsage?: string;
  drugEffect?: string;
  drugCure?: string;
  drugAttention?: string;
  drugDetailCount?: number;
  detailList?: DrugPrescriptionDetailVO[];
  delFlag?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface DrugPrescriptionListResponse {
  code?: number;
  msg?: string;
  rows?: DrugPrescriptionVO[] | null;
  data?: DrugPrescriptionVO[] | { rows?: DrugPrescriptionVO[]; list?: DrugPrescriptionVO[]; total?: number | string } | null;
  total?: number | string;
  [key: string]: unknown;
}

export interface DrugPrescriptionResponse {
  code?: number;
  msg?: string;
  data?: DrugPrescriptionVO | null;
  [key: string]: unknown;
}

export interface CaseDrugDetailItem {
  caseDrugDetailId?: string | number;
  videoId?: string | number;
  caseId?: string | number;
  drugId?: string | number;
  drugDetailName?: string;
  drugDetailUnit?: string;
  drugDetailShare?: string;
  [key: string]: unknown;
}

export interface CaseDrugDetailData {
  caseId?: string | number;
  videoId?: string | number;
  drugId?: string | number;
  drugName?: string;
  drugModel?: string;
  drugType?: string;
  drugUsage?: string;
  drugEffect?: string;
  drugCure?: string;
  drugAttention?: string;
  detailList?: CaseDrugDetailItem[] | null;
  [key: string]: unknown;
}

export interface CaseDrugDetailResponse {
  code?: number;
  msg?: string;
  data?: CaseDrugDetailData | null;
  [key: string]: unknown;
}

export interface InspectionRecognizedItem {
  item_name?: string;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  abnormal_flag?: string;
  result_status?: string;
  is_abnormal?: boolean;
  [key: string]: unknown;
}

export interface InspectionReportItem {
  reportId?: string | number;
  batchId?: string | number;
  caseId?: string | number;
  sortNo?: string | number;
  fileUrl?: string;
  recognizeStatus?: string | number;
  errorMsg?: string;
  confidenceScore?: string | number;
  recognizedItems?: InspectionRecognizedItem[] | null;
  itemsConfirmStatus?: string | number;
  analysisStatus?: string | number;
  analysisErrorMsg?: string;
  analysisAdvice?: string[] | null;
  summaryText?: string;
  abnormalCount?: string | number;
  abnormalItems?: InspectionRecognizedItem[] | null;
  adviceItems?: string[] | null;
  fullResultJson?: string;
  [key: string]: unknown;
}

export interface InspectionBatchListByCaseIdResponse {
  code?: number;
  msg?: string;
  data?: InspectionReportItem[] | null;
  [key: string]: unknown;
}

export interface InspectionBatchListByBatchIdResponse {
  code?: number;
  msg?: string;
  data?: InspectionReportItem[] | null;
  [key: string]: unknown;
}

export interface CaseDrugDetailSaveItem {
  caseDrugDetailId?: string | number;
  videoId: string | number;
  caseId: string | number;
  drugId: string | number;
  drugDetailName: string;
  drugDetailUnit: string;
  drugDetailShare: string;
  [key: string]: unknown;
}

export interface CaseDrugDetailSaveParams {
  caseId: string | number;
  videoId: string | number;
  drugId: string | number;
  detailList: CaseDrugDetailSaveItem[];
}

export interface CaseDrugDetailSaveResponse {
  code?: number;
  msg?: string;
  data?: unknown;
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
