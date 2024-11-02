<script setup lang="ts">
import { globalConfig } from "../utils/globalConfig";
import { readFile } from '@tauri-apps/plugin-fs'

const backgroundImgPath = ref('')

watch(() => globalConfig.value.background.url, async () => {
  const path = globalConfig.value.background.url
  
  if (globalConfig.value.background.enable) {
    if (path.length) {
      if (path.startsWith('http')) {
        backgroundImgPath.value = `url(${path})`
        return
      }

      const img = await readFile(path)
      const extension = path.split('.').pop()

      const blob = new Blob([img], { type: `image/${extension}` })

      const url = URL.createObjectURL(blob)

      backgroundImgPath.value = `url(${url})`
    }
  } else {
    backgroundImgPath.value = ''
  }
}, { immediate: true })
const enable = computed(() => globalConfig.value.background.enable)
</script>

<template>
  <div
    class="color-bg w-full h-full absolute top-0 left-0 -z-50"
    :style="{ backgroundImage: enable ? backgroundImgPath : '', opacity: enable ? globalConfig.background.opacity : 1 }"
  />
</template>