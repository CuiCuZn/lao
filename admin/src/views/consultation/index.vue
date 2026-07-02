<template>
  <div class="consultation-container">
    <el-tabs v-model="activeTab" class="corpus-tabs" @tab-change="onTabChange">
      <el-tab-pane label="医生问题" name="doctor" class="corpus-tab-pane">
        <div v-show="activeTab === 'doctor'" class="tab-content">
          <CorpusPanel
            v-if="loadedDoctor"
            subject-type="DOCTOR"
            :category-dict-type="'inquiry_doctor_category_type'"
            :cn-label="'中文问题'"
            :lo-label="'老挝语问题'"
            :add-text="'新增问题'"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="患者回答" name="patient" class="corpus-tab-pane">
        <div v-show="activeTab === 'patient'" class="tab-content">
          <CorpusPanel
            v-if="loadedPatient"
            subject-type="PATIENT"
            :category-dict-type="'inquiry_patient_category_type'"
            :cn-label="'中文回答'"
            :lo-label="'老挝语回答'"
            :add-text="'新增回答'"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CorpusPanel from './components/CorpusPanel.vue'

const activeTab = ref<'doctor' | 'patient'>('doctor')
const loadedDoctor = ref(true)
const loadedPatient = ref(false)

const onTabChange = (name: string | number) => {
  if (name === 'doctor') loadedDoctor.value = true
  if (name === 'patient') loadedPatient.value = true
}
</script>

<style lang="scss" scoped>
.consultation-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.corpus-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 24px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
}

.corpus-tab-pane {
  height: 100%;
}

.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
}
</style>
