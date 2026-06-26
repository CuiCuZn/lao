<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">关键词</span>
          <el-input
            v-model="queryParams.drugName"
            placeholder="方剂名称 / 功效 / 主治"
            clearable
            class="filter-input-wide"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">方剂分类</span>
          <el-select v-model="queryParams.drugType" placeholder="全部分类" clearable class="filter-select">
            <el-option
              v-for="item in categoryOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">剂型</span>
          <el-select v-model="queryParams.drugModel" placeholder="全部剂型" clearable class="filter-select">
            <el-option
              v-for="item in dosageFormOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 2. 表格卡片 -->
    <div class="card table-card">
      <!-- 操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增处方</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="prescriptionList" class="prescription-table" style="width: 100%">
        <el-table-column label="处方ID" prop="drugId" min-width="120" />
        <el-table-column label="方剂名称" prop="drugName" min-width="160" show-overflow-tooltip />
        <el-table-column label="分类" prop="drugType" min-width="120">
          <template #default="scope">
            <span class="type-tag type-tag--primary">{{ getDictLabel(categoryOptions, scope.row.drugType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="功效" prop="drugEffect" min-width="220" show-overflow-tooltip />
        <el-table-column label="主治" prop="drugCure" min-width="260" show-overflow-tooltip />
        <el-table-column label="剂型" prop="drugModel" min-width="100">
          <template #default="scope">
            <span class="type-tag" :style="getDictStyle(dosageFormOptions, scope.row.drugModel)">{{ getDictLabel(dosageFormOptions, scope.row.drugModel) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="药材数" prop="drugDetailCount" min-width="90" align="center" />
        <el-table-column label="操作" width="200" fixed="right" class-name="action-col">
          <template #default="scope">
            <div class="actions">
              <el-button link type="primary" :icon="View" @click="handleView(scope.row)">查看</el-button>
              <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)">修改</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <span class="pagination-info">共 {{ total }} 条</span>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" append-to-body>
      <el-form
        ref="prescriptionFormRef"
        v-loading="detailLoading"
        :model="form"
        :rules="rules"
        :disabled="isView"
        label-width="90px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="方剂名称" prop="prescriptionName">
              <el-input v-model="form.prescriptionName" placeholder="请输入方剂名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剂型" prop="dosageForm">
              <el-select v-model="form.dosageForm" placeholder="请选择剂型" style="width: 100%">
                <el-option
                  v-for="item in dosageFormOptions"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用法" prop="usage">
              <el-input v-model="form.usage" placeholder="如：水煎温服" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="功效" prop="effect">
              <el-input v-model="form.effect" type="textarea" :rows="2" placeholder="请输入功效" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="主治" prop="indication">
              <el-input v-model="form.indication" type="textarea" :rows="3" placeholder="请输入主治" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="注意事项" prop="notes">
              <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="请输入注意事项" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="药材组成">
              <div class="herb-section">
                <div v-for="(herb, index) in form.herbs" :key="index" class="herb-row">
                  <el-input v-model="herb.herbName" placeholder="药材名称" />
                  <el-input v-model="herb.dosage" placeholder="用量" />
                  <el-select v-model="herb.unit" placeholder="单位">
                    <el-option
                      v-for="item in unitOptions"
                      :key="item.dictValue"
                      :label="item.dictLabel"
                      :value="item.dictValue"
                    />
                  </el-select>
                  <el-button v-if="!isView && form.herbs.length > 1" link type="danger" @click="removeHerb(index)">
                    删除
                  </el-button>
                </div>
                <el-button v-if="!isView" type="primary" plain @click="addHerb">+ 添加药材</el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button v-if="!isView" type="primary" :loading="saving" @click="submitForm">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Search, Refresh, Plus, Edit, View, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { to } from 'await-to-js'
import {
  getDrugPrescription,
  listDrugPrescription,
  removeDrugPrescription,
  saveDrugPrescription
} from '@/api/prescription'
import { useDictStore } from '@/stores/dict'
import type { DictDataVO, DrugPrescriptionForm, DrugPrescriptionVO } from '@/api/types'

interface HerbItem {
  drugDetailId?: string | number
  herbName: string
  dosage: string
  unit: string
}

interface PrescriptionItem {
  prescriptionId: string
  prescriptionName: string
  category: string
  effect: string
  indication: string
  dosageForm: string
  usage: string
  notes: string
  herbs: HerbItem[]
  herbCount: number
}

const queryRef = ref<FormInstance>()
const prescriptionFormRef = ref<FormInstance>()
const dictStore = useDictStore()
const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isView = ref(false)
const dialogTitle = ref('')
const editingPrescriptionId = ref('')
const total = ref(0)

const queryParams = reactive({
  drugName: '',
  drugType: '',
  drugModel: '',
  pageNum: 1,
  pageSize: 20
})

const categoryOptions = computed(() => dictStore.getDict('drug_type'))
const dosageFormOptions = computed(() => dictStore.getDict('drug_model'))
const unitOptions = computed(() => dictStore.getDict('drug_detail_unit'))

const getDefaultUnit = () => unitOptions.value[0]?.dictValue || ''

const createEmptyForm = (): PrescriptionItem => ({
  prescriptionId: '',
  prescriptionName: '',
  category: '',
  effect: '',
  indication: '',
  dosageForm: '',
  usage: '',
  notes: '',
  herbs: [{ herbName: '', dosage: '', unit: getDefaultUnit() }],
  herbCount: 0
})

const form = ref<PrescriptionItem>(createEmptyForm())

const rules: FormRules = {
  prescriptionName: [{ required: true, message: '请输入方剂名称', trigger: 'blur' }],
  dosageForm: [{ required: true, message: '请选择剂型', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  usage: [{ required: true, message: '请输入用法', trigger: 'blur' }],
  effect: [{ required: true, message: '请输入功效', trigger: 'blur' }],
  indication: [{ required: true, message: '请输入主治', trigger: 'blur' }]
}

const prescriptionList = ref<DrugPrescriptionVO[]>([])

const getDictLabel = (options: DictDataVO[], value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return '--'
  const matched = options.find((item) => String(item.dictValue) === String(value))
  return matched?.dictLabel || String(value)
}

/**
 * 解析字典项的 cssClass 为内联样式对象
 * cssClass 为 JSON 字符串，如 {color: '#722ED1',backgroundColor: '#F9F0FF',borderColor: '#D3ADF7'}
 * 解析失败或为空时回退到默认紫色样式
 */
const getDictStyle = (options: DictDataVO[], value: string | number | undefined): Record<string, string> => {
  const fallback = { background: '#f3edff', color: '#8b5cf6' }
  if (value === undefined || value === null || value === '') return fallback
  const matched = options.find((item) => String(item.dictValue) === String(value))
  if (!matched || !matched.cssClass) return fallback
  try {
    // cssClass 为类 JSON 字符串，但键名和字符串值用的是单引号，需转为双引号后再解析
    const raw = matched.cssClass.trim()
    const normalized = raw
      // 先把单引号包裹的值转为双引号
      .replace(/'/g, '"')
      // 给裸键名补双引号（如 color: → "color":）
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    const parsed = JSON.parse(normalized)
    if (parsed && typeof parsed === 'object') {
      const style: Record<string, string> = {}
      for (const key of Object.keys(parsed)) {
        const val = parsed[key]
        if (typeof val === 'string' || typeof val === 'number') {
          style[key] = String(val)
        }
      }
      return style
    }
  } catch {
    // cssClass 无法解析，忽略
  }
  return fallback
}

const toFormData = (row: DrugPrescriptionVO): PrescriptionItem => ({
  prescriptionId: String(row.drugId ?? ''),
  prescriptionName: row.drugName ?? '',
  category: row.drugType ?? '',
  effect: row.drugEffect ?? '',
  indication: row.drugCure ?? '',
  dosageForm: row.drugModel ?? '',
  usage: row.drugUsage ?? '',
  notes: row.drugAttention ?? '',
  herbs: row.detailList && row.detailList.length > 0
    ? row.detailList.map((item) => ({
        drugDetailId: item.drugDetailId,
        herbName: item.drugDetailName ?? '',
        dosage: item.drugDetailShare ?? '',
        unit: item.drugDetailUnit ?? getDefaultUnit()
      }))
    : [{ herbName: '', dosage: '', unit: getDefaultUnit() }],
  herbCount: Number(row.drugDetailCount) || 0
})

const toSaveData = (data: PrescriptionItem): DrugPrescriptionForm => {
  const detailList = data.herbs
    .filter((item) => item.herbName || item.dosage)
    .map((item) => ({
      drugDetailId: item.drugDetailId,
      drugDetailName: item.herbName,
      drugDetailShare: item.dosage,
      drugDetailUnit: item.unit
    }))

  return {
    ...(editingPrescriptionId.value ? { drugId: editingPrescriptionId.value } : {}),
    drugName: data.prescriptionName,
    drugModel: data.dosageForm,
    drugType: data.category,
    drugUsage: data.usage,
    drugEffect: data.effect,
    drugCure: data.indication,
    drugAttention: data.notes,
    detailList
  }
}

const getList = async () => {
  loading.value = true
  const [err, res] = await to(listDrugPrescription({
    pageNum: queryParams.pageNum,
    pageSize: queryParams.pageSize,
    drugName: queryParams.drugName || undefined,
    drugType: queryParams.drugType || undefined,
    drugModel: queryParams.drugModel || undefined
  }))

  if (res) {
    const rows = res.rows || []
    const totalValue = Number(res.total)
    prescriptionList.value = rows
    total.value = Number.isFinite(totalValue) ? totalValue : rows.length
  }
  if (err) {
    prescriptionList.value = []
    total.value = 0
  }
  loading.value = false
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.drugName = ''
  queryParams.drugType = ''
  queryParams.drugModel = ''
  queryParams.pageNum = 1
  queryParams.pageSize = 20
  getList()
}

const clonePrescription = (row: PrescriptionItem) => ({
  ...row,
  herbs: row.herbs.map((item) => ({ ...item }))
})

const resetForm = () => {
  form.value = createEmptyForm()
  editingPrescriptionId.value = ''
  prescriptionFormRef.value?.resetFields()
}

const handleAdd = () => {
  resetForm()
  isView.value = false
  dialogTitle.value = '新增处方'
  dialogVisible.value = true
}

const openDetailDialog = async (row: DrugPrescriptionVO, readonly: boolean) => {
  const drugId = row.drugId
  if (!drugId) return

  resetForm()
  isView.value = readonly
  dialogTitle.value = readonly ? '查看处方' : '修改处方'
  dialogVisible.value = true

  detailLoading.value = true
  const [err, res] = await to(getDrugPrescription(drugId))
  detailLoading.value = false

  if (err) {
    dialogVisible.value = false
    return
  }

  if (res?.data) {
    form.value = clonePrescription(toFormData(res.data))
    editingPrescriptionId.value = String(res.data.drugId ?? drugId)
  }
}

const handleView = (row: DrugPrescriptionVO) => {
  openDetailDialog(row, true)
}

const handleEdit = (row: DrugPrescriptionVO) => {
  openDetailDialog(row, false)
}

const handleDelete = async (row: DrugPrescriptionVO) => {
  if (!row.drugId) return
  try {
    await ElMessageBox.confirm(`确认要删除"${row.drugName}"吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const [err] = await to(removeDrugPrescription(row.drugId))
    if (!err) {
      ElMessage.success('删除成功')
      getList()
    }
  } catch {}
}

const addHerb = () => {
  form.value.herbs.push({ herbName: '', dosage: '', unit: getDefaultUnit() })
}

const removeHerb = (index: number) => {
  form.value.herbs.splice(index, 1)
}

const submitForm = () => {
  prescriptionFormRef.value?.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    const [err] = await to(saveDrugPrescription(toSaveData(form.value)))
    saving.value = false

    if (!err) {
      ElMessage.success(editingPrescriptionId.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      getList()
    }
  })
}

onMounted(async () => {
  await dictStore.loadDicts(['drug_type', 'drug_model', 'drug_detail_unit'])
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
.filter-input-wide {
  width: 220px;
}
.filter-select {
  width: 180px;
}
.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;
}

/* 表格 */
.prescription-table {
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

/* 分类/剂型标签（胶囊样式） */
.type-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.type-tag--primary {
  background: #ecf5ff;
  color: #409eff;
}
.type-tag--purple {
  background: #f3edff;
  color: #8b5cf6;
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

/* 弹窗药材区 */
.herb-section {
  width: 100%;

  .herb-row {
    display: grid;
    grid-template-columns: 140px 100px 140px auto;
    gap: 8px;
    margin-bottom: 12px;
  }
}
</style>
