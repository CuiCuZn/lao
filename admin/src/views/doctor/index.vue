<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('doctor.nickName') }}</span>
          <el-input
            v-model="queryParams.nickName"
            :placeholder="t('doctor.inputNickName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('doctor.userName') }}</span>
          <el-input
            v-model="queryParams.userName"
            :placeholder="t('doctor.inputUserName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('doctor.phonenumber') }}</span>
          <el-input
            v-model="queryParams.phonenumber"
            :placeholder="t('doctor.inputPhonenumber')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('doctor.role') }}</span>
          <el-select
            v-model="queryParams.roleFilter"
            :placeholder="t('doctor.selectRole')"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="item in allowedRoleOptions"
              :key="item.roleId"
              :label="item.roleName"
              :value="item.roleId"
              :disabled="item.status === '1'"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('doctor.status') }}</span>
          <el-select
            v-model="queryParams.status"
            :placeholder="t('common.selectStatus')"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="dict in statusOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('doctor.createTime') }}</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            :start-placeholder="t('doctor.beginDate')"
            :end-placeholder="t('doctor.endDate')"
            value-format="YYYY-MM-DD"
            unlink-panels
            class="filter-daterange"
            @change="handleDateChange"
          />
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="handleQuery">{{ t('common.search') }}</el-button>
          <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
        </div>
      </div>
    </div>

    <!-- 2. 表格卡片 -->
    <div class="card table-card">
      <!-- 操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('doctor.addDoctor') }}</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="userList" class="doctor-table" style="width: 100%">
        <el-table-column :label="t('doctor.nickName')" prop="nickName" min-width="120" />
        <el-table-column :label="t('doctor.userName')" prop="userName" min-width="120" />
        <el-table-column :label="t('doctor.jobNumber')" prop="jobNumber" min-width="100" />
        <el-table-column :label="t('doctor.role')" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <span
              v-for="(name, idx) in getRoleList(scope.row)"
              :key="idx"
              class="role-tag"
              :class="isForeignAssistant(name) ? 'role-tag--purple' : 'role-tag--primary'"
            >{{ name }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('doctor.deptName')" min-width="120">
          <template #default="scope">
            <span>{{ getDeptName(scope.row.departmentId) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('doctor.title')" prop="title" min-width="110" />
        <el-table-column :label="t('doctor.phonenumber')" prop="phonenumber" min-width="130" />
        <el-table-column :label="t('doctor.status')" prop="status" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" class="status-tags" />
          </template>
        </el-table-column>
        <el-table-column :label="t('doctor.createTime')" prop="createTime" min-width="160" />
        <el-table-column :label="t('common.operate')" width="360" fixed="right" class-name="action-col">
          <template #default="scope">
            <div class="actions">
              <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
              <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)">{{ t('common.edit') }}</el-button>
              <el-button link type="primary" :icon="Key" @click="handleResetPwd(scope.row)">{{ t('doctor.resetPwd') }}</el-button>
              <el-button
                link
                :type="scope.row.status === '0' ? 'warning' : 'success'"
                @click="handleStatusChange(scope.row)"
              >
                {{ scope.row.status === '0' ? t('common.disable') : t('common.enable') }}
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">{{ t('common.delete') }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <span class="pagination-info">{{ t('common.total', { total }) }}</span>
        <el-pagination
          v-show="total > 0"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          layout="sizes, prev, pager, next, jumper"
          background
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </div>

    <!-- 3. 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="780px" align-center append-to-body class="doctor-dialog" @closed="handleDialogClosed">
      <el-form ref="userFormRef" class="doctor-form" :model="form" :rules="rules" label-width="110px" :disabled="isView">
        <el-tabs v-model="activeTab" class="form-tabs">
          <!-- 基本信息 Tab -->
          <el-tab-pane :label="t('doctor.tabBasic')" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="t('doctor.nickName')" prop="nickName">
                  <el-input v-model="form.nickName" :placeholder="t('doctor.inputNickName')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('doctor.jobNumber')" prop="jobNumber">
                  <el-input v-model="form.jobNumber" :placeholder="t('doctor.inputJobNumber')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('doctor.deptName')" prop="departmentId">
                  <el-select v-model="form.departmentId" :placeholder="t('doctor.selectDept')" style="width: 100%">
                    <el-option
                      v-for="dept in deptOptions"
                      :key="dept.departmentId"
                      :label="dept.departmentName"
                      :value="dept.departmentId"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('doctor.title')" prop="title">
                  <el-autocomplete
                    v-model="form.title"
                    :fetch-suggestions="queryTitleSuggestions"
                    :placeholder="t('doctor.selectTitle')"
                    style="width: 100%"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('doctor.role')" prop="roleIds">
                  <el-select v-model="singleRoleId" :placeholder="t('doctor.selectRole')" style="width: 100%">
                    <el-option
                      v-for="item in allowedRoleOptions"
                      :key="item.roleId"
                      :label="item.roleName"
                      :value="item.roleId"
                      :disabled="item.status === '1'"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('doctor.phonenumber')" prop="phonenumber">
                  <el-input v-model="form.phonenumber" :placeholder="t('doctor.inputPhonenumber')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('doctor.sex')" prop="sex">
                  <el-select v-model="form.sex" :placeholder="t('doctor.selectSex')" style="width: 100%">
                    <el-option :label="t('doctor.male')" value="0" />
                    <el-option :label="t('doctor.female')" value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('doctor.birthday')" prop="birthday">
                  <el-date-picker
                    v-model="form.birthday"
                    type="date"
                    :placeholder="t('doctor.inputBirthday')"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('doctor.goodAt')" prop="goodAt">
                  <el-input v-model="form.goodAt" type="textarea" :rows="3" :placeholder="t('doctor.goodAt')" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('doctor.remark')" prop="remark">
                  <el-input v-model="form.remark" type="textarea" :rows="3" :placeholder="t('doctor.remark')" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('doctor.avatar')" prop="avatar">
                  <div class="upload-area">
                    <div v-if="form.avatar" class="avatar-preview">
                      <el-image :src="form.avatar" fit="cover" class="avatar-img" :preview-src-list="[form.avatar]" hide-on-click-modal />
                      <div v-if="!isView" class="avatar-mask">
                        <el-icon class="mask-icon" @click="previewAvatar"><ZoomIn /></el-icon>
                        <el-icon class="mask-icon" @click="removeAvatar"><Delete /></el-icon>
                      </div>
                    </div>
                    <div v-else class="upload-box" @click="triggerAvatarUpload">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <span class="upload-text">{{ t('doctor.uploadAvatar') }}</span>
                    </div>
                    <input ref="avatarInputRef" type="file" accept="image/jpeg,image/png" class="hidden-input" @change="handleAvatarChange" />
                  </div>
                  <div class="form-hint">{{ t('doctor.avatarHint') }}</div>
                  <div v-if="avatarUploading" class="upload-loading">{{ t('doctor.uploading') }}</div>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 账号信息分割线 -->
            <el-divider content-position="left">{{ t('doctor.accountSection') }}</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="t('doctor.userName')" prop="userName">
                  <el-input v-model="form.userName" :placeholder="t('doctor.inputUserName')" :disabled="!!form.userId" maxlength="20" />
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="!form.userId">
                <el-form-item :label="t('doctor.password')" prop="password">
                  <el-input v-model="form.password" :placeholder="t('doctor.inputPassword')" type="password" show-password />
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="form.userId">
                <el-form-item :label="t('doctor.status')" prop="status">
                  <el-radio-group v-model="form.status">
                    <el-radio
                      v-for="dict in statusOptions"
                      :key="dict.dictValue"
                      :value="dict.dictValue"
                    >{{ dict.dictLabel }}</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 执业资质 Tab -->
          <el-tab-pane :label="t('doctor.tabCert')" name="cert">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item :label="t('doctor.certifiedDoctorNumber')" prop="certifiedDoctorNumber">
                  <el-input v-model="form.certifiedDoctorNumber" :placeholder="t('doctor.inputCertifiedNumber')" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('doctor.certifiedTime')" prop="certifiedEndTime">
                  <div class="date-range-inline">
                    <el-date-picker
                      v-model="form.certifiedStartTime"
                      type="date"
                      :placeholder="t('doctor.selectCertifiedStart')"
                      value-format="YYYY-MM-DD"
                      class="date-range-picker"
                    />
                    <span class="date-separator">—</span>
                    <el-date-picker
                      v-model="form.certifiedEndTime"
                      type="date"
                      :placeholder="t('doctor.selectCertifiedEnd')"
                      value-format="YYYY-MM-DD"
                      class="date-range-picker"
                    />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('doctor.certifiedUrl')" prop="certifiedUrl">
                  <div class="upload-area">
                    <div v-if="!form.certifiedUrl" class="upload-box" @click="triggerCertUpload">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <span class="upload-text">{{ t('doctor.uploadCert') }}</span>
                    </div>
                    <div v-else class="asset-card">
                      <div class="asset-icon">
                        <el-icon><Document /></el-icon>
                      </div>
                      <div class="asset-info">
                        <div class="asset-name">{{ certFileName }}</div>
                        <div class="asset-meta">{{ t('doctor.uploadDone') }}</div>
                      </div>
                      <span class="asset-action" @click="previewCert">{{ t('doctor.preview') }}</span>
                      <el-icon class="asset-remove" v-if="!isView" @click="removeCert"><Close /></el-icon>
                    </div>
                    <input ref="certInputRef" type="file" accept=".pdf,image/jpeg,image/png" class="hidden-input" @change="handleCertChange" />
                  </div>
                  <div class="form-hint">{{ t('doctor.certHint') }}</div>
                  <div v-if="certUploading" class="upload-loading">{{ t('doctor.uploading') }}</div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button v-if="!isView" type="primary" :loading="submitLoading" @click="submitForm">{{ t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Refresh, Plus, Edit, View, Key, Delete, ZoomIn, Document, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { listUser, getUser, addUser, updateUser, changeUserStatus, resetUserPwd, delUser } from '@/api/user'
import { listDept } from '@/api/dept'
import { UserQuery, UserVO, UserForm, DeptVO } from '@/api/types'
import { useDictStore } from '@/stores/dict'
import { to } from 'await-to-js'
import { uploadToOss } from '@/utils/oss-upload'
import DictTag from '@/components/DictTag/index.vue'

const { t } = useI18n()
const dictStore = useDictStore()

// 字典数据
const statusOptions = computed(() => dictStore.getDict('sys_normal_disable'))
const deptOptions = ref<DeptVO[]>([])
const roleOptions = ref<any[]>([])

/**
 * 判断是否为目标角色（白名单）：仅保留"国内医生"和"国外医助"
 * 匹配 roleName 含"医生"/"医助"，或 roleKey 为 doctor/assistant
 */
const isTargetRole = (r: any): boolean => {
  const name = String(r?.roleName || r?.name || '')
  const key = String(r?.roleKey || '').toLowerCase()
  return /医生|医助/.test(name) || ['doctor', 'assistant'].includes(key)
}

/**
 * 筛选/弹窗可选角色：仅保留"国内医生"和"国外医助"
 */
const allowedRoleOptions = computed(() => roleOptions.value.filter(r => isTargetRole(r)))

/**
 * 查询用角色 ID 列表：只查"国外医助"和"国内医生"
 */
const queryRoleIds = ref<(string | number)[]>([])

// 数据状态
const loading = ref(false)
const userList = ref<UserVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isView = ref(false)
const dialogTitle = ref('')
const userFormRef = ref<FormInstance>()
const submitLoading = ref(false)

// 弹窗 Tab 切换
const activeTab = ref<'basic' | 'cert'>('basic')

// 上传状态
const avatarInputRef = ref<HTMLInputElement>()
const certInputRef = ref<HTMLInputElement>()
const avatarUploading = ref(false)
const certUploading = ref(false)

// 临床职称预设建议（可输入可选）
const titleSuggestions = [
  '主任医师', '副主任医师', '主治医师', '住院医师', '中医专家', '护士长'
]
const queryTitleSuggestions = (queryString: string, cb: (results: { value: string }[]) => void) => {
  const results = queryString
    ? titleSuggestions.filter(s => s.includes(queryString)).map(s => ({ value: s }))
    : titleSuggestions.map(s => ({ value: s }))
  cb(results)
}

// 创建时间范围（双值绑定，提交时拆到 params）
const dateRange = ref<[string, string] | []>([])

// 将 roleIds 数组转换为单选 ID 进行绑定
const singleRoleId = computed({
  get: () => (form.value.roleIds && form.value.roleIds.length > 0 ? form.value.roleIds[0] : undefined),
  set: (val) => {
    form.value.roleIds = val ? [val] : []
  }
})

// 查询参数
const queryParams = reactive<UserQuery>({
  pageNum: 1,
  pageSize: 20,
  nickName: '',
  userName: '',
  phonenumber: '',
  status: '',
  departmentId: undefined,
  // roleId: 4,
  roleIds: [],
  // 角色筛选展示字段（单选，空=全部）；实际生效字段为 roleIds
  roleFilter: '',
  params: { beginTime: undefined, endTime: undefined }
})

// 表单对象
const form = ref<UserForm>({
  userId: undefined,
  userName: '',
  nickName: '',
  password: '',
  phonenumber: '',
  departmentId: undefined,
  status: '0',
  title: '',
  jobNumber: '',
  goodAt: '',
  remark: '',
  avatar: '',
  sex: '',
  birthday: '',
  certifiedDoctorNumber: '',
  certifiedStartTime: '',
  certifiedEndTime: '',
  certifiedUrl: '',
  // roleIds: []
})

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// 校验规则
const validateCertTime = (_rule: any, _value: any, callback: any) => {
  if (form.value.certifiedStartTime && form.value.certifiedEndTime) {
    if (new Date(form.value.certifiedEndTime) < new Date(form.value.certifiedStartTime)) {
      callback(new Error(t('doctor.certEndBeforeStart')))
      return
    }
  }
  callback()
}

const rules = {
  nickName: [{ required: true, message: t('doctor.inputNickName'), trigger: 'blur' }],
  userName: [{ required: true, message: t('doctor.inputUserName'), trigger: 'blur' }],
  password: [
    { required: true, message: t('doctor.inputPassword'), trigger: 'blur' },
    { pattern: passwordPattern, message: t('doctor.passwordLength'), trigger: 'blur' }
  ],
  jobNumber: [{ required: true, message: t('doctor.inputJobNumber'), trigger: 'blur' }],
  departmentId: [{ required: true, message: t('doctor.selectDept'), trigger: 'change' }],
  title: [{ required: true, message: t('doctor.inputTitle'), trigger: 'blur' }],
  sex: [{ required: true, message: t('doctor.selectSex'), trigger: 'change' }],
  certifiedDoctorNumber: [{ required: true, message: t('doctor.inputCertifiedNumber'), trigger: 'blur' }],
  certifiedEndTime: [{ validator: validateCertTime, trigger: 'change' }],
  phonenumber: [
    { required: true, message: t('doctor.inputPhonenumber'), trigger: 'blur' },
    { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: t('doctor.invalidPhone'), trigger: 'blur' }
  ],
  roleIds: [{ required: true, message: t('doctor.selectRole'), trigger: 'change' }]
}

/**
 * 日期范围变更：写入 params.beginTime / params.endTime
 */
const handleDateChange = (val: [string, string] | []) => {
  const params = (queryParams.params ??= {})
  if (val && val.length === 2) {
    params.beginTime = val[0]
    params.endTime = val[1]
  } else {
    params.beginTime = undefined
    params.endTime = undefined
  }
}

/**
 * 根据科室 ID 获取科室名称
 */
const getDeptName = (departmentId: string | number) => {
  const dept = deptOptions.value.find(item => String(item.departmentId) === String(departmentId))
  return dept ? dept.departmentName : departmentId || '-'
}

/**
 * 提取行角色名列表（用于表格标签渲染）
 */
const getRoleList = (row: UserVO): string[] => {
  if (Array.isArray(row.roleNames)) {
    return row.roleNames.filter(Boolean)
  }
  if (row.roleNames) return [String(row.roleNames)]
  if (row.roleName) return [String(row.roleName)]
  if (Array.isArray(row.roles)) {
    return row.roles
      .map((role: any) => {
        if (typeof role === 'string' || typeof role === 'number') return String(role)
        return role.roleName || role.name || role.roleKey || ''
      })
      .filter(Boolean)
  }
  return []
}

/**
 * 判断角色是否为"国外医助"（用于紫色标签）
 */
const isForeignAssistant = (name: string) => {
  return /医助|国外|助理/i.test(name)
}

/**
 * 获取列表数据
 */
const getList = async () => {
  loading.value = true
  const [err, res] = await to(listUser(queryParams))
  if (res) {
    userList.value = res.rows || []
    total.value = res.total || 0
  }
  loading.value = false
}

/**
 * 获取科室下拉列表
 */
const getDeptList = async () => {
  const [err, res] = await to(listDept({ pageNum: 1, pageSize: 100 } as any))
  if (res) {
    deptOptions.value = res.rows || []
  }
}

/**
 * 获取角色列表并筛出"国外医助"和"国内医生"的 roleId
 * 用于：1) 列表查询默认只查这两类角色；2) 弹窗角色下拉来源
 */
const fetchRoles = async () => {
  const [err, res] = await to(getUser())
  if (res && res.data && res.data.roles) {
    roleOptions.value = res.data.roles
    // 只保留"国内医生"和"国外医助"
    queryRoleIds.value = roleOptions.value
      .filter(r => isTargetRole(r))
      .map(r => r.roleId)
    // 写入查询参数，列表默认只查这两类角色
    queryParams.roleIds = queryRoleIds.value
  }
}

/**
 * 搜索按钮操作
 * roleFilter 为空 → roleIds 默认查"国内医生"和"国外医助"
 * roleFilter 有值 → roleIds 只查该角色
 */
const handleQuery = () => {
  queryParams.roleIds = queryParams.roleFilter
    ? [queryParams.roleFilter]
    : [...queryRoleIds.value]
  queryParams.pageNum = 1
  getList()
}

/**
 * 重置查询
 * roleFilter 清空（下拉显示"全部"），roleIds 恢复默认查两类角色
 */
const resetQuery = () => {
  queryParams.nickName = ''
  queryParams.userName = ''
  queryParams.phonenumber = ''
  queryParams.status = ''
  queryParams.departmentId = undefined
  queryParams.roleFilter = ''
  queryParams.roleIds = [...queryRoleIds.value]
  if (queryParams.params) {
    queryParams.params.beginTime = undefined
    queryParams.params.endTime = undefined
  }
  dateRange.value = []
  queryParams.pageSize = 20
  handleQuery()
}

/**
 * 状态切换
 */
const handleStatusChange = async (row: UserVO) => {
  const newStatus = row.status === '0' ? '1' : '0'
  const operateText = newStatus === '0' ? t('common.enable') : t('common.disable')
  try {
    await ElMessageBox.confirm(t('doctor.confirmStatus', { operate: operateText }), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    const [err] = await to(changeUserStatus(row.userId, newStatus))
    if (!err) {
      ElMessage.success(t('common.operateSuccess'))
      getList()
    }
  } catch {}
}

/**
 * 新增按钮操作
 */
const handleAdd = async () => {
  reset()
  isView.value = false
  const [err, res] = await to(getUser())
  if (res && res.data) {
    roleOptions.value = res.data.roles
    // 新增默认选中"国内医生"：优先按 roleName 匹配，兜底 roleKey=doctor
    const doctorRole = roleOptions.value.find(r => /医生/.test(r.roleName) && !/医助/.test(r.roleName))
      || roleOptions.value.find(r => r.roleKey === 'doctor')
    if (doctorRole) {
      form.value.roleIds = [doctorRole.roleId]
    }
  }
  dialogTitle.value = t('doctor.addDoctor')
  dialogVisible.value = true
}

/**
 * 修改按钮操作
 */
const handleUpdate = async (row: UserVO) => {
  reset()
  isView.value = false
  const [err, res] = await to(getUser(row.userId))
  if (res && res.data) {
    const data = res.data.user
    roleOptions.value = res.data.roles
    form.value = {
      ...data,
      departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      roleIds: res.data.roleIds || []
    }
    dialogTitle.value = t('doctor.editDoctor')
    dialogVisible.value = true
  }
}

/**
 * 删除按钮操作
 */
const handleDelete = async (row: UserVO) => {
  if (!row.userId) return
  try {
    await ElMessageBox.confirm(t('doctor.confirmStatus', { operate: t('common.delete') }), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    const [err] = await to(delUser(row.userId))
    if (!err) {
      ElMessage.success(t('common.operateSuccess'))
      getList()
    }
  } catch {}
}

/**
 * 详情查看
 */
const handleDetail = async (row: UserVO) => {
  await handleUpdate(row)
  isView.value = true
  dialogTitle.value = t('doctor.doctorDetail')
}

/**
 * 重置密码
 */
const handleResetPwd = (row: UserVO) => {
  ElMessageBox.prompt(t('doctor.newPasswordPrompt', { name: row.nickName }), t('doctor.resetPwd'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    inputPattern: passwordPattern,
    inputErrorMessage: t('doctor.passwordLength')
  }).then(async ({ value }) => {
    const [err] = await to(resetUserPwd(row.userId, row.userName, value))
    if (!err) {
      ElMessage.success(t('doctor.resetPwdSuccess'))
    }
  }).catch(() => {})
}

/**
 * 提交表单
 */
const submitForm = () => {
  userFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      const isEdit = !!form.value.userId
      const action = isEdit ? updateUser : addUser
      const [err] = await to(action(form.value))
      submitLoading.value = false
      if (!err) {
        ElMessage.success(isEdit ? t('common.editSuccess') : t('common.addSuccess'))
        dialogVisible.value = false
        getList()
      }
    }
  })
}

/**
 * 重置表单
 */
const reset = () => {
  form.value = {
    userId: undefined,
    userName: '',
    nickName: '',
    password: '',
    phonenumber: '',
    departmentId: undefined,
    status: '0',
    title: '',
    jobNumber: '',
    goodAt: '',
    remark: '',
    avatar: '',
    sex: '',
    birthday: '',
    certifiedDoctorNumber: '',
    certifiedStartTime: '',
    certifiedEndTime: '',
    certifiedUrl: '',
    roleIds: []
  }
  activeTab.value = 'basic'
  userFormRef.value?.resetFields()
}

/** 弹窗关闭后重置上传状态 */
const handleDialogClosed = () => {
  avatarUploading.value = false
  certUploading.value = false
}

// ===== 文件/头像上传（先传 OSS 拿 URL，保存时提交 URL）=====

/** 校验文件类型与大小 */
const validateFile = (file: File, type: 'avatar' | 'cert'): boolean => {
  const isAvatar = type === 'avatar'
  const allowTypes = isAvatar ? ['image/jpeg', 'image/png'] : ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowTypes.includes(file.type)) {
    ElMessage.error(t('doctor.invalidFileType'))
    return false
  }
  const maxMB = isAvatar ? 2 : 5
  if (file.size > maxMB * 1024 * 1024) {
    ElMessage.error(t('doctor.fileTooLarge', { size: `${maxMB}MB` }))
    return false
  }
  return true
}

/** 触发头像选择 */
const triggerAvatarUpload = () => avatarInputRef.value?.click()

/** 头像文件选择变化 → 上传 OSS */
const handleAvatarChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!validateFile(file, 'avatar')) {
    target.value = ''
    return
  }
  avatarUploading.value = true
  const [err, res] = await to(uploadToOss(file, { folder: 'doctor/avatar', bizId: form.value.userId }))
  avatarUploading.value = false
  target.value = ''
  if (err || !res?.url) {
    ElMessage.error(t('doctor.uploadFailed'))
    return
  }
  form.value.avatar = res.url
  ElMessage.success(t('doctor.uploadSuccess'))
}

