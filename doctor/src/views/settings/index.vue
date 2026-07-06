<template>
  <div class="settings-page">
    <div class="settings-shell">
      <section class="profile-hero">
        <div class="avatar-wrap">
          <img class="avatar-image" :src="avatarPreview" alt="头像" />
          <span class="online-dot" />
        </div>
        <div class="profile-summary">
          <div class="summary-kicker">个人设置</div>
          <h2>{{ profileForm.name || '医生' }}</h2>
          <p>{{ profileForm.title || '医生' }} · {{ departmentName || '暂无科室' }}</p>
        </div>
      </section>

      <section class="settings-panel">
        <div class="panel-header">
          <h3>基本信息</h3>
        </div>
        <div class="panel-body">
          <div class="avatar-row">
            <div class="avatar-preview">
              <img :src="avatarPreview" alt="头像" />
            </div>
            <label class="upload-button" :class="{ 'is-uploading': avatarUploading }">
              <el-icon><UploadFilled /></el-icon>
              <span>{{ avatarUploading ? '上传中...' : '更换头像' }}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                :disabled="avatarUploading"
                @change="handleAvatarChange"
              />
            </label>
          </div>

          <el-form label-position="top" class="profile-form">
            <div class="form-grid">
              <el-form-item label="姓名">
                <el-input v-model="profileForm.name" placeholder="请输入姓名" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item label="职称">
                <el-input v-model="profileForm.title" placeholder="请输入职称" />
              </el-form-item>
              <el-form-item class="form-item-wide" label="擅长">
                <el-input
                  v-model="profileForm.skills"
                  type="textarea"
                  :rows="2"
                  resize="none"
                  placeholder="请输入擅长方向"
                />
              </el-form-item>
              <el-form-item class="form-item-wide" label="个人简介">
                <el-input
                  v-model="profileForm.bio"
                  type="textarea"
                  :rows="3"
                  resize="none"
                  placeholder="请输入个人简介"
                />
              </el-form-item>
            </div>
          </el-form>

          <el-button type="primary" class="primary-action" :loading="profileSaving" @click="handleProfileSave">
            保存修改
          </el-button>
        </div>
      </section>

      <section class="settings-panel">
        <div class="panel-header">
          <h3>修改密码</h3>
        </div>
        <div class="panel-body">
          <el-form label-position="top" class="password-form">
            <el-form-item label="当前密码">
              <el-input
                v-model="passwordForm.current"
                :type="passwordVisible.current ? 'text' : 'password'"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input
                v-model="passwordForm.next"
                :type="passwordVisible.next ? 'text' : 'password'"
                placeholder="请输入新密码"
              >
                <template #suffix>
                  <button type="button" class="password-toggle" @click="passwordVisible.next = !passwordVisible.next">
                    <el-icon><component :is="passwordVisible.next ? Hide : View" /></el-icon>
                  </button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input
                v-model="passwordForm.confirm"
                :type="passwordVisible.confirm ? 'text' : 'password'"
                placeholder="请再次输入新密码"
              >
                <template #suffix>
                  <button
                    type="button"
                    class="password-toggle"
                    @click="passwordVisible.confirm = !passwordVisible.confirm"
                  >
                    <el-icon><component :is="passwordVisible.confirm ? Hide : View" /></el-icon>
                  </button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>

          <div class="password-tip" :class="{ 'is-error': passwordError }">
            <el-icon><component :is="passwordError ? InfoFilled : Lock" /></el-icon>
            <span>{{ passwordError || '8-30位，含大写、小写、数字、特殊字符（@$!%*?&）' }}</span>
          </div>

          <el-button type="primary" class="primary-action" :loading="passwordSaving" @click="handlePasswordSave">
            修改密码
          </el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Hide, InfoFilled, Lock, UploadFilled, View } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { updateUserPassword, updateUserProfile } from '@/api/profile'
import { uploadToOss } from '@/utils/oss-upload'
import type { UserProfile } from '@/api/types'
import defaultAvatar from '@/assets/doctor_avatar.png'

