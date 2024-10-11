<script setup lang="ts">
import type { LotteryCardInfo } from '../lottery.ts'

const prop = defineProps<{
  card: LotteryCardInfo
}>()

const hasWatermark = ref(false)
const imgUrl = computed(() => hasWatermark.value ? prop.card.card_img_download : prop.card.card_img)
const hasVideo = computed(() => prop.card.video_list != null)
const videoUrl = computed(() => {
  if (hasVideo.value) {
    return hasWatermark.value ? prop.card.video_list_download![0] : prop.card.video_list![0]
  }
  return ''
})

const downloadFile = async (url: string) => {
  const downloader = document.createElement("a")
  downloader.style.display = 'none';
  document.body.appendChild(downloader)

  const data = await fetch(url).then(r => r.blob())
  const dataURL = URL.createObjectURL(data)
  downloader.href = dataURL

  const suffix = url.split('.').pop()!.split('?')[0]
  downloader.download = prop.card.card_name + '.' + suffix

  downloader.click()
  downloader.remove()
}
</script>

<template>
  <ElCard class="w-80">
    <template #header>
      <div class="flex">
        <div class="flex flex-col items-start">
          <ElText size="large" class="w-full" type="primary">{{ card.card_name }}</ElText>
          <ElText size="small" class="w-full" type="info">稀有度：{{ card.card_scarcity }}</ElText>
        </div>
        <ElSwitch class="ml-auto" size="small" v-model="hasWatermark" active-text="水印"/>
      </div>
    </template>
    <ElImage fit="contain"
             :src="imgUrl"
             :alt="card.card_name"
             :preview-src-list="[imgUrl]"
             :hide-on-click-modal="true"
             referrerpolicy="no-referrer"
    />
    <template #footer>
      <div class="flex h-4 items-center">
        <ElButtonGroup v-if="hasVideo">
          <ElButton type="primary" @click="downloadFile(imgUrl)">
            图片
            <ElIcon size="16">
              <i-ep-download/>
            </ElIcon>
          </ElButton>
          <ElButton type="primary" @click="downloadFile(videoUrl)">
            视频
            <ElIcon size="16">
              <i-ep-download/>
            </ElIcon>
          </ElButton>
        </ElButtonGroup>
        <ElButton v-else type="primary" @click="downloadFile(imgUrl)">
          图片
          <ElIcon size="16">
            <i-ep-download/>
          </ElIcon>
        </ElButton>
        <ElLink v-if="hasVideo" class="ml-auto" type="primary" :href="videoUrl" target="_blank">查看视频</ElLink>
      </div>
    </template>
  </ElCard>
</template>