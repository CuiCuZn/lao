import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listDictData } from '@/api/dict'
import { DictDataVO } from '@/api/types'
import { to } from 'await-to-js'

/**
 * 字典状态存储
 */
export const useDictStore = defineStore('dict', () => {
  // 存储所有已加载的字典映射
  const dictMap = ref<Record<string, DictDataVO[]>>({})

  /**
   * 获取指定类型的字典
   * @param dictType 
   */
  const getDict = (dictType: string) => {
    return dictMap.value[dictType] || []
  }

  /**
   * 加载并缓存字典数据
   * @param dictType 
   */
  const loadDict = async (dictType: string) => {
    // 如果已经加载过，则不再重复请求（可根据需要调整刷新机制）
    if (dictMap.value[dictType]) return dictMap.value[dictType]

    const [err, res] = await to(listDictData({ dictType }))
    if (res && res.rows) {
      dictMap.value[dictType] = res.rows
      return res.rows
    }
    return []
  }

  /**
   * 批量加载多个字典
   * @param dictTypes 
   */
  const loadDicts = async (dictTypes: string[]) => {
    const promises = dictTypes.map(type => loadDict(type))
    return await Promise.all(promises)
  }

  /**
   * 清除字典缓存
   */
  const clearDict = () => {
    dictMap.value = {}
  }

  return {
    dictMap,
    getDict,
    loadDict,
    loadDicts,
    clearDict
  }
})
