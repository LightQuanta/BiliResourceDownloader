<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";

const route = useRoute<'/suit/[id]'>()

const id = ref('')
const resp = ref('')

onMounted(async () => {
  id.value = route.params.id

  const url = new URL('https://api.bilibili.com/x/garb/v2/mall/suit/detail')
  url.searchParams.set('item_id', id.value)

  let data = null
  try {
    const resp = await cachedAPIFetch(url)
    data = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取直播间信息出错：${e}`,
      type: 'error',
    })
    return null
  }

  resp.value = data
})

</script>

<template>
  <pre>
    {{ resp }}
  </pre>
</template>
