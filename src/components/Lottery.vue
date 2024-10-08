<script lang="ts" setup>
import { fetch } from '@tauri-apps/plugin-http'

const result = ref("")
const test = async () => {
  let url = new URL('https://api.bilibili.com/x/garb/v2/mall/home/search')
  url.searchParams.set('key_word', '2233')
  url.searchParams.set('pn', '1')

  result.value = await fetch(url.toString()).then(r => r.json())
}

</script>
<template>
  <!-- TODO 实现收藏集相关页面 -->
  <button @click="test">测试搜索</button>
  <div>result:
    <pre style="text-align:left;">{{ result }}</pre>
  </div>
</template>