<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";

const route = useRoute<'/suit/[id]'>()

const id = ref('')
const resp = ref('')

const fetchData = async (paramID: string) => {
  id.value = paramID

  const url = new URL('https://api.bilibili.com/x/garb/v2/user/suit/benefit')
  url.searchParams.set('item_id', id.value)
  url.searchParams.set('part', 'card')

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
}

watch(() => route.params.id, fetchData, { immediate: true })

</script>

<template>
  <pre>
    {{ resp }}
  </pre>
</template>
