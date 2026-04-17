<template>
  <app-page plain>
    <section class="records-page">
      <div class="records-page__header">
        <el-button class="back-button" text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>{{ t('assistant.records.backToWorkbench') }}</span>
        </el-button>

        <div class="records-page__hero">
          <h1>{{ t('assistant.records.pageTitle') }}</h1>
          <p>{{ t('assistant.records.pageSubtitle') }}</p>
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
          :placeholder="t('assistant.records.searchPlaceholder')"
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
            <strong>{{ t('assistant.records.listTitle') }}</strong>
            <span class="records-panel__count">
              {{ filteredRecords.length }} {{ t('assistant.records.totalSuffix') }}
            </span>
          </div>
        </header>

        <div class="records-table-wrap">
          <el-table :data="pagedRecords" class="records-table">
            <el-table-column :label="t('assistant.records.visitDate')" min-width="132">
              <template #default="{ row }">
                <span>{{ row.visitDate }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.records.visitId')" min-width="180">
              <template #default="{ row }">
                <span>{{ row.visitId }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.records.patientInfo')" min-width="188">
              <template #default="{ row }">
                <div class="records-meta">
                  <strong>{{ row.patientName }}</strong>
                  <span>{{ row.patientMeta }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.records.doctorInfo')" min-width="188">
              <template #default="{ row }">
                <div class="records-meta">
                  <strong>{{ row.doctorName }}</strong>
                  <span>{{ row.doctorMeta }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.records.chiefComplaint')" min-width="186">
              <template #default="{ row }">
                <span>{{ row.chiefComplaint }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.records.contractStatus')" min-width="132">
              <template #default="{ row }">
                <el-tag
                  :type="statusTagTypeMap[row.status]"
                  effect="light"
                  :class="['status-tag', `is-${row.status}`]"
                >
                  {{ row.statusLabel }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column :label="t('assistant.records.action')" min-width="120" align="center">
              <template #default>
                <el-button link class="detail-link">
                  {{ t('assistant.records.viewDetail') }}
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
            :total="filteredRecords.length"
            background
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </section>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Search, Tickets } from '@element-plus/icons-vue'
import type { TagProps } from 'element-plus'
import AppPage from '@/components/AppPage.vue'

type FilterKey = 'all' | 'recent7' | 'recent30' | 'completed' | 'cancelled'
type RecordStatus = 'completed' | 'incomplete' | 'cancelled'

interface RecordRow {
  id: number
  visitDate: string
  visitId: string
  patientName: string
  patientMeta: string
  patientIdCard: string
  patientPhone: string
  doctorName: string
  doctorMeta: string
  chiefComplaint: string
  status: RecordStatus
  statusLabel: string
}

const router = useRouter()
const { t, locale } = useI18n()

const activeFilter = ref<FilterKey>('all')
const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)

const baseDate = new Date('2026-01-12T09:00:00')
const patientNames = ['李女士', '王先生', '赵女士', '周先生', '刘女士', '陈先生']
const doctorNames = ['陈医生', '王医生', '刘医生', '赵医生']
const departments = ['中医内科', '针灸科', '康复科', '全科门诊']
const doctorTitles = ['主任医师', '副主任医师', '主治医师']
const complaints = [
  '头晕1周，晨起加重',
  '反复咳嗽3天，夜间明显',
  '胃脘不适5天，餐后加剧',
  '腰腿酸痛2周，活动受限',
  '失眠多梦1月，伴心悸',
  '乏力纳差4天，伴低热'
]

const statusTagTypeMap: Record<RecordStatus, TagProps['type']> = {
  completed: 'success',
  incomplete: 'info',
  cancelled: 'danger'
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildRecordRows = () => {
  const rows: RecordRow[] = []

  for (let index = 0; index < 60; index += 1) {
    const patientName = patientNames[index % patientNames.length]
    const genderKey = index % 2 === 0 ? 'female' : 'male'
    const doctorName = doctorNames[index % doctorNames.length]
    const department = departments[index % departments.length]
    const doctorTitle = doctorTitles[index % doctorTitles.length]
    const status: RecordStatus = index % 5 === 4 ? 'cancelled' : index % 2 === 0 ? 'completed' : 'incomplete'
    const visitDate = new Date(baseDate)
    visitDate.setDate(baseDate.getDate() - (index % 34))

    rows.push({
      id: index + 1,
      visitDate: formatDate(visitDate),
      visitId: `VS20260325${String(index + 1).padStart(4, '0')}`,
      patientName,
      patientMeta: t('assistant.records.patientAgeGender', {
        age: 26 + (index % 18),
        gender: t(`assistant.records.${genderKey}`)
      }),
      patientIdCard: `31010119920${String((index % 28) + 1).padStart(2, '0')}015${String(index % 10)}`,
      patientPhone: `156568${String(60000 + index).padStart(5, '0')}`,
      doctorName,
      doctorMeta: t('assistant.records.doctorMeta', {
        title: doctorTitle,
        department
      }),
      chiefComplaint: complaints[index % complaints.length],
      status,
      statusLabel: t(`assistant.records.${status}`)
    })
  }

  return rows
}

const rawRecords = computed(() => buildRecordRows())

const filterOptions = computed(() => [
  { key: 'all' as const, label: t('assistant.records.allFilter') },
  { key: 'recent7' as const, label: t('assistant.records.recentSevenDays') },
  { key: 'recent30' as const, label: t('assistant.records.recentThirtyDays') },
  { key: 'completed' as const, label: t('assistant.records.completedFilter') },
  { key: 'cancelled' as const, label: t('assistant.records.cancelledFilter') }
])

const filteredRecords = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return rawRecords.value.filter((row) => {
    const diffDays = Math.floor(
      (baseDate.getTime() - new Date(`${row.visitDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)
    )

    const matchFilter =
      activeFilter.value === 'all' ||
      (activeFilter.value === 'recent7' && diffDays <= 7) ||
      (activeFilter.value === 'recent30' && diffDays <= 30) ||
      (activeFilter.value === 'completed' && row.status === 'completed') ||
      (activeFilter.value === 'cancelled' && row.status === 'cancelled')

    if (!matchFilter) {
      return false
    }

    if (!normalizedKeyword) {
      return true
    }

    return [
      row.patientName,
      row.visitId,
      row.patientIdCard,
      row.patientPhone
    ].some((value) => value.toLowerCase().includes(normalizedKeyword))
  })
})

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

watch([activeFilter, keyword, pageSize, locale], () => {
  page.value = 1
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

.status-tag {
  min-width: 58px;
  min-height: 24px;
  border: none;
  border-radius: 4px;
  justify-content: center;
  font-size: 11px;
}

.status-tag.is-completed {
  color: #41b56f;
  background: #eaf9ed;
}

.status-tag.is-incomplete {
  color: #74839a;
  background: #f3f5f7;
}

.status-tag.is-cancelled {
  color: #d75f5f;
  background: #fdeeee;
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

  .records-page__header {
    min-height: 136px;
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
