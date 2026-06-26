<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('userManage.nickName') }}</span>
          <el-input
            v-model="queryParams.nickName"
            :placeholder="t('userManage.inputNickName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('userManage.userName') }}</span>
          <el-input
            v-model="queryParams.userName"
            :placeholder="t('userManage.inputUserName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('userManage.phonenumber') }}</span>
          <el-input
            v-model="queryParams.phonenumber"
            :placeholder="t('userManage.inputPhonenumber')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('userManage.status') }}</span>
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
          <span class="filter-label">{{ t('userManage.createTime') }}</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            :start-placeholder="t('userManage.beginDate')"
            :end-placeholder="t('userManage.endDate')"
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
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('userManage.addUser') }}</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="userList" class="user-table" style="width: 100%">
        <el-table-column :label="t('userManage.nickName')" prop="nickName" min-width="120" />
        <el-table-column :label="t('userManage.userName')" prop="userName" min-width="120" />
        <el-table-column :label="t('userManage.role')" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <span
              v-for="(name, idx) in getRoleList(scope.row)"
              :key="idx"
              class="role-tag role-tag--primary"
            >{{ name }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('userManage.phonenumber')" prop="phonenumber" min-width="130" />
        <el-table-column :label="t('userManage.status')" prop="status" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" class="status-tags" />
          </template>
        </el-table-column>
        <el-table-column :label="t('userManage.createTime')" prop="createTime" min-width="160" />
        <el-table-column :label="t('common.operate')" width="360" fixed="right" class-name="action-col">
          <template #default="scope">
            <div class="actions">
              <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
              <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)">{{ t('common.edit') }}</el-button>
              <el-button link type="primary" :icon="Key" @click="handleResetPwd(scope.row)">{{ t('userManage.resetPwd') }}</el-button>
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
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px" append-to-body class="user-dialog">
      <el-form ref="userFormRef" class="user-form" :model="form" :rules="rules" label-width="100px" :disabled="isView">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('userManage.nickName')" prop="nickName">
              <el-input v-model="form.nickName" :placeholder="t('userManage.inputNickName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('userManage.role')" prop="roleIds">
              <el-select v-model="singleRoleId" :placeholder="t('userManage.selectRole')" style="width: 100%">
                <el-option
                  v-for="item in allowedRoleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status === '1'"
                />
                <!-- 用户管理仅可选“医生管理员”，其余角色（医生/医助等）按需求暂隐藏：roleOptions -->
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('userManage.userName')" prop="userName">
              <el-input v-model="form.userName" :placeholder="t('userManage.inputUserName')" :disabled="!!form.userId" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!form.userId">
            <el-form-item :label="t('userManage.password')" prop="password">
              <el-input v-model="form.password" :placeholder="t('userManage.password')" type="password" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="t('userManage.status')" prop="status">
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
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button v-if="!isView" type="primary" @click="submitForm">{{ t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Refresh, Plus, Edit, View, Key, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { listUser, getUser, addUser, updateUser, changeUserStatus, resetUserPwd, delUser } from '@/api/user'
import { listDept } from '@/api/dept'
import { UserQuery, UserVO, UserForm, DeptVO } from '@/api/types'
import { useDictStore } from '@/stores/dict'
import { to } from 'await-to-js'
import DictTag from '@/components/DictTag/index.vue'

const { t } = useI18n()
const dictStore = useDictStore()

// 字典数据
const statusOptions = computed(() => dictStore.getDict('sys_normal_disable'))
const deptOptions = ref<DeptVO[]>([])
const roleOptions = ref<any[]>([])

/**
 * 判断是否为"医生管理员"角色（用户管理仅保留此类角色）
 * 匹配 roleKey 含 admin 或 roleName 含"管理"/"admin"
 */
const isAdminRole = (r: any): boolean => {
  const key = String(r?.roleKey || '').toLowerCase()
  const name = String(r?.roleName || r?.name || '')
  return key.includes('admin') || /管理/.test(name) || /admin/i.test(name)
}

/**
 * 新增/编辑弹窗可选角色：仅保留"医生管理员"，排除医生/医助等其他角色
 */
const allowedRoleOptions = computed(() => roleOptions.value.filter(r => isAdminRole(r)))

/**
 * 查询用角色 ID 列表：只查"医生管理员"
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
  roleIds: [],
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
  roleIds: []
})

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// 校验规则
const rules = {
  nickName: [{ required: true, message: t('userManage.inputNickName'), trigger: 'blur' }],
  userName: [{ required: true, message: t('userManage.inputUserName'), trigger: 'blur' }],
  password: [
    { required: true, message: t('userManage.inputPassword'), trigger: 'blur' },
    { pattern: passwordPattern, message: t('userManage.passwordLength'), trigger: 'blur' }
  ],
  roleIds: [{ required: true, message: t('userManage.selectRole'), trigger: 'change' }]
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
 * 获取角色列表并筛出"医生管理员"的 roleId
 * 用于：1) 列表查询默认只查医生管理员；2) 弹窗角色下拉来源
 */
const fetchRoles = async () => {
  const [err, res] = await to(getUser())
  if (res && res.data && res.data.roles) {
    roleOptions.value = res.data.roles
    // 只保留"医生管理员"，排除医生/医助等其他角色
    queryRoleIds.value = roleOptions.value
      .filter(r => isAdminRole(r))
      .map(r => r.roleId)
    // 写入查询参数，列表默认只查医生管理员
    queryParams.roleIds = queryRoleIds.value
  }
}

/**
 * 搜索按钮操作
 */
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

/**
 * 重置查询
 */
const resetQuery = () => {
  queryParams.nickName = ''
  queryParams.userName = ''
  queryParams.phonenumber = ''
  queryParams.status = ''
  queryParams.departmentId = undefined
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
    await ElMessageBox.confirm(t('userManage.confirmStatus', { operate: operateText }), t('common.tip'), {
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
    // 新增时默认选中"医生管理员"角色
    const adminRole = roleOptions.value.find(r => isAdminRole(r))
    if (adminRole) {
      form.value.roleIds = [adminRole.roleId]
    }
  }
  dialogTitle.value = t('userManage.addUser')
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
    dialogTitle.value = t('userManage.editUser')
    dialogVisible.value = true
  }
}

/**
 * 删除按钮操作
 */
const handleDelete = async (row: UserVO) => {
  if (!row.userId) return
  try {
    await ElMessageBox.confirm(t('userManage.confirmStatus', { operate: t('common.delete') }), t('common.tip'), {
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
  dialogTitle.value = t('userManage.userDetail')
}

/**
 * 重置密码
 */
const handleResetPwd = (row: UserVO) => {
  ElMessageBox.prompt(t('userManage.newPasswordPrompt', { name: row.nickName }), t('userManage.resetPwd'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    inputPattern: passwordPattern,
    inputErrorMessage: t('userManage.passwordLength')
  }).then(async ({ value }) => {
    const [err] = await to(resetUserPwd(row.userId, row.userName, value))
    if (!err) {
      ElMessage.success(t('userManage.resetPwdSuccess'))
    }
  }).catch(() => {})
}

/**
 * 提交表单
 */
const submitForm = () => {
  userFormRef.value?.validate(async (valid) => {
    if (valid) {
      const isEdit = !!form.value.userId
      const action = isEdit ? updateUser : addUser
      const [err] = await to(action(form.value))
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
    roleIds: []
  }
  userFormRef.value?.resetFields()
}

onMounted(async () => {
  getDeptList()
  // 先获取角色并设定查询 roleIds（只查医生管理员），再拉列表
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
.user-table {
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

/* 角色标签（胶囊样式） */
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

/* 账号状态标签（覆盖 el-tag 为胶囊样式） */
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

/* 弹窗表单 */
.user-form {
  :deep(.el-form-item) {
    margin-bottom: 28px;
  }
  :deep(.el-form-item__error) {
    position: static;
    margin-top: 4px;
    line-height: 16px;
    white-space: normal;
    word-break: break-all;
  }
}
</style>
