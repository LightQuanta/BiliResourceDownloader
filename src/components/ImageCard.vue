<script setup lang="ts">

const prop = defineProps<{
  image: string
  title: string
}>()

const downloadFile = async (url: string) => {
  const downloader = document.createElement("a")
  downloader.style.display = 'none';
  document.body.appendChild(downloader)

  const data = await fetch(url).then(r => r.blob())
  downloader.href = URL.createObjectURL(data)

  const suffix = url.split('.').pop()!.split('?')[0]
  downloader.download = prop.title + '.' + suffix

  downloader.click()
  downloader.remove()
}
</script>

<template>
  <ElCard class="w-80">
    <template #header>
      <ElLink :href="image" class="w-full block text-center" target="_blank">
        <ElText size="large" type="primary">{{ title }}</ElText>
      </ElLink>
    </template>
    <ElImage fit="contain"
             :src="image"
             :alt="title"
             :preview-src-list="[image]"
             :hide-on-click-modal="true"
             referrerpolicy="no-referrer"
    />
    <template #footer>
      <div class="flex h-4 items-center justify-center">
        <ElButton type="primary" @click="downloadFile(image)">
          <ElIcon size="20">
            <i-ep-download/>
          </ElIcon>
        </ElButton>
      </div>
    </template>
  </ElCard>
</template>