/** 预览头像 */
const previewAvatar = () => {
  if (form.value.avatar) window.open(form.value.avatar, '_blank')
}

/** 移除头像 */
const removeAvatar = () => {
  form.value.avatar = ''
}

/** 触发证书选择 */
const triggerCertUpload = () => certInputRef.value?.click()

/** 证书文件选择变化 → 上传 OSS */
const handleCertChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!validateFile(file, 'cert')) {
    target.value = ''
    return
  }
  certUploading.value = true
  const [err, res] = await to(uploadToOss(file, { folder: 'doctor/cert', bizId: form.value.userId }))
  certUploading.value = false
  target.value = ''
  if (err || !res?.url) {
    ElMessage.error(t('doctor.uploadFailed'))
    return
  }
  form.value.certifiedUrl = res.url
  certFileNameCache.value = res.name || file.name
  ElMessage.success(t('doctor.uploadSuccess'))
}

/** 证书文件名：优先用上传返回的缓存名，否则从 URL 解析 */
const certFileNameCache = ref('')
const certFileName = computed(() => {
  if (certFileNameCache.value) return certFileNameCache.value
  const url = form.value.certifiedUrl
  if (!url) return ''
  try {
    const decoded = decodeURIComponent(url)
    return decoded.slice(decoded.lastIndexOf('/') + 1)
  } catch {
    return url.slice(url.lastIndexOf('/') + 1)
  }
})

