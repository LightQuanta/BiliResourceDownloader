<script lang="ts" setup>

const result = ref("")
const test = async () => {
  let url = new URL('https://api.bilibili.com/x/garb/v2/mall/home/search')
  url.searchParams.set('key_word', '2233')
  url.searchParams.set('pn', '1')
  result.value = await fetch(url).then(r => r.json())
}

</script>
<template>
  <!-- TODO 实现收藏集相关页面 -->
  <a href="https://baidu.com" target="_blank">111111</a>
  <ElButton @click="test">测试搜索</ElButton>
  <div>result:
    <pre style="text-align:left;">{{ result }}</pre>
  </div>
</template>