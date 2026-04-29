<template>
  <app-page plain>
    <section class="records-page">
      <div class="records-page__header">
        <el-button class="back-button" text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>{{ t('assistant.pendingRecords.backToWorkbench') }}</span>
        </el-button>

        <div class="records-page__hero">
          <h1>{{ t('assistant.pendingRecords.pageTitle') }}</h1>
          <p>{{ t('assistant.pendingRecords.pageSubtitle') }}</p>
        </div>
      </div>

      <div class="records-toolbar">
        <div class="records-filters">
          <el-button
            v-for="item in filterOptions"
            :key="item.key"
            class="filter-pill"
            :class="{ 'is-active': activeFilter === item.key }"
            @click="activeFilter = item.key"
          >
            {{ item.label }}
          </el-button>
        </div>

        <el-input
          v-model="keyword"
          :placeholder="t('assistant.pendingRecords.searchPlaceholder')"
          class="records-search"
          clearable
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <section class="records-panel">
        <header class="records-panel__header">
          <div class="records-panel__title">
            <span class="records-panel__badge">
              <el-icon><Tickets /></el-icon>
            </span>
            <strong>{{ t('assistant.pendingRecords.listTitle') }}</strong>
            <span class="records-panel__count">
              {{ total }} {{ t('assistant.pendingRecords.totalSuffix') }}
            </span>
          </div>
        </header>

        <div class="records-table-wrap">
          <el-table :data="records" v-loading="loading" class="records-table">
            <el-table-column :label="t('assistant.pendingRecords.visitDate')" min-width="132">
              <template #default="{ row }">
                <span>{{ row.visitDate }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.pendingRecords.visitId')" min-width="180">
              <template #default="{ row }">
                <span>{{ row.visitId }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.pendingRecords.patientInfo')" min-width="188">
              <template #default="{ row }">
                <div class="records-meta">
                  <strong>{{ row.patientName }}</strong>
                  <span>{{ row.patientMeta }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.pendingRecords.doctorInfo')" min-width="188">
              <template #default="{ row }">
                <div class="records-meta">
                  <strong>{{ row.doctorName }}</strong>
                  <span>{{ row.doctorMeta }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.pendingRecords.action')" min-width="132" align="center">
              <template #default="{ row }">
                <el-button
                  link
                  class="detail-link"
                  :loading="reconnectingRecordId === row.id"
                  :disabled="reconnectingRecordId !== '' && reconnectingRecordId !== row.id"
                  @click="handleReconnect(row)"
                >
                  {{ reconnectingRecordId === row.id ? t('assistant.pendingRecords.reconnecting') : t('assistant.pendingRecords.reconnect') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="records-panel__pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100]"
            :total="total"
            background
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </section>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Search, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getCaseDetail, getUndoneCaseList } from '@/api/record'
import { createVideoRoom } from '@/api/video'
import type { CaseRecordItem } from '@/api/types'
import AppPage from '@/components/AppPage.vue'
import { navigateToAideConsultationRoom } from '@/utils/aide-consultation'
import { startAssistantConsultationSse } from '@/utils/assistant-consultation-sse'
import { broadcastPatientContextSync, broadcastReconnectFailed, broadcastVideoRoomCreated } from '@/utils/patient-channel'

type FilterKey = 'all' | 'recent7' | 'recent30'
type DetailRecord = Record<string, unknown>

interface PendingRecordRow {
  id: string
  caseId: string
  patientId: string
  originalDoctorId: string
  visitDate: string
  visitId: string
  patientName: string
  patientMeta: string
  doctorName: string
  doctorMeta: string
}

const router = useRouter()
const { t, locale } = useI18n()

const activeFilter = ref<FilterKey>('all')
const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const total = ref(0)
const records = ref<PendingRecordRow[]>([])
const reconnectingRecordId = ref('')
let searchTimer = 0

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value).trim()
  return text || ''
}

const takeDisplayText = (value: unknown) => {
  const text = takeOptionalText(value)
  return text === '--' ? '' : text
}

const isObjectRecord = (value: unknown): value is DetailRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const pickText = (source: Record<string, unknown> | null | undefined, keys: string[]) => {
  if (!source) {
    return ''
  }

  for (const key of keys) {
    const value = source[key]
    const text = takeOptionalText(value)
    if (text) {
      return text
    }
  }

  return ''
}

const getDetailCandidateRecords = (value: DetailRecord | null | undefined) => {
  if (!value) {
    return []
  }

  const nestedKeys = [
    'patient',
    'patientInfo',
    'consultation',
    'consultationInfo',
    'caseInfo',
    'caseDetail',
    'detail',
    'record',
    'summary',
    'doctor',
    'doctorInfo'
  ]

  return [
    value,
    ...nestedKeys
      .map((key) => value[key])
      .filter((item): item is DetailRecord => isObjectRecord(item))
  ]
}

const pickTextFromRecords = (records: DetailRecord[], keys: string[]) => {
  for (const item of records) {
    const text = pickText(item, keys)
    if (text) {
      return text
    }
  }

  return ''
}

const formatDate = (value: unknown) => {
  const text = takeOptionalText(value)
  if (!text) {
    return '--'
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) {
    return text
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeGenderKey = (value: unknown) => {
  const text = takeOptionalText(value).toLowerCase()

  if (text === '1' || text === '男' || text === 'male' || text === 'm') {
    return 'male'
  }

  if (text === '0' || text === '女' || text === 'female' || text === 'f') {
    return 'female'
  }

  return ''
}

const buildDoctorMeta = (item: CaseRecordItem) => {
  const parts = [takeOptionalText(item.title)]
  const departmentName = takeOptionalText(item.departmentName)

  if (departmentName) {
    parts.push(departmentName)
  }

  return parts.filter(Boolean).join(' / ') || '--'
}

const resolveCaseId = (item: CaseRecordItem) => {
  return pickText(item, ['caseId', 'caseID', 'medicalCaseId'])
}

const resolvePatientId = (item: CaseRecordItem) => {
  return pickText(item, ['patientId', 'patId'])
}

const resolveOriginalDoctorId = (item: CaseRecordItem) => {
  return pickText(item, ['doctorId', 'userId', 'doctorUserId', 'receiveDoctorId', 'receptionDoctorId', 'attendingDoctorId'])
}

const normalizePendingRecordRow = (item: CaseRecordItem, index: number): PendingRecordRow => {
  const genderKey = normalizeGenderKey(item.patientSex)
  const ageText = takeOptionalText(item.patientAge) || '--'
  const patientMeta =
    ageText === '--' && !genderKey
      ? '--'
      : t('assistant.pendingRecords.patientAgeGender', {
          age: ageText,
          gender: genderKey ? t(`assistant.pendingRecords.${genderKey}`) : '--'
        })

  return {
    id: resolveCaseId(item) || takeOptionalText(item.patientNumber) || `row-${index + 1}`,
    caseId: resolveCaseId(item),
    patientId: resolvePatientId(item),
    originalDoctorId: resolveOriginalDoctorId(item),
    visitDate: formatDate(item.visitDate || item.createTime || item.updateTime || item.registerTime),
    visitId: takeOptionalText(item.patientNumber) || resolveCaseId(item) || '--',
    patientName: takeOptionalText(item.patientName) || '--',
    patientMeta,
    doctorName: pickText(item, ['doctorName', 'nickName', 'userName', 'name']) || '--',
    doctorMeta: buildDoctorMeta(item)
  }
}

const resolveCheckInfo = (filter: FilterKey) => {
  switch (filter) {
    case 'recent7':
      return 7
    case 'recent30':
      return 30
    default:
      return -1
  }
}

const fetchPendingRecords = async () => {
  loading.value = true

  try {
    const response = await getUndoneCaseList({
      searchInfo: keyword.value.trim(),
      checkInfo: resolveCheckInfo(activeFilter.value),
      pageSize: pageSize.value,
      pageNum: page.value
    })

    const parsedTotal = Number(response?.total)
    total.value = Number.isFinite(parsedTotal) ? parsedTotal : 0
    records.value = Array.isArray(response?.rows)
      ? response.rows.map((item, index) => normalizePendingRecordRow(item, index))
      : []
  } catch (error) {
    console.warn('Failed to load assistant undone case records.', error)
    total.value = 0
    records.value = []
  } finally {
    loading.value = false
  }
}

const resolveReconnectTargets = async (row: PendingRecordRow) => {
  let patientId = row.patientId
  let originalDoctorId = row.originalDoctorId
  let originalDoctorName = takeDisplayText(row.doctorName)

  if (patientId && originalDoctorId && originalDoctorName) {
    return {
      caseId: row.caseId,
      patientId,
      originalDoctorId,
      originalDoctorName
    }
  }

  if (!row.caseId) {
    return patientId
      ? {
          caseId: row.caseId,
          patientId,
          originalDoctorId,
          originalDoctorName
        }
      : null
  }

  const response = await getCaseDetail(row.caseId)
  const detail = isObjectRecord(response?.data) ? response.data : null
  const records = getDetailCandidateRecords(detail)

  patientId = patientId || pickTextFromRecords(records, ['patientId', 'patId'])
  originalDoctorId =
    originalDoctorId ||
    pickTextFromRecords(records, ['doctorId', 'userId', 'doctorUserId', 'receiveDoctorId', 'receptionDoctorId', 'attendingDoctorId'])
  originalDoctorName =
    originalDoctorName ||
    pickTextFromRecords(records, ['doctorName', 'nickName', 'userName', 'name'])

  return patientId
    ? {
        caseId: row.caseId || pickTextFromRecords(records, ['caseId', 'caseID', 'medicalCaseId']),
        patientId,
        originalDoctorId,
        originalDoctorName
      }
    : null
}

const notifyReconnectFailure = (payload: { patientId?: string; caseId?: string; message: string }) => {
  broadcastReconnectFailed({
    patientId: payload.patientId || '',
    caseId: payload.caseId || '',
    message: payload.message
  })
}

const handleReconnect = async (row: PendingRecordRow) => {
  if (!row.id || reconnectingRecordId.value) {
    return
  }

  reconnectingRecordId.value = row.id
  let resolvedPatientId = row.patientId
  let resolvedCaseId = row.caseId

  try {
    const reconnectTargets = await resolveReconnectTargets(row)

    if (reconnectTargets?.patientId && !reconnectTargets.originalDoctorId) {
      await router.push({
        path: '/assistant/doctor-select',
        query: {
          patientId: reconnectTargets.patientId
        }
      })
      return
    }

    if (!reconnectTargets?.patientId || !reconnectTargets.originalDoctorId) {
      const failureMessage = t('assistant.pendingRecords.reconnectMissingTargets')
      notifyReconnectFailure({
        patientId: reconnectTargets?.patientId || row.patientId,
        caseId: reconnectTargets?.caseId || row.caseId,
        message: failureMessage
      })
      ElMessage.error(failureMessage)
      return
    }

    resolvedPatientId = reconnectTargets.patientId
    resolvedCaseId = reconnectTargets.caseId

    broadcastPatientContextSync({
      patientId: resolvedPatientId
    })

    const response = await createVideoRoom({
      patientId: resolvedPatientId,
      userId: reconnectTargets.originalDoctorId,
      ...(resolvedCaseId ? { caseId: resolvedCaseId } : {})
    })

    const roomId = takeOptionalText(response?.data)
    if (!roomId) {
      throw new Error(t('assistant.pendingRecords.reconnectFailed'))
    }

    broadcastVideoRoomCreated({
      patientId: resolvedPatientId,
      doctorId: reconnectTargets.originalDoctorId,
      doctorName: reconnectTargets.originalDoctorName,
      roomId,
      ...(resolvedCaseId ? { caseId: resolvedCaseId } : {})
    })

    if (resolvedCaseId) {
      void startAssistantConsultationSse({
        patientId: resolvedPatientId,
        caseId: resolvedCaseId,
        doctorName: reconnectTargets.originalDoctorName
      }, router).catch((error) => {
        console.warn('Failed to connect assistant consultation SSE during reconnect.', error)
      })
    }

    try {
      await navigateToAideConsultationRoom(router, {
        patientId: resolvedPatientId,
        doctorId: reconnectTargets.originalDoctorId,
        doctorName: reconnectTargets.originalDoctorName,
        roomId,
        ...(resolvedCaseId ? { caseId: resolvedCaseId } : {})
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'missingParams'
          ? t('assistant.aideVideo.consultation.missingParams')
          : error instanceof Error && error.message.trim()
            ? error.message
            : t('assistant.aideVideo.consultation.joinFailed')
      ElMessage.error(message)
      return
    }

    ElMessage.success(t('assistant.pendingRecords.reconnectSuccess'))
  } catch (error) {
    const failureMessage =
      error instanceof Error && error.message.trim()
        ? error.message
        : t('assistant.pendingRecords.reconnectFailed')

    notifyReconnectFailure({
      patientId: resolvedPatientId,
      caseId: resolvedCaseId,
      message: failureMessage
    })
    ElMessage.error(failureMessage)
  } finally {
    reconnectingRecordId.value = ''
  }
}

const scheduleFetchPendingRecords = () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    void fetchPendingRecords()
  }, 300)
}

const filterOptions = computed(() => [
  { key: 'all' as const, label: t('assistant.pendingRecords.allFilter') },
  { key: 'recent7' as const, label: t('assistant.pendingRecords.recentSevenDays') },
  { key: 'recent30' as const, label: t('assistant.pendingRecords.recentThirtyDays') }
])

watch([activeFilter, keyword], () => {
  if (page.value !== 1) {
    page.value = 1
    return
  }

  scheduleFetchPendingRecords()
})

watch([page, pageSize], () => {
  void fetchPendingRecords()
})

watch(locale, () => {
  void fetchPendingRecords()
})

onMounted(() => {
  void fetchPendingRecords()
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
})

const goBack = () => {
  router.push('/assistant/workbench')
}
</script>

<style scoped lang="scss">
.records-page {
  height: calc(100vh - 40px);
  min-height: calc(100vh - 40px);
  box-sizing: border-box;
  padding: 10px 18px 18px;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(180deg, #eaf2ff 0%, #edf4ff 26%, #eff4fc 100%);
  overflow: hidden;
}

.records-page__header {
  position: relative;
  padding-top: 4px;
}

.back-button {
  position: absolute;
  top: 0;
  left: 0;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e4ecf7;
  color: #2d3748;
  box-shadow: 0 8px 24px rgba(109, 133, 177, 0.08);
}

.back-button:hover {
  background: #ffffff;
  color: #165dff;
}

.records-page__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 0;
  text-align: center;
}

.records-page__hero h1 {
  margin: 0;
  color: #1c2431;
  font-size: clamp(24px, 3.2vw, 34px);
  font-weight: 800;
  line-height: 1.15;
}

.records-page__hero p {
  margin: 0;
  color: #66758b;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.records-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  flex-shrink: 0;
}

.records-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-pill {
  min-width: 62px;
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: rgba(217, 228, 245, 0.95);
  color: #5f6f84;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.filter-pill:hover {
  transform: translateY(-1px);
  color: #5f6f84;
  background: rgba(217, 228, 245, 0.95);
  border-color: transparent;
}

.filter-pill.is-active {
  background: linear-gradient(180deg, #216cff 0%, #155ad7 100%);
  color: #ffffff;
  box-shadow: none;
}

.filter-pill.is-active:hover {
  color: #ffffff;
  background: linear-gradient(180deg, #216cff 0%, #155ad7 100%);
  border-color: transparent;
}

.records-search {
  width: min(360px, 100%);
}

.records-search :deep(.el-input__wrapper) {
  min-height: 34px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #e0e7f1 inset;
}

.records-panel {
  margin-top: 12px;
  padding: 12px 14px 12px;
  border-radius: 10px;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  background: #ffffff;
  box-shadow: 0 12px 36px rgba(124, 146, 186, 0.08);
  overflow: hidden;
}

.records-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.records-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1f2a3d;
  font-size: 13px;
}

.records-panel__title strong {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.records-panel__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: linear-gradient(180deg, #1f6fff 0%, #1557d7 100%);
  color: #ffffff;
  font-size: 11px;
}

.records-panel__count {
  color: #8d97a8;
  font-size: 12px;
}

.records-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.records-table {
  width: 100%;
}

.records-table :deep(th.el-table__cell) {
  background: #ffffff;
  color: #a2aab7;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid #edf1f6;
}

.records-table :deep(td.el-table__cell) {
  padding: 8px 0;
  border-bottom: 1px solid #edf1f6;
}

.records-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.records-table :deep(.el-table__cell .cell) {
  color: #2d3748;
  padding-inline: 10px;
  font-size: 12px;
}

.records-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.records-meta strong {
  color: #212a38;
  font-size: 13px;
  font-weight: 600;
}

.records-meta span {
  color: #8d97a8;
  font-size: 11px;
}

.detail-link {
  color: #1c6fff;
  font-size: 12px;
  font-weight: 600;
  padding: 0;
}

.records-panel__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  flex-shrink: 0;
  border-top: 1px solid #edf1f6;
  background: #ffffff;
}

@media (max-width: 960px) {
  .records-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .records-search {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .records-page {
    padding: 10px 10px 14px;
  }

  .back-button {
    position: static;
  }

  .records-page__hero {
    margin-top: 14px;
  }

  .records-page__hero p {
    font-size: 13px;
  }

  .records-panel {
    padding-inline: 10px;
  }

  .records-panel__title strong {
    font-size: 20px;
  }
}
</style>
