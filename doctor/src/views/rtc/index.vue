<template>
  <section class="doctor-consultation-page">
    <div v-if="pageError" class="consultation-error-state">
      <div class="error-card">
        <el-icon class="error-icon"><warning-filled /></el-icon>
        <h2>{{ t('doctorVideo.consultation.errorTitle') }}</h2>
        <p>{{ pageError }}</p>
        <el-button type="primary" @click="goBackToWorkbench">
          {{ t('doctorVideo.consultation.backWorkbench') }}
        </el-button>
      </div>
    </div>

    <div v-else class="consultation-layout">
      <consult-subtitle-timeline
        class="subtitle-column"
        :items="timeline.items.value"
        :loading="session.subtitleLoading.value"
        :error="''"
        :on-retry="retrySubtitle"
        :update-scroll-state="timeline.updateScrollState"
        :scroll-to-latest-if-needed="timeline.scrollToLatestIfNeeded"
        :scroll-version="timeline.scrollVersion.value"
        :chat-draft="chatDraft"
        :chat-sending="chatSending"
        :chat-input-disabled="chatInputDisabled"
        :chat-send-disabled="chatSendDisabled"
        :chat-status-text="chatStatusText"
        :translation-enabled="subtitleTranslationEnabled"
        primary-language="cn"
        :on-chat-input="handleChatInput"
        :on-chat-send="handleChatSend"
      />

      <section class="video-column">
        <div class="featured-stage">
          <div class="stage-pill">
            <span class="stage-dot" />
            <span>{{ t('doctorVideo.consultation.inCall') }}</span>
            <span>{{ consultationDuration }}</span>
          </div>

          <div v-if="session.connectionError.value" class="connection-banner">
            {{ session.connectionError.value }}
          </div>

          <div class="preview-row">
            <consult-participant-card
              :user-name="previewParticipant.userName"
              :track="previewParticipant.track"
              :muted="previewParticipant.muted"
              :speaking="previewParticipant.speaking"
              :badge="previewParticipant.track ? '' : previewParticipant.placeholderBadge"
              compact
              @click="toggleFeaturedParticipant"
            />
          </div>

          <consult-participant-card
            class="featured-card"
            :user-name="featuredParticipant.userName"
            :track="featuredParticipant.track"
            :muted="featuredParticipant.muted"
            :speaking="featuredParticipant.speaking"
            :badge="featuredParticipant.track ? '' : featuredParticipant.placeholderBadge"
            :show-status="false"
          />


          <div class="stage-controls">
            <consult-room-controls
              :camera-enabled="session.cameraEnabled.value"
              :mic-enabled="session.micEnabled.value"
              :on-toggle-camera="session.toggleCamera"
              :on-switch-camera="openCameraSwitchDialog"
              :on-toggle-mic="session.toggleMic"
              :on-leave="handleLeave"
              :camera-switching="session.cameraSwitching.value"
              show-camera
            />
          </div>
        </div>

        <footer class="session-summary">
          <div class="doctor-panel">
            <img class="doctor-avatar" :src="doctorAvatarImage" alt="" />

            <div class="doctor-copy">
              <div class="doctor-heading">
                <strong>{{ doctorName }}</strong>
                <span v-if="session.joined.value" class="doctor-status">
                  {{ t('doctorVideo.consultation.connected') }}
                </span>
              </div>

              <p v-if="doctorGoodAt" class="doctor-good-at">
                <span>{{ t('doctorVideo.consultation.goodAt') }}:</span>
                {{ doctorGoodAt }}
              </p>
            </div>
          </div>
        </footer>
      </section>

      <aside class="record-column">
        <div class="record-shell">
          <el-tabs v-model="activeTab" class="record-tabs" stretch>
            <el-tab-pane :label="t('doctorVideo.consultation.tabs.outpatient')" name="outpatient" />
            <el-tab-pane :label="t('doctorVideo.consultation.tabs.fourDiagnoses')" name="fourDiagnoses" />
            <el-tab-pane :label="t('doctorVideo.consultation.tabs.history')" name="history" />
          </el-tabs>

          <div v-if="activeTab === 'outpatient'" class="record-content">
            <button
              type="button"
              class="ai-button"
              :disabled="generatingMedicalRecord"
              @click="handleGenerateMedicalRecord"
            >
              {{ generatingMedicalRecord ? t('doctorVideo.consultation.aiGenerating') : t('doctorVideo.consultation.aiGenerate') }}
            </button>

            <section class="record-section">
              <h3>{{ t('doctorVideo.consultation.basicInfo') }}</h3>

              <div class="compact-info-row">
                <div v-for="field in basicInfoFields" :key="field.label" class="compact-info-item">
                  <span class="compact-label">{{ field.label }}：</span>
                  <span class="compact-value">{{ field.value }}</span>
                </div>
              </div>
            </section>

            <section class="record-section">
              <el-form :model="outpatientRecordForm" label-position="top" class="compact-history-form">
                <el-form-item :label="t('doctorVideo.consultation.chiefComplaint')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.chiefComplaint"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.chiefComplaint'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.currentHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.currentHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.currentHistory'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.pastHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.pastHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.pastHistory'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.allergyHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.allergyHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.allergyHistory'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.familyHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.familyHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.familyHistory'))"
                  />
                </el-form-item>
              </el-form>
            </section>

            <section class="record-section">
              <h3>{{ t('doctorVideo.consultation.diagnosisFormTitle') }}</h3>
              <el-form :model="diagnosisForm" :rules="diagnosisRules" ref="diagnosisFormRef" label-position="top" class="compact-diagnosis-form">
                <el-form-item :label="t('doctorVideo.consultation.diagnosis')" prop="diseaseNameCn" class="compact-form-item">
                  <el-input
                    v-model="diagnosisForm.diseaseNameCn"
                    :placeholder="resolveInputPlaceholder(t('doctorVideo.consultation.diagnosis'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.check')" prop="syndromeTypeCn" class="compact-form-item">
                  <el-input
                    v-model="diagnosisForm.syndromeTypeCn"
                    :placeholder="resolveInputPlaceholder(t('doctorVideo.consultation.check'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.therapy')" prop="prescriptionId" class="compact-form-item" required>
                  <el-select
                    v-model="diagnosisForm.prescriptionId"
                    filterable
                    clearable
                    remote
                    reserve-keyword
                    class="prescription-select"
                    popper-class="prescription-select-popper"
                    :placeholder="t('doctorVideo.consultation.prescriptionSelectPlaceholder')"
                    :loading="prescriptionSelectLoading"
                    :remote-method="handlePrescriptionRemoteSearch"
                    :validate-event="false"
                    @visible-change="handlePrescriptionVisibleChange"
                    @popup-scroll="handlePrescriptionPopupScroll"
                    @change="onPrescriptionSelect"
                  >
                    <el-option
                      v-for="prescription in prescriptionOptions"
                      :key="String(prescription.drugId)"
                      :label="resolvePrescriptionName(prescription)"
                      :value="String(prescription.drugId)"
                    >
                      <span class="prescription-option">
                        <span>{{ resolvePrescriptionName(prescription) }}</span>
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>

                <div v-if="selectedPrescription" class="prescription-detail-block">
                  <div class="prescription-preview">
                    <div v-loading="prescriptionDetailLoading" class="prescription-info-list">
                      <div class="prescription-info-row">
                        <span>{{ t('doctorVideo.consultation.prescriptionEffect') }}</span>
                        <p>{{ resolvePrescriptionEffect(selectedPrescription) || t('doctorVideo.consultation.notFilled') }}</p>
                      </div>
                      <div class="prescription-info-row">
                        <span>{{ t('doctorVideo.consultation.prescriptionIndication') }}</span>
                        <p>{{ resolvePrescriptionIndication(selectedPrescription) || t('doctorVideo.consultation.notFilled') }}</p>
                      </div>
                      <div class="prescription-info-row">
                        <span>{{ t('doctorVideo.consultation.prescriptionUsage') }}</span>
                        <p>{{ resolvePrescriptionUsage(selectedPrescription) || t('doctorVideo.consultation.notFilled') }}</p>
                      </div>
                      <div v-if="resolvePrescriptionNotes(selectedPrescription)" class="prescription-info-row prescription-info-row--warning">
                        <span>{{ t('doctorVideo.consultation.prescriptionNotes') }}</span>
                        <p>{{ resolvePrescriptionNotes(selectedPrescription) }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="prescription-herbs">
                    <div class="prescription-herb-header">
                      <strong>{{ t('doctorVideo.consultation.prescriptionHerbs') }}</strong>
                      <div>
                        <span v-if="selectedPrescription">{{ activePrescriptionHerbs.length }}{{ t('doctorVideo.consultation.herbCountUnit') }}</span>
                        <el-button
                          type="primary"
                          size="small"
                          :icon="Plus"
                          :disabled="!selectedPrescription"
                          @click="addPrescriptionHerb"
                        >
                          {{ t('doctorVideo.consultation.addHerb') }}
                        </el-button>
                      </div>
                    </div>

                    <el-table
                      :data="editablePrescriptionHerbs"
                      size="small"
                      stripe
                      class="prescription-herb-table"
                      :empty-text="t('doctorVideo.consultation.prescriptionEmptyHerbs')"
                    >
                      <el-table-column :label="t('doctorVideo.consultation.herbName')" min-width="92">
                        <template #default="{ row }">
                          <el-input v-model="row.herb" size="small" :placeholder="t('doctorVideo.consultation.herbName')" />
                        </template>
                      </el-table-column>
                      <el-table-column :label="t('doctorVideo.consultation.herbDose')" width="70">
                        <template #default="{ row }">
                          <el-input v-model="row.dose" size="small" :placeholder="t('doctorVideo.consultation.herbDose')" />
                        </template>
                      </el-table-column>
                      <el-table-column :label="t('doctorVideo.consultation.herbUnit')" width="72">
                        <template #default="{ row }">
                          <el-select v-model="row.unit" size="small">
                            <el-option
                              v-for="unit in prescriptionUnitOptions"
                              :key="unit.dictValue"
                              :label="unit.dictLabel"
                              :value="unit.dictValue"
                            />
                          </el-select>
                        </template>
                      </el-table-column>
                      <el-table-column :label="t('doctorVideo.consultation.herbAction')" width="52" align="center">
                        <template #default="{ $index }">
                          <el-button
                            type="danger"
                            link
                            :icon="Delete"
                            :title="t('doctorVideo.consultation.removeHerb')"
                            :aria-label="t('doctorVideo.consultation.removeHerb')"
                            @click="removePrescriptionHerb($index)"
                          />
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </div>
                <el-form-item :label="t('doctorVideo.consultation.advice')" prop="adviceCn" class="compact-form-item">
                  <el-input
                    type="textarea"
                    :rows="2"
                    resize="none"
                    v-model="diagnosisForm.adviceCn"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.advice'))"
                  />
                </el-form-item>
                <div class="submit-btn-wrapper">
                  <el-button type="primary" :loading="submittingDiagnosis" @click="onSubmitDiagnosis" style="width: 100%;">
                    {{ t('doctorVideo.consultation.submitDiagnosis') }}
                  </el-button>
                </div>
              </el-form>
            </section>
          </div>

          <div v-else-if="activeTab === 'history'" class="record-content">
            <div v-if="historyCaseLoading" class="empty-record-state">
              <h3>{{ t('doctorVideo.consultation.historyCaseLoadingTitle') }}</h3>
              <p>{{ t('doctorVideo.consultation.historyCaseLoadingDescription') }}</p>
            </div>

            <div v-else-if="historyCaseError" class="empty-record-state">
              <h3>{{ t('doctorVideo.consultation.historyCaseErrorTitle') }}</h3>
              <p>{{ historyCaseError }}</p>
            </div>

            <div v-else-if="historyCaseList.length" class="history-case-list">
              <article v-for="item in historyCaseList" :key="`${item.caseId}-${item.date}`" class="history-case-card">
                <div class="history-case-head">
                  <strong>{{ item.departmentName || t('workbench.notAvailable') }}</strong>
                  <span>{{ formatHistoryCaseDate(item.date) }}</span>
                </div>

                <p class="history-case-diagnosis">
                  {{ t('workbench.diagnosisLabel') }}{{ item.diagnosis || t('doctorVideo.consultation.notFilled') }}
                </p>
                <p class="history-case-therapy">
                  {{ t('doctorVideo.consultation.therapy') }}：{{ item.therapy || t('doctorVideo.consultation.notFilled') }}
                </p>
              </article>
            </div>

            <div v-else class="empty-record-state">
              <h3>{{ t('doctorVideo.consultation.historyCaseEmptyTitle') }}</h3>
              <p>{{ t('doctorVideo.consultation.historyCaseEmptyDescription') }}</p>
            </div>
          </div>

          <div v-else-if="activeTab === 'fourDiagnoses'" class="record-content four-diagnosis-content">
            <div v-if="fourApparatusUrl" class="four-diagnosis-report-card">
              <div class="four-report-main">
                <el-icon><document /></el-icon>
                <strong>{{ t('doctorVideo.consultation.fourDiagnosisReportTitle') }}</strong>
              </div>
              <button type="button" @click="fourDiagnosisPdfVisible = true">
                {{ t('doctorVideo.consultation.fourDiagnosisViewReport') }}
              </button>
            </div>

            <div v-else class="four-diagnosis-empty-state">
              <el-icon><document /></el-icon>
              <h3>{{ t('doctorVideo.consultation.fourDiagnosisEmptyTitle') }}</h3>
            </div>

            <div class="four-diagnosis-report-card inspection-report-card">
              <div class="four-report-main">
                <el-icon><document /></el-icon>
                <strong>{{ t('doctorVideo.consultation.inspectionReportTitle') }}</strong>
              </div>
              <button
                type="button"
                :disabled="inspectionReportLoading"
                @click="handleInspectionReportView"
              >
                {{ inspectionReportLoading ? t('doctorVideo.consultation.inspectionReportLoading') : t('doctorVideo.consultation.fourDiagnosisViewReport') }}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="fourDiagnosisPdfVisible" class="four-pdf-preview-mask" @click.self="fourDiagnosisPdfVisible = false">
      <div class="four-pdf-preview-dialog">
        <div class="four-pdf-preview-header">
          <h3>{{ t('doctorVideo.consultation.fourDiagnosisPdfTitle') }}</h3>
          <button type="button" :title="t('common.cancel')" @click="fourDiagnosisPdfVisible = false">
            <el-icon><close /></el-icon>
          </button>
        </div>
        <iframe
          class="four-pdf-preview-frame"
          :src="fourApparatusUrl"
          :title="t('doctorVideo.consultation.fourDiagnosisPdfTitle')"
        ></iframe>
      </div>
    </div>

    <div v-if="inspectionReportVisible" class="four-pdf-preview-mask" @click.self="closeInspectionReportDialog">
      <div class="four-pdf-preview-dialog inspection-report-dialog">
        <div class="four-pdf-preview-header">
          <h3>{{ t('doctorVideo.consultation.inspectionReportDialogTitle') }}</h3>
          <button type="button" :title="t('common.cancel')" @click="closeInspectionReportDialog">
            <el-icon><close /></el-icon>
          </button>
        </div>

        <div class="inspection-report-body">
          <div v-if="inspectionReportList.length && activeInspectionReport" class="inspection-report-workspace">
            <aside class="inspection-report-visual">
              <div class="inspection-report-main-image">
                <el-image
                  v-if="activeInspectionReport.fileUrl"
                  :src="activeInspectionReport.fileUrl"
                  :preview-src-list="[activeInspectionReport.fileUrl]"
                  :z-index="3200"
                  fit="contain"
                  preview-teleported
                />
                <el-empty
                  v-else
                  :image-size="72"
                  :description="t('doctorVideo.consultation.inspectionReportImageUnavailable')"
                />
              </div>

              <div class="inspection-report-thumbnails" role="tablist">
                <button
                  v-for="(item, index) in inspectionReportList"
                  :key="resolveInspectionReportKey(item, index)"
                  type="button"
                  class="inspection-report-thumbnail"
                  :class="{ 'is-active': index === selectedInspectionReportIndex }"
                  :title="t('doctorVideo.consultation.inspectionReportImageIndex', { index: index + 1 })"
                  @click="selectInspectionReport(index)"
                >
                  <el-image v-if="item.fileUrl" :src="item.fileUrl" fit="cover" />
                  <span v-else>{{ index + 1 }}</span>
                </button>
              </div>
            </aside>

            <main class="inspection-report-content">
              <section class="inspection-analysis-panel">
                <header class="inspection-panel-header">
                  <h4>{{ t('doctorVideo.consultation.inspectionReportAnalysis') }}</h4>
                  <span class="inspection-analysis-status" :class="`is-status-${activeInspectionAnalysisStatus}`">
                    {{ inspectionAnalysisStatusText }}
                  </span>
                </header>

                <el-progress
                  v-if="inspectionAnalysisPolling || inspectionAnalysisProgress > 0"
                  class="inspection-analysis-progress"
                  :percentage="inspectionAnalysisProgress"
                  :format="formatInspectionAnalysisProgress"
                  :status="inspectionAnalysisProgressStatus"
                />

                <p v-if="activeInspectionAnalysisError" class="inspection-report-error">
                  {{ activeInspectionAnalysisError }}
                </p>

                <ul v-if="activeInspectionAdvice.length" class="inspection-report-advice-list">
                  <li v-for="(advice, adviceIndex) in activeInspectionAdvice" :key="adviceIndex">
                    {{ advice }}
                  </li>
                </ul>
                <p v-else class="inspection-report-empty-line">
                  {{
                    inspectionAnalysisPolling
                      ? t('doctorVideo.consultation.inspectionAnalysisWaitingAdvice')
                      : t('doctorVideo.consultation.inspectionReportNoAdvice')
                  }}
                </p>
              </section>

              <section class="inspection-items-panel">
                <header class="inspection-panel-header">
                  <h4>{{ t('doctorVideo.consultation.inspectionReportItems') }}</h4>
                </header>

                <el-table
                  v-if="activeInspectionItems.length"
                  :data="activeInspectionItems"
                  :row-class-name="getInspectionItemRowClassName"
                  size="small"
                  border
                  class="inspection-report-table"
                >
                  <el-table-column prop="item_name" :label="t('doctorVideo.consultation.inspectionReportItemName')" min-width="150" />
                  <el-table-column prop="result_value" :label="t('doctorVideo.consultation.inspectionReportResultValue')" min-width="120" />
                  <el-table-column prop="abnormal_flag" :label="t('doctorVideo.consultation.inspectionReportAbnormalFlag')" min-width="90" />
                  <el-table-column prop="reference_range" :label="t('doctorVideo.consultation.inspectionReportReferenceRange')" min-width="140" />
                  <el-table-column prop="unit" :label="t('doctorVideo.consultation.inspectionReportUnit')" min-width="100" />
                </el-table>
                <p v-else class="inspection-report-empty-line">
                  {{ t('doctorVideo.consultation.inspectionReportNoItems') }}
                </p>
              </section>
            </main>
          </div>

          <div v-else class="empty-record-state">
            <h3>{{ t('doctorVideo.consultation.inspectionReportEmptyTitle') }}</h3>
          </div>
        </div>
      </div>
    </div>

    <consult-camera-select-dialog
      v-model="cameraDialogVisible"
      :devices="session.cameraDevices.value"
      :selected-device-id="session.selectedCameraId.value"
      :loading="session.cameraDeviceLoading.value"
      :switching="session.cameraSwitching.value"
      :initial-required="cameraDialogRequired"
      @confirm="handleCameraSelectionConfirm"
      @refresh="refreshCameraDevices"
    />
  </section>
</template>

<script setup lang="ts">
import { Close, Delete, Document, Plus, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { listDictData } from '@/api/dict'
import { addWrittenRecord, translateConsultationText } from '@/api/patient'
import { getDrugPrescription, listDrugPrescription, saveCaseDrugDetail } from '@/api/prescription'
import { getInspectionBatchByBatchId, getInspectionBatchByCaseId } from '@/api/record'
import type {
  CaseDrugDetailSaveParams,
  ConsultationMode,
  DictDataVO,
  DrugPrescriptionListResponse,
  DrugPrescriptionVO,
  GenerateMedicalRecordData,
  InspectionRecognizedItem,
  InspectionReportItem
} from '@/api/types'
import { generateMedicalRecord, getCaseList, getVideoConversation, getVideoId, getVideoTime, getVideoToken, saveSubtitle, submitDiagnosis } from '@/api/video'
import doctorAvatarImage from '@/assets/doctor_avatar.png'
import { useUserStore } from '@/stores/user'
import { showConfirmDialog } from '@/utils/confirm-dialog'
import ConsultCameraSelectDialog from './components/ConsultCameraSelectDialog.vue'
import ConsultParticipantCard from './components/ConsultParticipantCard.vue'
import ConsultRoomControls from './components/ConsultRoomControls.vue'
import ConsultSubtitleTimeline from './components/ConsultSubtitleTimeline.vue'
import { createDoctorConsultationChatService } from './services/consultation-chat'
import { useDoctorConsultationSession } from './composables/useDoctorConsultationSession'
import { useDoctorSubtitleTimeline } from './composables/useDoctorSubtitleTimeline'
import type {
  ConsultationChatPayload,
  ConsultationMessageType,
  DoctorRtcContext,
  SubtitleTimelineItem
} from './types'

const RTC_APP_ID = 'bkbbxxzy'
const RTC_APP_KEY = 'da88a821450548b6a5758f0d442d59d9'
const DOCTOR_RTC_CONTEXT_KEY = 'doctor_rtc_context'

interface ConsultationHistoryItem {
  messageType: ConsultationMessageType
  isDoctor: 0 | 1 | 2
  contentCn: string
  contentLo: string
  timestamp: number
  sequence: number
}

interface HistoryCaseRecord {
  caseId: string
  departmentName: string
  diagnosis: string
  therapy: string
  date: string
}

interface PrescriptionHerb {
  herb: string
  dose: string
  unit: string
  note?: string
}

interface PrescriptionPopupScrollPayload {
  scrollTop: number
  scrollLeft?: number
}

const PRESCRIPTION_UNIT_DICT_TYPE = 'drug_detail_unit'
const PRESCRIPTION_PAGE_SIZE = 20
const PRESCRIPTION_SCROLL_PRELOAD_DISTANCE = 50

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { locale, t } = useI18n()
const session = useDoctorConsultationSession()
const activeTab = ref('outpatient')
const pageError = ref('')
const consultationDuration = ref('00:00:00')
const consultationContext = ref<DoctorRtcContext>({})
const savedSubtitleKeys = new Set<string>()
const chatDraft = ref('')
const chatSending = ref(false)
const historyCaseList = ref<HistoryCaseRecord[]>([])
const historyCaseLoading = ref(false)
const historyCaseError = ref('')
const generatingMedicalRecord = ref(false)
const cameraDialogVisible = ref(false)
const cameraDialogRequired = ref(false)
const fourDiagnosisPdfVisible = ref(false)
const inspectionReportVisible = ref(false)
const inspectionReportLoading = ref(false)
const inspectionReportList = ref<InspectionReportItem[]>([])
const selectedInspectionReportIndex = ref(0)
const inspectionAnalysisPolling = ref(false)
const inspectionAnalysisProgress = ref(0)
const inspectionAnalysisError = ref('')
const featuredParticipantRole = ref<'doctor' | 'patient'>('patient')
let durationTimer = 0
let durationStartedAt = 0
let durationRequestId = 0
let inspectionReportRequestId = 0
let inspectionAnalysisPollTimer = 0
let inspectionAnalysisProgressTimer = 0
let inspectionAnalysisPollRequestId = 0
let inspectionAnalysisProgressCeiling = 72
let pendingInitialCameraSelection: ((deviceId: string) => void) | null = null
let leavingInProgress = false

const normalizeConsultationMode = (value: unknown): ConsultationMode => {
  return value === 'continue' ? 'continue' : 'accept'
}

const normalizeConsultationLang = (value: unknown): 'lo' | 'cn' | undefined => {
  const normalizedValue = value !== null && value !== undefined ? String(value).trim().toLowerCase() : ''
  if (normalizedValue === 'cn' || normalizedValue === 'zh-cn' || normalizedValue === 'zh') return 'cn'
  if (normalizedValue === 'lo' || normalizedValue === 'lo-la' || normalizedValue === 'lao') return 'lo'
  return undefined
}

const queryValue = (key: string) => {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

const loadConsultationContext = () => {
  try {
    const raw = sessionStorage.getItem(DOCTOR_RTC_CONTEXT_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    consultationContext.value = {
      ...parsed,
      consultationMode: normalizeConsultationMode(parsed?.consultationMode)
    }
  } catch {
    consultationContext.value = {}
  }
}

const doctorId = computed(() => {
  const userId = userStore.profile?.userId
  return userId !== null && userId !== undefined ? String(userId) : userStore.name || ''
})

const doctorName = computed(() => {
  return userStore.profile?.nickName || userStore.nickname || userStore.name || t('workbench.unknownDoctor')
})

const doctorGoodAt = computed(() => {
  const profile = userStore.profile
  const value =
    profile?.goodAt ||
    profile?.specialty ||
    profile?.speciality ||
    profile?.expertise ||
    profile?.description ||
    ''

  return value !== null && value !== undefined ? String(value).trim() : ''
})

const roomId = computed(() => {
  const storedRoomId = consultationContext.value.roomId
  if (storedRoomId !== null && storedRoomId !== undefined && String(storedRoomId).trim() !== '') {
    return String(storedRoomId).trim()
  }

  return queryValue('roomId')
})
const caseId = computed(() => {
  const storedCaseId = consultationContext.value.caseId
  return storedCaseId !== null && storedCaseId !== undefined && String(storedCaseId).trim() !== ''
    ? String(storedCaseId)
    : queryValue('caseId')
})
const videoId = computed(() => {
  const storedVideoId = consultationContext.value.videoId
  return storedVideoId !== null && storedVideoId !== undefined && String(storedVideoId).trim() !== ''
    ? String(storedVideoId)
    : queryValue('videoId')
})
const patientId = computed(() => {
  const storedPatientId = consultationContext.value.patientId
  return storedPatientId !== null && storedPatientId !== undefined && String(storedPatientId).trim() !== ''
    ? String(storedPatientId)
    : queryValue('patientId')
})
const doctorAideId = computed(() => {
  const storedDoctorAideId = consultationContext.value.doctorAideId
  return storedDoctorAideId !== null && storedDoctorAideId !== undefined && String(storedDoctorAideId).trim() !== ''
    ? String(storedDoctorAideId)
    : queryValue('doctorAideId')
})
const consultationMode = computed<ConsultationMode>(() => {
  const queryMode = queryValue('consultationMode')
  if (queryMode) {
    return normalizeConsultationMode(queryMode)
  }

  return normalizeConsultationMode(consultationContext.value.consultationMode)
})
const isContinueConsultation = computed(() => consultationMode.value === 'continue')
const consultationLang = computed<'lo' | 'cn'>(() => {
  return (
    normalizeConsultationLang(queryValue('consultationLang')) ||
    normalizeConsultationLang(consultationContext.value.consultationLang) ||
    'lo'
  )
})
const translationEnabled = computed(() => consultationLang.value === 'lo')
const subtitleTranslationEnabled = computed(() => true)
const manualChatTranslationEnabled = computed(() => translationEnabled.value || subtitleTranslationEnabled.value)
const fourApparatusUrl = computed(() => resolveContextText(consultationContext.value.fourApparatusUrl))

const patientName = computed(() => {
  return consultationContext.value.patientName || queryValue('patientId') || t('workbench.unknownPatient')
})

const doctorPreviewBadge = computed(() => t('doctorVideo.consultation.selfBadge'))
const waitingPatientBadge = computed(() => t('doctorVideo.consultation.waitingPatient'))

const buildPlaceholderParticipant = (userId: string, userName: string, placeholderBadge: string) => ({
  userId,
  userName,
  track: null,
  muted: true,
  speaking: false,
  placeholderBadge
})

const findRemoteParticipant = (userId: string) => {
  const normalizedUserId = userId?.trim()
  if (!normalizedUserId) {
    return null
  }

  return session.remoteParticipants.value.find((participant) => participant.userId === normalizedUserId) || null
}

const patientStageParticipant = computed(() => {
  const expectedPatientId = patientId.value
  return (
    findRemoteParticipant(expectedPatientId) ||
    (!expectedPatientId ? session.remoteParticipants.value.find((participant) => participant.track) : null) ||
    buildPlaceholderParticipant(
      expectedPatientId || 'patient-placeholder',
      patientName.value,
      waitingPatientBadge.value
    )
  )
})

const doctorSelfParticipant = computed(() => ({
  userId: session.channelContext.value?.userId || doctorId.value || 'doctor',
  userName: doctorName.value,
  track: session.localPreviewTrack.value,
  muted: !session.micEnabled.value,
  speaking: false,
  placeholderBadge: doctorPreviewBadge.value
}))

const featuredParticipant = computed(() => {
  return featuredParticipantRole.value === 'patient' ? patientStageParticipant.value : doctorSelfParticipant.value
})

const previewParticipantRole = computed<'doctor' | 'patient'>(() => {
  return featuredParticipantRole.value === 'patient' ? 'doctor' : 'patient'
})

const previewParticipant = computed(() => {
  return previewParticipantRole.value === 'patient' ? patientStageParticipant.value : doctorSelfParticipant.value
})

const featuredCaptionText = computed(() => {
  return featuredParticipantRole.value === 'patient'
    ? `${t('doctorVideo.consultation.patientPrefix')}${patientName.value}`
    : doctorName.value
})

const toggleFeaturedParticipant = () => {
  featuredParticipantRole.value = previewParticipantRole.value
}

const resolveInputPlaceholder = (label: string) => {
  return t('doctorVideo.consultation.inputPlaceholder', { label })
}

const resolveTextareaPlaceholder = (label: string) => {
  return t('doctorVideo.consultation.textareaPlaceholder', { label })
}

const resolveContextText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const formatMarriage = (value: unknown) => {
  const text = resolveContextText(value).toLowerCase()

  if (text === '0') {
    return t('assistant.caseResult.unmarried')
  }

  if (text === '1') {
    return t('assistant.caseResult.married')
  }

  return resolveContextText(value)
}

const normalizeHistoryCaseList = (value: unknown): HistoryCaseRecord[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>
      return {
        caseId: resolveContextText(record.caseId),
        departmentName: resolveContextText(record.departmentName),
        diagnosis: resolveContextText(record.diagnosis),
        therapy: resolveContextText(record.therapy),
        date: resolveContextText(record.date)
      }
    })
    .filter((item): item is HistoryCaseRecord => Boolean(item))
}

const formatHistoryCaseDate = (value: string) => {
  if (!value) {
    return t('workbench.notAvailable')
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(resolveUiLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const basicInfoFields = computed(() => [
  {
    label: t('doctorVideo.consultation.name'),
    value: patientName.value
  },
  {
    label: t('doctorVideo.consultation.gender'),
    value: consultationContext.value.sexText || t('workbench.notAvailable')
  },
  {
    label: t('doctorVideo.consultation.age'),
    value:
      consultationContext.value.age !== null &&
      consultationContext.value.age !== undefined &&
      String(consultationContext.value.age).trim() !== ''
        ? String(consultationContext.value.age).trim()
        : t('workbench.notAvailable')
  },
  {
    label: t('doctorVideo.consultation.marriage'),
    value: formatMarriage(consultationContext.value.marriage) || t('doctorVideo.consultation.notFilled')
  },
  {
    label: t('doctorVideo.consultation.occupation'),
    value: resolveContextText(consultationContext.value.occupation) || t('doctorVideo.consultation.notFilled')
  }
])

const outpatientRecordForm = reactive({
  chiefComplaint: '',
  currentHistory: '',
  pastHistory: '',
  allergyHistory: '',
  familyHistory: ''
})

const diagnosisFormRef = ref<FormInstance>()
const diagnosisForm = ref({
  diseaseNameCn: '',
  syndromeTypeCn: '',
  prescriptionId: '',
  adviceCn: ''
})

const prescriptionOptions = ref<DrugPrescriptionVO[]>([])
const selectedPrescription = ref<DrugPrescriptionVO | null>(null)
const editablePrescriptionHerbs = ref<PrescriptionHerb[]>([])
const prescriptionListLoading = ref(false)
const prescriptionSelectLoading = ref(false)
const prescriptionDetailLoading = ref(false)
const prescriptionListTotal = ref(0)
const prescriptionHasMore = ref(true)
const prescriptionListPageNum = ref(0)
const prescriptionKeyword = ref('')
const prescriptionUnitOptions = ref<DictDataVO[]>([])
let prescriptionSearchTimer = 0
let prescriptionListRequestId = 0
let prescriptionDetailRequestId = 0
let prescriptionUnitRequestId = 0

const activePrescriptionHerbs = computed(() => {
  return editablePrescriptionHerbs.value.filter((herb) => herb.herb.trim())
})

const hasMorePrescriptions = computed(() => {
  return prescriptionHasMore.value
})

const resolvePrescriptionId = (prescription: DrugPrescriptionVO) => takeOptionalText(prescription.drugId)

const resolvePrescriptionName = (prescription: DrugPrescriptionVO) => {
  return takeOptionalText(prescription.drugName) || '--'
}

const resolvePrescriptionEffect = (prescription: DrugPrescriptionVO) => takeOptionalText(prescription.drugEffect)

const resolvePrescriptionIndication = (prescription: DrugPrescriptionVO) => takeOptionalText(prescription.drugCure)

const resolvePrescriptionUsage = (prescription: DrugPrescriptionVO) => takeOptionalText(prescription.drugUsage)

const resolvePrescriptionNotes = (prescription: DrugPrescriptionVO) => takeOptionalText(prescription.drugAttention)

const normalizeDictListPayload = (response: { rows?: DictDataVO[] | null; data?: DictDataVO[] | null }) => {
  if (Array.isArray(response?.rows)) return response.rows
  if (Array.isArray(response?.data)) return response.data
  return []
}

const getDefaultPrescriptionUnit = () => {
  return takeOptionalText(prescriptionUnitOptions.value[0]?.dictValue)
}

const findPrescriptionUnitOption = (value: unknown) => {
  const text = takeOptionalText(value)
  if (!text) return undefined

  const exactValueMatched = prescriptionUnitOptions.value.find((item) => takeOptionalText(item.dictValue) === text)
  if (exactValueMatched) return exactValueMatched

  const normalizedText = text.toLowerCase()
  const normalizedValueMatched = prescriptionUnitOptions.value.find((item) => takeOptionalText(item.dictValue).toLowerCase() === normalizedText)
  if (normalizedValueMatched) return normalizedValueMatched

  const exactLabelMatched = prescriptionUnitOptions.value.find((item) => takeOptionalText(item.dictLabel) === text)
  if (exactLabelMatched) return exactLabelMatched

  return prescriptionUnitOptions.value.find((item) => takeOptionalText(item.dictLabel).toLowerCase() === normalizedText)
}

const resolvePrescriptionUnitValue = (value: unknown) => {
  return findPrescriptionUnitOption(value)?.dictValue || takeOptionalText(value) || getDefaultPrescriptionUnit()
}

const normalizeEditablePrescriptionHerbUnits = () => {
  editablePrescriptionHerbs.value = editablePrescriptionHerbs.value.map((herb) => ({
    ...herb,
    unit: resolvePrescriptionUnitValue(herb.unit)
  }))
}

const loadPrescriptionUnitDict = async () => {
  const requestId = ++prescriptionUnitRequestId

  try {
    const response = await listDictData({ dictType: PRESCRIPTION_UNIT_DICT_TYPE })
    if (requestId !== prescriptionUnitRequestId) return

    prescriptionUnitOptions.value = normalizeDictListPayload(response)
    normalizeEditablePrescriptionHerbUnits()
  } catch (error) {
    if (requestId !== prescriptionUnitRequestId) return
    console.warn('Failed to load prescription unit dict.', error)
    prescriptionUnitOptions.value = []
  }
}

const normalizePrescriptionListPayload = (response: DrugPrescriptionListResponse) => {
  const data = response?.data
  let rows: DrugPrescriptionVO[] = []
  let totalValue: unknown = response?.total

  if (Array.isArray(response?.rows)) {
    rows = response.rows
  } else if (Array.isArray(data)) {
    rows = data
  } else if (isObjectRecord(data)) {
    if (Array.isArray(data.rows)) {
      rows = data.rows as DrugPrescriptionVO[]
    } else if (Array.isArray(data.list)) {
      rows = data.list as DrugPrescriptionVO[]
    }

    totalValue = data.total ?? totalValue
  }

  const parsedTotal = Number(totalValue)
  return { rows, total: Number.isFinite(parsedTotal) ? parsedTotal : 0 }
}

const mergePrescriptionOptions = (currentOptions: DrugPrescriptionVO[], nextOptions: DrugPrescriptionVO[]) => {
  const optionMap = new Map<string, DrugPrescriptionVO>()

  ;[...currentOptions, ...nextOptions].forEach((item) => {
    const drugId = resolvePrescriptionId(item)
    if (drugId) {
      optionMap.set(drugId, item)
    }
  })

  return Array.from(optionMap.values())
}

const fetchPrescriptionList = async (reset = false) => {
  const nextPageNum = reset ? 1 : prescriptionListPageNum.value + 1
  const requestId = ++prescriptionListRequestId
  prescriptionListLoading.value = true
  if (reset) {
    prescriptionSelectLoading.value = true
  }

  try {
    const response = await listDrugPrescription({
      pageNum: nextPageNum,
      pageSize: PRESCRIPTION_PAGE_SIZE,
      drugName: prescriptionKeyword.value || undefined
    })

    if (requestId !== prescriptionListRequestId) return

    const previousOptionsLength = prescriptionOptions.value.length
    const { rows, total } = normalizePrescriptionListPayload(response)
    const nextOptions = reset ? rows : mergePrescriptionOptions(prescriptionOptions.value, rows)
    const hasNewOptions = reset || nextOptions.length > previousOptionsLength
    prescriptionOptions.value = nextOptions
    prescriptionListTotal.value = total > 0 ? Math.max(total, nextOptions.length) : nextOptions.length
    prescriptionHasMore.value = hasNewOptions && (rows.length >= PRESCRIPTION_PAGE_SIZE || (total > 0 && nextOptions.length < total))
    prescriptionListPageNum.value = nextPageNum
  } catch (error) {
    if (requestId !== prescriptionListRequestId) return
    console.warn('Failed to load prescription list.', error)
    if (reset) {
      prescriptionOptions.value = []
      prescriptionListTotal.value = 0
      prescriptionHasMore.value = true
      prescriptionListPageNum.value = 0
    }
    ElMessage.warning(t('doctorVideo.consultation.prescriptionListLoadFailed'))
  } finally {
    if (requestId === prescriptionListRequestId) {
      prescriptionListLoading.value = false
      if (reset) {
        prescriptionSelectLoading.value = false
      }
    }
  }
}

const handlePrescriptionVisibleChange = (visible: boolean) => {
  if (visible && !prescriptionOptions.value.length && !prescriptionListLoading.value) {
    void fetchPrescriptionList(true)
  }
}

const handlePrescriptionRemoteSearch = (keyword: string) => {
  prescriptionKeyword.value = keyword.trim()
  window.clearTimeout(prescriptionSearchTimer)
  prescriptionSearchTimer = window.setTimeout(() => {
    void fetchPrescriptionList(true)
  }, 300)
}

const getPrescriptionPopupScrollWrap = () => {
  return document.querySelector<HTMLElement>('.prescription-select-popper .el-select-dropdown__wrap')
    || document.querySelector<HTMLElement>('.prescription-select-popper .el-scrollbar__wrap')
}

const handlePrescriptionPopupScroll = (payload: PrescriptionPopupScrollPayload) => {
  const target = getPrescriptionPopupScrollWrap()
  if (!target) return

  const scrollTop = Number(payload?.scrollTop ?? target.scrollTop)
  const distanceToBottom = target.scrollHeight - scrollTop - target.clientHeight
  if (distanceToBottom > PRESCRIPTION_SCROLL_PRELOAD_DISTANCE) return

  if (!hasMorePrescriptions.value || prescriptionListLoading.value) return
  void fetchPrescriptionList(false)
}

const normalizePrescriptionHerbs = (prescription: DrugPrescriptionVO) => {
  return (prescription.detailList || [])
    .map((item) => ({
      herb: takeOptionalText(item.drugDetailName),
      dose: takeOptionalText(item.drugDetailShare),
      unit: resolvePrescriptionUnitValue(item.drugDetailUnit)
    }))
    .filter((item) => item.herb || item.dose)
}

const clearPrescriptionValidation = () => {
  diagnosisFormRef.value?.clearValidate('prescriptionId')
}

const refreshPrescriptionValidation = () => {
  if (!diagnosisForm.value.prescriptionId) {
    clearPrescriptionValidation()
    return
  }

  void diagnosisFormRef.value?.validateField('prescriptionId').catch(() => undefined)
}

const onPrescriptionSelect = async (prescriptionId: string | number | boolean | undefined) => {
  const normalizedId = prescriptionId !== null && prescriptionId !== undefined && prescriptionId !== false
    ? String(prescriptionId).trim()
    : ''
  diagnosisForm.value.prescriptionId = normalizedId
  clearPrescriptionValidation()

  if (!normalizedId) {
    prescriptionDetailRequestId++
    prescriptionDetailLoading.value = false
    selectedPrescription.value = null
    editablePrescriptionHerbs.value = []
    return
  }

  const listItem = prescriptionOptions.value.find((prescription) => resolvePrescriptionId(prescription) === normalizedId)
  selectedPrescription.value = listItem || null
  editablePrescriptionHerbs.value = []

  const requestId = ++prescriptionDetailRequestId
  prescriptionDetailLoading.value = true

  try {
    const response = await getDrugPrescription(normalizedId)
    if (requestId !== prescriptionDetailRequestId) return

    const detail = response?.data || listItem || null
    selectedPrescription.value = detail
    editablePrescriptionHerbs.value = detail ? normalizePrescriptionHerbs(detail) : []

    if (detail) {
      prescriptionOptions.value = mergePrescriptionOptions(prescriptionOptions.value, [detail])
    }
    refreshPrescriptionValidation()
  } catch (error) {
    if (requestId !== prescriptionDetailRequestId) return
    console.warn('Failed to load prescription detail.', error)
    selectedPrescription.value = listItem || null
    editablePrescriptionHerbs.value = listItem ? normalizePrescriptionHerbs(listItem) : []
    refreshPrescriptionValidation()
    ElMessage.warning(t('doctorVideo.consultation.prescriptionDetailLoadFailed'))
  } finally {
    if (requestId === prescriptionDetailRequestId) {
      prescriptionDetailLoading.value = false
    }
  }
}

const addPrescriptionHerb = () => {
  if (!selectedPrescription.value) return
  editablePrescriptionHerbs.value.push({ herb: '', dose: '', unit: getDefaultPrescriptionUnit(), note: '' })
}

const removePrescriptionHerb = (index: number) => {
  editablePrescriptionHerbs.value.splice(index, 1)
}

const normalizeSubmitId = (value: unknown, fallback = 0) => {
  const text = takeOptionalText(value)
  if (!text) return fallback

  const parsedValue = Number(text)
  return Number.isFinite(parsedValue) ? parsedValue : text
}

const buildCaseDrugDetailPayload = (submitCaseId: number): CaseDrugDetailSaveParams | null => {
  const prescription = selectedPrescription.value
  if (!prescription) return null

  const submitVideoId = normalizeSubmitId(videoId.value)
  const submitDrugId = normalizeSubmitId(prescription.drugId)
  const detailList = activePrescriptionHerbs.value.map((herb) => ({
    caseDrugDetailId: 0,
    videoId: submitVideoId,
    caseId: submitCaseId,
    drugId: submitDrugId,
    drugDetailName: herb.herb.trim(),
    drugDetailUnit: resolvePrescriptionUnitValue(herb.unit),
    drugDetailShare: herb.dose.trim()
  }))

  return {
    caseId: submitCaseId,
    videoId: submitVideoId,
    drugId: submitDrugId,
    detailList
  }
}

const buildPrescriptionContent = () => {
  const prescription = selectedPrescription.value
  return prescription ? resolvePrescriptionName(prescription) : ''
}

const validatePrescription = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
  if (!selectedPrescription.value) {
    callback(new Error(t('doctorVideo.consultation.prescriptionRequired')))
    return
  }

  if (!activePrescriptionHerbs.value.length) {
    callback(new Error(t('doctorVideo.consultation.prescriptionHerbRequired')))
    return
  }

  callback()
}

const diagnosisRules = computed<FormRules>(() => ({
  diseaseNameCn: [{ required: true, message: resolveInputPlaceholder(t('doctorVideo.consultation.diagnosis')), trigger: 'blur' }],
  syndromeTypeCn: [{ required: true, message: resolveInputPlaceholder(t('doctorVideo.consultation.check')), trigger: 'blur' }],
  prescriptionId: [{ validator: validatePrescription, trigger: 'change' }],
  adviceCn: [{ required: true, message: resolveInputPlaceholder(t('doctorVideo.consultation.advice')), trigger: 'blur' }]
}))

const submittingDiagnosis = ref(false)

const syncOutpatientRecordForm = () => {
  outpatientRecordForm.chiefComplaint = resolveContextText(consultationContext.value.complaint)
  outpatientRecordForm.currentHistory = resolveContextText(consultationContext.value.historyIllness)
  outpatientRecordForm.pastHistory = resolveContextText(consultationContext.value.previousHistory)
  outpatientRecordForm.allergyHistory = resolveContextText(consultationContext.value.allergichistory)
  outpatientRecordForm.familyHistory = resolveContextText(consultationContext.value.familyhistory)
}

const persistConsultationContext = (payload: Partial<DoctorRtcContext>) => {
  consultationContext.value = {
    ...consultationContext.value,
    ...payload
  }

  try {
    sessionStorage.setItem(DOCTOR_RTC_CONTEXT_KEY, JSON.stringify(consultationContext.value))
  } catch {
    undefined
  }
}

const resolveGeneratedRecordText = (
  record: GenerateMedicalRecordData,
  fieldName: 'mainSuit' | 'historyIllness' | 'previousHistory' | 'allergichistory' | 'familyhistory'
) => {
  const preferLao = locale.value === 'lo'
  const localizedKey = `${fieldName}${preferLao ? 'Lo' : 'Cn'}` as keyof GenerateMedicalRecordData
  const fallbackKey = `${fieldName}${preferLao ? 'Cn' : 'Lo'}` as keyof GenerateMedicalRecordData

  return takeOptionalText(record[localizedKey]) || takeOptionalText(record[fallbackKey])
}

const resolveUiLocale = () => {
  if (locale.value === 'zh-cn') return 'zh-CN'
  if (locale.value === 'lo') return 'lo-LA'
  if (locale.value === 'en') return 'en-US'
  return 'zh-CN'
}

const applyGeneratedMedicalRecord = (record: GenerateMedicalRecordData) => {
  const chiefComplaint = resolveGeneratedRecordText(record, 'mainSuit')
  const currentHistory = resolveGeneratedRecordText(record, 'historyIllness')
  const pastHistory = resolveGeneratedRecordText(record, 'previousHistory')
  const allergyHistory = resolveGeneratedRecordText(record, 'allergichistory')
  const familyHistory = resolveGeneratedRecordText(record, 'familyhistory')

  outpatientRecordForm.chiefComplaint = chiefComplaint
  outpatientRecordForm.currentHistory = currentHistory
  outpatientRecordForm.pastHistory = pastHistory
  outpatientRecordForm.allergyHistory = allergyHistory
  outpatientRecordForm.familyHistory = familyHistory

  persistConsultationContext({
    complaint: chiefComplaint,
    historyIllness: currentHistory,
    previousHistory: pastHistory,
    allergichistory: allergyHistory,
    familyhistory: familyHistory
  })
}

const handleGenerateMedicalRecord = async () => {
  if (!caseId.value) {
    ElMessage.warning(t('doctorVideo.consultation.aiGenerateCaseUnavailable'))
    return
  }

  generatingMedicalRecord.value = true

  try {
    const response = await generateMedicalRecord(caseId.value)
    const record = response?.data

    if (!record) {
      throw new Error('Missing generated medical record data.')
    }

    applyGeneratedMedicalRecord(record)
    ElMessage.success(t('doctorVideo.consultation.aiGenerateSuccess'))
  } catch (error) {
    console.warn('Failed to generate doctor medical record.', error)
    ElMessage.error(error instanceof Error && error.message ? error.message : t('doctorVideo.consultation.aiGenerateFailed'))
  } finally {
    generatingMedicalRecord.value = false
  }
}

const fetchHistoryCaseList = async () => {
  if (!patientId.value || !caseId.value) {
    historyCaseList.value = []
    historyCaseError.value = ''
    historyCaseLoading.value = false
    return
  }

  historyCaseLoading.value = true
  historyCaseError.value = ''

  try {
    const response = await getCaseList(patientId.value, caseId.value)
    historyCaseList.value = normalizeHistoryCaseList(response?.data)
  } catch (error) {
    historyCaseList.value = []
    historyCaseError.value = t('doctorVideo.consultation.historyCaseLoadFailed')
    console.warn('Failed to load history case list.', error)
  } finally {
    historyCaseLoading.value = false
  }
}

const resolveInspectionReportKey = (item: InspectionReportItem, index: number) => {
  const reportId = takeOptionalText(item.reportId)
  if (reportId) return `report-${reportId}`

  const batchId = takeOptionalText(item.batchId)
  if (batchId) return `batch-${batchId}-${index}`

  return `inspection-${index}`
}

const activeInspectionReport = computed(() => {
  return inspectionReportList.value[selectedInspectionReportIndex.value] || null
})

const activeInspectionItems = computed<InspectionRecognizedItem[]>(() => {
  const report = activeInspectionReport.value
  const items = report?.recognizedItems ?? report?.abnormalItems
  return Array.isArray(items) ? items : []
})

const activeInspectionAdvice = computed(() => {
  const report = activeInspectionReport.value
  const advice = report?.analysisAdvice ?? report?.adviceItems
  return Array.isArray(advice) ? advice.filter((item) => takeOptionalText(item)) : []
})

const getInspectionAnalysisStatusNumber = (status: unknown) => {
  const statusNumber = Number(status)
  return Number.isFinite(statusNumber) ? statusNumber : 0
}

const activeInspectionAnalysisStatus = computed(() => {
  return getInspectionAnalysisStatusNumber(activeInspectionReport.value?.analysisStatus)
})

const inspectionAnalysisStatusText = computed(() => {
  const statusTextMap: Record<number, string> = {
    0: t('doctorVideo.consultation.inspectionAnalysisNotSubmitted'),
    1: t('doctorVideo.consultation.inspectionAnalysisPending'),
    2: t('doctorVideo.consultation.inspectionAnalysisProcessing'),
    3: t('doctorVideo.consultation.inspectionAnalysisSuccess'),
    4: t('doctorVideo.consultation.inspectionAnalysisFailed')
  }
  return statusTextMap[activeInspectionAnalysisStatus.value] || statusTextMap[0]
})

const activeInspectionAnalysisError = computed(() => {
  return takeOptionalText(activeInspectionReport.value?.analysisErrorMsg) || inspectionAnalysisError.value
})

const inspectionAnalysisProgressStatus = computed(() => {
  if (activeInspectionAnalysisStatus.value === 4 || inspectionAnalysisError.value) return 'exception'
  if (activeInspectionAnalysisStatus.value === 3 && inspectionAnalysisProgress.value >= 100) return 'success'
  return undefined
})

const formatInspectionAnalysisProgress = (percentage: number) => `${Math.round(percentage)}%`

const getInspectionItemRowClassName = ({ row }: { row: InspectionRecognizedItem }) => {
  return row.is_abnormal ? 'is-abnormal-row' : ''
}

const selectInspectionReport = (index: number) => {
  selectedInspectionReportIndex.value = index
}

const clearInspectionAnalysisPollTimer = () => {
  if (inspectionAnalysisPollTimer) {
    window.clearTimeout(inspectionAnalysisPollTimer)
    inspectionAnalysisPollTimer = 0
  }
}

const clearInspectionAnalysisProgressTimer = () => {
  if (inspectionAnalysisProgressTimer) {
    window.clearInterval(inspectionAnalysisProgressTimer)
    inspectionAnalysisProgressTimer = 0
  }
}

const stopInspectionAnalysisPolling = () => {
  inspectionAnalysisPollRequestId += 1
  clearInspectionAnalysisPollTimer()
  clearInspectionAnalysisProgressTimer()
  inspectionAnalysisPolling.value = false
}

const finishInspectionAnalysisPolling = () => {
  clearInspectionAnalysisPollTimer()
  clearInspectionAnalysisProgressTimer()
  inspectionAnalysisPolling.value = false
}

const startInspectionAnalysisProgress = () => {
  clearInspectionAnalysisProgressTimer()
  inspectionAnalysisProgressTimer = window.setInterval(() => {
    if (!inspectionAnalysisPolling.value) return

    const currentProgress = inspectionAnalysisProgress.value
    const remainingProgress = inspectionAnalysisProgressCeiling - currentProgress
    if (remainingProgress <= 0.1) return

    const step =
      currentProgress < 30
        ? 1.2
        : currentProgress < 60
          ? 0.8
          : currentProgress < 80
            ? 0.45
            : 0.18

    inspectionAnalysisProgress.value = Number(
      Math.min(
        inspectionAnalysisProgressCeiling,
        currentProgress + step,
        currentProgress + remainingProgress * 0.08
      ).toFixed(1)
    )
  }, 450)
}

const replaceInspectionReports = (reports: InspectionReportItem[]) => {
  const activeReport = activeInspectionReport.value
  const activeReportId = takeOptionalText(activeReport?.reportId)
  const activeFileUrl = takeOptionalText(activeReport?.fileUrl)

  inspectionReportList.value = reports

  const matchedIndex = reports.findIndex((report) => {
    if (activeReportId) return takeOptionalText(report.reportId) === activeReportId
    return Boolean(activeFileUrl) && takeOptionalText(report.fileUrl) === activeFileUrl
  })

  selectedInspectionReportIndex.value = matchedIndex >= 0
    ? matchedIndex
    : Math.min(selectedInspectionReportIndex.value, Math.max(reports.length - 1, 0))
}

const resolveInspectionAnalysisState = (reports: InspectionReportItem[]) => {
  const statuses = reports.map((report) => getInspectionAnalysisStatusNumber(report.analysisStatus))
  const failedReport = reports.find((report) => getInspectionAnalysisStatusNumber(report.analysisStatus) === 4)

  if (failedReport) {
    return {
      state: 'failed' as const,
      error: takeOptionalText(failedReport.analysisErrorMsg) || t('doctorVideo.consultation.inspectionAnalysisFailedMessage')
    }
  }

  if (reports.length > 0 && statuses.every((status) => status === 3)) {
    return { state: 'success' as const, error: '' }
  }

  if (statuses.some((status) => status === 1 || status === 2)) {
    inspectionAnalysisProgressCeiling = statuses.some((status) => status === 2) ? 94 : 72
    return { state: 'polling' as const, error: '' }
  }

  return { state: 'idle' as const, error: '' }
}

const pollInspectionAnalysis = async (batchId: string | number, requestId: number) => {
  try {
    const response = await getInspectionBatchByBatchId(batchId)
    if (requestId !== inspectionAnalysisPollRequestId) return

    const reports = Array.isArray(response?.data) ? response.data : []
    if (reports.length) {
      replaceInspectionReports(reports)
    }
    const analysisState = resolveInspectionAnalysisState(
      reports.length ? reports : inspectionReportList.value
    )

    if (analysisState.state === 'success') {
      finishInspectionAnalysisPolling()
      inspectionAnalysisProgress.value = 100
      inspectionAnalysisError.value = ''
      return
    }

    if (analysisState.state === 'failed') {
      finishInspectionAnalysisPolling()
      inspectionAnalysisProgress.value = 100
      inspectionAnalysisError.value = analysisState.error
      return
    }

    if (analysisState.state === 'idle') {
      finishInspectionAnalysisPolling()
      inspectionAnalysisProgress.value = 0
      inspectionAnalysisError.value = ''
      return
    }

    inspectionAnalysisError.value = ''
    clearInspectionAnalysisPollTimer()
    inspectionAnalysisPollTimer = window.setTimeout(() => {
      void pollInspectionAnalysis(batchId, requestId)
    }, 3000)
  } catch (error) {
    if (requestId !== inspectionAnalysisPollRequestId) return

    console.warn('Failed to poll inspection analysis.', error)
    finishInspectionAnalysisPolling()
    inspectionAnalysisProgress.value = 100
    inspectionAnalysisError.value = t('doctorVideo.consultation.inspectionReportLoadFailed')
  }
}

const startInspectionAnalysisPolling = (batchId: string | number) => {
  stopInspectionAnalysisPolling()
  const requestId = ++inspectionAnalysisPollRequestId
  inspectionAnalysisPolling.value = true
  inspectionAnalysisProgress.value = Math.max(inspectionAnalysisProgress.value, 8)
  inspectionAnalysisError.value = ''
  startInspectionAnalysisProgress()
  inspectionAnalysisPollTimer = window.setTimeout(() => {
    void pollInspectionAnalysis(batchId, requestId)
  }, 3000)
}

const closeInspectionReportDialog = () => {
  inspectionReportVisible.value = false
  stopInspectionAnalysisPolling()
}

const handleInspectionReportView = async () => {
  if (!caseId.value) {
    ElMessage.warning(t('doctorVideo.consultation.diagnosisCaseUnavailable'))
    return
  }

  const requestId = ++inspectionReportRequestId
  inspectionReportLoading.value = true
  stopInspectionAnalysisPolling()
  inspectionAnalysisProgress.value = 0
  inspectionAnalysisError.value = ''

  try {
    const response = await getInspectionBatchByCaseId(caseId.value)
    if (requestId !== inspectionReportRequestId) return

    const reports = Array.isArray(response?.data) ? response.data : []
    inspectionReportList.value = reports
    selectedInspectionReportIndex.value = 0
    inspectionReportVisible.value = true

    const analysisState = resolveInspectionAnalysisState(reports)
    if (analysisState.state === 'success') {
      inspectionAnalysisProgress.value = 100
    } else if (analysisState.state === 'failed') {
      inspectionAnalysisProgress.value = 100
      inspectionAnalysisError.value = analysisState.error
    } else if (analysisState.state === 'polling') {
      const batchId = reports.map((report) => takeOptionalText(report.batchId)).find(Boolean)
      if (batchId) {
        startInspectionAnalysisPolling(batchId)
      }
    }
  } catch (error) {
    if (requestId !== inspectionReportRequestId) return

    console.warn('Failed to load inspection reports.', error)
    ElMessage.warning(t('doctorVideo.consultation.inspectionReportLoadFailed'))
  } finally {
    if (requestId === inspectionReportRequestId) {
      inspectionReportLoading.value = false
    }
  }
}

const onSubmitDiagnosis = () => {
  if (!diagnosisFormRef.value) return
  diagnosisFormRef.value.validate(async (valid) => {
    if (valid) {
      if (!caseId.value) {
        ElMessage.warning(t('doctorVideo.consultation.diagnosisCaseUnavailable'))
        return
      }
      const submitCaseId = Number(caseId.value)
      if (!Number.isFinite(submitCaseId)) {
        ElMessage.warning(t('doctorVideo.consultation.diagnosisCaseUnavailable'))
        return
      }
      submittingDiagnosis.value = true
      try {
        const caseDrugDetailPayload = buildCaseDrugDetailPayload(submitCaseId)
        if (!caseDrugDetailPayload) {
          ElMessage.warning(t('doctorVideo.consultation.prescriptionRequired'))
          return
        }

        await saveCaseDrugDetail(caseDrugDetailPayload)
        await submitDiagnosis({
          caseId: submitCaseId,
          ...(doctorAideId.value ? { doctorAideId: doctorAideId.value } : {}),
          diseaseNameCn: diagnosisForm.value.diseaseNameCn,
          syndromeTypeCn: diagnosisForm.value.syndromeTypeCn,
          therapyCn: buildPrescriptionContent(),
          adviceCn: diagnosisForm.value.adviceCn,
          mainSuitCn: outpatientRecordForm.chiefComplaint,
          historyIllnessCn: outpatientRecordForm.currentHistory,
          previousHistoryCn: outpatientRecordForm.pastHistory,
          allergichistoryCn: outpatientRecordForm.allergyHistory,
          familyhistoryCn: outpatientRecordForm.familyHistory
        })
        ElMessage.success(t('doctorVideo.consultation.submitDiagnosisSuccess'))
        await leaveConsultation()
      } catch (error) {
        ElMessage.error(t('doctorVideo.consultation.submitDiagnosisFailed'))
      } finally {
        submittingDiagnosis.value = false
      }
    }
  })
}

const buildSubtitleSaveKey = (item: SubtitleTimelineItem) => {
  if (item.beginTime > 0) {
    return `${item.speakerId}_${item.sourceLanguage}_begin_${item.beginTime}`
  }

  if (item.sentenceIndex >= 0) {
    return `${item.speakerId}_${item.sourceLanguage}_sentence_${item.sentenceIndex}`
  }

  return `${item.speakerId}_${item.sourceLanguage}_item_${item.id}`
}

const resolveSubtitleSavePayload = (item: SubtitleTimelineItem) => {
  const sourceText = item.sourceText.trim()
  const translatedText = item.translatedText.trim()

  if (!subtitleTranslationEnabled.value) {
    if (!item.sourceFinal || !sourceText) {
      return null
    }

    return {
      recordCn: sourceText,
      recordLo: ''
    }
  }

  if (!item.sourceFinal || !item.translatedFinal || !sourceText || !translatedText) {
    return null
  }

  if (item.sourceLanguage === 'cn') {
    return {
      recordCn: sourceText,
      recordLo: translatedText
    }
  }

  if (item.sourceLanguage === 'lo') {
    return {
      recordCn: translatedText,
      recordLo: sourceText
    }
  }

  return null
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  const normalizedValue = String(value).trim()
  return normalizedValue || ''
}

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':')
}

const parseVideoTime = (value: unknown) => {
  if (value === null || value === undefined) {
    return Number.NaN
  }

  return Date.parse(String(value))
}

const resolveVideoDurationMs = (value: unknown) => {
  if (!isObjectRecord(value)) {
    return 0
  }

  const startTime = parseVideoTime(value.videoStartTime)
  const currentTime = parseVideoTime(value.newDate)
  if (!Number.isFinite(startTime) || !Number.isFinite(currentTime)) {
    return 0
  }

  return Math.max(0, currentTime - startTime)
}

const syncConsultationDuration = () => {
  consultationDuration.value = formatDuration(Date.now() - durationStartedAt)
}

const clearConsultationDurationTimer = () => {
  if (durationTimer) {
    window.clearInterval(durationTimer)
    durationTimer = 0
  }
}

const stopConsultationDuration = () => {
  durationRequestId += 1
  durationStartedAt = 0
  consultationDuration.value = '00:00:00'
  clearConsultationDurationTimer()
}

const startConsultationDuration = async (resolvedVideoId: string) => {
  durationRequestId += 1
  const currentRequestId = durationRequestId
  clearConsultationDurationTimer()
  durationStartedAt = Date.now()
  consultationDuration.value = '00:00:00'
  durationTimer = window.setInterval(syncConsultationDuration, 1000)

  if (!resolvedVideoId) {
    return
  }

  try {
    const response = await getVideoTime(resolvedVideoId)
    if (currentRequestId !== durationRequestId) {
      return
    }

    durationStartedAt = Date.now() - resolveVideoDurationMs(response?.data)
    syncConsultationDuration()
  } catch (error) {
    console.warn('Failed to load doctor consultation video duration.', error)
  }
}

const takeOptionalTimestamp = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value < 1_000_000_000_000 ? value * 1000 : value
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value)

    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue
    }

    const parsedTimestamp = new Date(value).getTime()
    if (Number.isFinite(parsedTimestamp) && parsedTimestamp > 0) {
      return parsedTimestamp
    }
  }

  return 0
}

