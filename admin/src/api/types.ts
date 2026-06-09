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
  phonenumber?: string;
  status?: string;
  departmentId?: string | number;
  pageNum: number;
  pageSize: number;
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
 * 通用响应包装类
 */
export interface ResponseData<T> {
  code: number;
  msg: string;
  data: T;
  total?: number;
  rows?: T; // 分页列表通常返回 rows
}
