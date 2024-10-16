<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import {
  resolveAVBVID,
  resolveDynamicID,
  resolveLiveroomID,
  resolveActID,
  resolveSuitID,
  resolveText,
  resolveUID
} from "../linkResolver.ts";

const router = useRouter()

const inputText = ref('')
const processedInputText = computed<string>(() => {
  if (URL.canParse(inputText.value)) {
    const url = URL.parse(inputText.value)!
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
    await router.push({ path: '/search/garb', query: { keyword: input } })
  } else if (type === 'user') {
    const uid = resolveUID(input)
    if (uid === null) {
      ElMessage({
        message: '请输入正确的用户空间链接或UID！',
        type: 'error',
      })
      return
    }

    // TODO 实现用户空间查看界面

  } else if (type === 'liveroom') {
    const roomId = resolveLiveroomID(input)
    if (roomId === null) {
      ElMessage({
        message: '请输入正确的直播间链接或直播间号！',
        type: 'error'
      })
      return
    }

    await router.push({ path: `/liveroom/${roomId}` })

  } else if (type === 'dynamic') {
    const id = resolveDynamicID(input)
    if (id === null) {
      ElMessage({
        message: '请输入正确的动态链接！',
        type: 'error',
      })
      return
    }
    await router.push({ path: `/dynamic/${id}` })
  } else if (type === 'video') {
    const id = resolveAVBVID(input)
    if (id === null) {
      ElMessage({
        message: '请输入正确的视频链接、BV号或AV号！',
        type: 'error',
      })
      return
    }

    // TODO 实现视频查看界面
  } else if (type === 'lottery') {
    try {
      const id = resolveActID(input)
      if (id === null) {
        ElMessage({
          message: '请输入正确的收藏集链接！',
          type: 'error',
        })
        return
      }

      await router.push({ path: '/lottery', query: { act_id: id } })

    } catch (e) {
      ElMessage({
        message: '获取收藏集信息出错：' + e,
        type: 'error',
      })
    }
  } else if (type === 'suit') {
    const id = resolveSuitID(input)
    if (id === null) {
      ElMessage({
        message: '请输入正确的收藏集链接！',
        type: 'error',
      })
      return
    }

    await router.push({ path: `/suit/${id}` })

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