<script setup lang="ts">
import { download } from '@tauri-apps/plugin-upload'
import { save } from '@tauri-apps/plugin-dialog'

const prop = defineProps<{
  image?: string
  title?: string
  subtitle?: string

  downloadName?: string
  previewImages?: string[]
  index?: number

  video?: string

  lazy?: boolean
}>()

const downloadFile = async (url: string) => {
  const suffix = url.split('?')[0].split('.').pop() ?? ''
  const name = (prop.downloadName ?? prop.title) + '.' + suffix

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
    message: `${name}下载成功`,
    type: 'success',
  })
}

const videoVisible = ref(false)
const videoUrl = ref('')

function showVideo(url: string) {
  videoUrl.value = url
  videoVisible.value = true
}

function closeVideo() {
  videoVisible.value = false
}
</script>

<template>
  <ElDialog
    v-if="video"
    append-to-body
    align-center
    v-model="videoVisible"
    :title="title"
    :before-close="closeVideo"
  >
    <div style="height: calc(100vh - 150px - var(--title-bar-height));">
      <video
        v-if="videoVisible"
        class="w-full"
        style="height: calc(100vh - 150px - var(--title-bar-height));"
        :src="videoUrl"
        controls
        autoplay
      />
    </div>
  </ElDialog>
  <ElCard class="max-w-80">
    <template
      v-if="title"
      #header
    >
      <div class="flex flex-col items-center">
        <ElLink
          :href="image"
          class="text-center"
          target="_blank"
        >
          <ElText
            size="large"
            type="primary"
          >
            {{ title }}
          </ElText>
        </ElLink>
        <ElText
          v-if="subtitle?.length ?? 0 > 0"
          size="small"
          type="info"
          class="text-center whitespace-pre-wrap"
        >
          {{ subtitle }}
        </ElText>
      </div>
    </template>

    <!-- 优先展示图片 -->
    <ElImage
      v-if="image?.length ?? 0 > 0"
      :alt="title"
      :hide-on-click-modal="true"
      :initial-index="index ?? 0"
      :lazy="lazy ?? true"
      :preview-src-list="previewImages ?? [image ?? '']"
      :src="image"
      fit="contain"
      preview-teleported
      referrerpolicy="no-referrer"
    >
      <template #error>
        <ElText type="danger">
          加载图片/视频出错
        </ElText>
      </template>
    </ElImage>

    <!-- 仅在无图片时展示视频 -->
    <video
      v-else-if="video?.length ?? 0 > 0"
      :src="video"
      controls
      autoplay
      loop
    />

    <ElText
      type="danger"
      v-else
    >
      加载图片/视频出错
    </ElText>

    <template #footer>
      <div class="flex h-4 items-center justify-center">
        <!-- 仅图片或视频 -->
        <ElButton
          v-if="(video?.length ?? 0) === 0 || (image?.length ?? 0) === 0"
          type="primary"
          @click="downloadFile(image ?? video ?? '')"
        >
          <ElIcon size="20">
            <i-ep-download />
          </ElIcon>
        </ElButton>

        <!-- 图片和视频展示 -->
        <template v-else>
          <ElButtonGroup>
            <ElButton
              type="primary"
              @click="downloadFile(image ?? '')"
            >
              图片
              <ElIcon size="16">
                <i-ep-download />
              </ElIcon>
            </ElButton>
            <ElButton
              type="primary"
              @click="downloadFile(video ?? '')"
            >
              视频
              <ElIcon size="16">
                <i-ep-download />
              </ElIcon>
            </ElButton>
          </ElButtonGroup>

          <ElLink
            @click="() => showVideo(video ?? '')"
            class="ml-auto"
            target="_blank"
            type="primary"
          >
            查看视频
          </ElLink>
        </template>
      </div>
    </template>
  </ElCard>
</template>