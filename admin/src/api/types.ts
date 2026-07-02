/**
 * 登录请求数据
 */
export interface LoginData {
  tenantId?: string;
  username?: string;
  password?: string;
  rememberMe?: boolean;
  code?: string;
  uuid?: string;
  clientId: string;
  grantType: string;
}

/**
 * 登录响应结果
 */
export interface LoginResult {
  access_token: string;
}

/**
 * 验证码响应结果
 */
export interface VerifyCodeResult {
  captchaEnabled: boolean;
  uuid?: string;
  img?: string;
}

/**
 * 租户信息
 */
export interface TenantVO {
  companyName: string;
  tenantId: string;
}

/**
 * 租户配置及列表
 */
export interface TenantInfo {
  tenantEnabled: boolean;
  voList: TenantVO[];
}

/**
 * 科室管理查询对象 (适配后端 Swagger 定义)
 */
export interface DeptQuery {
  departmentName?: string;
  departmentCode?: string;
  departmentType?: string;
  status?: string;
  pageNum: number;
  pageSize: number;
  orderByColumn?: string;
  isAsc?: string;
  /** 后端通用查询参数（beginTime/endTime 等） */
  params?: Record<string, any>;
  [key: string]: any;
}

/**
 * 科室数据项 (适配后端 Swagger 定义)
 */
export interface DeptVO {
  departmentId: string | number;
  departmentName: string;
  departmentCode: string;
  departmentType: string;
  departmentPrincipal: string; // 负责人
  departmentPhone: string; // 联系电话
  status: string;
  createTime: string;
  usefulExpressions?: string;
  /** 医生数（后端聚合返回，无则为 0） */
  doctorCount?: number;
  [key: string]: any;
}

/**
 * 科室表单对象 (适配后端 Swagger 定义)
 */
export interface DeptForm {
  departmentId?: string | number;
  departmentName: string;
  departmentCode: string;
  departmentType: string;
  departmentPrincipal: string;
  departmentPhone: string;
  status: string;
  usefulExpressions?: string; // 诊疗常用语 (后端字段名)
  phrases?: string[]; // 前端展示使用的常用语数组
}

/**
 * 字典数据项
 */
export interface DictDataVO {
  dictCode: number;
  dictSort: number;
  dictLabel: string;
  dictValue: string;
  dictType: string;
  cssClass?: string;
  listClass?: string;
  isDefault: string;
  status: string;
  remark?: string;
  createTime?: string;
}

/**
 * 字典查询对象
 */
