<script setup lang="ts">
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import { BasicUserInfo } from "../types.ts";

const props = withDefaults(defineProps<{
  mid: number
  name?: string
  face?: string
  openInBrowser?: boolean
}>(), {
  name: '',
  face: '',
  openInBrowser: false,
})
const mid = ref(props.mid)
const name = ref(props.name)
const face = ref(props.face)

const hasFullInfo = computed(() => props.name.length > 0 && props.face.length > 0)
onMounted(async () => {
  if (hasFullInfo.value) return

  const url = new URL('https://api.bilibili.com/x/web-interface/card')
  url.searchParams.set('mid', String(mid.value))

  console.log(url)

  const resp = await cachedAPIFetch(url).then(r => r.data) as BasicUserInfo

  name.value = resp.card.name
  face.value = resp.card.face
})
</script>

<template>
  <div class="flex items-center">
    <!-- 浏览器中打开 -->
    <ElLink v-if="openInBrowser" type="primary" :href="`https://space.bilibili.com/${mid}`"
            target="_blank">
      <ElImage :src="face" referrerpolicy="no-referrer" class="h-12 w-12 rounded-full"/>
      <span class="ml-2">{{ name }}</span>
    </ElLink>
    <!-- 解析用户信息 -->
    <RouterLink :to="`/space/${mid}`" v-else>
      <ElLink type="primary">
        <ElImage :src="face" referrerpolicy="no-referrer" class="h-12 w-12 rounded-full"/>
        <span class="ml-2">{{ name }}</span>
      </ElLink>
    </RouterLink>
  </div>
</template>

<style scoped>

</style>