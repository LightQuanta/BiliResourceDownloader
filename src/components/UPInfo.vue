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
const mid = ref(-1)
const name = ref('')
const face = ref('')

const hasFullInfo = computed(() => name.value.length > 0 && face.value.length > 0)

const fetchData = async () => {
  if (hasFullInfo.value) return

  mid.value = props.mid
  name.value = props.name
  face.value = props.face

  const url = new URL('https://api.bilibili.com/x/web-interface/card')
  url.searchParams.set('mid', String(mid.value))

  const resp = await cachedAPIFetch(url).then(r => r.data) as BasicUserInfo

  name.value = resp.card.name
  face.value = resp.card.face
}

onMounted(fetchData)
watch(() => props.mid, fetchData)

</script>

<template>
  <!-- 浏览器中打开 -->
  <ElLink v-if="openInBrowser"
          type="primary"
          :href="`https://space.bilibili.com/${mid}`"
          target="_blank"
          class="mr-2"
  >
    <ElImage :src="face" referrerpolicy="no-referrer" class="h-8 w-8 rounded-full"/>
    <span class="ml-2">{{ name }}</span>
  </ElLink>
  <!-- 解析用户信息 -->
  <RouterLink :to="`/space/${mid}`" v-else class="mr-2">
    <ElLink type="primary">
      <ElImage :src="face" referrerpolicy="no-referrer" class="h-8 w-8 rounded-full"/>
      <span class="ml-2">{{ name }}</span>
    </ElLink>
  </RouterLink>
</template>

<style scoped>

</style>