export interface DictQuery {
  dictType: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 用户管理查询对象 (医生管理适配)
 */
export interface UserQuery {
  nickName?: string;
  userName?: string;
  phonenumber?: string;
  status?: string;
  departmentId?: string | number;
  pageNum: number;
  pageSize: number;
  /** 后端通用查询参数（beginTime/endTime 等） */
  params?: Record<string, any>;
  [key: string]: any;
}

/**
 * 用户数据项 (医生管理适配)
 */
export interface UserVO {
  userId: string | number;
  userName: string;
  nickName: string;
  phonenumber: string;
  status: string;
  createTime: string;
  deptName?: string;
  departmentId?: string | number;
  title?: string;
  jobNumber?: string;
  goodAt?: string;
  /** 头像 URL */
  avatar?: string;
  /** 个人简介 */
  remark?: string;
  /** 性别（0=男 1=女） */
  sex?: string;
  /** 出生日期 */
  birthday?: string;
  /** 执业医师证号 */
  certifiedDoctorNumber?: string;
  /** 执业证书有效期-开始 */
  certifiedStartTime?: string;
  /** 执业证书有效期-结束 */
  certifiedEndTime?: string;
  /** 执业证书文件 URL */
  certifiedUrl?: string;
  roleName?: string;
  roleNames?: string | string[];
  roles?: Array<string | number | { roleName?: string; roleKey?: string; name?: string }>;
}

/**
 * 用户表单对象 (医生管理适配)
 */
export interface UserForm {
  userId?: string | number;
  userName: string;
  nickName: string;
  password?: string;
  phonenumber: string;
  departmentId: string | number | undefined;
  status: string;
  title: string;
  jobNumber: string;
  goodAt: string;
  /** 头像 URL */
  avatar?: string;
  /** 个人简介 */
  remark?: string;
  /** 性别（0=男 1=女） */
  sex?: string;
  /** 出生日期 */
  birthday?: string;
  /** 执业医师证号 */
  certifiedDoctorNumber?: string;
  /** 执业证书有效期-开始 */
  certifiedStartTime?: string;
  /** 执业证书有效期-结束 */
  certifiedEndTime?: string;
  /** 执业证书文件 URL */
  certifiedUrl?: string;
  roleIds?: (string | number)[];
}

/**
 * 就诊记录查询对象
 */
export interface DiagnosisRecordQuery {
  patientName?: string;
  doctorName?: string;
  departmentName?: string;
  visitDate?: string;
  pageNum: number;
  pageSize: number;
}

/**
 * 就诊记录数据项
 */
export interface DiagnosisRecordVO {
  caseId?: string | number;
  recordId?: string | number;
  patientName?: string;
  doctorName?: string;
  departmentName?: string;
  visitDate?: string;
  diagnosisResult?: string;
  diagnosisStatus?: string;
  createTime?: string;
  [key: string]: unknown;
}

/**
 * 处方管理查询对象
 */
export interface DrugPrescriptionQuery {
  pageNum: number;
  pageSize: number;
  drugName?: string;
  drugModel?: string;
  drugType?: string;
}

/**
 * 处方管理数据项
 */
export interface DrugPrescriptionVO {
  drugId: string | number;
  drugName: string;
  drugModel: string;
  drugType: string;
  drugUsage: string;
  drugEffect: string;
  drugCure: string;
  drugAttention: string;
  drugDetailCount: number;
  detailList?: DrugPrescriptionDetailVO[];
  delFlag?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

/**
 * 处方药材明细
 */
export interface DrugPrescriptionDetailVO {
  drugDetailId?: string | number;
  drugId?: string | number;
  drugDetailName: string;
  drugDetailUnit: string;
  drugDetailShare: string;
  delFlag?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
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

/**
 * 新增/编辑处方表单
 */
export interface DrugPrescriptionForm {
  drugId?: string | number;
  drugName: string;
  drugModel: string;
  drugType: string;
  drugUsage: string;
  drugEffect: string;
  drugCure: string;
  drugAttention: string;
  detailList: DrugPrescriptionDetailVO[];
}

/**
 * 工作台总览数据 (适配 GET /workbench/overview)
 */
export interface WorkbenchOverviewVO {
  /** 今日接诊量 */
  todayReceptionCount?: number;
  /** 今日接诊量较昨日变化比例 */
  receptionChangeRate?: string;
  /** 接诊完成率 */
  completionRate?: string;
  /** 今日已完成接诊数 */
  completedReceptionCount?: number;
  /** 今日总接诊数 */
  totalReceptionCount?: number;
  /** 在线医生数 */
  onlineDoctorCount?: number;
  /** 医生总数 */
  totalDoctorCount?: number;
  /** 今日新增患者数 */
  todayNewPatientCount?: number;
  /** 累计患者数 */
  totalPatientCount?: number;
}

/**
 * 工作台近 7 天接诊趋势 (适配 GET /workbench/reception-trend)
 */
export interface WorkbenchTrendVO {
  /** 日期 */
  date?: string;
  /** 接诊数量 */
  count?: number;
}

/**
 * 工作台今日科室分布 (适配 GET /workbench/department-distribution)
 */
export interface WorkbenchDeptDistributionVO {
  /** 科室名称 */
  departmentName?: string;
  /** 接诊数量 */
  count?: number;
}

/**
 * 工作台今日医生排行 (适配 GET /workbench/doctor-ranking)
 */
export interface WorkbenchDoctorRankingVO {
  /** 医生 ID */
  doctorId?: string | number;
  /** 医生姓名 */
  doctorName?: string;
  /** 科室名称 */
  departmentName?: string;
  /** 今日接诊数 */
  receptionCount?: number;
  /** 今日处方数 */
  prescriptionCount?: number;
  /** 平均通话时长 */
  averageDuration?: string;
}

/**
 * 工作台最近就诊 (适配 GET /workbench/recent-visits)
 */
export interface WorkbenchRecentVisitVO {
  /** 病例 ID */
  caseId?: string | number;
  /** 患者姓名 */
  patientName?: string;
  /** 医生姓名 */
  doctorName?: string;
  /** 科室名称 */
  departmentName?: string;
  /** 诊断结果 */
  diagnosis?: string;
  /** 就诊状态 */
  status?: string;
  /** 就诊时间展示文本 */
  visitTimeText?: string;
}

/**
 * 患者管理分页查询条件 (适配 GET /patient/list 的 bo + pageQuery)
 */
export interface PatientPageQuery {
  /** 关键字：姓名模糊匹配，手机号/就诊ID精确匹配 */
  keyword?: string;
  /** 性别 */
  patientSex?: string;
  /** 创建开始时间 */
  beginCreateTime?: string;
  /** 创建结束时间 */
  endCreateTime?: string;
  pageNum: number;
  pageSize: number;
  orderByColumn?: string;
  isAsc?: string;
}

/**
 * 患者管理分页列表项 (PatientPageVo)
 */
export interface PatientPageVO {
  /** 患者ID */
  patientId?: string | number;
  /** 就诊ID */
  patientNumber?: string;
  /** 患者姓名 */
  patientName?: string;
  /** 性别 */
  patientSex?: string;
  /** 年龄 */
  patientAge?: number;
  /** 手机号 */
  patientPhone?: string;
  /** 婚况 */
  maritalStatus?: string;
  /** 职业 */
  job?: string;
  /** 就诊次数 */
  visitCount?: number;
  /** 最近就诊时间 */
  latestVisitTime?: string;
  /** 最新就诊ID */
  latestCaseId?: string | number;
  /** 创建时间 */
  createTime?: string;
}

/**
 * 患者新增/修改表单 (PatientProfileBo)
 * 必填：patientName、patientSex、patientNumber、patientPhone
 */
export interface PatientProfileForm {
  /** 患者ID；新增时不传，修改时必传 */
  patientId?: string | number;
  patientName?: string;
  patientSex?: string;
  /** 出生日期 */
  patientBirthday?: string;
  /** 就诊ID */
  patientNumber?: string;
  patientPhone?: string;
  /** 身份证号 */
  patientIdCard?: string;
  /** 婚况 */
  maritalStatus?: string;
  /** 职业 */
  job?: string;
  /** 血型【A、B、AB、O】 */
  bloodType?: string;
  /** 紧急联系人 */
  emergencyContact?: string;
  /** 紧急联系人电话 */
  emergencyContactPhone?: string;
  /** 地址 */
  address?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 患者基础资料回显 (PatientProfileVo)
 */
export interface PatientProfileVO extends PatientProfileForm {}

/**
 * 患者管理历史就诊记录项 (PatientVisitRecordVo)
 */
export interface PatientVisitRecordVO {
  /** 病例ID */
  caseId?: string | number;
  /** 就诊日期 */
  visitDate?: string;
  /** 医生姓名 */
  doctorName?: string;
  /** 科室名称 */
  departmentName?: string;
  /** 当前语言诊断结果 */
  diagnosisResult?: string;
}

/**
 * 患者管理查看详情 (PatientManageDetailVo)
 */
export interface PatientManageDetailVO {
  /** 患者基础信息 */
  basicInfo?: PatientProfileVO;
  /** 历史就诊记录 */
  visitRecords?: PatientVisitRecordVO[];
}

/**
 * 患者管理历史就诊记录查看弹窗数据 (PatientVisitDetailVo)
 */
export interface PatientVisitDetailVO {
  caseId?: string | number;
  patientId?: string | number;
  patientName?: string;
  patientAge?: number;
  patientSex?: string;
  /** 年龄/性别展示文本 */
  ageSex?: string;
  maritalStatus?: string;
  patientNumber?: string;
  patientPhone?: string;
  job?: string;
  visitDate?: string;
  departmentName?: string;
  doctorName?: string;
  /** 通话时长秒数 */
  callDurationSeconds?: number;
  /** 通话时长展示文本 */
  callDuration?: string;
  videoStartTime?: string;
  videoEndTime?: string;
  /** 主诉 */
  mainSuit?: string;
  /** 现病史 */
  historyIllness?: string;
  /** 既往史 */
  previousHistory?: string;
  /** 过敏史 */
  allergichistory?: string;
  /** 家族史 */
  familyhistory?: string;
  /** 诊断结果 */
  diagnosisResult?: string;
  /** 中医证型 */
  syndromeType?: string;
  /** 处方 */
  prescriptions?: string;
  /** 医嘱 */
  advice?: string;
}

/**
 * 通用响应包装类
 */
export interface ResponseData<T> {
  code: number;
  msg: string;
  data: T;
  total?: number;
  rows?: T; // 分页列表通常返回 rows
}

/**
 * 角色查询对象
 */
export interface RoleQuery {
  roleName?: string;
  roleKey?: string;
  status?: string;
  pageNum: number;
  pageSize: number;
  /** 后端通用查询参数（beginTime/endTime 等） */
  params?: Record<string, any>;
  [key: string]: any;
}

/**
 * 角色数据项
 */
export interface RoleVO {
  roleId: string | number;
  roleName: string;
  roleKey: string;
  roleSort?: number;
  status: string;
  remark?: string;
  createTime?: string;
  /** 用户数（后端聚合返回） */
  userCount?: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  [key: string]: any;
}

/**
 * 操作日志查询对象 (适配 GET /monitor/operlog/list)
 */
export interface OperLogQuery {
  pageNum: number;
  pageSize: number;
  /** 操作 IP */
  operIp?: string;
  /** 系统模块 */
  title?: string;
  /** 操作人员 */
  operName?: string;
  /** 业务类型（字典 sys_oper_type） */
  businessType?: string | number;
  /** 操作状态：0 成功 1 失败 */
  status?: string | number;
  /** 排序字段，默认 operTime */
  orderByColumn?: string;
  /** 排序方向，默认 descending */
  isAsc?: string;
  /** 后端通用查询参数（beginTime/endTime 等） */
  params?: Record<string, any>;
  [key: string]: any;
}

/**
 * 操作日志数据项 (适配 GET /monitor/operlog/list 返回)
 */
export interface OperLogVO {
  /** 日志主键 */
  operId: string | number;
  /** 租户 ID */
  tenantId?: string;
  /** 系统模块 */
  title?: string;
  /** 业务类型（字典 sys_oper_type） */
  businessType?: number;
  /** 业务类型数组 */
  businessTypes?: number[];
  /** 方法名称 */
  method?: string;
  /** 请求方式 */
  requestMethod?: string;
  /** 操作人类别 */
  operatorType?: number;
  /** 操作人员 */
  operName?: string;
  /** 部门名称 */
  deptName?: string;
  /** 请求 URL */
  operUrl?: string;
  /** 操作 IP */
  operIp?: string;
  /** 操作地点 */
  operLocation?: string;
  /** 请求参数 */
  operParam?: string;
  /** 返回结果 */
  jsonResult?: string;
  /** 操作状态：0 成功 1 失败 */
  status?: number;
  /** 错误消息 */
  errorMsg?: string;
  /** 操作时间 */
  operTime?: string;
  /** 消耗时间（毫秒） */
  costTime?: number;
  [key: string]: any;
}

/**
 * 登录日志查询对象 (适配 GET /monitor/logininfor/list)
 */
export interface LoginLogQuery {
  pageNum: number;
  pageSize: number;
  /** 登录 IP */
  ipaddr?: string;
  /** 用户名称 */
  userName?: string;
  /** 登录状态：0 成功 1 失败 */
  status?: string | number;
  /** 排序字段，默认 loginTime */
  orderByColumn?: string;
  /** 排序方向，默认 descending */
  isAsc?: string;
  /** 后端通用查询参数（beginTime/endTime 等） */
  params?: Record<string, any>;
  [key: string]: any;
}

/**
 * 登录日志数据项 (适配 GET /monitor/logininfor/list 返回)
 */
export interface LoginLogVO {
  /** 日志主键 */
  infoId: string | number;
  /** 租户 ID */
  tenantId?: string;
  /** 用户名称 */
  userName?: string;
  /** 客户端 key */
  clientKey?: string;
  /** 设备类型 */
  deviceType?: string;
  /** 登录 IP */
  ipaddr?: string;
  /** 登录地点 */
  loginLocation?: string;
  /** 浏览器 */
  browser?: string;
  /** 操作系统 */
  os?: string;
  /** 登录状态：0 成功 1 失败 */
  status?: string;
  /** 描述/提示消息 */
  msg?: string;
  /** 登录时间 */
  loginTime?: string;
  /** 后端通用查询参数 */
  params?: Record<string, any>;
  [key: string]: any;
}

/**
 * OSS 临时凭证数据 (适配 GET /oss/sts)
 */
export interface OssStsData {
  accessKeyId: string;
  accessKeySecret: string;
  token: string;
  bucket: string;
  region: string;
  time?: number;
  folder?: string;
  [key: string]: unknown;
}

/**
 * OSS 上传结果
 */
export interface OssUploadResult {
  /** OSS object name */
  objectName: string;
  /** 可访问 URL */
  url?: string;
  /** 原始文件名 */
  name: string;
}