/** 预览证书 */
const previewCert = () => {
  if (form.value.certifiedUrl) window.open(form.value.certifiedUrl, '_blank')
}

/** 移除证书 */
const removeCert = async () => {
  try {
    await ElMessageBox.confirm(t('doctor.confirmRemoveFile'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    form.value.certifiedUrl = ''
    certFileNameCache.value = ''
  } catch {}
}

onMounted(async () => {
  getDeptList()
  // 先获取角色并设定查询 roleIds（只查国外医助和国内医生），再拉列表
  await fetchRoles()
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 0;
}

/* 卡片 */
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}
.search-card {
  padding: 20px 24px;
}
.table-card {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
}

/* 筛选区 */
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: flex-end;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}
.filter-input,
.filter-select {
  width: 180px;
}
.filter-daterange {
  width: 260px;
}
.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;
}

/* 表格 */
.doctor-table {
  width: 100%;
  display: block;
  :deep(thead th) {
    background: #fafbfc;
    color: #606266;
    font-weight: 600;
  }
  :deep(tbody tr:hover > td) {
    background: #f5f8ff;
  }
}
/* 角色标签（原型胶囊样式） */
.role-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  margin-right: 4px;
}
.role-tag--primary {
  background: #ecf5ff;
  color: #409eff;
}
.role-tag--purple {
  background: #f3edff;
  color: #8b5cf6;
}

