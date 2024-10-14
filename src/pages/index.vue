<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { GarbSearchResult } from "../types.ts";

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
    return `${url.protocol}//${url.host}${url.pathname}${url.search}`
  }
  return inputText.value.trim()
})
const selectedSearchType = ref('auto')

const getInferredType = (text: string) => {
  if (URL.canParse(text)) {
    const url = new URL(text)!
    if (/^https:\/\/live\.bilibili\.com\/\d+(\?.+)?$/.test(text)) {
      return 'liveroom'
    } else if (/^https:\/\/space\.bilibili\.com\/\d+(\?.+)?$/.test(text) || /^UID:\d+$/.test(text)) {
      return 'user'
    } else if (/^https:\/\/t\.bilibili\.com\/\d+(\?.+)?$/.test(text)
        || /^https:\/\/(www\.)?bilibili\.com\/opus\/\d+(\?.+)?$/.test(text)
    ) {
      return 'dynamic'
    } else if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)(\?.+)?$/.test(text)) {
      return 'video'
    } else if ('https://www.bilibili.com/blackboard/activity-Mz9T5bO5Q3.html' === text.split('?')[0]) {
      const id = url.searchParams.get('id')
      const type = url.searchParams.get('type')
      if (id != null && type != null) {
        if (type === 'suit') {
          return 'suit'
        } else if (type === 'dlc') {
          return 'lottery'
        }
      }
      return null
    } else if (text.split('?')[0] === 'https://www.bilibili.com/h5/mall/digital-card/home') {
      const actId = url.searchParams.get('act_id')
      const lotteryId = url.searchParams.get('lottery_id')
      if (actId != null && lotteryId != null) {
        return 'lottery'
      }
      return null
    } else if (text.split('?')[0] === 'https://www.bilibili.com/h5/mall/suit/detail') {
      const id = url.searchParams.get('id')
      if (id != null) {
        return 'suit'
      }
      return null
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

const jump = async () => {
  if (processedInputText.value === '') {
    ElMessage({
      message: '请输入要搜索的内容！',
      type: 'error',
    })
    return
  }

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
  } else if (type === 'garbSearch') {
    router.push({ path: '/search/garb', query: { keyword: processedInputText.value } })
  } else if (type === 'user') {
    let uid = ''
    if (getInferredType(processedInputText.value) === 'user') {
      if (URL.canParse(processedInputText.value)) {
        uid = URL.parse(processedInputText.value)!.pathname
      } else {
        uid = processedInputText.value.substring(4).split('?')[0]
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
      roomId = URL.parse(processedInputText.value)!.pathname.substring(1).split('?')[0]
    } else if (/^\d+$/.test(processedInputText.value)) {
      roomId = processedInputText.value
    } else {
      ElMessage({
        message: '请输入正确的直播间链接或直播间号！',
        type: 'error'
      })
      return
    }
    router.push({ path: `/liveroom/${roomId}` })
  } else if (type === 'dynamic') {
    if (getInferredType(processedInputText.value) !== 'dynamic') {
      ElMessage({
        message: '请输入正确的动态链接！',
        type: 'error',
      })
      return
    }
    let id = ''
    if (/^https:\/\/t\.bilibili\.com\/\d+(\?.+)?$/.test(processedInputText.value)) {
      id = URL.parse(processedInputText.value)!.pathname.substring(1).split('?')[0]
    } else {
      id = URL.parse(processedInputText.value)!.pathname.substring(6).split('?')[0]
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
    if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)(\?.+)?$/.test(processedInputText.value)) {
      id = URL.parse(processedInputText.value)!.pathname.substring(1).split('?')[0]
      if (id.startsWith('video/')) {
        id = id.substring(6)
      }
    } else {
      id = processedInputText.value
    }
    // TODO 实现视频查看界面
  } else if (type === 'lottery') {
    if (getInferredType(processedInputText.value) !== 'lottery') {
      ElMessage({
        message: '请输入正确的收藏集链接！',
        type: 'error',
      })
      return
    }

    const url = URL.parse(processedInputText.value)!

    const actId = url.searchParams.get('id') ?? url.searchParams.get('act_id')
    const resp = await fetch(`https://api.bilibili.com/x/vas/dlc_act/act/basic?act_id=${actId}`).then(r => r.json())

    if (resp.code !== 0) {
      ElMessage({
        message: '获取收藏集信息出错：' + resp.msg,
        type: 'error',
      })
    }

    const lotteryId = resp.data.tab_lottery_id
    const lotteryInfo = resp.data.lottery_list.filter(l => l.lottery_id === lotteryId)[0]

    const fakeSearchResult: GarbSearchResult = {
      item_id: 0,
      name: resp.data.act_title,
      jump_link: `https://www.bilibili.com/h5/mall/digital-card/home?act_id=${actId}&lottery_id=${lotteryId}`,
      sale_count_desc: '',
      properties: {
        dlc_act_id: actId as number,
        dlc_lottery_id: lotteryId as number,

        dlc_lottery_sale_quantity: lotteryInfo.total_sale_amount as number,
        image_cover: lotteryInfo.lottery_image as string,

        dlc_sale_start_time: lotteryInfo.start_time as string,
        dlc_sale_end_time: lotteryInfo.end_time as string,
      }
    }

    router.push({ path: '/lottery', query: { lottery: JSON.stringify(fakeSearchResult) } })
  } else if (type === 'suit') {
    if (getInferredType(processedInputText.value) !== 'suit') {
      ElMessage({
        message: '请输入正确的收藏集链接！',
        type: 'error',
      })
      return
    }

    const url = URL.parse(processedInputText.value)!
    const id = url.searchParams.get('id')

    // TODO 实现装扮页面
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