const resolveTextFromUnknown = (value: unknown, depth = 0): string => {
  if (depth > 3) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolvedText = resolveTextFromUnknown(item, depth + 1)
      if (resolvedText) {
        return resolvedText
      }
    }
    return ''
  }

  if (!isObjectRecord(value)) {
    return ''
  }

  const candidateKeys = [
    'contentLo',
    'translatedText',
    'translation',
    'lo',
    'lao',
    'result',
    'value',
    'text'
  ]

  for (const key of candidateKeys) {
    const resolvedText = resolveTextFromUnknown(value[key], depth + 1)
    if (resolvedText) {
      return resolvedText
    }
  }

  for (const nestedValue of Object.values(value)) {
    const resolvedText = resolveTextFromUnknown(nestedValue, depth + 1)
    if (resolvedText) {
      return resolvedText
    }
  }

  return ''
}

const resolveTranslationText = (payload: unknown) => {
  const translatedText = resolveTextFromUnknown(payload)

  if (!translatedText) {
    throw new Error('Missing translated text from response.')
  }

  return translatedText
}

const resolveHistoryMessageType = (
  record: Record<string, unknown>,
  fallbackType?: ConsultationMessageType
): ConsultationMessageType => {
  const explicitType = takeOptionalText(record.messageType || record.type || record.recordType).toLowerCase()

  if (explicitType.includes('manual') || explicitType.includes('chat') || explicitType.includes('written') || explicitType.includes('text')) {
    return 'manual'
  }

  if (explicitType.includes('subtitle') || explicitType.includes('record')) {
    return 'subtitle'
  }

  if (record.contentCn !== undefined || record.contentLo !== undefined) {
    return 'manual'
  }

  if (record.recordCn !== undefined || record.recordLo !== undefined) {
    return 'subtitle'
  }

  return fallbackType || 'subtitle'
}

