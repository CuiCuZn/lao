<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('record.patientName') }}</span>
          <el-input
            v-model="queryParams.patientName"
            :placeholder="t('record.inputPatientName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('record.doctorName') }}</span>
          <el-input
            v-model="queryParams.doctorName"
            :placeholder="t('record.inputDoctorName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('record.departmentName') }}</span>
          <el-input
            v-model="queryParams.departmentName"
            :placeholder="t('record.inputDepartmentName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('record.visitDate') }}</span>
          <el-date-picker
            v-model="queryParams.visitDate"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="t('record.selectVisitDate')"
            clearable
            class="filter-input"
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
      <el-table v-loading="loading" :data="recordList" class="record-table" style="width: 100%">
        <el-table-column :label="t('record.caseId')" min-width="120">
          <template #default="scope">
            <span>{{ displayValue(scope.row.patientNumber ?? scope.row.recordId) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.patientName')" prop="patientName" min-width="140" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.patientName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.doctorName')" prop="doctorName" min-width="140" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.doctorName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.departmentName')" prop="departmentName" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.departmentName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.visitDate')" prop="visitDate" min-width="180">
          <template #default="scope">
            <span>{{ displayValue(scope.row.visitDate ?? scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.diagnosisResult')" prop="diagnosisResult" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.diagnosisResult) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operate')" width="120" fixed="right" class-name="action-col">
          <template #default="scope">
            <div class="actions">
              <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">
                {{ t('common.view') }}
              </el-button>
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

    <el-drawer
      v-model="drawerVisible"
      :title="t('common.view')"
      size="60%"
      destroy-on-close
      append-to-body
    >
      <case-detail v-if="drawerVisible" :case-id="currentCaseId" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import { to } from 'await-to-js'
import type { FormInstance } from 'element-plus'
import { listDiagnosisRecord } from '@/api/record'
import type { DiagnosisRecordQuery, DiagnosisRecordVO } from '@/api/types'
import CaseDetail from './components/CaseDetail.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const queryRef = ref<FormInstance>()
const loading = ref(false)
const total = ref(0)
const recordList = ref<DiagnosisRecordVO[]>([])

const drawerVisible = ref(false)
const currentCaseId = ref('')

const queryParams = reactive<DiagnosisRecordQuery>({
  patientName: '',
  doctorName: '',
  departmentName: '',
  visitDate: '',
  pageNum: 1,
  pageSize: 20
})

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '--'
  }
  return String(value)
}

const extractRows = (payload: any): DiagnosisRecordVO[] => {
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.records)) return payload.records

  const nestedData = payload?.data
  if (Array.isArray(nestedData?.rows)) return nestedData.rows
  if (Array.isArray(nestedData?.list)) return nestedData.list
  if (Array.isArray(nestedData?.records)) return nestedData.records

  return []
}

const extractTotal = (payload: any, rows: DiagnosisRecordVO[]) => {
  const candidates = [payload?.total, payload?.data?.total, payload?.count, payload?.data?.count]
  for (const item of candidates) {
    const totalValue = Number(item)
    if (Number.isFinite(totalValue)) {
      return totalValue
    }
  }
  return rows.length
}

const getList = async () => {
  loading.value = true
  const [err, res] = await to(listDiagnosisRecord(queryParams))
  if (res) {
    const rows = extractRows(res)
    recordList.value = rows
    total.value = extractTotal(res, rows)
  }
  if (err) {
    recordList.value = []
    total.value = 0
  }
  loading.value = false
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryRef.value?.resetFields()
  queryParams.patientName = ''
  queryParams.doctorName = ''
  queryParams.departmentName = ''
  queryParams.visitDate = ''
  queryParams.pageNum = 1
  queryParams.pageSize = 20
  getList()
}

const handleDetail = (row: DiagnosisRecordVO) => {
  currentCaseId.value = String(row.caseId ?? row.recordId ?? '')
  drawerVisible.value = true
}

onMounted(() => {
  // 支持从工作台"查看全部"携带今日日期筛选跳转
  const q = route.query.visitDate
  if (q && typeof q === 'string') {
    queryParams.visitDate = q
    // 消费后清理 query，避免刷新或重置时仍被带入
    router.replace({ path: route.path, query: {} })
  }
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
.filter-input {
  width: 180px;
}
.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

/* 表格 */
.record-table {
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
</style>

