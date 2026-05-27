import { ref } from 'vue'
import { listDictData } from '@/api/dict'
import type { DictDataVO } from '@/api/types'

const SEX_DICT_TYPE = 'sys_user_sex'

export const sexDictOptions = ref<DictDataVO[]>([])

let loadingPromise: Promise<DictDataVO[]> | null = null

const toText = (value: unknown) => {
  return value === null || value === undefined ? '' : String(value).trim()
}

const normalize = (value: unknown) => toText(value).toLowerCase()

export const loadSexDict = async () => {
  if (sexDictOptions.value.length > 0) {
    return sexDictOptions.value
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = listDictData({ dictType: SEX_DICT_TYPE })
    .then((response) => {
      sexDictOptions.value = response.rows || response.data || []
      return sexDictOptions.value
    })
    .catch(() => {
      sexDictOptions.value = []
      return []
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}

export const formatSexByDict = (value: unknown, emptyText = '') => {
  const text = toText(value)

  if (!text) {
    return emptyText
  }

  const valueMatched = sexDictOptions.value.find((item) => toText(item.dictValue) === text)
  if (valueMatched) {
    return valueMatched.dictLabel
  }

  const normalizedText = normalize(text)
  const normalizedValueMatched = sexDictOptions.value.find((item) => normalize(item.dictValue) === normalizedText)
  if (normalizedValueMatched) {
    return normalizedValueMatched.dictLabel
  }

  const labelMatched = sexDictOptions.value.find((item) => toText(item.dictLabel) === text)
  if (labelMatched) {
    return labelMatched.dictLabel
  }

  const normalizedLabelMatched = sexDictOptions.value.find((item) => normalize(item.dictLabel) === normalizedText)
  if (normalizedLabelMatched) {
    return normalizedLabelMatched.dictLabel
  }

  return text
}
