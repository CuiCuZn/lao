<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="560px"
    append-to-body
    class="import-dialog"
    @close="handleClose"
  >
    <div class="upload-zone" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,.xls"
        style="display: none"
        @change="handleFileChange"
      />
      <el-icon class="upload-icon"><UploadFilled /></el-icon>
      <p class="upload-text" v-if="!selectedFile">将 Excel 文件拖拽到此处，或 <em>点击上传</em></p>
      <p class="upload-text" v-else>已选择文件：<strong>{{ selectedFile.name }}</strong></p>
      <p class="upload-hint">仅支持 .xlsx、.xls 格式</p>
    </div>
    <div class="tip-row">
      <el-icon class="tip-icon"><InfoFilled /></el-icon>
      <span class="tip-text">请先下载模板，按模板格式填写后上传</span>
      <el-link type="primary" :underline="false" @click="handleDownloadTemplate">下载模板</el-link>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!selectedFile" @click="handleSubmit">确认导入</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { UploadFilled, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { to } from 'await-to-js'
import { importTemplate, importData } from '@/api/corpus'

const props = defineProps<{
  modelValue: boolean
  title: string
  corpusType: string
  subjectType?: string
  templatePath: string
  templateFilename: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const visible = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    selectedFile.value = null
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const file = files[0]
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
    if (ext !== 'xlsx' && ext !== 'xls') {
      ElMessage.error('只能上传 Excel 文件（.xlsx 或 .xls）')
      target.value = ''
      return
    }
    selectedFile.value = file
  }
  target.value = ''
}

const handleDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
    if (ext !== 'xlsx' && ext !== 'xls') {
      ElMessage.error('只能上传 Excel 文件（.xlsx 或 .xls）')
      return
    }
    selectedFile.value = file
  }
}

const handleDownloadTemplate = async () => {
  const [err] = await to(importTemplate(props.templatePath, props.templateFilename))
  if (!err) {
    ElMessage.success('模板下载成功')
  }
}

const handleSubmit = async () => {
  if (!selectedFile.value) return
  uploading.value = true
  const [err, res] = await to(importData(selectedFile.value, props.corpusType, props.subjectType, false))
  uploading.value = false
  if (!err && res) {
    if (res.code === 200) {
      let msg = '导入成功'
      if (res.totalNum !== undefined) {
        msg += `，共 ${res.totalNum} 条，成功 ${res.successNum || 0} 条`
        if (res.failNum && res.failNum > 0) {
          msg += `，失败 ${res.failNum} 条`
        }
      }
      ElMessage.success(msg)
      emit('success')
      visible.value = false
    } else {
      ElMessage.error(res.msg || '导入失败')
    }
  }
}

const handleClose = () => {
  selectedFile.value = null
}
</script>

<style scoped lang="scss">
.import-dialog {
  .el-dialog__body {
    padding-top: 20px;
  }
}

.upload-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;

  &:hover {
    border-color: #409eff;
    background: #f5f8ff;
  }
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin: 0 0 6px 0;

  em {
    color: #409eff;
    font-style: normal;
  }

  strong {
    color: #409eff;
    font-weight: 600;
  }
}

.upload-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.tip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 12px;
  color: #909399;
}

.tip-icon {
  color: #e6a23c;
  font-size: 14px;
}

.tip-text {
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
