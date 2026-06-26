<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('dept.deptName') }}</span>
          <el-input
            v-model="queryParams.departmentName"
            :placeholder="t('dept.inputDeptName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('dept.deptType') }}</span>
          <el-select
            v-model="queryParams.departmentType"
            :placeholder="t('dept.selectDeptType')"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="dict in sysDeptOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('dept.status') }}</span>
          <el-select
            v-model="queryParams.status"
            :placeholder="t('dept.selectStatus')"
            clearable
            class="filter-select"
          >
            <el-option :label="t('common.statusNormal')" value="0" />
            <el-option :label="t('common.statusStop')" value="1" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('dept.createTime') }}</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            :start-placeholder="t('dept.beginDate')"
            :end-placeholder="t('dept.endDate')"
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
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('dept.addDept') }}</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="deptList" class="dept-table" style="width: 100%">
        <el-table-column :label="t('dept.deptName')" min-width="180">
          <template #default="scope">
            <div class="dept-info">
              <div class="dept-name">{{ scope.row.departmentName }}</div>
              <div class="dept-sub">{{ getDeptTypeLabel(scope.row.departmentType) }}<template v-if="scope.row.doctorCount != null"> · {{ scope.row.doctorCount }}{{ t('dept.doctorUnit') }}</template></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('dept.deptCode')" prop="departmentCode" min-width="100" />
        <el-table-column :label="t('dept.deptType')" min-width="120">
          <template #default="scope">
            <span
              class="type-tag"
              :class="isMedicalTech(scope.row.departmentType) ? 'type-tag--purple' : 'type-tag--primary'"
            >{{ getDeptTypeLabel(scope.row.departmentType) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('dept.leader')" prop="departmentPrincipal" min-width="110" />
        <el-table-column :label="t('dept.phone')" prop="departmentPhone" min-width="130" />
        <el-table-column :label="t('dept.doctorCount')" min-width="90" align="center">
          <template #default="scope">
            <span>{{ scope.row.doctorCount != null ? scope.row.doctorCount : 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('dept.status')" prop="status" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="sysStatusOptions" :value="scope.row.status" class="status-tags" />
          </template>
        </el-table-column>
        <el-table-column :label="t('dept.createTime')" prop="createTime" min-width="160" />
        <el-table-column :label="t('common.operate')" width="280" fixed="right" class-name="action-col">
          <template #default="scope">
            <div class="actions">
              <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
              <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)">{{ t('common.edit') }}</el-button>
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

    <!-- 3. 新增/编辑对话框（保持原有逻辑不动） -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="100px" :disabled="isView">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('dept.deptName')" prop="departmentName">
              <el-input v-model="form.departmentName" :placeholder="t('dept.inputDeptName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.deptCode')" prop="departmentCode">
              <el-input v-model="form.departmentCode" :placeholder="t('dept.inputDeptCode')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.deptType')" prop="departmentType">
              <el-select v-model="form.departmentType" :placeholder="t('dept.selectDeptType')" style="width: 100%">
                <el-option
                  v-for="dict in sysDeptOptions"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="dict.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.leader')" prop="departmentPrincipal">
              <el-input v-model="form.departmentPrincipal" :placeholder="t('dept.inputLeader')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.phone')" prop="departmentPhone">
              <el-input v-model="form.departmentPhone" :placeholder="t('dept.inputPhone')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.status')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="0">{{ t('common.statusNormal') }}</el-radio>
                <el-radio value="1">{{ t('common.statusStop') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 特殊项：诊疗常用语管理 -->
        <el-divider content-position="left">{{ t('dept.phrases') }}</el-divider>
        <div class="phrases-section">
          <div v-for="(phrase, index) in form.phrases" :key="index" class="phrase-item">
            <el-input v-if="form.phrases" v-model="form.phrases[index]" :placeholder="t('dept.inputPhrase')" style="width: 80%" />
            <el-button v-if="!isView" type="danger" link :icon="Minus" @click="removePhrase(index)" />
          </div>
          <el-button v-if="!isView" type="primary" link :icon="Plus" @click="addPhrase">{{ t('dept.addPhrase') }}</el-button>
        </div>
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
import { Search, Refresh, Plus, Edit, View, Delete, Minus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { listDept, addDept, updateDept, removeDept, delDept } from '@/api/dept'
import { DeptQuery, DeptVO, DeptForm } from '@/api/types'
import { useDictStore } from '@/stores/dict'
import { to } from 'await-to-js'
import DictTag from '@/components/DictTag/index.vue'

const { t } = useI18n()
const dictStore = useDictStore()

// 获取科室字典数据
const sysDeptOptions = computed(() => dictStore.getDict('sys_dept'))
const sysStatusOptions = computed(() => [
  { dictLabel: t('common.statusNormal'), dictValue: '0', listClass: 'primary' },
  { dictLabel: t('common.statusStop'), dictValue: '1', listClass: 'danger' }
] as any[])

// 1. 数据状态定义
const loading = ref(false)
const deptList = ref<DeptVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isView = ref(false)
const dialogTitle = ref('')
const deptFormRef = ref<FormInstance>()

// 创建时间范围（双值绑定，提交时拆到 params）
const dateRange = ref<[string, string] | []>([])

// 查询参数 (适配 Swagger)
const queryParams = reactive<DeptQuery>({
  pageNum: 1,
  pageSize: 20,
  departmentName: '',
  departmentType: '',
  status: '',
  params: { beginTime: undefined, endTime: undefined }
})

// 表单对象 (适配 Swagger)
const form = ref<DeptForm>({
  departmentName: '',
  departmentCode: '',
  departmentType: '',
  departmentPrincipal: '',
  departmentPhone: '',
  status: '0',
  usefulExpressions: '',
  phrases: []
})

// 校验规则 (适配 Swagger)
const rules = {
  departmentName: [{ required: true, message: t('dept.inputDeptName'), trigger: 'blur' }],
  departmentCode: [{ required: true, message: t('dept.inputDeptCode'), trigger: 'blur' }],
  departmentType: [{ required: true, message: t('dept.selectDeptType'), trigger: 'change' }],
  departmentPrincipal: [{ required: true, message: t('dept.inputLeader'), trigger: 'blur' }],
  departmentPhone: [{ required: true, message: t('dept.inputPhone'), trigger: 'blur' }]
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
 * 根据科室类型 value 获取 label
 */
const getDeptTypeLabel = (value: string | number) => {
  const dict = sysDeptOptions.value.find(d => String(d.dictValue) === String(value))
  return dict ? dict.dictLabel : (value || '-')
}

/**
 * 判断是否为"医技科室"（用于紫色标签）
 */
const isMedicalTech = (value: string | number) => {
  const label = getDeptTypeLabel(value)
  return /医技/.test(String(label))
}

// 2. 核心逻辑方法

/**
 * 获取列表数据
 */
const getList = async () => {
  loading.value = true
  const [err, res] = await to(listDept(queryParams))
  if (res) {
    deptList.value = res.rows || []
    total.value = res.total || 0
  }
  loading.value = false
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
  queryParams.departmentName = ''
  queryParams.departmentType = ''
  queryParams.status = ''
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
 * 启用/停用统一调用 POST /department/delete/{departmentId}/{status}（status: 0启用 1停用）
 */
const handleStatusChange = async (row: DeptVO) => {
  const newStatus = row.status === '0' ? '1' : '0'
  const operateText = newStatus === '0' ? t('common.enable') : t('common.disable')
  try {
    await ElMessageBox.confirm(t('dept.confirmStatus', { operate: operateText }), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
  } catch {
    // 用户点击取消，直接返回
    return
  }
  const [err] = await to(delDept(row.departmentId, newStatus))
  if (err) {
    ElMessage.error(t('common.operateFail'))
    return
  }
  ElMessage.success(t('common.operateSuccess'))
  getList()
}

/**
 * 新增按钮操作
 */
const handleAdd = () => {
  reset()
  isView.value = false
  dialogTitle.value = t('dept.addDept')
  dialogVisible.value = true
}

/**
 * 修改按钮操作 (源数据从表格行中获取)
 */
const handleUpdate = (row: DeptVO) => {
  reset()
  isView.value = false
  const phrasesArr = row.usefulExpressions ? row.usefulExpressions.split('\n').filter(Boolean) : []
  form.value = { ...row, phrases: phrasesArr }
  dialogTitle.value = t('dept.editDept')
  dialogVisible.value = true
}

/**
 * 详情查看 (源数据从表格行中获取)
 */
const handleDetail = (row: DeptVO) => {
  reset()
  isView.value = true
  const phrasesArr = row.usefulExpressions ? row.usefulExpressions.split('\n').filter(Boolean) : []
  form.value = { ...row, phrases: phrasesArr }
  dialogTitle.value = t('dept.deptDetail')
  dialogVisible.value = true
}

/**
 * 删除操作
 */
const handleDelete = async (row: DeptVO) => {
  if (!row.departmentId) return
  try {
    await ElMessageBox.confirm(
      t('dept.confirmStatus', { operate: t('common.delete') }),
      t('common.tip'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    const [err] = await to(removeDept(row.departmentId))
    if (!err) {
      ElMessage.success(t('common.operateSuccess'))
      getList()
    }
  } catch {}
}

/**
 * 提交表单
 */
const submitForm = () => {
  deptFormRef.value?.validate(async (valid) => {
    if (valid) {
      const isEdit = !!form.value.departmentId
      const action = isEdit ? updateDept : addDept

      if (form.value.phrases && form.value.phrases.length > 0) {
        form.value.usefulExpressions = form.value.phrases.filter(p => p.trim() !== '').join('\n')
      } else {
        form.value.usefulExpressions = ''
      }

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
    departmentName: '',
    departmentCode: '',
    departmentType: '',
    departmentPrincipal: '',
    departmentPhone: '',
    status: '0',
    usefulExpressions: '',
    phrases: []
  }
  deptFormRef.value?.resetFields()
}

/**
 * 常用语操作
 */
const addPhrase = () => {
  if (!form.value.phrases) form.value.phrases = []
  form.value.phrases.push('')
}
const removePhrase = (index: number) => {
  form.value.phrases?.splice(index, 1)
}

onMounted(() => {
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
.dept-table {
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

/* 科室信息列（名称 + 副信息） */
.dept-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dept-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}
.dept-sub {
  font-size: 12px;
  color: #909399;
}

/* 科室类型标签（原型胶囊样式） */
.type-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.type-tag--primary {
  background: #ecf5ff;
  color: #409eff;
}
.type-tag--purple {
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

/* 操作列 */
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

/* 弹窗常用语区 */
.phrases-section {
  .phrase-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }
}
</style>
