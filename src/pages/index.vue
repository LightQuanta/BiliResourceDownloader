<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { resolveText, autoJump } from "../linkResolver.ts";

const inputText = ref('')
const processedInputText = computed<string>(() => {
  if (URL.canParse(inputText.value)) {
    const url = new URL(inputText.value)
    if (url.protocol === 'http:') {
      url.protocol = 'https:'
    }
    if (url.pathname.endsWith('/')) {
      url.pathname = url.pathname.substring(0, url.pathname.length - 1)
    }
    return `${url.protocol}//${url.host}${url.pathname}${url.search}`
  }
  return inputText.value.trim()
})
const selectedSearchType = ref('auto')

const onChange = () => {
  const type = resolveText(processedInputText.value)
  if (type !== null) {
    selectedSearchType.value = type
  }
}

const jump = async () => {
  if (processedInputText.value === '') {
    ElMessage({
      message: '请输入要搜索的内容！',
      type: 'error',
    })
    return
  }

  const input = processedInputText.value

  let type = selectedSearchType.value
  if (type === 'auto') {
    const inferredType = resolveText(processedInputText.value)
    if (inferredType !== null) {
      selectedSearchType.value = inferredType
    } else {
      ElMessage({
        message: '无法自动推断出要搜索的类型，请手动选择！',
        type: 'error',
      })
      return
    }
  }

  await autoJump(input, true, type)
}
</script>

<template>
  <div class="flex justify-center items-center w-full h-full">
    <ElInput
        v-model="inputText"
        placeholder="输入要搜索的内容"
        autofocus
        clearable
        @input="onChange"
        class="max-w-screen-sm"
        autocomplete="on"
    >
      <template #prepend>
        <ElSelect class="!w-40" v-model="selectedSearchType" placeholder="选择搜索类型">
          <ElOption label="自动推断" value="auto"/>
          <ElOption label="直播间信息" value="liveroom"/>
          <ElOption label="用户信息" value="user"/>
          <ElOption label="动态" value="dynamic"/>
          <ElOption label="视频" value="video"/>
          <ElOption label="收藏集" value="lottery"/>
          <ElOption label="装扮" value="suit"/>
          <ElOption label="装扮/收藏集搜索" value="garbSearch"/>
        </ElSelect>
      </template>
      <template #append>
        <!-- TODO type为啥无效？ -->
        <ElButton type="primary" @click="jump" :icon="Search"/>
      </template>
    </ElInput>
  </div>
</template>