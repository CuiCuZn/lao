<!--
 * @version:
 * @Author: Cuidezhen
 * @Date: 2026-06-22 11:36:27
 * @LastEditors: Cuidezhen
 * @LastEditTime: 2026-06-25 11:50:00
 * @company: 医视界
 * @FilePath: \lao\admin\src\views\dashboard\index.vue
 * @Descripttion: 工作台 - 首页 Dashboard，汇总各模块数据，提供快速概览和导航入口
 * @Edit Record:
-->
<template>
  <div class="dashboard-container">
    <!-- 顶部标题与刷新 -->
    <div class="page-top">
      <div class="page-title">{{ t('dashboard.title') }}</div>
      <div class="page-top-right">
        <span class="page-date">{{ currentDateText }}</span>
        <el-button class="refresh-btn" link :icon="Refresh" :loading="loading" @click="loadAll(true)">
          {{ t('dashboard.refresh') }}
        </el-button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ displayNumber(overview.todayReceptionCount) }}</div>
          <div class="stat-label">{{ t('dashboard.todayVisits') }}</div>
          <div class="stat-sub">
            <span :class="['change', isUp(overview.receptionChangeRate) ? 'up' : 'down']">
              {{ formatRate(overview.receptionChangeRate) }}
            </span>
            {{ t('dashboard.ratioUp') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <el-icon><Select /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ formatRate(overview.completionRate, '%') }}</div>
          <div class="stat-label">{{ t('dashboard.completionRate') }}</div>
          <div class="stat-sub">
            {{ overview.completedReceptionCount ?? 0 }}/{{ overview.totalReceptionCount ?? 0 }}
            {{ t('dashboard.completed') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ displayNumber(overview.onlineDoctorCount) }}
            <span class="stat-value-sub">/{{ displayNumber(overview.totalDoctorCount) }}</span>
          </div>
          <div class="stat-label">{{ t('dashboard.onlineDoctors') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <el-icon><Plus /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ displayNumber(overview.todayNewPatientCount) }}</div>
          <div class="stat-label">{{ t('dashboard.todayNewPatients') }}</div>
          <div class="stat-sub">
            {{ t('dashboard.totalPatient') }} {{ displayNumber(overview.totalPatientCount) }}
            {{ t('dashboard.personUnit') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 图表行 -->
    <div class="content-grid cols-2">
      <!-- 近7天接诊趋势 -->
      <div class="card">
        <div class="card-header">
          <span>{{ t('dashboard.visitTrend') }}</span>
          <span class="card-header-extra">{{ t('dashboard.visitUnit') }}</span>
        </div>
        <div class="card-body chart-body" v-loading="loading">
          <div ref="trendChartRef" class="chart"></div>
          <div v-if="!trendData.length && !loading" class="empty-tip">{{ t('dashboard.noData') }}</div>
        </div>
      </div>

      <!-- 今日科室分布 -->
      <div class="card">
        <div class="card-header">
          <span>{{ t('dashboard.deptDistribution') }}</span>
        </div>
        <div class="card-body chart-body" v-loading="loading">
          <div ref="deptChartRef" class="chart"></div>
          <div v-if="!deptData.length && !loading" class="empty-tip">{{ t('dashboard.noData') }}</div>
        </div>
      </div>
    </div>

    <!-- 列表行 -->
    <div class="content-grid cols-2">
      <!-- 今日医生排行 -->
      <div class="card">
        <div class="card-header">
          <span>{{ t('dashboard.doctorRank') }}</span>
          <span class="card-header-extra">TOP5</span>
        </div>
        <div class="card-body" v-loading="loading">
          <table class="mini-table">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th>{{ t('dashboard.rankDoctor') }}</th>
                <th>{{ t('dashboard.rankDept') }}</th>
                <th class="col-num">{{ t('dashboard.rankVisits') }}</th>
                <th class="col-num">{{ t('dashboard.rankPrescription') }}</th>
                <th class="col-num">{{ t('dashboard.rankAvgTime') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in doctorRanking" :key="item.doctorId ?? idx">
                <td>
                  <span :class="['rank-no', rankClass(idx)]">{{ idx + 1 }}</span>
                </td>
                <td>{{ displayValue(item.doctorName) }}</td>
                <td>{{ displayValue(item.departmentName) }}</td>
                <td class="col-num">{{ displayNumber(item.receptionCount) }}</td>
                <td class="col-num">{{ displayNumber(item.prescriptionCount) }}</td>
                <td class="col-num text-muted">{{ displayValue(item.averageDuration) }}</td>
              </tr>
              <tr v-if="!doctorRanking.length && !loading">
                <td colspan="6" class="empty-row">{{ t('dashboard.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 最近就诊 -->
      <div class="card">
        <div class="card-header">
          <span>{{ t('dashboard.recentVisits') }}</span>
          <span class="card-header-extra view-all" @click="goRecord">
            {{ t('dashboard.viewAll') }}
            <el-icon><ArrowRight /></el-icon>
          </span>
        </div>
        <div class="card-body" v-loading="loading">
          <table class="mini-table">
            <thead>
              <tr>
                <th>{{ t('dashboard.colPatient') }}</th>
                <th>{{ t('dashboard.rankDoctor') }}</th>
                <th>{{ t('dashboard.rankDept') }}</th>
                <th>{{ t('dashboard.colDiagnosis') }}</th>
                <th>{{ t('dashboard.colStatus') }}</th>
                <th class="col-time">{{ t('dashboard.colTime') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in recentVisits" :key="item.caseId ?? idx">
                <td>{{ displayValue(item.patientName) }}</td>
                <td :class="{ 'text-muted': !item.doctorName }">{{ displayValue(item.doctorName) }}</td>
                <td :class="{ 'text-muted': !item.departmentName }">{{ displayValue(item.departmentName) }}</td>
                <td>
                  <span v-if="item.diagnosis" class="tag tag-info">{{ item.diagnosis }}</span>
                  <span v-else class="text-muted">--</span>
                </td>
                <td>
                  <span :class="['tag', statusTagClass(item.status)]">{{ statusText(item.status) }}</span>
                </td>
                <td class="col-time text-muted">{{ displayValue(item.visitTimeText) }}</td>
              </tr>
              <tr v-if="!recentVisits.length && !loading">
                <td colspan="6" class="empty-row">{{ t('dashboard.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  Refresh,
  ChatDotRound,
  Select,
  UserFilled,
  Plus,
  ArrowRight
} from '@element-plus/icons-vue'
import { to } from 'await-to-js'
import {
  getWorkbenchOverview,
  getWorkbenchTrend,
  getWorkbenchDeptDistribution,
  getWorkbenchDoctorRanking,
  getWorkbenchRecentVisits
} from '@/api/workbench'
import type {
  WorkbenchOverviewVO,
  WorkbenchTrendVO,
  WorkbenchDeptDistributionVO,
  WorkbenchDoctorRankingVO,
  WorkbenchRecentVisitVO
} from '@/api/types'

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  MarkPointComponent,
  CanvasRenderer
])

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const overview = reactive<WorkbenchOverviewVO>({})
const trendData = ref<WorkbenchTrendVO[]>([])
const deptData = ref<WorkbenchDeptDistributionVO[]>([])
const doctorRanking = ref<WorkbenchDoctorRankingVO[]>([])
const recentVisits = ref<WorkbenchRecentVisitVO[]>([])

const trendChartRef = ref<HTMLElement>()
const deptChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let deptChart: echarts.ECharts | null = null

// 自动刷新定时器（每 5 分钟）
const REFRESH_INTERVAL = 5 * 60 * 1000
let refreshTimer: ReturnType<typeof setInterval> | null = null

/** 科室柱状图配色（循环取色） */
const DEPT_COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#8B5CF6', '#F56C6C', '#909399']

/**
 * 顶部日期文本，格式：2026年6月15日 星期一 10:32
 */
const currentDateText = computed(() => {
  const now = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]} ${hh}:${mm}`
})

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

const displayNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '0'
  const num = Number(value)
  return Number.isFinite(num) ? String(num) : '0'
}

/** 完成率格式化：后端可能返回 "96.9" 或 "96.9%" */
const formatRate = (value?: string, suffix = '') => {
  if (value === null || value === undefined || value === '') return '--'
  const str = String(value)
  if (suffix && !str.endsWith('%')) return `${str}${suffix}`
  return str
}

const isUp = (rate?: string) => {
  if (!rate) return false
  const num = parseFloat(String(rate))
  return Number.isFinite(num) ? num >= 0 : false
}

const rankClass = (idx: number) => {
  if (idx === 0) return 'rank-1'
  if (idx === 1) return 'rank-2'
  if (idx === 2) return 'rank-3'
  return ''
}

/**
 * 就诊状态映射 → 标签样式
 * 兼容后端可能返回的中文 / 编码
 */
const STATUS_MAP: Record<string, { type: string; key: string }> = {
  '已完成': { type: 'tag-success', key: 'statusDone' },
  '完成': { type: 'tag-success', key: 'statusDone' },
  'done': { type: 'tag-success', key: 'statusDone' },
  'completed': { type: 'tag-success', key: 'statusDone' },
  '待接诊': { type: 'tag-warning', key: 'statusWaiting' },
  'waiting': { type: 'tag-warning', key: 'statusWaiting' },
  'pending': { type: 'tag-warning', key: 'statusWaiting' },
  '已开方': { type: 'tag-primary', key: 'statusPrescribed' },
  'prescribed': { type: 'tag-primary', key: 'statusPrescribed' },
  '进行中': { type: 'tag-primary', key: 'statusInProgress' },
  'in_progress': { type: 'tag-primary', key: 'statusInProgress' },
  'ongoing': { type: 'tag-primary', key: 'statusInProgress' }
}

const statusTagClass = (status?: string) => {
  if (!status) return 'tag-info'
  return STATUS_MAP[String(status).trim()]?.type || 'tag-info'
}

const statusText = (status?: string) => {
  if (!status || status === '') return '--'
  const mapped = STATUS_MAP[String(status).trim()]
  if (mapped) return t(`dashboard.${mapped.key}`)
  return String(status)
}

/**
 * 近 7 天接诊趋势折线图
 */
const renderTrendChart = () => {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  const dates = trendData.value.map(d => shortDate(d.date))
  const counts = trendData.value.map(d => Number(d.count ?? 0))
  const lastIndex = counts.length - 1

  trendChart.setOption({
    grid: { left: 44, right: 24, top: 30, bottom: 30, containLabel: false },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        return `${p.axisValue}<br/>${t('dashboard.rankVisits')}：${p.value}`
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#EBEEF5' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#909399',
        fontSize: 11,
        formatter: (val: string, idx: number) => (idx === lastIndex ? `{hl|${val}}` : val),
        rich: { hl: { color: '#67C23A', fontWeight: 700, fontSize: 12 } }
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#EBEEF5' } },
      axisLabel: { color: '#909399', fontSize: 11 }
    },
    series: [
      {
        type: 'line',
        data: counts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#409EFF', width: 2.5 },
        itemStyle: { color: '#409EFF', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.25)' },
            { offset: 1, color: 'rgba(64,158,255,0)' }
          ])
        },
        markPoint: lastIndex >= 0
          ? {
              symbol: 'circle',
              symbolSize: 9,
              data: [{ coord: [lastIndex, counts[lastIndex]], itemStyle: { color: '#67C23A' } }]
            }
          : undefined
      }
    ]
  })
  trendChart.resize()
}

/**
 * 今日科室分布柱状图（横向）
 */
const renderDeptChart = () => {
  if (!deptChartRef.value) return
  if (!deptChart) {
    deptChart = echarts.init(deptChartRef.value)
  }
  const rows = [...deptData.value]
  const max = Math.max(1, ...rows.map(r => Number(r.count ?? 0)))

  deptChart.setOption({
    grid: { left: 8, right: 40, top: 12, bottom: 12, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        return `${p.name}<br/>${t('dashboard.rankVisits')}：${p.value}`
      }
    },
    xAxis: {
      type: 'value',
      max: Math.ceil(max * 1.1),
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399', fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: rows.map(r => r.departmentName || '--'),
      axisLine: { lineStyle: { color: '#EBEEF5' } },
      axisTick: { show: false },
      axisLabel: { color: '#606266', fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        data: rows.map((r, i) => ({
          value: Number(r.count ?? 0),
          itemStyle: { color: DEPT_COLORS[i % DEPT_COLORS.length], borderRadius: [0, 4, 4, 0] }
        })),
        barWidth: 16,
        label: {
          show: true,
          position: 'right',
          color: '#606266',
          fontSize: 12
        }
      }
    ]
  })
  deptChart.resize()
}

/** 日期短格式化：取 MM-DD */
const shortDate = (date?: string) => {
  if (!date) return ''
  const d = new Date(String(date).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return String(date).slice(5)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

/**
 * 加载所有工作台数据
 * @param notify 是否提示刷新成功
 */
const loadAll = async (notify = false) => {
  loading.value = true
  const tasks = [
    to(getWorkbenchOverview()),
    to(getWorkbenchTrend()),
    to(getWorkbenchDeptDistribution()),
    to(getWorkbenchDoctorRanking()),
    to(getWorkbenchRecentVisits())
  ]
  const [ov, tr, dd, dr, rv] = await Promise.all(tasks)

  if (ov[1]) Object.assign(overview, (ov[1] as any)?.data || {})
  if (tr[1]) trendData.value = (tr[1] as any)?.data || []
  if (dd[1]) deptData.value = (dd[1] as any)?.data || []
  if (dr[1]) doctorRanking.value = (dr[1] as any)?.data || []
  if (rv[1]) recentVisits.value = (rv[1] as any)?.data || []

  loading.value = false

  await nextTick()
  renderTrendChart()
  renderDeptChart()

  if (notify) {
    ElMessage.success(t('dashboard.refreshSuccess'))
  }
}

/**
 * "查看全部" → 跳转诊疗记录页，并带入今日日期筛选
 */
const goRecord = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const visitDate = `${yyyy}-${mm}-${dd}`

  const route = router.getRoutes().find(r => /\/record/.test(r.path) && !r.meta?.hidden)
  const path = route?.path || '/record'
  router.push({ path, query: { visitDate } })
}

const handleResize = () => {
  trendChart?.resize()
  deptChart?.resize()
}

onMounted(() => {
  loadAll()
  refreshTimer = setInterval(() => loadAll(false), REFRESH_INTERVAL)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  deptChart?.dispose()
  trendChart = null
  deptChart = null
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 4px 12px 12px;
}

/* 顶部 */
.page-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}
.page-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-date {
  font-size: 13px;
  color: #909399;
}
.refresh-btn {
  font-size: 13px;
}

/* 指标卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  .el-icon {
    font-size: 26px;
  }
}
.stat-icon-blue { background: #ecf5ff; color: #409eff; }
.stat-icon-green { background: #f0f9eb; color: #67c23a; }
.stat-icon-orange { background: #fdf6ec; color: #e6a23c; }
.stat-icon-purple { background: #f4f0ff; color: #8b5cf6; }
.stat-info { min-width: 0; }
.stat-value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
  color: #303133;
}
.stat-value-sub {
  font-size: 16px;
  color: #909399;
  font-weight: 400;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}
.stat-sub {
  font-size: 12px;
  margin-top: 4px;
  color: #909399;
  .change.up { color: #f56c6c; font-weight: 600; }
  .change.down { color: #67c23a; font-weight: 600; }
}

/* 图表 / 列表网格 */
.content-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 18px;
}
.cols-2 {
  grid-template-columns: 1fr 1fr;
}

/* 卡片 */
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.card-header {
  padding: 14px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.card-header-extra {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}
.view-all {
  color: #409eff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  &:hover { color: #66b1ff; }
}
.card-body {
  padding: 16px 20px;
}
.chart-body {
  position: relative;
}
.chart {
  width: 100%;
  height: 240px;
}
.empty-tip {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
}

/* 迷你表格 */
.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th {
    text-align: left;
    padding: 8px 12px;
    background: #fafbfc;
    color: #606266;
    font-weight: 600;
    border-bottom: 1px solid #ebeef5;
    font-size: 12px;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #ebeef5;
    color: #303133;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:hover td {
    background: #f5f8ff;
  }
  .col-index { width: 36px; text-align: center; }
  .col-num { text-align: right; }
  .col-time { width: 80px; }
  .text-muted { color: #909399; }
  .empty-row {
    text-align: center;
    color: #909399;
    padding: 28px 0;
  }
}

/* 排名序号 */
.rank-no {
  display: inline-block;
  font-weight: 700;
  color: #909399;
  &.rank-1 { color: #f56c6c; }
  &.rank-2 { color: #e6a23c; }
  &.rank-3 { color: #409eff; }
}

/* 标签 */
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.tag-success { background: #f0f9eb; color: #67c23a; }
.tag-warning { background: #fdf6ec; color: #e6a23c; }
.tag-danger { background: #fef0f0; color: #f56c6c; }
.tag-primary { background: #ecf5ff; color: #409eff; }
.tag-info { background: #f4f4f5; color: #909399; }

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .cols-2 { grid-template-columns: 1fr; }
}
</style>
