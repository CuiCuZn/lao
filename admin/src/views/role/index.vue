<template>
  <div class="app-container">
    <!-- 1. 搜索筛选卡片 -->
    <div class="card search-card">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">{{ t('role.roleName') }}</span>
          <el-input
            v-model="queryParams.roleName"
            :placeholder="t('role.inputRoleName')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('role.roleCode') }}</span>
          <el-input
            v-model="queryParams.roleKey"
            :placeholder="t('role.inputRoleCode')"
            clearable
            class="filter-input"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('role.status') }}</span>
          <el-select
            v-model="queryParams.status"
            :placeholder="t('common.selectStatus')"
            clearable
            class="filter-select"
          >
            <el-option :label="t('common.statusNormal')" value="0" />
            <el-option :label="t('common.statusStop')" value="1" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">{{ t('role.createTime') }}</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            :start-placeholder="t('role.beginDate')"
            :end-placeholder="t('role.endDate')"
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
      <!-- 操作栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('role.addRole') }}</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="roleList" class="role-table" style="width: 100%">
        <el-table-column :label="t('role.roleName')" prop="roleName" min-width="200">
          <template #default="scope">
            <span class="role-name">{{ scope.row.roleName }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('role.roleCode')" prop="roleKey" min-width="140" />
        <el-table-column :label="t('role.displayOrder')" prop="roleSort" min-width="90" align="center">
          <template #default="scope">
            <span>{{ scope.row.roleSort != null ? scope.row.roleSort : 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('role.userCount')" prop="userCount" min-width="90" align="center">
          <template #default="scope">
            <span>{{ scope.row.userCount != null ? scope.row.userCount : 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('role.status')" prop="status" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" class="status-tags" />
          </template>
        </el-table-column>
        <el-table-column :label="t('role.createTime')" prop="createTime" min-width="160" />
        <el-table-column :label="t('common.operate')" width="320" fixed="right" class-name="action-col">
          <template #default="scope">
            <div v-if="isProtectedRole(scope.row)" class="action-empty">-</div>
            <div v-else class="actions">
              <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">{{ t('common.view') }}</el-button>
              <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)">{{ t('common.edit') }}</el-button>
              <el-button
                link
                :type="scope.row.status === '0' ? 'warning' : 'success'"
                @click="handleStatusChange(scope.row)"
              >
                {{ scope.row.status === '0' ? t('common.disable') : t('common.enable') }}
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">{{ t('common.delete') }}</el-button>
            </div>
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

    <!-- 3. 新增/编辑/详情对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="780px" append-to-body class="role-dialog">
      <el-form ref="roleFormRef" class="role-form" :model="form" :rules="rules" label-width="100px" :disabled="isView">
        <!-- 第 1 行：角色名称 + 角色编码 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('role.roleName')" prop="roleName">
              <el-input v-model="form.roleName" :placeholder="t('role.inputRoleName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('role.roleCode')" prop="roleKey">
              <el-input v-model="form.roleKey" :placeholder="t('role.inputRoleCode')" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第 2 行：状态 + 角色顺序 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('role.status')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="0">{{ t('common.statusNormal') }}</el-radio>
                <el-radio value="1">{{ t('common.statusStop') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('role.roleSort')" prop="roleSort">
              <el-input-number
                v-model="form.roleSort"
                :min="0"
                :max="9999"
                :placeholder="t('role.inputRoleSort')"
                class="role-sort-input"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第 3 行：描述 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item :label="t('role.description')" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" :placeholder="t('role.inputDescription')" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第 4 行：权限配置 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item :label="t('role.permissionConfig')" prop="menuIds" class="permission-form-item">
              <div class="permission-box">
                <div class="permission-tip">{{ t('role.permissionConfigTip') }}</div>
                <div v-loading="menuTreeLoading" class="permission-tree-wrapper" :class="{ 'is-readonly': isView }">
                  <el-tree
                    v-if="menuTreeData.length > 0"
                    ref="menuTreeRef"
                    :data="menuTreeData"
                    show-checkbox
                    node-key="id"
                    :default-checked-keys="form.menuIds"
                    :props="{ label: 'label', children: 'children' }"
                    class="permission-tree"
                  />
                  <el-empty v-else-if="!menuTreeLoading" :description="t('role.menuEmpty')" :image-size="60" />
                  <div v-else class="tree-loading-text">{{ t('role.menuLoading') }}</div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button v-if="!isView" type="primary" :loading="submitLoading" @click="submitForm">{{ t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Refresh, Plus, Edit, View, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { listRole, changeRoleStatus, addRole, updateRole, getRoleDetail, delRole } from '@/api/role'
import { listMenuTreeSelect, roleMenuTreeselect, type MenuTreeNode } from '@/api/menu'
import { RoleQuery, RoleVO } from '@/api/types'
import { to } from 'await-to-js'
import DictTag from '@/components/DictTag/index.vue'

const { t } = useI18n()

// 字典数据
const statusOptions = computed(() => [
  { dictLabel: t('common.statusNormal'), dictValue: '0', listClass: 'success' },
  { dictLabel: t('common.statusStop'), dictValue: '1', listClass: 'danger' }
] as any[])

/**
 * 判断是否为受保护角色（操作栏不可编辑）
 * superadmin / doctor / assistant_doctor 三类角色禁止任何操作
 */
const PROTECTED_ROLE_KEYS = ['superadmin', 'doctor', 'assistant_doctor']
const isProtectedRole = (row: RoleVO): boolean => {
  return PROTECTED_ROLE_KEYS.includes(String(row.roleKey || '').toLowerCase())
}

// 数据状态
const loading = ref(false)
const roleList = ref<RoleVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isView = ref(false)
const dialogTitle = ref('')
const roleFormRef = ref<FormInstance>()
const submitLoading = ref(false)
const menuTreeRef = ref<any>()
const menuTreeData = ref<MenuTreeNode[]>([])
const menuTreeLoading = ref(false)

// 创建时间范围（双值绑定，提交时拆到 params）
const dateRange = ref<[string, string] | []>([])

// 查询参数
const queryParams = reactive<RoleQuery>({
  pageNum: 1,
  pageSize: 20,
  roleName: '',
  roleKey: '',
  status: '',
  params: { beginTime: undefined, endTime: undefined }
})

// 表单对象
const form = ref<any>({
  roleId: '',
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: '0',
  remark: '',
  menuIds: [] as Array<string | number>
})

// 校验规则
const rules = computed(() => ({
  roleName: [{ required: true, message: t('role.inputRoleName'), trigger: 'blur' }],
  roleKey: [
    { required: true, message: t('role.inputRoleCode'), trigger: 'blur' },
    {
      pattern: /^[a-zA-Z_]\w*$/,
      message: t('role.codeRuleError'),
      trigger: 'blur'
    }
  ],
  roleSort: [{ required: true, message: t('role.inputRoleSort'), trigger: 'blur' }]
}))

/**
 * 过滤菜单树：只保留 label 为"医院管理"的根节点及其子树
 * @param tree 后端原始菜单树
 */
/**
 * 菜单树过滤：去掉第一层，展示第二层 children
 * @param tree 后端原始菜单树
 */
const filterMenuTree = (tree: MenuTreeNode[]): MenuTreeNode[] => {
  if (!Array.isArray(tree)) return []
  // 取第一层节点的 children 作为第二层展示
  const result: MenuTreeNode[] = []
  for (const node of tree) {
    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(...node.children)
    }
  }
  return result
}

/**
 * 加载菜单树（去掉第一层“医院管理”，以第二层 children 为根展示）
 */
const loadMenuTree = async () => {
  menuTreeLoading.value = true
  menuTreeData.value = []
  const [err, res] = await to(listMenuTreeSelect())
  if (!err && res?.data) {
    menuTreeData.value = filterMenuTree(res.data)
  }
  menuTreeLoading.value = false
}

/**
 * 加载角色关联菜单树（查看/编辑用）：一次拿到全量菜单树 + 该角色已选 checkedKeys
 * 并直接回显勾选状态
 * @param roleId 角色ID
 */
const loadRoleMenuTree = async (roleId: string | number) => {
  menuTreeLoading.value = true
  menuTreeData.value = []
  const [err, res] = await to(roleMenuTreeselect(roleId))
  if (!err && res?.data) {
    const { menus, checkedKeys } = res.data
    // 菜单树原样使用，去掉第一层、展示第二层 children
    menuTreeData.value = filterMenuTree(menus)
    // 接口返回的 checkedKeys 是什么就选中什么，没有就不选中
    form.value.menuIds = checkedKeys || []
  }
  menuTreeLoading.value = false
}

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
  const [err, res] = await to(listRole(queryParams))
  if (res) {
    roleList.value = res.rows || []
    total.value = res.total || 0
  }
  if (err) {
    roleList.value = []
    total.value = 0
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
  queryParams.roleName = ''
  queryParams.roleKey = ''
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
 * 状态切换（启用/停用）
 */
const handleStatusChange = async (row: RoleVO) => {
  const newStatus = row.status === '0' ? '1' : '0'
  const operateText = newStatus === '0' ? t('common.enable') : t('common.disable')
  try {
    await ElMessageBox.confirm(t('role.confirmStatus', { operate: operateText }), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    const [err] = await to(changeRoleStatus(row.roleId, newStatus))
    if (!err) {
      ElMessage.success(t('common.operateSuccess'))
      getList()
    }
  } catch {}
}

/**
 * 新增按钮操作
 */
const handleAdd = () => {
  reset()
  isView.value = false
  dialogTitle.value = t('role.addRole')
  dialogVisible.value = true
  loadMenuTree()
}

/**
 * 打开弹窗（查看/编辑共用）：先调详情接口拉取完整数据
 * @param row 行数据
 * @param readonly 是否只读（查看）
 */
const openRoleDialog = async (row: RoleVO, readonly: boolean) => {
  if (!row.roleId) return
  reset()
  isView.value = readonly
  dialogTitle.value = readonly ? t('role.roleDetail') : t('role.editRole')
  dialogVisible.value = true

  const [err, res] = await to(getRoleDetail(row.roleId))
  if (!err && res?.data) {
    // 用详情接口返回的完整数据回填表单
    form.value = {
      ...res.data,
      roleSort: res.data.roleSort ?? 0,
      menuIds: (res.data as any).menuIds || []
    }
  } else {
    // 详情失败时回退用行数据
    form.value = { ...row, roleSort: row.roleSort ?? 0, menuIds: (row as any).menuIds || [] }
  }

  // 加载角色关联菜单树（含该角色已选权限 checkedKeys），自动回显勾选
  await loadRoleMenuTree(row.roleId)
}

/**
 * 修改按钮操作
 */
const handleUpdate = (row: RoleVO) => {
  openRoleDialog(row, false)
}

/**
 * 详情查看
 */
const handleDetail = (row: RoleVO) => {
  openRoleDialog(row, true)
}

/**
 * 删除按钮操作
 */
const handleDelete = async (row: RoleVO) => {
  if (!row.roleId) return
  try {
    await ElMessageBox.confirm(t('role.confirmDelete'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    const [err] = await to(delRole(row.roleId))
    if (!err) {
      ElMessage.success(t('common.operateSuccess'))
      getList()
    }
  } catch {}
}

/**
 * 提交表单
 */
const submitForm = () => {
  roleFormRef.value?.validate(async (valid) => {
    if (!valid) return
    // 修改时选择完后，直接把树当前勾选值（含半选父节点）放进 menuIds 提交
    const checkedKeys = menuTreeRef.value?.getCheckedKeys?.() || []
    const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys?.() || []
    const menuIds = [...checkedKeys, ...halfCheckedKeys]

    const isEdit = !!form.value.roleId

    if (isEdit) {
      // 编辑：以详情接口返回的完整数据为基底，用表单修改值覆盖
      const payload: any = {
        ...form.value,
        roleSort: Number(form.value.roleSort) || 0,
        menuIds,
        deptIds: []
      }
      submitLoading.value = true
      const [err] = await to(updateRole(payload))
      submitLoading.value = false
      if (!err) {
        ElMessage.success(t('common.editSuccess'))
        dialogVisible.value = false
        getList()
      }
    } else {
      // 新增
      const payload: any = {
        roleName: form.value.roleName,
        roleKey: form.value.roleKey,
        roleSort: Number(form.value.roleSort) || 0,
        status: form.value.status,
        remark: form.value.remark,
        dataScope: '1',
        deptCheckStrictly: true,
        deptIds: [],
        menuCheckStrictly: true,
        menuIds
      }
      submitLoading.value = true
      const [err] = await to(addRole(payload))
      submitLoading.value = false
      if (!err) {
        ElMessage.success(t('common.addSuccess'))
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
    roleId: '',
    roleName: '',
    roleKey: '',
    roleSort: 0,
    status: '0',
    remark: '',
    menuIds: []
  }
  nextTick(() => {
    roleFormRef.value?.resetFields()
  })
}

onMounted(() => {
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

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;
}

/* 表格 */
.role-table {
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

/* 角色名称列（加粗） */
.role-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

/* 状态标签（覆盖 el-tag 为胶囊样式） */
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
  .actions {
    display: flex;
    gap: 2px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  .action-empty {
    color: #c0c4cc;
    text-align: center;
    width: 100%;
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

/* 弹窗表单 */
.role-form {
  :deep(.el-form-item) {
    margin-bottom: 28px;
  }
  :deep(.el-form-item__error) {
    position: static;
    margin-top: 4px;
    line-height: 16px;
    white-space: normal;
    word-break: break-all;
  }
}
.form-hint {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.5;
}
.form-hint-warn {
  color: #f56c6c;
}

/* 角色顺序 */
.role-sort-input {
  width: 100%;
  :deep(.el-input__inner) {
    text-align: left;
  }
}

/* 权限配置区 */
.permission-form-item {
  :deep(.el-form-item__content) {
    line-height: normal;
  }
}
.permission-box {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafbfc;
  padding: 12px 16px;
}
.permission-tip {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  line-height: 1.5;
}
.permission-tree-wrapper {
  min-height: 80px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px 0;
}
/* 查看态：禁用交互并置灰 */
.permission-tree-wrapper.is-readonly {
  pointer-events: none;
  opacity: 0.7;
}
.permission-tree {
  background: transparent;
  :deep(.el-tree-node__content) {
    height: 30px;
  }
}
.tree-loading-text {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 16px 0;
}
</style>