const resolveHistoryDoctorFlag = (record: Record<string, unknown>): 0 | 1 | 2 | null => {
  const directValue = record.isDoctor ?? record.is_doctor ?? record.fromDoctor ?? record.doctor

  if (typeof directValue === 'number') {
    return directValue === 0 || directValue === 1 || directValue === 2 ? directValue : null
  }

  if (typeof directValue === 'boolean') {
    return directValue ? 0 : 1
  }

  if (typeof directValue === 'string') {
    const normalizedValue = directValue.trim().toLowerCase()

    if (normalizedValue === '0' || normalizedValue === 'doctor' || normalizedValue === 'self' || normalizedValue === 'true') {
      return 0
    }

    if (normalizedValue === '1' || normalizedValue === 'patient' || normalizedValue === 'remote' || normalizedValue === 'false') {
      return 1
    }

    if (normalizedValue === '2' || normalizedValue === 'aide' || normalizedValue === 'assistant') {
      return 2
    }
  }

  const roleValue = takeOptionalText(record.role || record.speakerRole || record.senderRole).toLowerCase()

  if (roleValue.includes('doctor')) {
    return 0
  }

  if (roleValue.includes('patient')) {
    return 1
  }

  if (roleValue.includes('aide') || roleValue.includes('assistant')) {
    return 2
  }

  return null
}

