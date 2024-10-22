<script setup lang="ts">
import { APIFetch } from "../APIFetch.ts";
import { BasicUserInfo } from "../types.ts";

type UPInfoType = 'face' | 'at'

const props = withDefaults(defineProps<{
  mid: string
  name?: string
  subtitle?: string
  face?: string
  openInBrowser?: boolean
  type?: UPInfoType
}>(), {
  name: '',
  face: '',
  subtitle: '',
  openInBrowser: false,
  type: 'face'
})
const userMid = ref('')
const userName = ref('')
const faceURL = ref('')

const hasFullInfo = computed(() => {
  if (props.type === 'face') {
    return userName.value.length > 0 && faceURL.value.length > 0
  }
  return userName.value.length > 0
})

const router = useRouter()
const jump = () => {
  if (props.openInBrowser) {
    window.open(`https://space.bilibili.com/${userMid.value}`)
  } else {
    router.push(`/space/${userMid.value}`)
  }
}

const fetchData = async () => {
  userMid.value = props.mid
  userName.value = props.name
  faceURL.value = props.face

  if (hasFullInfo.value) return
  if (props.mid.length === 0) return

  const url = new URL('https://api.bilibili.com/x/web-interface/card')
  url.searchParams.set('mid', String(userMid.value))

  const resp = await APIFetch<BasicUserInfo>(url).then(r => r.data)

  userName.value = resp.card.name
  faceURL.value = resp.card.face
}

onMounted(fetchData)
watch(() => props.mid, fetchData)

</script>

<template>
  <ElLink
    type="primary"
    @click="jump"
  >
    <ElImage
      v-if="type === 'face'"
      :src="faceURL"
      class="h-8 w-8 rounded-full"
      referrerpolicy="no-referrer"
    />
    <div
      v-if="subtitle"
      class="mr-4 ml-2 flex flex-col"
    >
      <span>{{ userName }}</span>
      <ElText
        size="small"
        class="mt--1"
      >
        {{ subtitle }}
      </ElText>
    </div>
    <span
      v-else
      class="mx-1"
    >{{ userName }}</span>
  </ElLink>
</template>
