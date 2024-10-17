<script setup lang="ts">
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import { BasicUserInfo } from "../types.ts";

type UPInfoType = 'face' | 'at'

const props = withDefaults(defineProps<{
  mid: string
  name?: string
  face?: string
  openInBrowser?: boolean
  type?: UPInfoType
}>(), {
  name: '',
  face: '',
  openInBrowser: false,
  type: 'face'
})
const mid = ref('')
const name = ref('')
const face = ref('')

const hasFullInfo = computed(() => {
  if (props.type === 'face') {
    return name.value.length > 0 && face.value.length > 0
  }
  return name.value.length > 0
})

const router = useRouter()
const jump = () => {
  if (props.openInBrowser) {
    window.open(`https://space.bilibili.com/${mid}`)
  } else {
    router.push(`/space/${mid}`)
  }
}

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
  <ElLink type="primary" @click="jump">
    <ElImage v-if="type === 'face'" :src="face" referrerpolicy="no-referrer" class="h-8 w-8 rounded-full"/>
    <span class="mx-1">{{ name }}</span>
  </ElLink>
</template>