const resolveHistoryTexts = (record: Record<string, unknown>) => {
  let contentCn =
    takeOptionalText(record.contentCn) ||
    takeOptionalText(record.recordCn) ||
    takeOptionalText(record.cn)
  let contentLo =
    takeOptionalText(record.contentLo) ||
    takeOptionalText(record.recordLo) ||
    takeOptionalText(record.lo)

  if (contentCn && contentLo) {
    return {
      contentCn,
      contentLo
    }
  }

  const sourceText = takeOptionalText(record.sourceText)
  const translatedText = takeOptionalText(record.translatedText)
  const sourceLanguage = takeOptionalText(record.sourceLanguage).toLowerCase()
  const targetLanguage = takeOptionalText(record.targetLanguage).toLowerCase()

  if (sourceText && translatedText) {
    if (sourceLanguage === 'cn' || sourceLanguage === 'zh' || sourceLanguage === 'zh-cn') {
      contentCn = sourceText
      contentLo = translatedText
    } else if (sourceLanguage === 'lo' || sourceLanguage === 'lao') {
      contentCn = translatedText
      contentLo = sourceText
    } else if (targetLanguage === 'cn' || targetLanguage === 'zh' || targetLanguage === 'zh-cn') {
      contentCn = translatedText
      contentLo = sourceText
    } else if (targetLanguage === 'lo' || targetLanguage === 'lao') {
      contentCn = sourceText
      contentLo = translatedText
    }
  } else if (sourceText && !translatedText) {
    if (sourceLanguage === 'lo' || sourceLanguage === 'lao') {
      contentLo = sourceText
    } else {
      contentCn = sourceText
    }
  }

  return {
    contentCn,
    contentLo
  }
}

