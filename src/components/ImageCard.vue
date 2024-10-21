<script setup lang="ts">
import { download } from '@tauri-apps/plugin-upload'
import { save } from '@tauri-apps/plugin-dialog'

const prop = defineProps<{
  image?: string
  title?: string
  downloadName?: string
  previewImages?: string[]
  index?: number
  lazy?: boolean
  extraTitle?: string
}>()

const downloadImage = async (url: string) => {
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

  await download(url, path)

  ElMessage({
    message: `${name}下载成功`,
    type: 'success',
  })
}
</script>

<template>
  <ElCard class="max-w-80">
    <template
      v-if="title"
      #header
    >
      <ElLink
        :href="image"
        class="w-full block text-center"
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
        v-if="extraTitle?.length ?? 0 > 0"
        size="small"
        class="w-full text-center block"
      >
        {{ extraTitle }}
      </ElText>
    </template>
    <ElImage
      :alt="title"
      :hide-on-click-modal="true"
      :initial-index="index ?? 0"
      :lazy="lazy ?? true"
      :preview-src-list="previewImages ?? [image ?? '']"
      :src="image"
      fit="contain"
      preview-teleported
      referrerpolicy="no-referrer"
    />
    <template #footer>
      <div class="flex h-4 items-center justify-center">
        <ElButton
          type="primary"
          @click="downloadImage(image ?? '')"
        >
          <ElIcon size="20">
            <i-ep-download />
          </ElIcon>
        </ElButton>
      </div>
    </template>
  </ElCard>
</template>