const userStore = useUserStore()
const avatarPreview = ref(defaultAvatar)
const avatarUrl = ref('')
const avatarUploading = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const passwordError = ref('')
const profileDirty = ref(false)
const syncingProfileForm = ref(false)
const profileForm = reactive({
  name: '',
  phone: '',
  title: '',
  skills: '',
  bio: ''
})
const passwordForm = reactive({
  current: '',
  next: '',
  confirm: ''
})
const passwordVisible = reactive({
  current: false,
  next: false,
  confirm: false
})

const departmentName = computed(() => {
  const profile = userStore.profile
  return takeText(profile?.deptName) || takeText(profile?.departmentName)
})

watch(
  () => userStore.profile,
  (profile) => {
    if (!profileDirty.value) {
      avatarUrl.value = takeText(profile?.avatar)
      avatarPreview.value = avatarUrl.value || defaultAvatar
      syncProfileForm(profile)
    }
  },
  { immediate: true }
)

watch(
  profileForm,
  () => {
    if (!syncingProfileForm.value) {
      profileDirty.value = true
    }
  },
  { deep: true }
)

function syncProfileForm(profile: UserProfile | null) {
  syncingProfileForm.value = true
  profileForm.name = takeText(profile?.nickName) || takeText(profile?.userName)
  profileForm.phone = takeText(profile?.phonenumber) || takeText(profile?.phoneNumber)
  profileForm.title = takeText(profile?.title) || takeText(profile?.postName)
  profileForm.skills = takeProfileText(['goodAt', 'specialty', 'speciality', 'expertise'])
  profileForm.bio = takeProfileText(['remark', 'description', 'intro', 'briefIntroduction'])
  void nextTick(() => {
    syncingProfileForm.value = false
  })
}

function takeText(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function takeProfileText(keys: string[]) {
  const profile = userStore.profile as Record<string, unknown> | null
  if (!profile) {
    return ''
  }

  for (const key of keys) {
    const value = takeText(profile[key])
    if (value) {
      return value
    }
  }

  return ''
}

async function handleAvatarChange(event: Event) {
  if (avatarUploading.value) {
    return
  }

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    ElMessage.warning('请上传 JPG/PNG/WebP/GIF 格式的图片')
    return
  }

  const previousAvatar = avatarPreview.value
  avatarUploading.value = true

  try {
    const previewUrl = await readImageAsDataUrl(file)
    avatarPreview.value = previewUrl || avatarPreview.value

    const uploadResult = await uploadToOss(file, {
      folder: 'doctor/avatar',
      bizId: userStore.profile?.userId || userStore.profile?.userName || 'unknown'
    })

    if (!uploadResult.url) {
      throw new Error('Missing OSS upload URL.')
    }

    avatarUrl.value = uploadResult.url
    avatarPreview.value = uploadResult.url
    profileDirty.value = true
    ElMessage.success('头像已上传，请点击保存修改')
  } catch (error) {
    avatarPreview.value = previousAvatar
    ElMessage.error('头像上传失败，请稍后重试')
    console.error('Failed to upload avatar:', error)
  } finally {
    avatarUploading.value = false
  }
}

async function handleProfileSave() {
  if (profileSaving.value) {
    return
  }

  if (avatarUploading.value) {
    ElMessage.warning('头像上传中，请稍后保存')
    return
  }

  if (!profileForm.name.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }

  if (!profileForm.phone.trim()) {
    ElMessage.warning('请输入手机号')
    return
  }

  profileSaving.value = true

  try {
    const payload = {
      nickName: profileForm.name.trim(),
      phonenumber: profileForm.phone.trim(),
      title: profileForm.title.trim(),
      goodAt: profileForm.skills.trim(),
      remark: profileForm.bio.trim(),
      avatar: avatarUrl.value
    }

    await updateUserProfile(payload)
    userStore.updateProfile(payload)
    profileDirty.value = false
    ElMessage.success('个人信息保存成功')
  } catch (error) {
    console.error('Failed to update profile:', error)
  } finally {
    profileSaving.value = false
  }
}