const normalizeHistoryItem = (
  rawItem: unknown,
  sequence: number,
  fallbackType?: ConsultationMessageType
): ConsultationHistoryItem | null => {
  if (!isObjectRecord(rawItem)) {
    return null
  }

  const { contentCn, contentLo } = resolveHistoryTexts(rawItem)
  const isDoctor = resolveHistoryDoctorFlag(rawItem)

  if ((!contentCn && !contentLo) || isDoctor === null) {
    return null
  }

  return {
    messageType: resolveHistoryMessageType(rawItem, fallbackType),
    isDoctor,
    contentCn,
    contentLo,
    timestamp:
      takeOptionalTimestamp(
        rawItem.timestamp ||
          rawItem.createTime ||
          rawItem.createdAt ||
          rawItem.updateTime ||
          rawItem.beginTime ||
          rawItem.anchorTimestamp
      ) || 0,
    sequence
  }
}

const collectHistoryItems = (
  payload: unknown,
  sequenceOffset = 0,
  fallbackType?: ConsultationMessageType
): ConsultationHistoryItem[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => normalizeHistoryItem(item, sequenceOffset + index, fallbackType))
      .filter((item): item is ConsultationHistoryItem => Boolean(item))
  }

  if (!isObjectRecord(payload)) {
    return []
  }

  const groups: Array<{ items: unknown[]; type?: ConsultationMessageType }> = []
  const subtitleKeys = [
    'subtitleList',
    'subtitles',
    'subtitleRecords',
    'videoRecordList',
    'videoRecords',
    'recordList',
    'records'
  ]
  const manualKeys = [
    'writtenList',
    'writtenRecords',
    'chatList',
    'chatRecords',
    'conversationList',
    'conversations',
    'messageList',
    'messages'
  ]

  subtitleKeys.forEach((key) => {
    if (Array.isArray(payload[key])) {
      groups.push({
        items: payload[key] as unknown[],
        type: 'subtitle'
      })
    }
  })

  manualKeys.forEach((key) => {
    if (Array.isArray(payload[key])) {
      groups.push({
        items: payload[key] as unknown[],
        type: 'manual'
      })
    }
  })

  if (groups.length > 0) {
    let nextSequence = sequenceOffset
    return groups.flatMap((group) => {
      const items = collectHistoryItems(group.items, nextSequence, group.type)
      nextSequence += group.items.length
      return items
    })
  }

  if (Array.isArray(payload.data)) {
    return collectHistoryItems(payload.data, sequenceOffset, fallbackType)
  }

  if (isObjectRecord(payload.data)) {
    return collectHistoryItems(payload.data, sequenceOffset, fallbackType)
  }

  const fallbackListKey = ['list', 'rows', 'items'].find((key) => Array.isArray(payload[key]))
  if (fallbackListKey) {
    return collectHistoryItems(payload[fallbackListKey], sequenceOffset, fallbackType)
  }

  const singleItem = normalizeHistoryItem(payload, sequenceOffset, fallbackType)
  return singleItem ? [singleItem] : []
}

