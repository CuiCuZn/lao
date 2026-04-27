<template>
  <div ref="containerRef" class="loading-lottie" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import lottie, { type AnimationItem } from 'lottie-web'
import loadingAnimation from '@/assets/loading.json'

const containerRef = ref<HTMLDivElement | null>(null)
let animation: AnimationItem | null = null

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  animation = lottie.loadAnimation({
    container: containerRef.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet'
    }
  })
})

onBeforeUnmount(() => {
  animation?.destroy()
  animation = null
})
</script>

<style scoped lang="scss">
.loading-lottie {
  width: 100%;
  height: 100%;
}
</style>