async function handlePasswordSave() {
  if (passwordSaving.value) {
    return
  }

  passwordError.value = validatePasswordForm()

  if (passwordError.value) {
    return
  }

  passwordSaving.value = true

  try {
    await updateUserPassword({
      oldPassword: passwordForm.current,
      newPassword: passwordForm.next
    })
    resetPasswordForm()
    ElMessage.success('密码修改成功')
  } catch (error) {
    console.error('Failed to update password:', error)
  } finally {
    passwordSaving.value = false
  }
}

function validatePasswordForm() {
  if (!passwordForm.current) {
    return '请输入当前密码'
  }
  if (!passwordForm.next) {
    return '请输入新密码'
  }
  if (passwordForm.next.length < 8 || passwordForm.next.length > 30) {
    return '密码长度需为8-30位'
  }
  if (!/[A-Z]/.test(passwordForm.next)) {
    return '需包含大写字母'
  }
  if (!/[a-z]/.test(passwordForm.next)) {
    return '需包含小写字母'
  }
  if (!/[0-9]/.test(passwordForm.next)) {
    return '需包含数字'
  }
  if (!/[@$!%*?&]/.test(passwordForm.next)) {
    return '需包含特殊字符（@$!%*?&）'
  }
  if (!/^[A-Za-z0-9@$!%*?&]+$/.test(passwordForm.next)) {
    return '仅允许特殊字符 @$!%*?&'
  }
  if (passwordForm.next !== passwordForm.confirm) {
    return '两次密码输入不一致'
  }
  return ''
}

function resetPasswordForm() {
  passwordForm.current = ''
  passwordForm.next = ''
  passwordForm.confirm = ''
  passwordError.value = ''
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100%;
  padding: 20px;
}

.settings-shell {
  width: min(640px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.07);
}

.avatar-wrap,
.avatar-preview {
  position: relative;
  flex: none;
  overflow: hidden;
  border-radius: 50%;
  background: #edf3fb;
  border: 2px solid #e2e8f0;
}

.avatar-wrap {
  width: 72px;
  height: 72px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.avatar-image,
.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.online-dot {
  position: absolute;
  right: 3px;
  bottom: 5px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.profile-summary {
  min-width: 0;
}

.summary-kicker {
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 6px;
}

.profile-summary h2 {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
}

.profile-summary p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.settings-panel {
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.07);
}

.panel-header {
  padding: 18px 22px;
  border-bottom: 1px solid #eef2f7;
}

.panel-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.panel-body {
  padding: 22px;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.avatar-preview {
  width: 64px;
  height: 64px;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}

.upload-button:hover {
  color: #1d4ed8;
  background: #eaf2ff;
}

.upload-button.is-uploading {
  opacity: 0.68;
  cursor: not-allowed;
}

.upload-button input {
  display: none;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-item-wide {
  grid-column: 1 / -1;
}

.profile-form :deep(.el-form-item),
.password-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.profile-form :deep(.el-form-item__label),
.password-form :deep(.el-form-item__label) {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 7px;
}

.profile-form :deep(.el-input__wrapper),
.password-form :deep(.el-input__wrapper),
.profile-form :deep(.el-textarea__inner) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  background: #ffffff;
}

.profile-form :deep(.el-input__wrapper),
.password-form :deep(.el-input__wrapper) {
  min-height: 40px;
}

.profile-form :deep(.el-input__wrapper.is-focus),
.password-form :deep(.el-input__wrapper.is-focus),
.profile-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}

.profile-form :deep(.el-input__inner),
.password-form :deep(.el-input__inner),
.profile-form :deep(.el-textarea__inner) {
  color: #1e293b;
  font-size: 14px;
}

.primary-action {
  min-width: 96px;
  min-height: 38px;
  border-radius: 8px;
  font-weight: 700;
}

.password-form {
  max-width: 100%;
}

.password-toggle {
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: #475569;
  background: #f1f5f9;
}

.password-tip {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 20px;
  margin: -2px 0 16px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
}

.password-tip.is-error {
  color: #ef4444;
}

@media (max-width: 760px) {
  .settings-page {
    padding: 14px;
  }

  .profile-hero,
  .panel-body,
  .panel-header {
    padding-left: 16px;
    padding-right: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .profile-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .avatar-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