const normalizeConversationHistory = (payload: unknown) => {
  const normalizedItems = collectHistoryItems(payload)

  if (!normalizedItems.length) {
    return []
  }

  const fallbackBaseTimestamp = Date.now() - normalizedItems.length * 1000

  return normalizedItems
    .map((item, index) => ({
      ...item,
      timestamp: item.timestamp || fallbackBaseTimestamp + index
    }))
    .sort((left, right) => {
      const timestampDelta = left.timestamp - right.timestamp

      if (timestampDelta !== 0) {
        return timestampDelta
      }

      return left.sequence - right.sequence
    })
}

const appendConversationHistory = (items: ConsultationHistoryItem[]) => {
  items.forEach((item) => {
    const doctorMessage = item.isDoctor === 0
    const aideMessage = item.isDoctor === 2
    const sourceText = translationEnabled.value
      ? doctorMessage ? item.contentCn : item.contentLo
      : item.contentCn || item.contentLo
    const translatedText = translationEnabled.value
      ? doctorMessage ? item.contentLo : item.contentCn
      : subtitleTranslationEnabled.value ? item.contentLo : ''
    timeline.appendHistoryMessage({
      speakerId: doctorMessage
        ? doctorId.value || 'doctor'
        : aideMessage
          ? `aide:${doctorAideId.value || 'aide'}`
          : `patient:${patientId.value || 'patient'}`,
      speakerName: doctorMessage
        ? doctorName.value
        : aideMessage
          ? t('doctorVideo.consultation.aideFallbackName')
          : patientName.value,
      side: doctorMessage ? 'self' : 'remote',
      messageType: item.messageType,
      sourceText,
      translatedText,
      sourceLanguage: translationEnabled.value ? doctorMessage ? 'cn' : 'lo' : 'cn',
      targetLanguage: translationEnabled.value ? doctorMessage ? 'lo' : 'cn' : subtitleTranslationEnabled.value ? 'lo' : 'cn',
      timestamp: item.timestamp
    })
  })
}

const loadConversationHistory = async (resolvedVideoId: string) => {
  if (!isContinueConsultation.value || !resolvedVideoId) {
    return
  }

  try {
    const historyResponse = await getVideoConversation(resolvedVideoId)
    const historyItems = normalizeConversationHistory(historyResponse?.data)

    if (!historyItems.length) {
      return
    }

    appendConversationHistory(historyItems)
  } catch (error) {
    console.warn('Failed to load doctor consultation conversation history.', error)
    ElMessage.warning(t('doctorVideo.consultation.historyLoadFailed'))
  }
}

const persistConsultationVideoId = (nextVideoId: string) => {
  if (!nextVideoId) {
    return
  }

  persistConsultationContext({
    videoId: nextVideoId
  })
}

const handleSubtitleFinalized = (item: SubtitleTimelineItem) => {
  const resolvedVideoId = videoId.value
  const currentUserId = session.channelContext.value?.userId || doctorId.value
  const payload = resolveSubtitleSavePayload(item)

  if (!resolvedVideoId || !payload || !currentUserId || item.speakerId !== currentUserId) {
    return
  }

  const saveKey = buildSubtitleSaveKey(item)
  if (savedSubtitleKeys.has(saveKey)) {
    return
  }

  savedSubtitleKeys.add(saveKey)
  void saveSubtitle({
    videoId: resolvedVideoId,
    isDoctor: 0,
    ...payload
  }).catch((error) => {
    console.warn('Failed to save doctor subtitle record.', error)
  })
}

