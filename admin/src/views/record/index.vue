<template>
  <div class="app-container">
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item :label="t('record.patientName')" prop="patientName">
          <el-input
            v-model="queryParams.patientName"
            :placeholder="t('record.inputPatientName')"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item :label="t('record.doctorName')" prop="doctorName">
          <el-input
            v-model="queryParams.doctorName"
            :placeholder="t('record.inputDoctorName')"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item :label="t('record.departmentName')" prop="departmentName">
          <el-input
            v-model="queryParams.departmentName"
            :placeholder="t('record.inputDepartmentName')"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item :label="t('record.visitDate')" prop="visitDate">
          <el-date-picker
            v-model="queryParams.visitDate"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="t('record.selectVisitDate')"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ t('common.search') }}</el-button>
          <el-button @click="resetQuery">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never" style="margin-top: 20px">
      <el-table v-loading="loading" :data="recordList" style="width: 100%; margin-top: 15px" border>
        <el-table-column :label="t('record.caseId')" align="center" min-width="120">
          <template #default="scope">
            <span>{{ displayValue(scope.row.caseId ?? scope.row.recordId) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.patientName')" align="center" prop="patientName" min-width="140" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.patientName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.doctorName')" align="center" prop="doctorName" min-width="140" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.doctorName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.departmentName')" align="center" prop="departmentName" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.departmentName) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.visitDate')" align="center" prop="visitDate" min-width="180">
          <template #default="scope">
            <span>{{ displayValue(scope.row.visitDate ?? scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('record.diagnosisResult')" align="center" prop="diagnosisResult" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ displayValue(scope.row.diagnosisResult) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operate')" align="center" fixed="right" min-width="120">
          <template #default="scope">
            <el-button link type="primary" @click="handleDetail(scope.row)">
              {{ t('common.view') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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
import { to } from 'await-to-js'
import type { FormInstance } from 'element-plus'
import { listDiagnosisRecord } from '@/api/record'
import type { DiagnosisRecordQuery, DiagnosisRecordVO } from '@/api/types'
import CaseDetail from './components/CaseDetail.vue'

const { t } = useI18n()

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
  pageSize: 10
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
  queryParams.pageNum = 1
  queryParams.pageSize = 10
  getList()
}

const handleDetail = (row: DiagnosisRecordVO) => {
  currentCaseId.value = String(row.caseId ?? row.recordId ?? '')
  drawerVisible.value = true
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
