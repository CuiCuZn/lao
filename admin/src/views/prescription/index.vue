<template>
  <div class="app-container">
    <el-card class="search-card" shadow="never">
      <el-form ref="queryRef" :model="queryParams" :inline="true">
        <el-form-item label="关键词" prop="drugName">
          <el-input
            v-model="queryParams.drugName"
            placeholder="方剂名称 / 功效 / 主治"
            clearable
            style="width: 220px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="方剂分类" prop="drugType">
          <el-select v-model="queryParams.drugType" placeholder="全部分类" clearable style="width: 220px">
            <el-option
              v-for="item in categoryOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="剂型" prop="drugModel">
          <el-select v-model="queryParams.drugModel" placeholder="全部剂型" clearable style="width: 180px">
            <el-option
              v-for="item in dosageFormOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="toolbar">
        <el-button type="primary" plain @click="handleAdd">新增处方</el-button>
      </div>

      <el-table v-loading="loading" :data="prescriptionList" height="100%" style="width: 100%; margin-top: 15px" border>
        <el-table-column label="处方ID" align="center" prop="drugId" min-width="120" />
        <el-table-column label="方剂名称" align="center" prop="drugName" min-width="160" show-overflow-tooltip />
        <el-table-column label="分类" align="center" prop="drugType" min-width="120">
          <template #default="scope">
            <span>{{ getDictLabel(categoryOptions, scope.row.drugType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="功效" align="center" prop="drugEffect" min-width="220" show-overflow-tooltip />
        <el-table-column label="主治" align="center" prop="drugCure" min-width="260" show-overflow-tooltip />
        <el-table-column label="剂型" align="center" prop="drugModel" min-width="100">
          <template #default="scope">
            <span>{{ getDictLabel(dosageFormOptions, scope.row.drugModel) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="药材数" align="center" prop="drugDetailCount" min-width="100" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="160">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(scope.row)">修改</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
import { Search, Refresh } from '@element-plus/icons-vue'
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
  queryRef.value?.resetFields()
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
.search-card {
  margin-bottom: 0;
}

.table-card {
  .toolbar {
    margin-bottom: 10px;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

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
