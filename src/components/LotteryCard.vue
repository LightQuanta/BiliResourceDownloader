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
</script>

<template>
  <ElCard class="w-64 h-128">
    <template #header>
      <div class="flex">
        <div>
          {{ card.card_name }}
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
      <div class="flex">
        <div>稀有度：{{ card.card_scarcity }}</div>
        <ElLink v-if="card.video_list" class="ml-auto" type="primary" :href="videoUrl" target="_blank">查看视频</ElLink>
      </div>
    </template>
  </ElCard>
</template>