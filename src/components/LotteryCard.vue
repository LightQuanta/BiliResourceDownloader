<script setup lang="ts">
import type { LotteryCardInfo } from '../types.ts'
import { save } from "@tauri-apps/plugin-dialog";
import { download } from "@tauri-apps/plugin-upload";

const prop = defineProps<{
  card: LotteryCardInfo
  previewImages?: string[]
  index?: number
}>()

const hasWatermark = ref(false)
const imgUrl = computed(() => hasWatermark.value ? prop.card.card_img_download : prop.card.card_img)
const hasVideo = computed(() => (prop.card.video_list?.length ?? 0) != 0)
const videoUrl = computed(() => {
  if (hasVideo.value) {
    return hasWatermark.value ? prop.card.video_list_download?.[0] : prop.card.video_list?.[0]
  }
  return ''
})

const downloadFile = async (url: string) => {
  const suffix = url.split('?')[0].split('.').pop() ?? ''
  const name = prop.card.card_name + '.' + suffix

  const path = await save({
    defaultPath: name,
    filters: [
      {
        name: suffix,
        extensions: [suffix],
      },
    ],
  })
  if (path === null) return

  // 必须设置UA才能绕过视频下载检测
  const header = new Map<string, string>()
  header.set('User-Agent', '111')

  try {
    await download(url, path, undefined, header)
  } catch (e) {
    console.error(e)

    ElMessage({
      message: `下载出错： ${e}`,
      type: 'error',
    })
    return
  }

  ElMessage({
    message: `${name} 下载成功`,
    type: 'success',
  })
}
</script>

<template>
  <ElCard class="max-w-80">
    <template #header>
      <div class="flex">
        <div class="flex flex-col items-start">
          <ElText
            class="w-full"
            size="large"
            type="primary"
          >
            {{ card.card_name }}
          </ElText>
          <ElText
            class="w-full"
            size="small"
            type="info"
          >
            稀有度：{{ card.card_scarcity }}
          </ElText>
        </div>
        <ElSwitch
          v-model="hasWatermark"
          active-text="水印"
          class="ml-auto"
          size="small"
        />
      </div>
    </template>
    <ElImage
      :alt="card.card_name"
      :hide-on-click-modal="true"
      :initial-index="index ?? 0"
      :preview-src-list="previewImages ?? [imgUrl]"
      :src="imgUrl"
      fit="contain"
      preview-teleported
      referrerpolicy="no-referrer"
    />
    <template #footer>
      <div class="flex h-4 items-center">
        <ElButtonGroup v-if="hasVideo">
          <ElButton
            type="primary"
            @click="downloadFile(imgUrl)"
          >
            图片
            <ElIcon size="16">
              <i-ep-download />
            </ElIcon>
          </ElButton>
          <ElButton
            type="primary"
            @click="downloadFile(videoUrl ?? '')"
          >
            视频
            <ElIcon size="16">
              <i-ep-download />
            </ElIcon>
          </ElButton>
        </ElButtonGroup>
        <ElButton
          v-else
          type="primary"
          @click="downloadFile(imgUrl)"
        >
          图片
          <ElIcon size="16">
            <i-ep-download />
          </ElIcon>
        </ElButton>
        <ElLink
          v-if="hasVideo"
          :href="videoUrl"
          class="ml-auto"
          target="_blank"
          type="primary"
        >
          查看视频
        </ElLink>
      </div>
    </template>
  </ElCard>
</template>