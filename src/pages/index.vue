<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

const router = useRouter()

const inputText = ref('')
const processedInputText = computed(() => {
  if (URL.canParse(inputText.value)) {
    const url = URL.parse(inputText.value)!
    if (url.protocol === 'http:') {
      url.protocol = 'https:'
    }
    if (url.pathname.endsWith('/')) {
      url.pathname = url.pathname.substring(0, url.pathname.length - 1)
    }
    return `${url.protocol}//${url.host}${url.pathname}`
  }
  return inputText.value.trim()
})
const selectedSearchType = ref('auto')

const getInferredType = (text: string) => {
  if (URL.canParse(text)) {
    if (/^https:\/\/live\.bilibili\.com\/\d+$/.test(text)) {
      return 'liveroom'
    } else if (/^https:\/\/space\.bilibili\.com\/\d+$/.test(text) || /^UID:\d+$/.test(text)) {
      return 'user'
    } else if (/^https:\/\/t\.bilibili\.com\/\d+$/.test(text)
        || /^https:\/\/(www\.)?bilibili\.com\/opus\/\d+$/.test(text)
    ) {
      return 'dynamic'
    } else if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)$/.test(text)) {
      return 'video'
    }
  } else if (/^((av|AV)\d+|BV\w+)$/.test(text)) {
    return 'video'
  }
  return null
}

const onChange = () => {
  const type = getInferredType(processedInputText.value)
  if (type !== null) {
    selectedSearchType.value = type
  }
}

const jump = () => {
  let type = selectedSearchType.value
  if (type === 'auto') {
    const inferredType = getInferredType(processedInputText.value)
    if (inferredType !== null) {
      selectedSearchType.value = inferredType
      type = inferredType
    } else {
      ElMessage({
        message: '无法自动推断出要搜索的类型，请手动选择！',
        type: 'error',
      })
      return
    }
  }

  if (type === 'garbSearch') {
    // TODO 实现装扮和收藏集搜索界面

  } else if (type === 'user') {
    let uid = ''
    if (getInferredType(processedInputText.value) === 'user') {
      if (URL.canParse(processedInputText.value)) {
        uid = URL.parse(processedInputText.value)!.pathname
      } else {
        uid = processedInputText.value.substring(4)
      }
    } else if (/^\d+$/.test(processedInputText.value)) {
      uid = processedInputText.value
    } else {
      ElMessage({
        message: '请输入正确的用户空间链接或UID！',
        type: 'error',
      })
      return
    }
    // TODO 实现用户空间查看界面

  } else if (type === 'liveroom') {
    let roomId = ''
    if (getInferredType(processedInputText.value) === 'liveroom') {
      roomId = URL.parse(processedInputText.value)!.pathname.substring(1)
    } else if (/^\d+$/.test(processedInputText.value)) {
      roomId = processedInputText.value
    } else {
      ElMessage({
        message: '请输入正确的直播间链接或直播间号！',
        type: 'error'
      })
      return
    }
    router.push({ path: '/liveroom', query: { id: roomId } })
  } else if (type === 'dynamic') {
    if (getInferredType(processedInputText.value) !== 'dynamic') {
      ElMessage({
        message: '请输入正确的动态链接！',
        type: 'error',
      })
      return
    }
    let id = ''
    if (/^https:\/\/t\.bilibili\.com\/\d+$/.test(processedInputText.value)) {
      id = URL.parse(processedInputText.value)!.pathname.substring(1)
    } else {
      id = URL.parse(processedInputText.value)!.pathname.substring(6)
    }
    // TODO 实现动态查看界面

  } else if (type === 'video') {
    if (getInferredType(processedInputText.value) !== 'video') {
      ElMessage({
        message: '请输入正确的视频链接、BV号或AV号！',
        type: 'error',
      })
      return
    }

    let id = ''
    if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)$/.test(processedInputText.value)) {
      id = URL.parse(processedInputText.value)!.pathname.substring(1)
      if (id.startsWith('video/')) {
        id = id.substring(6)
      }
    } else {
      id = processedInputText.value
    }
    // TODO 实现视频查看界面
  }
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
    >
      <template #prepend>
        <ElSelect class="!w-40" v-model="selectedSearchType" placeholder="选择搜索类型">
          <ElOption label="自动推断" value="auto"></ElOption>
          <ElOption label="直播间信息" value="liveroom"></ElOption>
          <ElOption label="用户信息" value="user"></ElOption>
          <ElOption label="动态" value="dynamic"></ElOption>
          <ElOption label="视频" value="video"></ElOption>
          <ElOption label="装扮/收藏集搜索" value="garbSearch"></ElOption>
        </ElSelect>
      </template>
      <template #append>
        <!-- TODO type为啥无效？ -->
        <ElButton type="primary" @click="jump" :icon="Search"/>
      </template>
    </ElInput>
  </div>
</template>