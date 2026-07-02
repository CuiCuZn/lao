<template>
  <div class="app-container">
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">字典名称</span>
          <el-input
            v-model="queryParams.dictName"
            placeholder="请输入字典名称"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">字典类型</span>
          <el-input
            v-model="queryParams.dictType"
            placeholder="请输入字典类型"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">创建时间</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="filter-date"
          />
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </div>
        <div class="filter-right-actions">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增字典</el-button>
          <el-button type="warning" :icon="RefreshRight" @click="handleRefreshCache">刷新缓存</el-button>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <el-table v-loading="loading" :data="dictList" class="dict-table" style="width: 100%">
        <el-table-column label="字典编号" prop="dictId" align="center" width="220" />
        <el-table-column label="字典名称" prop="dictName" min-width="160" show-overflow-tooltip />
        <el-table-column label="字典类型" prop="dictType" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <el-link type="primary" :underline="false" @click="handleOpenData(scope.row)">
              {{ scope.row.dictType }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" min-width="160" align="center">
          <template #default="scope">
            <span class="time-text">{{ formatTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" class-name="action-col">
          <template #default="scope">
            <el-button link type="primary" :icon="View" @click="handleView(scope.row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <span class="pagination-info">共 {{ total }} 条</span>
        <el-pagination
          v-show="total > 0"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next, jumper"
          background
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="currentDictType ? `字典数据 - ${currentDictType.dictName} (${currentDictType.dictType})` : '字典数据'"
      direction="rtl"
      size="70%"
      destroy-on-close
      header-class="dict-drawer-header"
    >
      <div class="drawer-content">
        <div class="card search-card drawer-search">
          <div class="filter-row">
            <div class="filter-item">
              <span class="filter-label">字典标签</span>
              <el-input
                v-model="dataQueryParams.dictLabel"
                placeholder="请输入字典标签"
                clearable
                class="filter-input"
                @keyup.enter="handleDataQuery"
              />
            </div>
            <div class="filter-actions">
              <el-button type="primary" :icon="Search" @click="handleDataQuery">查询</el-button>
              <el-button :icon="Refresh" @click="resetDataQuery">重置</el-button>
            </div>
            <div class="filter-right-actions">
              <el-button type="primary" :icon="Plus" @click="handleDataAdd">新增字典数据</el-button>
            </div>
          </div>
        </div>

        <div class="card table-card drawer-table">
          <el-table v-loading="dataLoading" :data="dictDataList" class="dict-table" style="width: 100%">
            <el-table-column label="字典编码" prop="dictCode" align="center" width="220" />
            <el-table-column label="字典标签" prop="dictLabel" min-width="140" show-overflow-tooltip />
            <el-table-column label="字典键值" prop="dictValue" min-width="140" show-overflow-tooltip />
            <el-table-column label="字典排序" prop="dictSort" align="center" width="100" />
            <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="createTime" min-width="160" align="center">
              <template #default="scope">
                <span class="time-text">{{ formatTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right" class-name="action-col">
              <template #default="scope">
                <el-button link type="primary" :icon="View" @click="handleDataView(scope.row)">查看</el-button>
                <el-button link type="primary" :icon="Edit" @click="handleDataEdit(scope.row)">编辑</el-button>
                <el-button link type="danger" :icon="Delete" @click="handleDataDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-bar">
            <span class="pagination-info">共 {{ dataTotal }} 条</span>
            <el-pagination
              v-show="dataTotal > 0"
              v-model:current-page="dataQueryParams.pageNum"
              v-model:page-size="dataQueryParams.pageSize"
              :total="dataTotal"
              :page-sizes="[10, 20, 50]"
              layout="sizes, prev, pager, next, jumper"
              background
              @size-change="getDataList"
              @current-change="getDataList"
            />
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="typeDialogVisible"
      :title="typeDialogTitle"
      width="560px"
      append-to-body
      destroy-on-close
      @close="resetTypeForm"
    >
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="90px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="typeForm.dictName" placeholder="请输入字典名称" :disabled="typeReadOnly" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="typeForm.dictType" placeholder="请输入字典类型" :disabled="typeReadOnly" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="typeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            :disabled="typeReadOnly"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button v-if="!typeReadOnly" type="primary" :loading="typeSubmitLoading" @click="submitTypeForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dataDialogVisible"
      :title="dataDialogTitle"
      width="560px"
      append-to-body
      destroy-on-close
      @close="resetDataForm"
    >
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="90px">
        <el-form-item label="字典类型">
          <el-input :value="currentDictType?.dictType" disabled />
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input v-model="dataForm.dictLabel" placeholder="请输入字典标签" :disabled="dataReadOnly" />
        </el-form-item>
        <el-form-item label="字典键值" prop="dictValue">
          <el-input v-model="dataForm.dictValue" placeholder="请输入字典键值" :disabled="dataReadOnly" />
        </el-form-item>
        <el-form-item label="字典排序" prop="dictSort">
          <el-input-number v-model="dataForm.dictSort" :min="0" :disabled="dataReadOnly" />
        </el-form-item>
        <el-form-item label="样式属性" prop="cssClass">
          <el-input v-model="dataForm.cssClass" placeholder="请输入样式属性" :disabled="dataReadOnly" />
        </el-form-item>
        <el-form-item label="回显样式" prop="listClass">
          <el-select v-model="dataForm.listClass" placeholder="请选择回显样式" :disabled="dataReadOnly" style="width: 100%">
            <el-option
              v-for="item in listClassOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="dataForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            :disabled="dataReadOnly"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataDialogVisible = false">取消</el-button>
        <el-button v-if="!dataReadOnly" type="primary" :loading="dataSubmitLoading" @click="submitDataForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, View, Edit, Delete, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { to } from 'await-to-js'
import {
  listDictType,
  getDictType,
  addDictType,
  updateDictType,
  delDictType,
  refreshCache,
  listDictData,
  getDictData,
  addDictData,
  updateDictData,
  delDictData,
  type DictTypeVO,
  type DictTypeQuery,
  type DictDataQuery
} from '@/api/dict'
import { type DictDataVO } from '@/api/types'

const loading = ref(false)
const dictList = ref<DictTypeVO[]>([])
const total = ref(0)
const dateRange = ref<string[]>([])

const queryParams = reactive<DictTypeQuery>({
  dictName: '',
  dictType: '',
  pageNum: 1,
  pageSize: 10
})

const drawerVisible = ref(false)
const currentDictType = ref<DictTypeVO | null>(null)
const dataLoading = ref(false)
const dictDataList = ref<DictDataVO[]>([])
const dataTotal = ref(0)

const dataQueryParams = reactive<DictDataQuery>({
  dictLabel: '',
  dictType: '',
  pageNum: 1,
  pageSize: 10
})

const typeDialogVisible = ref(false)
const typeDialogTitle = ref('')
const typeReadOnly = ref(false)
const typeSubmitLoading = ref(false)
const typeFormRef = ref<FormInstance>()
const typeForm = reactive<Partial<DictTypeVO>>({
  dictId: undefined,
  dictName: '',
  dictType: '',
  remark: ''
})

const typeRules: FormRules = {
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }]
}

const dataDialogVisible = ref(false)
const dataDialogTitle = ref('')
const dataReadOnly = ref(false)
const dataSubmitLoading = ref(false)
const dataFormRef = ref<FormInstance>()

const listClassOptions = [
  { label: '默认(default)', value: 'default' },
  { label: '主要(primary)', value: 'primary' },
  { label: '成功(success)', value: 'success' },
  { label: '信息(info)', value: 'info' },
  { label: '警告(warning)', value: 'warning' },
  { label: '危险(danger)', value: 'danger' }
]

const dataForm = reactive<Partial<DictDataVO>>({
  dictCode: undefined,
  dictLabel: '',
  dictValue: '',
  dictSort: 0,
  cssClass: '',
  listClass: 'primary',
  remark: '',
  dictType: ''
})

const dataRules: FormRules = {
  dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典键值', trigger: 'blur' }],
  dictSort: [{ required: true, message: '请输入字典排序', trigger: 'blur' }]
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 16)
}

const getList = async () => {
  loading.value = true
  const params: any = { ...queryParams }
  if (dateRange.value && dateRange.value.length === 2) {
    params.params = {
      beginTime: dateRange.value[0],
      endTime: dateRange.value[1]
    }
  }
  const [err, res] = await to(listDictType(params))
  if (res) {
    dictList.value = res.rows || []
    total.value = res.total || 0
  }
  loading.value = false
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.dictName = ''
  queryParams.dictType = ''
  dateRange.value = []
  queryParams.pageNum = 1
  queryParams.pageSize = 10
  getList()
}

const resetTypeForm = () => {
  typeForm.dictId = undefined
  typeForm.dictName = ''
  typeForm.dictType = ''
  typeForm.remark = ''
  typeFormRef.value?.clearValidate()
}

const handleAdd = () => {
  typeReadOnly.value = false
  typeDialogTitle.value = '新增字典类型'
  resetTypeForm()
  typeDialogVisible.value = true
}

const handleEdit = async (row: DictTypeVO) => {
  typeReadOnly.value = false
  typeDialogTitle.value = '编辑字典类型'
  resetTypeForm()
  const [err, res] = await to(getDictType(row.dictId))
  if (res && res.data) {
    Object.assign(typeForm, {
      dictId: res.data.dictId,
      dictName: res.data.dictName,
      dictType: res.data.dictType,
      remark: res.data.remark || ''
    })
    typeDialogVisible.value = true
  }
}

const handleView = async (row: DictTypeVO) => {
  typeReadOnly.value = true
  typeDialogTitle.value = '查看字典类型'
  resetTypeForm()
  const [err, res] = await to(getDictType(row.dictId))
  if (res && res.data) {
    Object.assign(typeForm, {
      dictId: res.data.dictId,
      dictName: res.data.dictName,
      dictType: res.data.dictType,
      remark: res.data.remark || ''
    })
    typeDialogVisible.value = true
  }
}

const submitTypeForm = async () => {
  if (!typeFormRef.value) return
  const valid = await typeFormRef.value.validate().catch(() => false)
  if (!valid) return
  typeSubmitLoading.value = true
  const isEdit = !!typeForm.dictId
  const [err] = await to(
    isEdit ? updateDictType(typeForm) : addDictType(typeForm)
  )
  typeSubmitLoading.value = false
  if (!err) {
    ElMessage.success(isEdit ? '修改成功' : '新增成功')
    typeDialogVisible.value = false
    getList()
  }
}

const handleDelete = (row: DictTypeVO) => {
  ElMessageBox.confirm(`确认删除字典「${row.dictName}」？此操作不可撤销。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    const [err] = await to(delDictType(String(row.dictId)))
    if (!err) {
      ElMessage.success('已删除')
      getList()
    }
  }).catch(() => {})
}

const handleRefreshCache = async () => {
  const [err] = await to(refreshCache())
  if (!err) {
    ElMessage.success('刷新缓存成功')
  }
}

const handleOpenData = (row: DictTypeVO) => {
  currentDictType.value = row
  dataQueryParams.dictType = row.dictType
  dataQueryParams.dictLabel = ''
  dataQueryParams.pageNum = 1
  dataQueryParams.pageSize = 10
  drawerVisible.value = true
  getDataList()
}

const getDataList = async () => {
  if (!currentDictType.value) return
  dataLoading.value = true
  const params: DictDataQuery = {
    dictLabel: dataQueryParams.dictLabel || undefined,
    dictType: currentDictType.value.dictType,
    pageNum: dataQueryParams.pageNum,
    pageSize: dataQueryParams.pageSize
  }
  const [err, res] = await to(listDictData(params))
  if (res) {
    dictDataList.value = res.rows || []
    dataTotal.value = res.total || 0
  }
  dataLoading.value = false
}

const handleDataQuery = () => {
  dataQueryParams.pageNum = 1
  getDataList()
}

const resetDataQuery = () => {
  dataQueryParams.dictLabel = ''
  dataQueryParams.pageNum = 1
  dataQueryParams.pageSize = 10
  getDataList()
}

const resetDataForm = () => {
  dataForm.dictCode = undefined
  dataForm.dictLabel = ''
  dataForm.dictValue = ''
  dataForm.dictSort = 0
  dataForm.cssClass = ''
  dataForm.listClass = 'primary'
  dataForm.remark = ''
  dataForm.dictType = currentDictType.value?.dictType || ''
  dataFormRef.value?.clearValidate()
}

const handleDataAdd = () => {
  dataReadOnly.value = false
  dataDialogTitle.value = '新增字典数据'
  resetDataForm()
  dataDialogVisible.value = true
}

const handleDataEdit = async (row: DictDataVO) => {
  dataReadOnly.value = false
  dataDialogTitle.value = '编辑字典数据'
  resetDataForm()
  const [err, res] = await to(getDictData(row.dictCode))
  if (res && res.data) {
    Object.assign(dataForm, {
      dictCode: res.data.dictCode,
      dictLabel: res.data.dictLabel,
      dictValue: res.data.dictValue,
      dictSort: res.data.dictSort,
      cssClass: res.data.cssClass || '',
      listClass: res.data.listClass || 'primary',
      remark: res.data.remark || '',
      dictType: res.data.dictType
    })
    dataDialogVisible.value = true
  }
}

const handleDataView = async (row: DictDataVO) => {
  dataReadOnly.value = true
  dataDialogTitle.value = '查看字典数据'
  resetDataForm()
  const [err, res] = await to(getDictData(row.dictCode))
  if (res && res.data) {
    Object.assign(dataForm, {
      dictCode: res.data.dictCode,
      dictLabel: res.data.dictLabel,
      dictValue: res.data.dictValue,
      dictSort: res.data.dictSort,
      cssClass: res.data.cssClass || '',
      listClass: res.data.listClass || 'primary',
      remark: res.data.remark || '',
      dictType: res.data.dictType
    })
    dataDialogVisible.value = true
  }
}

const submitDataForm = async () => {
  if (!dataFormRef.value) return
  const valid = await dataFormRef.value.validate().catch(() => false)
  if (!valid) return
  dataSubmitLoading.value = true
  const payload: Partial<DictDataVO> = {
    ...dataForm,
    dictType: currentDictType.value?.dictType || dataForm.dictType
  }
  const isEdit = !!dataForm.dictCode
  const [err] = await to(
    isEdit ? updateDictData(payload) : addDictData(payload)
  )
  dataSubmitLoading.value = false
  if (!err) {
    ElMessage.success(isEdit ? '修改成功' : '新增成功')
    dataDialogVisible.value = false
    getDataList()
  }
}

const handleDataDelete = (row: DictDataVO) => {
  ElMessageBox.confirm(`确认删除字典数据「${row.dictLabel}」？此操作不可撤销。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    const [err] = await to(delDictData(String(row.dictCode)))
    if (!err) {
      ElMessage.success('已删除')
      getDataList()
    }
  }).catch(() => {})
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
  width: 180px;
}

.filter-date {
  width: 260px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.filter-right-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-left: auto;
}

.dict-table {
  width: 100%;
  :deep(thead th) {
    background: #fafbfc;
    color: #606266;
    font-weight: 600;
  }
  :deep(tbody tr:hover > td) {
    background: #f5f8ff;
  }
}

.time-text {
  font-size: 12px;
  color: #909399;
}

.action-col {
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

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 4px;
}

.drawer-search {
  margin-bottom: 12px;
  padding: 14px 16px;
}

.drawer-table {
  flex: 1;
  min-height: 0;
}
</style>

<style lang="scss">
.dict-drawer-header {
  padding: 12px 20px !important;
  margin-bottom: 0 !important;
  font-size: 15px !important;
}
</style>
