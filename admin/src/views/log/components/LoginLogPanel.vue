<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('log.loginIp') }}</span>
          <el-input
            v-model="queryParams.ipaddr"
            :placeholder="t('log.inputLoginIp')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.userName') }}</span>
          <el-input
            v-model="queryParams.userName"
            :placeholder="t('log.inputUserName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.loginStatus') }}</span>
          <el-select
            v-model="queryParams.status"
            :placeholder="t('log.selectLoginStatus')"
            clearable
            class="filter-select"
          >
            <el-option :label="t('log.loginStatusSuccess')" value="0" />
            <el-option :label="t('log.loginStatusFail')" value="1" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('log.loginDateRange') }}</span>
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
        <el-table-column :label="t('log.userName')" prop="userName" min-width="120" />
        <el-table-column :label="t('log.deviceType')" min-width="110" align="center">
          <template #default="scope">
            <dict-tag :options="deviceTypeOptions" :value="scope.row.deviceType ?? ''" class="status-tags" />
          </template>
        </el-table-column>
        <el-table-column :label="t('log.loginIp')" prop="ipaddr" min-width="130" />
        <el-table-column :label="t('log.loginLocation')" prop="loginLocation" min-width="120" show-overflow-tooltip />
        <el-table-column :label="t('log.os')" prop="os" min-width="140" show-overflow-tooltip />
        <el-table-column :label="t('log.browser')" prop="browser" min-width="130" show-overflow-tooltip />
        <el-table-column :label="t('log.loginStatus')" prop="status" width="100" align="center">
          <template #default="scope">
            <span
              class="status-tag"
              :class="String(scope.row.status) === '1' ? 'status-tag--danger' : 'status-tag--success'"
            >{{ String(scope.row.status) === '1' ? t('log.loginStatusFail') : t('log.loginStatusSuccess') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('log.loginDesc')" prop="msg" min-width="150" show-overflow-tooltip />
        <el-table-column :label="t('log.loginTime')" prop="loginTime" min-width="160" />
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
    <el-dialog :title="t('log.loginDetail')" v-model="detailVisible" width="640px" append-to-body class="detail-dialog">
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">{{ t('log.userName') }}</span>
          <span class="detail-value">{{ detailData.userName || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.deviceType') }}</span>
          <span class="detail-value">
            <dict-tag :options="deviceTypeOptions" :value="detailData.deviceType ?? ''" class="status-tags" />
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.loginIp') }}</span>
          <span class="detail-value">{{ detailData.ipaddr || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.loginLocation') }}</span>
          <span class="detail-value">{{ detailData.loginLocation || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.loginStatus') }}</span>
          <span class="detail-value">
            <span
              class="status-tag"
              :class="String(detailData.status) === '1' ? 'status-tag--danger' : 'status-tag--success'"
            >{{ String(detailData.status) === '1' ? t('log.loginStatusFail') : t('log.loginStatusSuccess') }}</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ t('log.loginTime') }}</span>
          <span class="detail-value">{{ detailData.loginTime || '-' }}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.os') }}</span>
          <span class="detail-value detail-value--break">{{ detailData.os || '-' }}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.browser') }}</span>
          <span class="detail-value detail-value--break">{{ detailData.browser || '-' }}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">{{ t('log.loginDesc') }}</span>
          <div class="detail-json" :class="String(detailData.status) === '1' ? 'detail-json--error' : ''">{{ detailData.msg || '-' }}</div>
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
import { listLogininfor } from '@/api/loginlog'
import { LoginLogQuery, LoginLogVO } from '@/api/types'
import { useDictStore } from '@/stores/dict'
import { to } from 'await-to-js'
import DictTag from '@/components/DictTag/index.vue'

const { t } = useI18n()
const dictStore = useDictStore()

// 设备类型字典 sys_device_type
const deviceTypeOptions = computed(() => dictStore.getDict('sys_device_type'))

// 数据状态
const loading = ref(false)
const logList = ref<LoginLogVO[]>([])
const total = ref(0)
const detailVisible = ref(false)
const detailData = ref<Partial<LoginLogVO>>({})

// 登录时间范围（双值绑定，提交时拆到 params）
const dateRange = ref<[string, string] | []>([])

// 查询参数 (适配 GET /monitor/logininfor/list)
const queryParams = reactive<LoginLogQuery>({
  pageNum: 1,
  pageSize: 20,
  ipaddr: '',
  userName: '',
  status: '',
  orderByColumn: 'loginTime',
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
 * 获取列表数据
 */
const getList = async () => {
  loading.value = true
  const [err, res] = await to(listLogininfor(queryParams))
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
  queryParams.ipaddr = ''
  queryParams.userName = ''
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
const handleDetail = (row: LoginLogVO) => {
  detailData.value = { ...row }
  detailVisible.value = true
}

onMounted(async () => {
  // 预加载设备类型字典
  await dictStore.loadDict('sys_device_type')
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

/* 字典标签（设备类型）覆盖为原型胶囊样式 */
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
