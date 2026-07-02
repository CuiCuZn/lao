<template>
  <div class="app-container">
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">关键词</span>
          <el-input
            v-model="queryParams.keyword"
            placeholder="穴位名称"
            clearable
            class="filter-input filter-input--wide"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">所属经络</span>
          <el-select
            v-model="queryParams.categoryCode"
            placeholder="全部经络"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="dict in meridianOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">特定穴分类</span>
          <el-select
            v-model="queryParams.bizLabelCode"
            placeholder="全部类型"
            clearable
            class="filter-select filter-select--sm"
          >
            <el-option
              v-for="dict in acupointOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </div>
        <div class="filter-right-actions">
          <el-button type="success" :icon="Upload" @click="handleImport">批量导入</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增穴位</el-button>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <el-table v-loading="loading" :data="corpusList" class="corpus-table" style="width: 100%">
        <el-table-column label="穴位名称" prop="cnContent" min-width="110" show-overflow-tooltip />
        <el-table-column label="特定穴分类" min-width="120" align="center">
          <template #default="scope">
            <span class="tag tag--info">{{ getDictLabel(acupointOptions, scope.row.bizLabelCode) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="老挝语译文" min-width="130" show-overflow-tooltip>
          <template #default="scope">
            <span class="lao-text">{{ scope.row.loContent }}</span>
          </template>
        </el-table-column>
        <el-table-column label="所属经络" min-width="120" align="center">
          <template #default="scope">
            <span class="tag tag--primary">{{ getDictLabel(meridianOptions, scope.row.categoryCode) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="定位" prop="acupointLocationCn" min-width="180" show-overflow-tooltip />
        <el-table-column label="主治功能" prop="acupointIndicationCn" min-width="200" show-overflow-tooltip />
        <el-table-column label="手法/留针" min-width="120" align="center">
          <template #default="scope">
            <div class="method-cell">
              <span class="tag tag--info">{{ getDictLabel(methodOptions, scope.row.bizTypeCode) }}</span>
              <span class="retention-text">{{ scope.row.acupointRetentionTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="素材" width="90" align="center">
          <template #default="scope">
            <span v-if="scope.row.acupointMediaUrls" class="tag tag--success">有素材</span>
            <span v-else class="tag tag--info">无</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" class-name="action-col">
          <template #default="scope">
            <el-button link type="primary" :icon="View" @click="handleView(scope.row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)">修改</el-button>
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

    <el-dialog
      v-model="formVisible"
      :title="formTitle"
      width="760px"
      append-to-body
      class="form-dialog"
      @close="closeForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" class="corpus-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属经络" prop="categoryCode">
              <el-select v-model="form.categoryCode" placeholder="选择经络" style="width: 100%" filterable allow-create>
                <el-option
                  v-for="dict in meridianOptions"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="dict.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="特定穴分类" prop="bizLabelCode">
              <el-select v-model="form.bizLabelCode" placeholder="选择特定穴分类" style="width: 100%" filterable allow-create>
                <el-option
                  v-for="dict in acupointOptions"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="dict.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="穴位中文名称" prop="cnContent">
              <el-input v-model="form.cnContent" placeholder="如 足三里" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="老挝语译文" prop="loContent">
              <el-input v-model="form.loContent" placeholder="如 ຈູ້ຊານຫຼີ" class="lao-text" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="针刺手法" prop="bizTypeCode">
              <el-select v-model="form.bizTypeCode" placeholder="请选择" style="width: 100%" filterable allow-create>
                <el-option
                  v-for="dict in methodOptions"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="dict.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手法详情" prop="acupointMethodDetail">
              <el-input v-model="form.acupointMethodDetail" placeholder="如 直刺1-2寸" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="留针时间" prop="acupointRetentionTime">
              <el-input v-model="form.acupointRetentionTime" placeholder="如 20-30分钟" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="定位描述" prop="acupointLocationCn">
          <el-input v-model="form.acupointLocationCn" type="textarea" :rows="2" placeholder="穴位的解剖定位描述" />
        </el-form-item>
        <el-form-item label="定位（老挝语）" prop="acupointLocationLo">
          <el-input v-model="form.acupointLocationLo" type="textarea" :rows="2" placeholder="穴位定位的老挝语译文（选填）" class="lao-text" />
        </el-form-item>
        <el-form-item label="主治功能" prop="acupointIndicationCn">
          <el-input v-model="form.acupointIndicationCn" type="textarea" :rows="3" placeholder="穴位的主要治疗功能" />
        </el-form-item>
        <el-form-item label="主治（老挝语）" prop="acupointIndicationLo">
          <el-input v-model="form.acupointIndicationLo" type="textarea" :rows="2" placeholder="主治功能的老挝语译文（选填）" class="lao-text" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标签" prop="acupointMediaLabel">
              <el-input v-model="form.acupointMediaLabel" placeholder="逗号分隔，如 常用,保健" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="禁忌、注意事项等（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确认保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="穴位详情"
      width="720px"
      append-to-body
      class="detail-dialog"
    >
      <div class="detail-section">
        <div class="section-title">基本信息</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">穴位名称</span>
            <span class="detail-value">{{ detailData.cnContent || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">老挝语译文</span>
            <span class="detail-value lao-text">{{ detailData.loContent || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">所属经络</span>
            <span class="detail-value tag tag--primary">{{ getDictLabel(meridianOptions, detailData.categoryCode) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">特定穴分类</span>
            <span class="detail-value tag tag--info">{{ getDictLabel(acupointOptions, detailData.bizLabelCode) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">标签</span>
            <span class="detail-value">{{ detailData.acupointMediaLabel || '-' }}</span>
          </div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-title">定位描述</div>
        <div class="detail-content">{{ detailData.acupointLocationCn || '-' }}</div>
        <div v-if="detailData.acupointLocationLo" class="detail-content lao-text mt-sm">{{ detailData.acupointLocationLo }}</div>
      </div>
      <div class="detail-section">
        <div class="section-title">主治功能</div>
        <div class="detail-content">{{ detailData.acupointIndicationCn || '-' }}</div>
        <div v-if="detailData.acupointIndicationLo" class="detail-content lao-text mt-sm">{{ detailData.acupointIndicationLo }}</div>
      </div>
      <div class="detail-section">
        <div class="section-title">针刺方案</div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">针刺手法</span>
            <span class="detail-value tag tag--warning">{{ getDictLabel(methodOptions, detailData.bizTypeCode) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">手法详情</span>
            <span class="detail-value">{{ detailData.acupointMethodDetail || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">留针时间</span>
            <span class="detail-value">{{ detailData.acupointRetentionTime || '-' }}</span>
          </div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-title">素材</div>
        <div class="detail-content">
          <span v-if="detailData.acupointMediaUrls" class="tag tag--success">有素材</span>
          <span v-else class="tag tag--info">无</span>
        </div>
      </div>
      <div v-if="detailData.remark" class="detail-section">
        <div class="section-title">备注</div>
        <div class="detail-content detail-content--note">{{ detailData.remark }}</div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <ImportDialog
      v-model="importVisible"
      title="批量导入穴位语料"
      :corpus-type="CORPUS_TYPE.ACUPOINT"
      template-filename="针灸语料模板.xlsx"
      :template-path="TEMPLATE_PATHS.ACUPOINT"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh, Plus, View, Edit, Delete, Upload, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { to } from 'await-to-js'
import {
  listCorpus,
  getCorpus,
  saveCorpus,
  removeCorpus,
  exportCorpus,
  CORPUS_TYPE,
  TEMPLATE_PATHS,
  type CorpusVO,
  type CorpusForm,
  type CorpusQuery
} from '@/api/corpus'
import { useDictStore } from '@/stores/dict'
import ImportDialog from '../corpus/components/ImportDialog.vue'

const dictStore = useDictStore()

const meridianOptions = computed(() => dictStore.getDict('acupuncture_category_code'))
const acupointOptions = computed(() => dictStore.getDict('acupuncture_label_code'))
const methodOptions = computed(() => dictStore.getDict('acupuncture_type_code'))

const loading = ref(false)
const submitLoading = ref(false)
const corpusList = ref<CorpusVO[]>([])
const total = ref(0)

const formVisible = ref(false)
const formRef = ref<FormInstance>()
const isEdit = ref(false)
const formTitle = computed(() => (isEdit.value ? '修改穴位' : '新增穴位'))
const form = reactive<CorpusForm>({
  corpusId: undefined,
  corpusType: CORPUS_TYPE.ACUPOINT,
  categoryCode: '',
  bizLabelCode: '',
  bizTypeCode: '',
  cnContent: '',
  loContent: '',
  acupointLocationCn: '',
  acupointLocationLo: '',
  acupointIndicationCn: '',
  acupointIndicationLo: '',
  acupointRetentionTime: '',
  acupointMethodDetail: '',
  acupointMediaUrls: '',
  acupointMediaLabel: '',
  remark: '',
  status: '0'
})

const detailVisible = ref(false)
const detailData = ref<Partial<CorpusVO>>({})
const importVisible = ref(false)

const queryParams = reactive<CorpusQuery>({
  corpusType: CORPUS_TYPE.ACUPOINT,
  keyword: '',
  categoryCode: '',
  bizLabelCode: '',
  bizTypeCode: '',
  pageNum: 1,
  pageSize: 20
})

const formRules: FormRules = {
  categoryCode: [{ required: true, message: '请选择所属经络', trigger: 'change' }],
  bizLabelCode: [{ required: true, message: '请选择特定穴分类', trigger: 'change' }],
  cnContent: [{ required: true, message: '请输入穴位名称', trigger: 'blur' }],
  loContent: [{ required: true, message: '请输入老挝语译文', trigger: 'blur' }],
  bizTypeCode: [{ required: true, message: '请选择针刺手法', trigger: 'change' }],
  acupointLocationCn: [{ required: true, message: '请输入定位描述', trigger: 'blur' }],
  acupointIndicationCn: [{ required: true, message: '请输入主治功能', trigger: 'blur' }],
  acupointRetentionTime: [{ required: true, message: '请输入留针时间', trigger: 'blur' }]
}

const getDictLabel = (options: any[], value?: string | number) => {
  if (value === undefined || value === null || value === '') return '-'
  const strValue = String(value)
  const item = options.find(d => String(d.dictValue) === strValue)
  return item ? item.dictLabel : strValue
}

const getList = async () => {
  loading.value = true
  const [err, res] = await to(listCorpus(queryParams))
  if (res) {
    corpusList.value = res.rows || []
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
  queryParams.categoryCode = ''
  queryParams.bizLabelCode = ''
  queryParams.bizTypeCode = ''
  queryParams.pageNum = 1
  queryParams.pageSize = 20
  getList()
}

const resetForm = () => {
  form.corpusId = undefined
  form.categoryCode = ''
  form.bizLabelCode = ''
  form.bizTypeCode = ''
  form.cnContent = ''
  form.loContent = ''
  form.acupointLocationCn = ''
  form.acupointLocationLo = ''
  form.acupointIndicationCn = ''
  form.acupointIndicationLo = ''
  form.acupointRetentionTime = ''
  form.acupointMethodDetail = ''
  form.acupointMediaUrls = ''
  form.acupointMediaLabel = ''
  form.remark = ''
  form.status = '0'
  formRef.value?.resetFields()
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  formVisible.value = true
}

const handleEdit = async (row: CorpusVO) => {
  resetForm()
  isEdit.value = true
  const [err, res] = await to(getCorpus(row.corpusId))
  if (res && res.data) {
    const d = res.data
    Object.assign(form, {
      corpusId: d.corpusId,
      corpusType: d.corpusType,
      categoryCode: d.categoryCode,
      bizLabelCode: d.bizLabelCode || '',
      bizTypeCode: d.bizTypeCode || '',
      cnContent: d.cnContent,
      loContent: d.loContent,
      acupointLocationCn: d.acupointLocationCn || '',
      acupointLocationLo: d.acupointLocationLo || '',
      acupointIndicationCn: d.acupointIndicationCn || '',
      acupointIndicationLo: d.acupointIndicationLo || '',
      acupointRetentionTime: d.acupointRetentionTime || '',
      acupointMethodDetail: d.acupointMethodDetail || '',
      acupointMediaUrls: d.acupointMediaUrls || '',
      acupointMediaLabel: d.acupointMediaLabel || '',
      remark: d.remark || '',
      status: d.status
    })
    formVisible.value = true
  }
}

const handleView = async (row: CorpusVO) => {
  const [err, res] = await to(getCorpus(row.corpusId))
  if (res && res.data) {
    detailData.value = { ...res.data }
    detailVisible.value = true
  }
}

const handleDelete = (row: CorpusVO) => {
  ElMessageBox.confirm(`确认删除穴位「${row.cnContent}」？此操作不可撤销。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    const [err] = await to(removeCorpus(row.corpusId))
    if (!err) {
      ElMessage.success('已删除')
      getList()
    }
  }).catch(() => {})
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    const [err] = await to(saveCorpus(form))
    submitLoading.value = false
    if (!err) {
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      formVisible.value = false
      getList()
    }
  })
}

const closeForm = () => {
  resetForm()
}

const handleImport = () => {
  importVisible.value = true
}

const handleImportSuccess = () => {
  getList()
}

const handleExport = async () => {
  const exportParams = {
    corpusType: CORPUS_TYPE.ACUPOINT,
    keyword: queryParams.keyword || undefined,
    categoryCode: queryParams.categoryCode || undefined,
    bizLabelCode: queryParams.bizLabelCode || undefined,
    bizTypeCode: queryParams.bizTypeCode || undefined
  }
  const [err] = await to(exportCorpus(exportParams, '针灸语料.xlsx'))
  if (!err) {
    ElMessage.success('导出成功')
  }
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

  &--wide {
    width: 240px;
  }

  &--sm {
    width: 160px;
  }
}

.filter-select {
  width: 170px;
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

.corpus-table {
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

.lao-text {
  font-family: 'Noto Sans Lao', 'Phetsarath OT', 'Saysettha OT', 'Helvetica Neue', Arial, sans-serif;
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}

.tag--primary {
  background: #ecf5ff;
  color: #409eff;
}

.tag--info {
  background: #f4f4f5;
  color: #909399;
}

.tag--success {
  background: #f0f9eb;
  color: #67c23a;
}

.tag--warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.method-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.retention-text {
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

.detail-section {
  background: #fafafa;
  border-radius: 4px;
  padding: 14px 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  font-size: 13px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  color: #909399;
}

.detail-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.detail-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.8;
  word-break: break-all;

  &--note {
    color: #606266;
  }
}

.mt-sm {
  margin-top: 6px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style lang="scss">
.form-dialog {
  .el-dialog__body {
    max-height: 65vh;
    overflow-y: auto;
    scrollbar-width: thin;
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

.detail-dialog {
  .el-dialog__body {
    max-height: 65vh;
    overflow-y: auto;
    scrollbar-width: thin;
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
