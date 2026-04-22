<template>
  <div class="app-container">
    <!-- 1. 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item :label="t('doctor.nickName')" prop="nickName">
          <el-input
            v-model="queryParams.nickName"
            :placeholder="t('doctor.inputNickName')"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item :label="t('doctor.deptName')" prop="departmentId">
          <el-select v-model="queryParams.departmentId" :placeholder="t('doctor.selectDept')" clearable style="width: 200px">
            <el-option
              v-for="dept in deptOptions"
              :key="dept.departmentId"
              :label="dept.departmentName"
              :value="dept.departmentId"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('doctor.status')" prop="status">
          <el-select v-model="queryParams.status" :placeholder="t('common.selectStatus')" clearable style="width: 150px">
            <el-option
              v-for="dict in statusOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ t('common.search') }}</el-button>
          <el-button @click="resetQuery">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 操作栏 -->
    <el-card class="table-card" shadow="never" style="margin-top: 20px">
      <div class="toolbar">
        <el-button type="primary" plain @click="handleAdd">{{ t('doctor.addDoctor') }}</el-button>
        <!-- <el-button type="warning" plain @click="handleExport">{{ t('common.export') }}</el-button> -->
      </div>

      <!-- 3. 数据表格 -->
      <el-table v-loading="loading" :data="userList" style="width: 100%; margin-top: 15px" border>
        <el-table-column label="ID" align="center" prop="userId" width="100" :show-overflow-tooltip="true" />
        <el-table-column :label="t('doctor.nickName')" align="center" prop="nickName" />
        <el-table-column :label="t('doctor.userName')" align="center" prop="userName" />
        <el-table-column :label="t('doctor.jobNumber')" align="center" prop="jobNumber" />
        <el-table-column :label="t('doctor.deptName')" align="center" prop="departmentId">
          <template #default="scope">
            <span>{{ getDeptName(scope.row.departmentId) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('doctor.title')" align="center" prop="title" />
        <el-table-column :label="t('doctor.phonenumber')" align="center" prop="phonenumber" width="120" />
        <el-table-column :label="t('doctor.status')" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column :label="t('doctor.createTime')" align="center" prop="createTime" width="160" />
        <el-table-column :label="t('common.operate')" align="center" class-name="small-padding fixed-width" width="200">
          <template #default="scope">
            <el-button link type="primary" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
            <el-button link type="primary" @click="handleUpdate(scope.row)">{{ t('common.edit') }}</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">{{ t('common.delete') }}</el-button>
            <el-button
              link
              :type="scope.row.status === '0' ? 'danger' : 'success'"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === '0' ? t('common.disable') : t('common.enable') }}
            </el-button>
            <!-- <el-button link type="primary" @click="handleResetPwd(scope.row)">{{ t('doctor.resetPwd') }}</el-button> -->
          </template>
        </el-table-column>
      </el-table>

      <!-- 4. 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-show="total > 0"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 5. 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px" append-to-body>
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="100px" :disabled="isView">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('doctor.nickName')" prop="nickName">
              <el-input v-model="form.nickName" :placeholder="t('doctor.inputNickName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('doctor.jobNumber')" prop="jobNumber">
              <el-input v-model="form.jobNumber" :placeholder="t('doctor.jobNumber')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('doctor.userName')" prop="userName">
              <el-input v-model="form.userName" :placeholder="t('doctor.inputUserName')" :disabled="!!form.userId" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!form.userId">
            <el-form-item :label="t('doctor.password')" prop="password">
              <el-input v-model="form.password" :placeholder="t('doctor.password')" type="password" show-password />
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
              <el-input v-model="form.title" :placeholder="t('doctor.inputTitle')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('doctor.phonenumber')" prop="phonenumber">
              <el-input v-model="form.phonenumber" :placeholder="t('doctor.inputPhonenumber')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="roleIds">
              <el-select v-model="singleRoleId" placeholder="请选择角色" style="width: 100%">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status === '1'"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="t('doctor.status')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in statusOptions"
                  :key="dict.dictValue"
                  :label="dict.dictValue"
                >{{ dict.dictLabel }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="t('doctor.goodAt')" prop="goodAt">
              <el-input v-model="form.goodAt" type="textarea" :rows="3" :placeholder="t('doctor.goodAt')" />
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
import {
  Search,
  Refresh,
  Plus,
  Download,
  Edit,
  View,
  Key,
  CircleClose,
  CircleCheck
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
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

// 数据状态
const loading = ref(false)
const userList = ref<UserVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isView = ref(false)
const dialogTitle = ref('')
const userFormRef = ref<FormInstance>()

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
  pageSize: 10,
  nickName: '',
  phonenumber: '',
  status: '',
  departmentId: undefined
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

// 校验规则
const rules = {
  nickName: [{ required: true, message: t('doctor.inputNickName'), trigger: 'blur' }],
  userName: [{ required: true, message: t('doctor.inputUserName'), trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
  jobNumber: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  departmentId: [{ required: true, message: t('doctor.selectDept'), trigger: 'change' }],
  title: [{ required: true, message: '请输入职称', trigger: 'blur' }],
  phonenumber: [
    { required: true, message: t('doctor.inputPhonenumber'), trigger: 'blur' },
    { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

/**
 * 根据科室 ID 获取科室名称
 * @param departmentId 
 */
const getDeptName = (departmentId: string | number) => {
  const dept = deptOptions.value.find(item => String(item.departmentId) === String(departmentId))
  return dept ? dept.departmentName : departmentId
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
  queryParams.phonenumber = ''
  queryParams.status = ''
  queryParams.departmentId = undefined
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
    // 如果有“医生”角色（假设 key 是 doctor），可以默认选中
    const doctorRole = roleOptions.value.find(r => r.roleKey === 'doctor')
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
  ElMessageBox.prompt('请输入 "' + row.nickName + '" 的新密码', t('doctor.resetPwd'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    inputPattern: /^.{5,20}$/,
    inputErrorMessage: '密码长度需在 5 到 20 个字符之间'
  }).then(async ({ value }) => {
    const [err] = await to(resetUserPwd(row.userId, value))
    if (!err) {
      ElMessage.success('重置成功')
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

/**
 * 导出操作
 */
const handleExport = () => {
  ElMessage.info('正在导出，请稍后...')
}

onMounted(() => {
  getList()
  getDeptList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