const timeline = useDoctorSubtitleTimeline({
  getCurrentUserId: () => session.channelContext.value?.userId || doctorId.value,
  getCurrentUserName: () => doctorName.value,
  getRemoteUsers: () => session.allUsers.value.filter((item) => item.userId !== doctorId.value),
  getTranslationEnabled: () => subtitleTranslationEnabled.value,
  onFinalizedItem: handleSubtitleFinalized
})

const chat = createDoctorConsultationChatService({
  onMessage: ({ contentCn, contentLo, role }) => {
    const resolvedPatientId = patientId.value || 'patient'
    const sender =
      role === 0
        ? {
            speakerId: doctorId.value || 'doctor',
            speakerName: doctorName.value,
            side: 'self' as const
          }
        : role === 2
          ? {
              speakerId: `aide:${doctorAideId.value || 'aide'}`,
              speakerName: t('doctorVideo.consultation.aideFallbackName'),
              side: 'remote' as const
            }
          : {
              speakerId: `patient:${resolvedPatientId}`,
              speakerName: patientName.value,
              side: 'remote' as const
            }

    timeline.appendManualMessage({
      ...sender,
      sourceText: translationEnabled.value ? contentLo : contentCn || contentLo,
      translatedText: translationEnabled.value ? contentCn : manualChatTranslationEnabled.value ? contentLo : '',
      sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
      targetLanguage: translationEnabled.value ? 'cn' : manualChatTranslationEnabled.value ? 'lo' : 'cn'
    })
  },
  onError: (error) => {
    console.warn('Doctor consultation chat websocket error.', error)
  }
})

const chatInputDisabled = computed(() => false)
const chatSendDisabled = computed(() => {
  return (
    chatSending.value ||
    !chatDraft.value.trim() ||
    !patientId.value ||
    !doctorAideId.value ||
    !caseId.value ||
    chat.connectionStatus.value !== 'connected'
  )
})

const chatStatusText = computed(() => {
  if (!patientId.value) {
    return t('doctorVideo.consultation.chatPatientUnavailable')
  }

  if (!doctorAideId.value) {
    return t('doctorVideo.consultation.chatUnavailable')
  }

  if (!caseId.value) {
    return t('doctorVideo.consultation.chatCaseUnavailable')
  }

  if (chat.connectionStatus.value === 'connecting') {
    return t('doctorVideo.consultation.chatConnecting')
  }

  if (chat.connectionStatus.value === 'connected') {
    return t('doctorVideo.consultation.chatConnected')
  }

  return t('doctorVideo.consultation.chatUnavailable')
})

const connectConsultationChat = async () => {
  try {
    await chat.connect()
  } catch (error) {
    console.warn('Failed to connect doctor consultation chat websocket.', error)
    ElMessage.warning(t('doctorVideo.consultation.chatConnectFailed'))
  }
}

const refreshCameraDevices = async () => {
  try {
    await session.loadCameraDevices()
  } catch (error) {
    console.warn('Failed to load doctor camera devices.', error)
    ElMessage.warning(t('doctorVideo.consultation.cameraLoadFailed'))
  }
}

const requestInitialCameraSelection = async () => {
  await refreshCameraDevices()

  if (session.rememberedCameraAvailable.value && session.selectedCameraId.value) {
    return session.selectedCameraId.value
  }

  cameraDialogRequired.value = true
  cameraDialogVisible.value = true

  return new Promise<string>((resolve) => {
    pendingInitialCameraSelection = resolve
  })
}

const openCameraSwitchDialog = async () => {
  cameraDialogRequired.value = false
  cameraDialogVisible.value = true
  await refreshCameraDevices()
}

const handleCameraSelectionConfirm = async (deviceId: string) => {
  if (cameraDialogRequired.value) {
    session.selectCamera(deviceId)
    pendingInitialCameraSelection?.(deviceId)
    pendingInitialCameraSelection = null
    cameraDialogVisible.value = false
    cameraDialogRequired.value = false
    return
  }

  try {
    await session.switchCamera(deviceId)
    cameraDialogVisible.value = false
    ElMessage.success(t('doctorVideo.consultation.cameraSwitchSuccess'))
  } catch (error) {
    console.warn('Failed to switch doctor camera.', error)
    ElMessage.warning(t('doctorVideo.consultation.cameraSwitchFailed'))
  }
}

const handleChatInput = (value: string) => {
  chatDraft.value = value
}

const appendLocalManualMessage = (payload: ConsultationChatPayload) => {
  const currentUserId = session.channelContext.value?.userId || doctorId.value || 'doctor'
  timeline.appendManualMessage({
    speakerId: currentUserId,
    speakerName: doctorName.value,
    side: 'self',
    sourceText: payload.contentCn,
    translatedText: manualChatTranslationEnabled.value ? payload.contentLo : '',
    sourceLanguage: 'cn',
    targetLanguage: manualChatTranslationEnabled.value ? 'lo' : 'cn'
  })
}

const handleChatSend = async () => {
  const normalizedText = chatDraft.value.trim()

  if (!normalizedText) {
    ElMessage.warning(t('doctorVideo.consultation.chatInputRequired'))
    return
  }

  if (!patientId.value) {
    ElMessage.warning(t('doctorVideo.consultation.chatPatientUnavailable'))
    return
  }

  if (!doctorAideId.value) {
    ElMessage.warning(t('doctorVideo.consultation.chatUnavailable'))
    return
  }

  if (!caseId.value) {
    ElMessage.warning(t('doctorVideo.consultation.chatCaseUnavailable'))
    return
  }

  if (chat.connectionStatus.value !== 'connected') {
    ElMessage.warning(t('doctorVideo.consultation.chatUnavailable'))
    return
  }

  chatDraft.value = ''
  chatSending.value = true

  try {
    const contentLo = manualChatTranslationEnabled.value
      ? resolveTranslationText((await translateConsultationText({
          source: 'cn',
          to: 'lo',
          text: normalizedText
        }))?.data)
      : ''
    const payload = {
      contentCn: normalizedText,
      contentLo
    }

    appendLocalManualMessage(payload)

    const [sendResult, saveResult] = await Promise.allSettled([
      chat.sendTranslatedMessage({
        patientId: patientId.value,
        doctorAideId: doctorAideId.value,
        role: 0,
        ...payload
      }),
      addWrittenRecord({
        caseId: caseId.value,
        isDoctor: 0,
        contentCn: normalizedText,
        contentLo
      })
    ])

    if (sendResult.status === 'rejected') {
      console.warn('Failed to send doctor consultation chat websocket message.', sendResult.reason)
      ElMessage.warning(t('doctorVideo.consultation.chatSendFailed'))
    }

    if (saveResult.status === 'rejected') {
      console.warn('Failed to save doctor consultation manual chat record.', saveResult.reason)
      ElMessage.warning(t('doctorVideo.consultation.chatSaveFailed'))
    }
  } catch (error) {
    console.warn('Failed to translate doctor consultation chat message.', error)
    if (!chatDraft.value) {
      chatDraft.value = normalizedText
    }
    ElMessage.warning(t('doctorVideo.consultation.chatTranslateFailed'))
  } finally {
    chatSending.value = false
  }
}

const goBackToWorkbench = async () => {
  await router.replace('/workbench')
}

const bootstrapConsultation = async () => {
  if (!doctorId.value || !roomId.value) {
    pageError.value = t('doctorVideo.consultation.missingParams')
    return
  }

  const initialCameraId = await requestInitialCameraSelection()
  await session.prepareLocalTracks(initialCameraId)

  try {
    const primaryChannelId = `${roomId.value}_cn`
    const secondaryChannelId = `${roomId.value}_lo`
    const videoIdPromise = caseId.value
      ? getVideoId(caseId.value)
          .then((response) => {
            if (response?.data === null || response?.data === undefined) {
              return ''
            }

            const nextVideoId = String(response.data).trim()
            persistConsultationVideoId(nextVideoId)
            return nextVideoId
          })
          .catch((error) => {
            console.warn('Failed to get doctor consultation videoId before entering the room.', error)
            return ''
          })
      : Promise.resolve(videoId.value || '')
    const [primaryResponse, secondaryResponse, resolvedVideoId] = await Promise.all([
      getVideoToken({
        channelId: primaryChannelId,
        userId: doctorId.value
      }),
      translationEnabled.value
        ? getVideoToken({
            channelId: secondaryChannelId,
            userId: doctorId.value
          })
        : Promise.resolve(null),
      videoIdPromise
    ])

    const token =
      primaryResponse?.data !== null && primaryResponse?.data !== undefined
        ? String(primaryResponse.data)
        : ''
    const secondaryToken =
      secondaryResponse?.data !== null && secondaryResponse?.data !== undefined
        ? String(secondaryResponse.data)
        : ''

    if (!token || (translationEnabled.value && !secondaryToken)) {
      throw new Error(t('doctorVideo.consultation.joinFailed'))
    }

    await session.enterConsultationRoom({
      appId: RTC_APP_ID,
      appKey: RTC_APP_KEY,
      userId: doctorId.value,
      channelName: roomId.value,
      userName: doctorName.value,
      token,
      secondaryToken,
      language: 'cn',
      translationEnabled: translationEnabled.value,
      subtitleTranslationEnabled: subtitleTranslationEnabled.value
    })

    const resolvedConsultationVideoId = takeOptionalText(resolvedVideoId) || videoId.value
    void startConsultationDuration(resolvedConsultationVideoId)
    await loadConversationHistory(resolvedConsultationVideoId)
    await connectConsultationChat()
    timeline.bindAsrStreams(session.subtitleBindings.value)
    await session.bootstrapSubtitle({ taskPolicy: isContinueConsultation.value ? 'auto' : 'skip' })
  } catch (error) {
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : t('doctorVideo.consultation.joinFailed')
  }
}

const retrySubtitle = async () => {
  const taskPolicy = isContinueConsultation.value ? 'auto' : 'skip'
  await session.stopSubtitleTasks(taskPolicy)
  await session.cleanupSubtitle()
  timeline.bindAsrStreams(session.subtitleBindings.value)
  await session.bootstrapSubtitle({ taskPolicy })
}

const leaveConsultation = async () => {
  savedSubtitleKeys.clear()
  stopConsultationDuration()
  chatDraft.value = ''
  pendingInitialCameraSelection = null
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom({ taskPolicy: isContinueConsultation.value ? 'auto' : 'skip' })
  await goBackToWorkbench()
}

const handleLeave = async () => {
  if (leavingInProgress) {
    return
  }

  leavingInProgress = true
  const confirmed = await showConfirmDialog({
    title: t('doctorVideo.consultation.leaveConfirmTitle'),
    message: t('doctorVideo.consultation.leaveConfirmMessage'),
    description: t('doctorVideo.consultation.leaveConfirmDescription'),
    cancelText: t('doctorVideo.consultation.leaveConfirmCancel'),
    confirmText: t('doctorVideo.consultation.leaveConfirmConfirm'),
    type: 'danger',
    icon: 'warning'
  })

  if (!confirmed) {
    leavingInProgress = false
    return
  }

  try {
    await leaveConsultation()
  } finally {
    leavingInProgress = false
  }
}

onMounted(async () => {
  loadConsultationContext()
  syncOutpatientRecordForm()
  void loadPrescriptionUnitDict()
  void fetchHistoryCaseList()
  await bootstrapConsultation()
})

watch([patientId, caseId], () => {
  void fetchHistoryCaseList()
})

onBeforeUnmount(async () => {
  stopInspectionAnalysisPolling()
  window.clearTimeout(prescriptionSearchTimer)
  stopConsultationDuration()
  savedSubtitleKeys.clear()
  chatDraft.value = ''
  pendingInitialCameraSelection = null
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom({ taskPolicy: isContinueConsultation.value ? 'auto' : 'skip' })
})
</script>

<style scoped lang="scss">
.doctor-consultation-page {
  height: 100%;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(109, 180, 255, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(241, 246, 252, 0.95) 0%, rgba(248, 251, 255, 0.98) 100%);
}

.consultation-layout {
  display: grid;
  grid-template-columns: 370px minmax(0, 1fr) 360px;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.subtitle-column {
  min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(77, 103, 154, 0.08);
}

.video-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

.featured-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 14px 14px 110px;
  border: 1.5px solid rgba(53, 118, 242, 0.92);
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: 0 6px 20px rgba(80, 104, 150, 0.08);
  overflow: hidden;
}

.stage-pill {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.96);
  color: #233a64;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(76, 100, 145, 0.12);
}

.stage-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2fca68;
  box-shadow: 0 0 0 3px rgba(47, 202, 104, 0.14);
}

.connection-banner {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 6;
  transform: translateX(-50%);
  max-width: calc(100% - 314px);
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255, 241, 241, 0.96);
  color: #c54949;
  font-size: 12px;
  font-weight: 700;
}

