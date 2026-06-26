<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('log.ip') }}</span>
          <el-input
            v-model="queryParams.operIp"
            :placeholder="t('log.inputIp')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.module') }}</span>
          <el-input
            v-model="queryParams.title"
            :placeholder="t('log.inputModule')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.operator') }}</span>
          <el-input
            v-model="queryParams.operName"
            :placeholder="t('log.inputOperator')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.operateType') }}</span>
          <el-select
            v-model="queryParams.businessType"
            :placeholder="t('log.selectType')"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="dict in operTypeOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.status') }}</span>
          <el-select
            v-model="queryParams.status"
            :placeholder="t('log.selectStatus')"
            clearable
            class="filter-select"
          >
            <el-option :label="t('log.statusSuccess')" value="0" />
            <el-option :label="t('log.statusFail')" value="1" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.dateRange') }}</span>
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
      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="logList" class="log-table" style="width: 100%">
        <el-table-column :label="t('log.operateTime')" prop="operTime" min-width="160" />
        <el-table-column :label="t('log.operator')" prop="operName" min-width="110" />
        <el-table-column :label="t('log.module')" prop="title" min-width="120">
          <template #default="scope">
            <span class="module-tag">{{ scope.row.title || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('log.operateType')" min-width="100" align="center">
          <template #default="scope">
            <dict-tag :options="operTypeOptions" :value="scope.row.businessType ?? ''" class="status-tags" />
          </template>
        </el-table-column>
        <el-table-column :label="t('log.ip')" prop="operIp" min-width="130" />
        <el-table-column :label="t('log.status')" prop="status" width="90" align="center">
          <template #default="scope">
            <span
              class="status-tag"
              :class="String(scope.row.status) === '1' ? 'status-tag--danger' : 'status-tag--success'"
            >{{ String(scope.row.status) === '1' ? t('log.statusFail') : t('log.statusSuccess') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('log.costTime')" min-width="110" align="center">
          <template #default="scope">
            <span>{{ formatCostTime(scope.row.costTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operate')" width="100" fixed="right" class-name="action-col">
          <template #default="scope">
            <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
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

    <!-- 3. 详情弹窗 -->
    <el-dialog :title="t('log.operateDetail')" v-model="detailVisible" width="640px" append-to-body class="detail-dialog">
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">{{ t('log.operateType') }}</span>
          <span class="detail-value">
            <dict-tag :options="operTypeOptions" :value="detailData.businessType ?? ''" class="status-tags" />
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.operator') }}</span>
          <span class="detail-value">{{ detailData.operName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.operateTime') }}</span>
          <span class="detail-value">{{ detailData.operTime || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.ip') }}</span>
          <span class="detail-value">{{ detailData.operIp || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.module') }}</span>
          <span class="detail-value">{{ detailData.title || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.status') }}</span>
          <span class="detail-value">
            <span
              class="status-tag"
              :class="String(detailData.status) === '1' ? 'status-tag--danger' : 'status-tag--success'"
            >{{ String(detailData.status) === '1' ? t('log.statusFail') : t('log.statusSuccess') }}</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.requestMethod') }}</span>
          <span class="detail-value">{{ detailData.requestMethod || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.costTime') }}</span>
          <span class="detail-value">{{ formatCostTime(detailData.costTime) }}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.operUrl') }}</span>
          <span class="detail-value detail-value--break">{{ detailData.operUrl || '-' }}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.method') }}</span>
          <span class="detail-value detail-value--break">{{ detailData.method || '-' }}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.operParam') }}</span>
          <div class="detail-json">{{ formatJson(detailData.operParam) }}</div>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.jsonResult') }}</span>
          <div class="detail-json">{{ formatJson(detailData.jsonResult) }}</div>
        </div>
        <div v-if="String(detailData.status) === '1'" class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.errorMsg') }}</span>
          <div class="detail-json detail-json--error">{{ detailData.errorMsg || '-' }}</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">{{ t('common.close') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import { listOperlog } from '@/api/operlog'
import { OperLogQuery, OperLogVO } from '@/api/types'
import { useDictStore } from '@/stores/dict'
import { to } from 'await-to-js'
import DictTag from '@/components/DictTag/index.vue'

const { t } = useI18n()
const dictStore = useDictStore()

// 操作类型字典 sys_oper_type
const operTypeOptions = computed(() => dictStore.getDict('sys_oper_type'))

// 数据状态
const loading = ref(false)
const logList = ref<OperLogVO[]>([])
const total = ref(0)
const detailVisible = ref(false)
const detailData = ref<Partial<OperLogVO>>({})

// 操作时间范围（双值绑定，提交时拆到 params）
const dateRange = ref<[string, string] | []>([])

// 查询参数 (适配 GET /monitor/operlog/list)
const queryParams = reactive<OperLogQuery>({
  pageNum: 1,
  pageSize: 20,
  operIp: '',
  title: '',
  operName: '',
  businessType: '',
  status: '',
  orderByColumn: 'operTime',
  isAsc: 'descending',
  params: { beginTime: undefined, endTime: undefined }
})

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
 * 格式化消耗时间（毫秒 → 可读文本）
 */
const formatCostTime = (costTime?: number) => {
  if (costTime == null) return '-'
  if (costTime < 1000) return `${costTime} ms`
  return `${(costTime / 1000).toFixed(2)} s`
}

/**
 * 格式化 JSON 字符串（请求参数 / 返回结果），失败则原样返回
 */
const formatJson = (str?: string) => {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

/**
 * 获取列表数据
 */
const getList = async () => {
  loading.value = true
  const [err, res] = await to(listOperlog(queryParams))
  if (res) {
    logList.value = res.rows || []
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
  queryParams.operIp = ''
  queryParams.title = ''
  queryParams.operName = ''
  queryParams.businessType = ''
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
 * 查看详情
 */
const handleDetail = (row: OperLogVO) => {
  detailData.value = { ...row }
  detailVisible.value = true
}

onMounted(async () => {
  // 预加载操作类型字典
  await dictStore.loadDict('sys_oper_type')
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

/* 表格 */
.log-table {
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

/* 系统模块标签（原型灰色胶囊） */
.module-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  background: #f4f4f5;
  color: #909399;
}

/* 操作状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.status-tag--success {
  background: #f0f9eb;
  color: #67c23a;
}
.status-tag--danger {
  background: #fef0f0;
  color: #f56c6c;
}

/* 字典标签（操作类型）覆盖为原型胶囊样式 */
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

/* 详情弹窗 */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-item--full {
  grid-column: 1 / -1;
}
.detail-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}
.detail-value {
  font-size: 14px;
  color: #303133;
  min-height: 24px;
  display: flex;
  align-items: center;
}
.detail-value--break {
  word-break: break-all;
}
.detail-json {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 12px;
  font-family: "SF Mono", Monaco, Menlo, monospace;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
.detail-json--error {
  background: #fef0f0;
  color: #f56c6c;
}
</style>

<!-- 详情弹窗：append-to-body 后 DOM 挂在 body 下，需用全局样式 + 独有 class 限定 -->
<style lang="scss">
.detail-dialog {
  .el-dialog__body {
    height: 480px;
    overflow-y: auto;
    /* 默认隐藏滚动条，悬停(滑动)时显示，并减小宽度 */
    scrollbar-width: thin; /* Firefox */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 3px;
      transition: background 0.2s;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &:hover::-webkit-scrollbar-thumb {
      background: #c0c4cc;
    }
    &:hover::-webkit-scrollbar-thumb:hover {
      background: #909399;
    }
  }
}
</style>
