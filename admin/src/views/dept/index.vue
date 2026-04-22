<template>
  <div class="app-container">
    <!-- 1. 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item :label="t('dept.deptName')" prop="departmentName">
          <el-input
            v-model="queryParams.departmentName"
            :placeholder="t('dept.inputDeptName')"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item :label="t('dept.deptType')" prop="departmentType">
          <el-select v-model="queryParams.departmentType" :placeholder="t('dept.selectDeptType')" clearable style="width: 200px">
            <el-option
              v-for="dict in sysDeptOptions"
              :key="dict.dictValue"
              :label="dict.dictLabel"
              :value="dict.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('dept.status')" prop="status">
          <el-select v-model="queryParams.status" :placeholder="t('dept.selectStatus')" clearable style="width: 150px">
            <el-option :label="t('common.statusNormal')" value="0" />
            <el-option :label="t('common.statusStop')" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ t('common.search') }}</el-button>
          <el-button @click="resetQuery">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 操作栏 -->
    <el-card class="table-card" shadow="never" style="margin-top: 20px">
      <div class="toolbar">
        <el-button type="primary" plain @click="handleAdd">{{ t('dept.addDept') }}</el-button>
        <!-- <el-button type="warning" plain @click="handleExport">{{ t('common.export') }}</el-button> -->
      </div>

      <!-- 3. 数据表格 -->
      <el-table v-loading="loading" :data="deptList" style="width: 100%; margin-top: 15px" border>
        <el-table-column :label="t('dept.deptName')" align="center" prop="departmentName" />
        <el-table-column :label="t('dept.deptCode')" align="center" prop="departmentCode" />
        <el-table-column :label="t('dept.deptType')" align="center" prop="departmentType">
          <template #default="scope">
             <dict-tag :options="sysDeptOptions" :value="scope.row.departmentType" />
          </template>
        </el-table-column>
        <el-table-column :label="t('dept.leader')" align="center" prop="departmentPrincipal" />
        <el-table-column :label="t('dept.phone')" align="center" prop="departmentPhone" />
        <el-table-column :label="t('dept.status')" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="sysStatusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column :label="t('dept.createTime')" align="center" prop="createTime" width="180" />
        <el-table-column :label="t('common.operate')" align="center" class-name="small-padding fixed-width" width="200">
          <template #default="scope">
            <el-button link type="primary" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
            <el-button link type="primary" @click="handleUpdate(scope.row)">{{ t('common.edit') }}</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">{{ t('common.delete') }}</el-button>
            <el-button
              link
              :type="scope.row.status === '0' ? 'danger' : 'success'"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === '0' ? t('common.disable') : t('common.enable') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 4. 分页 -->
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

    <!-- 5. 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="100px" :disabled="isView">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('dept.deptName')" prop="departmentName">
              <el-input v-model="form.departmentName" :placeholder="t('dept.inputDeptName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.deptCode')" prop="departmentCode">
              <el-input v-model="form.departmentCode" :placeholder="t('dept.inputDeptCode')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.deptType')" prop="departmentType">
              <el-select v-model="form.departmentType" :placeholder="t('dept.selectDeptType')" style="width: 100%">
                <el-option
                  v-for="dict in sysDeptOptions"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="dict.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.leader')" prop="departmentPrincipal">
              <el-input v-model="form.departmentPrincipal" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.phone')" prop="departmentPhone">
              <el-input v-model="form.departmentPhone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('dept.status')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="0">{{ t('common.statusNormal') }}</el-radio>
                <el-radio label="1">{{ t('common.statusStop') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 特殊项：诊疗常用语管理 -->
        <el-divider content-position="left">{{ t('dept.phrases') }}</el-divider>
        <div class="phrases-section">
          <div v-for="(phrase, index) in form.phrases" :key="index" class="phrase-item">
            <el-input v-if="form.phrases" v-model="form.phrases[index]" placeholder="请输入诊疗常用语 (如: 饮食清淡)" style="width: 80%" />
            <el-button v-if="!isView" type="danger" link :icon="Minus" @click="removePhrase(index)" />
          </div>
          <el-button v-if="!isView" type="primary" link :icon="Plus" @click="addPhrase">{{ t('dept.addPhrase') }}</el-button>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button v-if="!isView" type="primary" @click="submitForm">{{ t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Search,
  Refresh,
  Plus,
  Download,
  Edit,
  View,
  Minus,
  CircleClose,
  CircleCheck
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { listDept, addDept, updateDept, changeDeptStatus, removeDept } from '@/api/dept'
import { DeptQuery, DeptVO, DeptForm } from '@/api/types'
import { useDictStore } from '@/stores/dict'
import { to } from 'await-to-js'
import DictTag from '@/components/DictTag/index.vue'

const { t } = useI18n()
const dictStore = useDictStore()

// 获取科室字典数据
const sysDeptOptions = computed(() => dictStore.getDict('sys_dept'))
const sysStatusOptions = computed(() => [
  { dictLabel: t('common.statusNormal'), dictValue: '0', listClass: 'primary' },
  { dictLabel: t('common.statusStop'), dictValue: '1', listClass: 'danger' }
] as any[])

// 1. 数据状态定义
const loading = ref(false)
const deptList = ref<DeptVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isView = ref(false)
const dialogTitle = ref('')
const deptFormRef = ref<FormInstance>()

// 查询参数 (适配 Swagger)
const queryParams = reactive<DeptQuery>({
  pageNum: 1,
  pageSize: 10,
  departmentName: '',
  departmentType: '',
  status: ''
})

// 表单对象 (适配 Swagger)
const form = ref<DeptForm>({
  departmentName: '',
  departmentCode: '',
  departmentType: '',
  departmentPrincipal: '',
  departmentPhone: '',
  status: '0',
  usefulExpressions: '',
  phrases: []
})

// 校验规则 (适配 Swagger)
const rules = {
  departmentName: [{ required: true, message: t('dept.inputDeptName'), trigger: 'blur' }],
  departmentCode: [{ required: true, message: t('dept.inputDeptCode'), trigger: 'blur' }],
  departmentType: [{ required: true, message: t('dept.selectDeptType'), trigger: 'change' }],
  departmentPrincipal: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  departmentPhone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
}

// 2. 核心逻辑方法

/**
 * 获取列表数据
 */
const getList = async () => {
  loading.value = true
  const [err, res] = await to(listDept(queryParams))
  if (res) {
    // 适配后端分页返回格式 (rows 包含数据，total 包含总数)
    deptList.value = res.rows || []
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
  queryParams.departmentName = ''
  queryParams.departmentType = ''
  queryParams.status = ''
  handleQuery()
}

/**
 * 状态切换
 */
const handleStatusChange = async (row: DeptVO) => {
  const newStatus = row.status === '0' ? '1' : '0'
  const operateText = newStatus === '0' ? t('common.enable') : t('common.disable')
  try {
    await ElMessageBox.confirm(t('dept.confirmStatus', { operate: operateText }), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning' 
    })
    const [err] = await to(changeDeptStatus({
      departmentId: row.departmentId,
      status: newStatus
    }))
    if (!err) {
      ElMessage.success(t('common.operateSuccess'))
      getList() // 刷新列表获取最新状态
    }
  } catch {}
}

/**
 * 新增按钮操作
 */
const handleAdd = () => {
  reset()
  isView.value = false
  dialogTitle.value = t('dept.addDept')
  dialogVisible.value = true
}

/**
 * 修改按钮操作 (源数据从表格行中获取)
 */
const handleUpdate = (row: DeptVO) => {
  reset()
  isView.value = false
  // 转换 row 数据到 form 对象
  const phrasesArr = row.usefulExpressions ? row.usefulExpressions.split('\n').filter(Boolean) : []
  form.value = { ...row, phrases: phrasesArr }
  dialogTitle.value = t('dept.editDept')
  dialogVisible.value = true
}

/**
 * 详情查看 (源数据从表格行中获取)
 */
const handleDetail = (row: DeptVO) => {
  reset()
  isView.value = true
  const phrasesArr = row.usefulExpressions ? row.usefulExpressions.split('\n').filter(Boolean) : []
  form.value = { ...row, phrases: phrasesArr }
  dialogTitle.value = t('dept.deptDetail')
  dialogVisible.value = true
}

/**
 * 删除操作
 */
const handleDelete = async (row: DeptVO) => {
  if (!row.departmentId) return
  try {
    await ElMessageBox.confirm(
      t('dept.confirmStatus', { operate: t('common.delete') }),
      t('common.tip'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    const [err] = await to(removeDept(row.departmentId))
    if (!err) {
      ElMessage.success(t('common.operateSuccess'))
      getList()
    }
  } catch {}
}

/**
 * 导出操作
 */
const handleExport = () => {
  ElMessage.info('正在导出，请稍后...')
}

/**
 * 提交表单
 */
const submitForm = () => {
  deptFormRef.value?.validate(async (valid) => {
    if (valid) {
      const isEdit = !!form.value.departmentId
      const action = isEdit ? updateDept : addDept
      
      // 提交前将前端数组转换为后端字符串字段 (\n 分隔)
      if (form.value.phrases && form.value.phrases.length > 0) {
        form.value.usefulExpressions = form.value.phrases.filter(p => p.trim() !== '').join('\n')
      } else {
        form.value.usefulExpressions = ''
      }

      const [err] = await to(action(form.value))
      if (!err) {
        ElMessage.success(isEdit ? t('common.editSuccess') : t('common.addSuccess'))
        dialogVisible.value = false
        getList()
      }
    }
  })
}

/**
 * 重置表单
 */
const reset = () => {
  form.value = {
    departmentName: '',
    departmentCode: '',
    departmentType: '',
    departmentPrincipal: '',
    departmentPhone: '',
    status: '0',
    usefulExpressions: '',
    phrases: []
  }
  deptFormRef.value?.resetFields()
}

/**
 * 常用语操作
 */
const addPhrase = () => {
  if (!form.value.phrases) form.value.phrases = []
  form.value.phrases.push('')
}
const removePhrase = (index: number) => {
  form.value.phrases?.splice(index, 1)
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
.phrases-section {
  .phrase-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }
}
</style>