.preview-row {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 5;
  display: grid;
  grid-template-columns: minmax(226px, 270px);
  gap: 8px;
  width: min(270px, calc(100% - 314px));
}

.preview-row :deep(.consult-participant-card) {
  width: 100%;
  cursor: pointer;
}

.featured-card {
  height: 100%;
}

.featured-caption {
  position: absolute;
  left: 50%;
  bottom: 104px;
  z-index: 4;
  transform: translateX(-50%);
  border-radius: 999px;
  padding: 6px 14px;
  background: rgba(74, 78, 89, 0.72);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.stage-controls {
  position: absolute;
  left: 50%;
  bottom: 14px;
  z-index: 5;
  transform: translateX(-50%);
}

.session-summary {
  border: 1px solid #d7e4f7;
  border-radius: 10px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #edf4ff 0%, #eef6ff 100%);
}

.doctor-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.doctor-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: block;
  object-fit: cover;
}

.doctor-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.doctor-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.doctor-heading strong {
  color: #22365d;
  font-size: 15px;
  font-weight: 800;
}

.doctor-status {
  color: #24a35c;
  font-size: 12px;
  font-weight: 700;
}

.doctor-copy p {
  margin: 0;
  color: #5f7395;
  font-size: 13px;
}

.doctor-good-at {
  max-width: min(520px, 46vw);
  line-height: 1.5;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doctor-good-at span {
  color: #22365d;
  font-weight: 800;
}

.record-column {
  min-height: 0;
}

.record-shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 20px rgba(77, 103, 154, 0.08);
  overflow: hidden;
}

.record-tabs {
  padding: 0 12px;
  border-bottom: 1px solid #e6eef8;
}

.record-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 12px 14px;
}

.ai-button {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #3d77f0 0%, #255cdb 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.ai-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.record-section {
  margin-top: 14px;
}

.record-section h3 {
  margin: 0 0 10px;
  color: #f25c35;
  font-size: 15px;
  font-weight: 700;
}

.compact-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  background: #f8fbff;
  border: 1px solid #e2edff;
  border-radius: 8px;
  padding: 10px 12px;
}

.compact-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.compact-label {
  color: #6c7e97;
  font-size: 13px;
  font-weight: 600;
}

.compact-value {
  color: #203351;
  font-size: 13px;
  font-weight: 500;
}

.compact-history-form,
.compact-diagnosis-form {
  background: #f8fbff;
  border: 1px solid #e2edff;
  border-radius: 8px;
  padding: 12px;
}

.compact-history-form :deep(.el-form-item__label),
.compact-diagnosis-form :deep(.el-form-item__label) {
  padding-bottom: 4px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  white-space: normal;
}

.compact-history-form :deep(.el-textarea__inner),
.compact-diagnosis-form :deep(.el-textarea__inner) {
  min-height: 72px;
  line-height: 1.6;
}

.compact-diagnosis-form :deep(.el-input__wrapper),
.compact-history-form :deep(.el-textarea__inner),
.compact-diagnosis-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}

.compact-form-item {
  margin-bottom: 15px;
}

.compact-history-form .compact-form-item:last-child,
.compact-diagnosis-form .compact-form-item:last-child {
  margin-bottom: 0;
}

.prescription-select {
  width: 100%;
}

.prescription-detail-block {
  margin: -6px 0 15px;
}

.prescription-option {
  display: flex;
  align-items: center;
  width: 100%;
}

.prescription-option span:first-child {
  color: #203351;
  font-weight: 600;
}

.prescription-preview {
  margin-top: 10px;
  border: 1px solid #e2edff;
  border-radius: 8px;
  padding: 10px;
  background: #ffffff;
}

.prescription-info-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prescription-info-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 8px;
  color: #203351;
  font-size: 13px;
  line-height: 1.65;
}

.prescription-info-row span {
  color: #6c7e97;
  font-weight: 700;
}

.prescription-info-row p {
  min-width: 0;
  margin: 0;
}

.prescription-info-row--warning,
.prescription-info-row--warning span {
  color: #c47918;
}

.prescription-herbs {
  margin-top: 12px;
}

.prescription-herb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.prescription-herb-header strong {
  color: #203351;
  font-size: 14px;
  font-weight: 800;
}

.prescription-herb-header div {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.prescription-herb-header span {
  color: #6c7e97;
  font-size: 12px;
  font-weight: 700;
}

.prescription-herb-table {
  overflow: hidden;
  border: 1px solid #e2edff;
  border-radius: 8px;
}

.prescription-herb-table :deep(.el-table__header th) {
  background: #eef5ff;
  color: #5d7190;
  font-size: 12px;
  font-weight: 800;
}

.prescription-herb-table :deep(.el-table__cell) {
  padding: 5px 0;
}

.prescription-herb-table :deep(.el-input__wrapper),
.prescription-herb-table :deep(.el-select__wrapper) {
  min-height: 30px;
  border-radius: 6px;
  box-shadow: 0 0 0 1px #dbe8f8 inset;
}

.submit-btn-wrapper {
  margin-top: 12px;
}

.history-case-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-case-card {
  border: 1px solid #e2edff;
  border-radius: 8px;
  background: #f8fbff;
  padding: 10px;
  box-shadow: 0 4px 10px rgba(78, 114, 168, 0.06);
}

.history-case-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.history-case-head strong {
  color: #203351;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
}

.history-case-head span {
  color: #6c7e97;
  font-size: 12px;
  line-height: 1.6;
}

.history-case-diagnosis,
.history-case-therapy {
  margin: 8px 0 0;
  color: #203351;
  font-size: 14px;
  line-height: 1.7;
}

.history-case-therapy {
  margin-top: 2px;
}

.four-diagnosis-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.four-diagnosis-report-card {
  min-height: 64px;
  padding: 10px 16px;
  border: 1px solid #e2edff;
  border-radius: 10px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 4px 14px rgba(78, 114, 168, 0.12);
}

.four-report-main {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.four-report-main .el-icon {
  flex: none;
  color: #ff4b55;
  font-size: 24px;
}

.four-report-main strong {
  min-width: 0;
  color: #203351;
  font-size: 18px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.four-diagnosis-report-card button {
  flex: none;
  min-width: 96px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: #eaf3ff;
  color: #2483ff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.four-diagnosis-report-card button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.four-diagnosis-empty-state {
  flex: 1;
  min-height: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #7f91aa;
}

.four-diagnosis-empty-state .el-icon {
  color: #d4dae2;
  font-size: 84px;
  line-height: 1;
}

.four-diagnosis-empty-state h3 {
  margin: 26px 0 0;
  color: #617693;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.35;
}

.empty-record-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #617693;
  text-align: center;
}

.empty-record-state h3,
.error-card h2 {
  margin: 0;
}

.consultation-error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(420px, 100%);
  padding: 28px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 24px rgba(64, 89, 139, 0.12);
  text-align: center;
}

.error-card p {
  margin: 0;
  color: #647791;
  line-height: 1.7;
}

.error-icon {
  font-size: 34px;
  color: #e15656;
}

.four-pdf-preview-mask {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(15, 23, 42, 0.36);
}

.four-pdf-preview-dialog {
  width: min(1180px, 100%);
  height: min(820px, 92vh);
  min-height: 420px;
  border-radius: 18px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
}

.four-pdf-preview-header {
  flex: none;
  height: 58px;
  padding: 0 14px 0 22px;
  border-bottom: 1px solid #e4edf7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.four-pdf-preview-header h3 {
  min-width: 0;
  margin: 0;
  color: #172033;
  font-size: 20px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.four-pdf-preview-header button {
  flex: none;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #71849a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  cursor: pointer;
}

.four-pdf-preview-header button:hover {
  background: #eef4fb;
  color: #2f66ee;
}

.four-pdf-preview-frame {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #ffffff;
}

.inspection-report-dialog {
  width: min(1480px, calc(100vw - 32px));
  height: min(860px, calc(100vh - 32px));
  border-radius: 10px;
}

.inspection-report-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  background: #ffffff;
}

.inspection-report-body .empty-record-state {
  min-height: 360px;
}

.inspection-report-workspace {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 18px;
  height: 100%;
  min-height: 0;
}

.inspection-report-visual {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.inspection-report-main-image {
  display: flex;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #dfe6f0;
  background: #f7f9fc;
}

.inspection-report-main-image .el-image {
  width: 100%;
  height: 100%;
}

.inspection-report-main-image .el-empty {
  width: 100%;
}

.inspection-report-thumbnails {
  display: flex;
  gap: 8px;
  min-height: 78px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
}

.inspection-report-thumbnail {
  position: relative;
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  overflow: hidden;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  background: #eef2f7;
  color: #607089;
  cursor: pointer;
}

.inspection-report-thumbnail.is-active {
  border-color: #2f6fe4;
}

.inspection-report-thumbnail .el-image {
  width: 100%;
  height: 100%;
}

.inspection-report-content {
  display: grid;
  grid-template-rows: minmax(170px, 0.42fr) minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
  min-height: 0;
}

.inspection-analysis-panel,
.inspection-items-panel {
  min-width: 0;
  min-height: 0;
  border: 1px solid #dfe6f0;
  background: #ffffff;
}

.inspection-analysis-panel {
  overflow: auto;
  padding: 14px 16px;
}

.inspection-items-panel {
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 0 0 12px;
}

.inspection-panel-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.inspection-analysis-panel .inspection-panel-header {
  padding: 0 0 12px;
}

.inspection-panel-header h4 {
  margin: 0;
  color: #203351;
  font-size: 17px;
  font-weight: 800;
}

.inspection-analysis-status {
  flex: 0 0 auto;
  padding: 3px 9px;
  border-radius: 999px;
  background: #eef3fa;
  color: #607089;
  font-size: 12px;
  line-height: 1.5;
}

.inspection-analysis-status.is-status-1,
.inspection-analysis-status.is-status-2 {
  background: #eaf3ff;
  color: #2f6fe4;
}

.inspection-analysis-status.is-status-3 {
  background: #ebf8ef;
  color: #2f8a4b;
}

.inspection-analysis-status.is-status-4 {
  background: #fff0f0;
  color: #d9363e;
}

.inspection-analysis-progress {
  margin-bottom: 12px;
}

.inspection-report-error {
  margin: 0 0 12px;
  color: #d94c4c;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.inspection-report-table {
  flex: 1 1 auto;
  width: calc(100% - 28px);
  margin: 0 14px;
}

.inspection-report-table :deep(.el-table__header th) {
  background: #f4f7fb;
  color: #5d7190;
  font-size: 12px;
  font-weight: 800;
}

.inspection-report-table :deep(.is-abnormal-row .cell) {
  color: #d9363e;
  font-weight: 600;
}

.inspection-report-empty-line {
  margin: 0;
  color: #7f91aa;
  font-size: 13px;
  line-height: 1.7;
}

.inspection-items-panel > .inspection-report-empty-line {
  padding: 0 14px;
}

.inspection-report-advice-list {
  margin: 0;
  padding-left: 20px;
  color: #334967;
  font-size: 14px;
  line-height: 1.8;
}

.inspection-report-advice-list li + li {
  margin-top: 4px;
}

@media (max-width: 1600px) {
  .consultation-layout {
    grid-template-columns: 340px minmax(0, 1fr) 320px;
  }
}

@media (max-width: 1320px) {
  .consultation-layout {
    grid-template-columns: minmax(320px, 1fr) minmax(0, 1.3fr);
  }

  .record-column {
    grid-column: 1 / -1;
    min-height: 420px;
  }

  .record-shell {
    height: auto;
  }

  .history-case-head {
    flex-direction: column;
  }
}

@media (max-width: 1080px) {
  .consultation-layout {
    grid-template-columns: 1fr;
  }

  .subtitle-column,
  .record-column {
    min-height: 320px;
  }

  .preview-row {
    position: static;
    width: 100%;
    margin-top: 36px;
    margin-bottom: 10px;
    grid-template-columns: minmax(0, 1fr);
  }

  .featured-stage {
    padding-top: 14px;
  }

  .featured-caption {
    bottom: 118px;
    font-size: 14px;
  }

  .stage-controls {
    width: calc(100% - 24px);
  }

  .diagnosis-grid,
  .record-grid {
    grid-template-columns: 1fr;
  }

  .four-diagnosis-empty-state {
    min-height: 320px;
  }

  .four-pdf-preview-mask {
    padding: 12px;
  }

  .four-pdf-preview-dialog {
    height: 92vh;
    min-height: 0;
  }

  .inspection-report-body {
    overflow: auto;
  }

  .inspection-report-workspace {
    grid-template-columns: 1fr;
    height: auto;
  }

  .inspection-report-main-image {
    height: 360px;
  }

  .inspection-report-content {
    grid-template-rows: auto minmax(320px, auto);
  }
}
</style>