/* 账号状态标签（覆盖 el-tag 为原型胶囊样式） */
.status-tags {
  :deep(.el-tag) {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    height: auto;
    border: none;
  }
}

.action-col {
  .actions {
    display: flex;
    gap: 2px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  :deep(.el-button) {
    padding-left: 6px;
    padding-right: 6px;
  }
}

/* 分页 */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
  width: 100%;
}
.pagination-info {
  font-size: 13px;
  color: #909399;
}

/* 弹窗：固定高度，body 区域内部滚动 */
.doctor-dialog {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    max-height: calc(100vh - 60px);
  }
  :deep(.el-dialog__header) {
    flex-shrink: 0;
    margin-right: 0;
  }
  :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
  :deep(.el-dialog__footer) {
    flex-shrink: 0;
  }
}

/* 弹窗表单 */
.doctor-form {
  :deep(.el-form-item) {
    margin-bottom: 22px;
  }
  :deep(.el-form-item__error) {
    position: static;
    margin-top: 4px;
    line-height: 16px;
    white-space: normal;
    word-break: break-all;
  }
}

/* Tab 样式 */
.form-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
  :deep(.el-tabs__nav-wrap)::after {
    height: 1px;
  }
}

/* 上传区 */
.upload-area {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.upload-box {
  width: 100px;
  height: 100px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  gap: 6px;
  transition: all 0.2s;
  &:hover {
    border-color: #409eff;
    color: #409eff;
  }
}
.upload-icon {
  font-size: 24px;
}
.upload-text {
  font-size: 12px;
}
.hidden-input {
  display: none;
}

/* 头像预览 */
.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid #ebeef5;
}
.avatar-img {
  width: 100%;
  height: 100%;
}
.avatar-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  .mask-icon {
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    &:hover {
      color: #409eff;
    }
  }
}
.avatar-preview:hover .avatar-mask {
  opacity: 1;
}

/* 证书文件卡片 */
.asset-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  flex: 1;
  max-width: 360px;
}
.asset-icon {
  width: 40px;
  height: 40px;
  background: #ecf5ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 20px;
  flex-shrink: 0;
}
.asset-info {
  flex: 1;
  min-width: 0;
}
.asset-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.asset-meta {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}
.asset-action {
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    color: #66b1ff;
  }
}
.asset-remove {
  color: #f56c6c;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    color: #f78989;
  }
}

/* 日期范围内联 */
.date-range-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.date-range-picker {
  flex: 1;
}
.date-separator {
  color: #909399;
  font-size: 13px;
  flex-shrink: 0;
}

/* 提示文字 */
.form-hint {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}
.upload-loading {
  font-size: 12px;
  color: #409eff;
  margin-top: 4px;
}

/* 分割线 */
:deep(.el-divider__text) {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}
</style>
