<script setup lang="ts">

const props = defineProps<{
  title?: string
  desc?: string
  cover?: string
  avid?: string
  bvid?: string
}>()

const processedTitle = computed(() => {
  return props.title?.replace(/<em class="keyword">(.+)<\/em>/, '$1') ?? ''
})

const processedCover = computed(() => {
  const cover = props.cover?.replace('http:', 'https:')
  return (cover?.startsWith('https:') ? cover : `https:${cover}`) ?? ''
})
</script>

<template>
  <div class="flex justify-start transition shadow hover:shadow-2xl">
    <ElImage
      :src="processedCover"
      class="h-36 w-64 rounded-l-md"
      referrerpolicy="no-referrer"
      :preview-src-list="[processedCover]"
      preview-teleported
      close-on-press-escape
      hide-on-click-modal
      fit="cover"
    />
    <div class="h-36 w-72 border text-wrap rounded-r-md p-2 bg-gray-100">
      <RouterLink
        :to="`/video/${avid ?? bvid}`"
        class="flex items-stretch justify-start"
      >
        <ElTooltip
          :content="processedTitle"
          placement="top-start"
        >
          <ElText
            type="primary"
            size="large"
            class="block h-8 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {{ processedTitle }}
          </ElText>
        </ElTooltip>
      </RouterLink>
      <div class="line-clamp-5 text-sm h-24">
        {{ desc }}
      </div>
    </div>
  </div>
</template>
