<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? t('patient.editPatient') : t('patient.addPatient')"
    width="680px"
    align-center
    :close-on-click-modal="false"
    append-to-body
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="patient-form"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item :label="t('patient.name')" prop="patientName">
            <el-input v-model="form.patientName" :placeholder="t('patient.inputName')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.gender')" prop="patientSex">
            <el-select v-model="form.patientSex" :placeholder="t('patient.selectGender')" style="width: 100%">
              <el-option :label="t('patient.male')" value="0" />
              <el-option :label="t('patient.female')" value="1" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.birthday')" prop="patientBirthday">
            <el-date-picker
              v-model="form.patientBirthday"
              type="date"
              :placeholder="t('patient.inputBirthday')"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.visitId')" prop="patientNumber">
            <el-input v-model="form.patientNumber" :placeholder="t('patient.inputPatientId')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.phone')" prop="patientPhone">
            <el-input
              v-model="form.patientPhone"
              :placeholder="t('patient.inputPhone')"
              maxlength="11"
              @input="onPhoneInput"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.idCard')" prop="patientIdCard">
            <el-input v-model="form.patientIdCard" :placeholder="t('patient.inputIdCard')" maxlength="18" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.marriage')" prop="maritalStatus">
            <el-select v-model="form.maritalStatus" :placeholder="t('patient.selectMarriage')" style="width: 100%" clearable>
              <el-option :label="t('patient.married')" value="已婚" />
              <el-option :label="t('patient.unmarried')" value="未婚" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.occupation')" prop="job">
            <el-input v-model="form.job" :placeholder="t('patient.inputOccupation')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.bloodType')" prop="bloodType">
            <el-select v-model="form.bloodType" :placeholder="t('patient.selectBloodType')" style="width: 100%" clearable>
              <el-option label="A" value="A" />
              <el-option label="B" value="B" />
              <el-option label="AB" value="AB" />
              <el-option label="O" value="O" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.emergencyContact')" prop="emergencyContact">
            <el-input v-model="form.emergencyContact" :placeholder="t('patient.inputEmergencyContact')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('patient.emergencyPhone')" prop="emergencyContactPhone">
            <el-input
              v-model="form.emergencyContactPhone"
              :placeholder="t('patient.inputEmergencyPhone')"
              maxlength="11"
              @input="onEmergencyPhoneInput"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('patient.address')" prop="address" class="full-item">
            <el-input v-model="form.address" :placeholder="t('patient.inputAddress')" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('patient.remark')" prop="remark" class="full-item">
            <el-input v-model="form.remark" type="textarea" :rows="2" :placeholder="t('patient.inputRemark')" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { to } from 'await-to-js'
import { savePatientProfile } from '@/api/patient'
import type { PatientProfileForm } from '@/api/types'

const { t } = useI18n()

const visible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const defaultForm = (): PatientProfileForm => ({
  patientId: undefined,
  patientName: '',
  patientSex: '',
  patientBirthday: '',
  patientNumber: '',
  patientPhone: '',
  patientIdCard: '',
  maritalStatus: '',
  job: '',
  bloodType: '',
  emergencyContact: '',
  emergencyContactPhone: '',
  address: '',
  remark: ''
})

const form = reactive<PatientProfileForm>(defaultForm())

const isEdit = computed(() => !!form.patientId)

const rules = computed<FormRules>(() => ({
  patientName: [{ required: true, message: t('patient.inputName'), trigger: 'blur' }],
  patientSex: [{ required: true, message: t('patient.selectGender'), trigger: 'change' }],
  patientNumber: [{ required: true, message: t('patient.inputPatientId'), trigger: 'blur' }],
  patientPhone: [
    { required: true, message: t('patient.inputPhone'), trigger: 'blur' },
    { pattern: /^\d{11}$/, message: t('patient.invalidPhone'), trigger: 'blur' }
  ]
}))

/** 手机号仅允许输入数字 */
const onPhoneInput = () => {
  if (form.patientPhone) {
    form.patientPhone = form.patientPhone.replace(/\D/g, '').slice(0, 11)
  }
}
const onEmergencyPhoneInput = () => {
  if (form.emergencyContactPhone) {
    form.emergencyContactPhone = form.emergencyContactPhone.replace(/\D/g, '').slice(0, 11)
  }
}

/**
 * 打开弹窗
 * @param data 修改时传入回显数据；新增时不传
 */
const open = (data?: PatientProfileForm) => {
  reset()
  if (data) {
    Object.assign(form, data)
  }
  visible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const reset = () => {
  Object.assign(form, defaultForm())
  formRef.value?.resetFields()
}

const submit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    const payload: PatientProfileForm = { ...form }
    const [err] = await to(savePatientProfile(payload))
    submitting.value = false
    if (err) return
    ElMessage.success(isEdit.value ? t('common.editSuccess') : t('common.addSuccess'))
    visible.value = false
    emit('success')
  })
}

const handleClosed = () => {
  reset()
}

const emit = defineEmits<{
  (e: 'success'): void
}>()

defineExpose({ open })
</script>

<style scoped lang="scss">
.patient-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  :deep(.el-form-item.full-item) {
    .el-form-item__content {
      width: 100%;
    }
  }
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
