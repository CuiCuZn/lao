<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('patient.keyword') }}</span>
          <el-input
            v-model="queryParams.keyword"
            :placeholder="t('patient.inputKeyword')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('patient.gender') }}</span>
          <el-select
            v-model="queryParams.patientSex"
            :placeholder="t('patient.selectGender')"
            clearable
            class="filter-select"
          >
            <el-option :label="t('patient.male')" value="0" />
            <el-option :label="t('patient.female')" value="1" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('patient.dateRange') }}</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            :start-placeholder="t('common.beginDate')"
            :end-placeholder="t('common.endDate')"
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
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('patient.addPatient') }}</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="patientList" class="patient-table" style="width: 100%">
        <el-table-column :label="t('patient.patientInfo')" min-width="180">
          <template #default="scope">
            <div class="patient-info">
              <div class="patient-name">{{ scope.row.patientName || '--' }}</div>
              <div class="patient-sub" :class="{ 'is-empty': !hasSubInfo(scope.row) }">{{ subInfo(scope.row) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('patient.gender')" min-width="70" align="center">
          <template #default="scope">
            <span :class="{ 'text-muted': !scope.row.patientSex }">{{ formatGender(scope.row.patientSex) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('patient.age')" min-width="70" align="center">
          <template #default="scope">
            <span :class="{ 'text-muted': scope.row.patientAge == null }">{{ formatAge(scope.row.patientAge) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('patient.phone')" min-width="130">
          <template #default="scope">
            <span :class="{ 'text-muted': !scope.row.patientPhone }">{{ scope.row.patientPhone || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('patient.visitCount')" prop="visitCount" min-width="90" align="center">
          <template #default="scope">
            <span>{{ scope.row.visitCount != null ? scope.row.visitCount : 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('patient.lastVisit')" min-width="120">
          <template #default="scope">
            <span class="date-cell">{{ formatDate(scope.row.latestVisitTime) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('patient.visitId')" min-width="100">
          <template #default="scope">
            <span class="text-muted">{{ scope.row.latestCaseId != null ? scope.row.latestCaseId : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('patient.createTime')" min-width="150">
          <template #default="scope">
            <span class="date-cell">{{ formatDateTime(scope.row.createTime) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operate')" width="200" fixed="right" class-name="action-col">
          <template #default="scope">
            <div class="actions">
              <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
              <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)">{{ t('common.edit') }}</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">{{ t('common.delete') }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 3. 新增/修改弹窗 -->
    <PatientForm ref="formRef" @success="getList" />

    <!-- 4. 患者详情弹窗（含就诊记录） -->
    <PatientDetail ref="detailRef" @edit="onDetailEdit" @view-visit="onViewVisit" />

    <!-- 5. 就诊详情弹窗 -->
    <VisitDetail ref="visitDetailRef" />

    <!-- 6. 删除确认弹窗 -->
    <ConfirmDialog
      v-model="deleteVisible"
      :title="t('patient.deleteConfirm')"
      type="danger"
      :message="t('patient.deleteTipRecords')"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus, Edit, View, Delete } from '@element-plus/icons-vue'
import { to } from 'await-to-js'
import { listPatient, getPatientProfile, deletePatient } from '@/api/patient'
import type { PatientPageQuery, PatientPageVO } from '@/api/types'
import PatientForm from './components/PatientForm.vue'
import PatientDetail from './components/PatientDetail.vue'
import VisitDetail from './components/VisitDetail.vue'
import ConfirmDialog from '@/components/ConfirmDialog/index.vue'

const { t } = useI18n()

const loading = ref(false)
const patientList = ref<PatientPageVO[]>([])
const total = ref(0)

const dateRange = ref<[string, string] | []>([])

const queryParams = reactive<PatientPageQuery>({
  pageNum: 1,
  pageSize: 20,
  keyword: '',
  patientSex: '',
  beginCreateTime: undefined,
  endCreateTime: undefined
})

const formRef = ref<InstanceType<typeof PatientForm>>()
const detailRef = ref<InstanceType<typeof PatientDetail>>()
const visitDetailRef = ref<InstanceType<typeof VisitDetail>>()

const deleteVisible = ref(false)
const deleteLoading = ref(false)
const deleteRow = ref<PatientPageVO | null>(null)

/** 性别展示：0=男 1=女 */
const formatGender = (sex?: string) => {
  if (!sex) return ''
  if (sex === '0' || sex === '男') return t('patient.male')
  if (sex === '1' || sex === '女') return t('patient.female')
  return sex
}

/** 年龄展示 */
const formatAge = (age?: number) => {
  if (age == null || age === undefined) return '--'
  return `${age}${t('patient.ageUnit')}`
}

/** 日期 YYYY-MM-DD */
const formatDate = (val?: string) => {
  if (!val) return ''
  const d = new Date(String(val).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** 日期时间 YYYY-MM-DD HH:mm */
const formatDateTime = (val?: string) => {
  if (!val) return ''
  const d = new Date(String(val).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 16)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${mi}`
}

/** 患者信息列副信息：婚况 · 职业 */
const hasSubInfo = (row: PatientPageVO) => !!(row.maritalStatus || row.job)

const subInfo = (row: PatientPageVO) => {
  const parts: string[] = []
  if (row.maritalStatus) parts.push(formatMarriage(row.maritalStatus))
  if (row.job) parts.push(row.job)
  return parts.length ? parts.join(' · ') : t('patient.unknown')
}

/** 婚况展示：兼容 已婚/未婚 与 0/1 */
const formatMarriage = (val?: string) => {
  if (!val) return ''
  if (val === '1' || val === '已婚') return t('patient.married')
  if (val === '0' || val === '未婚') return t('patient.unmarried')
  return val
}

const handleDateChange = (val: [string, string] | []) => {
  if (val && val.length === 2) {
    queryParams.beginCreateTime = val[0]
    queryParams.endCreateTime = val[1]
  } else {
    queryParams.beginCreateTime = undefined
    queryParams.endCreateTime = undefined
  }
}

const getList = async () => {
  loading.value = true
  const [err, res] = await to(listPatient(queryParams))
  if (res) {
    patientList.value = res.rows || []
    total.value = res.total || 0
  }
  loading.value = false
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.patientSex = ''
  queryParams.beginCreateTime = undefined
  queryParams.endCreateTime = undefined
  dateRange.value = []
  queryParams.pageSize = 20
  handleQuery()
}

const handleAdd = () => {
  formRef.value?.open()
}

const handleUpdate = async (row: PatientPageVO) => {
  // 修改时先调回显接口拿完整数据
  if (row.patientId) {
    const [err, res] = await to(getPatientProfile(row.patientId))
    if (!err && res?.data) {
      formRef.value?.open(res.data)
      return
    }
  }
  // 回显失败则用列表行数据兜底
  formRef.value?.open(row as any)
}

const handleDetail = (row: PatientPageVO) => {
  detailRef.value?.open(row.patientId, row.patientName)
}

const handleDelete = (row: PatientPageVO) => {
  deleteRow.value = row
  deleteVisible.value = true
}

const confirmDelete = async () => {
  const id = deleteRow.value?.patientId
  if (id == null) {
    deleteVisible.value = false
    return
  }
  deleteLoading.value = true
  const [err] = await to(deletePatient(id))
  deleteLoading.value = false
  if (err) return
  deleteVisible.value = false
  ElMessage.success(t('common.operateSuccess'))
  // 删除后若本页删空且非首页，回退一页
  if (patientList.value.length === 1 && queryParams.pageNum > 1) {
    queryParams.pageNum--
  }
  getList()
}

/** 详情弹窗点击"修改"，先回显再打开表单 */
const onDetailEdit = async (patientId: string | number) => {
  const [err, res] = await to(getPatientProfile(patientId))
  if (!err && res?.data) {
    formRef.value?.open(res.data)
  } else {
    formRef.value?.open({ patientId } as any)
  }
}

/** 详情弹窗就诊记录点击"查看"，打开就诊详情弹窗 */
const onViewVisit = (caseId: string | number) => {
  visitDetailRef.value?.open(caseId)
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 0;
}

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
.filter-input {
  width: 200px;
}
.filter-select {
  width: 130px;
}
.filter-daterange {
  width: 260px;
}
.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;
}

.patient-table {
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

.patient-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.patient-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}
.patient-sub {
  font-size: 12px;
  color: #909399;
  &.is-empty {
    color: #c0c4cc;
  }
}

.text-muted {
  color: #909399;
}
.date-cell {
  font-size: 13px;
  color: #909399;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
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
</style>
