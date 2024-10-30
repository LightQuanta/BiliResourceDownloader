<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import { AtTextNode, BatchDownloadTask, DynamicInfo, DynamicTypes } from "../../types.ts";
import { autoJump, resolveText } from "../../utils/linkResolver.ts";
import { sep } from "@tauri-apps/api/path";

const loading = ref(false)
const route = useRoute<'/dynamic/[id]'>()

// 动态ID
const dynamicID = ref('')

// 动态全部数据
const dynamicData = ref<DynamicInfo>()

// 作者信息
const authorInfo = computed(() => dynamicData.value?.modules.module_author)
// 动态信息
const dynamicInfo = computed(() => dynamicData.value?.modules.module_dynamic)

// 九宫格图拼接后数据
const ninePicData = ref('')

const fetchData = async (paramID: string) => {
  loading.value = true
  dynamicID.value = paramID
  ninePicData.value = ''

  const url = new URL('https://api.bilibili.com/x/polymer/web-dynamic/v1/detail')
  url.searchParams.set('id', paramID)
  url.searchParams.set('features', 'itemOpusStyle')

  let data: DynamicInfo
  try {
    const resp = await APIFetch<{ item: DynamicInfo }>(url, undefined, {
      debug: {
        name: '动态信息',
        extraParams: { id: '动态ID' },
      }
    })

    data = resp.data.item
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取动态信息出错：${e}`,
      type: 'error',
    })
    loading.value = false
    return
  }

  dynamicData.value = data
  loading.value = false
}

watch(() => route.params.id, fetchData, { immediate: true })

// 动态内容，{ rich_text_node: RichTextNode[], text: string}
const dynamicContent = computed(() => {
  if (dynamicInfo.value?.desc) {
    return dynamicInfo.value.desc
  }
  return dynamicInfo.value?.major?.opus?.summary
})

// 是否为转发动态
const isForward = computed(() => dynamicData.value?.type === 'DYNAMIC_TYPE_FORWARD')
// 原动态ID
const originalDynamicID = computed(() => dynamicData.value?.orig?.id_str)

const BVID = computed(() => dynamicInfo.value?.major?.archive.bvid)
const videoTitle = computed(() => dynamicInfo.value?.major?.archive.title)
const videoCover = computed(() => dynamicInfo.value?.major?.archive.cover)
const videoDesc = computed(() => dynamicInfo.value?.major?.archive.desc)

// 是否有话题
const hasTopic = computed(() => dynamicInfo.value?.topic?.id ?? -1 > 0)
// 动态话题
const dynamicTopic = computed(() => dynamicInfo.value?.topic)

// 动态@的用户
const atUsers = computed<AtTextNode[]>(() => dynamicContent.value
        ?.rich_text_nodes
        .filter(n => n.type === 'RICH_TEXT_NODE_TYPE_AT') as AtTextNode[]
    ?? []
)

const desc: Record<DynamicTypes, string> = {
  DYNAMIC_TYPE_WORD: '文本',
  DYNAMIC_TYPE_DRAW: '图文',
  DYNAMIC_TYPE_FORWARD: '转发',
  DYNAMIC_TYPE_AV: '视频投稿',
  DYNAMIC_TYPE_ARTICLE: '专栏投稿',
  DYNAMIC_TYPE_LIVE: '直播间分享',
  DYNAMIC_TYPE_LIVE_RCMD: '开播通知',
}
const dynamicType = computed(() => dynamicData.value?.type)
const dynamicTypeDesc = computed(() => (dynamicType.value && desc[dynamicType.value]) ?? 'UNKNOWN')

// 用户是否有装扮
const hasDecoration = computed(() => authorInfo.value?.decorate !== undefined)

// 装扮描述文本，显示用
const decorateDescription = computed(() => {
  const type = resolveText(authorInfo.value?.decorate?.jump_url)
  if (type === 'suit' && authorInfo.value?.decorate?.fan.is_fan) {
    return '粉丝装扮'
  } else if (type === 'lottery') {
    return '收藏集'
  }
  return '装扮'
})

const generateDownloadTask = () => {
  const task: BatchDownloadTask = {
    name: '动态' + dynamicID.value + '图片',
    files: [],
  }

  pictures.value.forEach((p, index) => {
    task.files.push({
      path: '动态' + dynamicID.value + '图片' + sep() + '图片' + (index + 1),
      url: p.url,
    })
  })

  return task
}


const pictures = computed(() => dynamicInfo.value?.major?.opus?.pics ?? [])
const pictureLinks = computed(() => pictures.value.map(p => p.url))
const ninePicRenderCanvasRef = ref<HTMLCanvasElement>()
// 九宫格判定
const is9Pic = computed(() => {
  if (pictures.value.length < 9) return false

  // 根据观察得来的规律，暂且认为拥有至少9张图，且第一、二、三列图片宽度相同的动态为九宫格动态
  const w = pictures.value.map(p => p.width)
  return w[0] === w[3] && w[3] === w[6]
      && w[1] === w[4] && w[4] === w[7]
      && w[2] === w[5] && w[5] === w[8]
})

const ninePicLoading = ref(false)
const connect9Pic = async () => {
  ninePicLoading.value = true
  const canvas = ninePicRenderCanvasRef.value
  const ctx = ninePicRenderCanvasRef.value?.getContext('2d') as CanvasRenderingContext2D
  if (!canvas || !ctx || !is9Pic.value) return

  const pics = pictures.value

  const wArray = pics.map(p => p.width)
  const w = wArray.slice(0, 3).reduce((acc, curr) => curr + acc, 0)
  const hArray = [
    Math.min(pics[0].height, pics[1].height, pics[2].height),
    Math.min(pics[3].height, pics[4].height, pics[5].height),
    Math.min(pics[6].height, pics[7].height, pics[8].height),
  ]
  const h = hArray.reduce((acc, curr) => acc + curr, 0)

  canvas.width = w
  canvas.height = h

  const imageBitmaps = await Promise.all(
      pics.map(p => fetch(p.url.replace('http://', 'https://'))
          .then(d => d.blob())
          .then(b => createImageBitmap(b)))
  )

  imageBitmaps.forEach((bitmap, index) => {
    const x = (wArray[index % 3 - 1] ?? 0) + (wArray[index % 3 - 2] ?? 0)
    const y = (hArray[Math.floor(index / 3) - 1] ?? 0) + (hArray[Math.floor(index / 3) - 2] ?? 0)
    const imgW = wArray[index]
    const imgH = hArray[Math.floor(index / 3)]

    ctx.drawImage(bitmap, 0, 0, imgW, imgH, x, y, imgW, imgH)
  })

  ninePicData.value = canvas.toDataURL()
  ninePicLoading.value = false
}

const jump = async () => {
  await autoJump(authorInfo.value?.decorate?.jump_url, true)
}

</script>
<template>
  <div v-loading="loading">
    <ElDescriptions
      v-if="!loading"
      :column="2"
      border
    >
      <template #title>
        <ElLink
          :href="`https://t.bilibili.com/${dynamicID}`"
          target="_blank"
          type="primary"
        >
          动态信息
        </ElLink>
      </template>

      <!-- 调试信息 -->
      <template #extra>
        <DebugButton :names="['动态信息']" />
        <BatchDownloadButton
          v-if="pictures.length > 1"
          :task="generateDownloadTask"
        />
      </template>

      <!-- UP主信息 -->
      <ElDescriptionsItem
        label="UP主"
        min-width="100px"
      >
        <UPInfo
          :face="authorInfo?.face"
          :mid="authorInfo?.mid?.toString() ?? ''"
          :name="authorInfo?.name"
        />
      </ElDescriptionsItem>

      <!-- 收藏集/装扮信息展示 -->
      <ElDescriptionsItem
        :label="decorateDescription"
        v-if="hasDecoration && ((authorInfo?.decorate?.name ?? '').length > 0)"
      >
        <div class="flex items-center">
          <ElLink
            type="primary"
            @click="jump"
          >
            {{ authorInfo?.decorate?.name }}
          </ElLink>
          <span
            v-if="authorInfo?.decorate?.fan.is_fan"
            :style="{color: authorInfo?.decorate?.fan.color}"
            class="ml-auto translate-x-24 z-50 font-bold select-none"
          >{{ authorInfo.decorate.fan.num_str }}</span>
          <ElImage
            v-if="hasDecoration"
            :class="authorInfo?.decorate?.fan.is_fan ? 'h-12 select-none' : 'ml-auto h-12 select-none'"
            :src="authorInfo?.decorate?.card_url"
            referrerpolicy="no-referrer"
          />
        </div>
      </ElDescriptionsItem>

      <!-- 动态类型 -->
      <ElDescriptionsItem
        :span="2"
        label="类型"
      >
        {{ dynamicTypeDesc }}
      </ElDescriptionsItem>

      <!-- 动态标题 -->
      <ElDescriptionsItem
        v-if="dynamicInfo?.major?.opus?.title"
        :span="2"
        label="标题"
      >
        <span class="font-bold">{{ dynamicInfo?.major?.opus?.title ?? '无' }}</span>
      </ElDescriptionsItem>

      <!-- 动态内容 -->
      <ElDescriptionsItem
        :span="2"
        label="内容"
      >
        <span class="whitespace-pre-wrap">{{ dynamicContent?.text }}</span>
      </ElDescriptionsItem>

      <!-- @的用户 -->
      <ElDescriptionsItem
        v-if="atUsers.length > 0"
        :span="2"
        label="@的用户"
      >
        <UPInfo
          v-for="user in atUsers"
          :key="user.rid"
          :mid="user.rid"
          :name="user.text"
          type="at"
        />
      </ElDescriptionsItem>

      <!-- 话题 -->
      <ElDescriptionsItem
        v-if="hasTopic"
        :span="2"
        label="话题"
      >
        <ElLink
          :href="dynamicTopic?.jump_url"
          target="_blank"
          type="primary"
        >
          #{{ dynamicTopic?.name }}#
        </ElLink>
      </ElDescriptionsItem>

      <!-- 转发动态的原动态信息 -->
      <ElDescriptionsItem
        v-if="isForward"
        :span="2"
        label="原动态"
      >
        <RouterLink :to="`/dynamic/${originalDynamicID}`">
          <ElLink type="primary">
            点击查看
          </ElLink>
        </RouterLink>
      </ElDescriptionsItem>

      <!-- 视频投稿解析 -->
      <ElDescriptionsItem
        v-if="dynamicType === 'DYNAMIC_TYPE_AV'"
        label="视频投稿"
      >
        <VideoCard
          :bvid="BVID"
          :title="videoTitle"
          :desc="videoDesc"
          :cover="videoCover"
        />
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 九宫格动态拼接 -->
    <div v-if="is9Pic">
      <ElText
        size="small"
      >
        该动态可能是一个九宫格动态，
        <ElLink
          type="primary"
          size="small"
          @click="connect9Pic"
          v-loading="ninePicLoading"
          v-if="ninePicData.length === 0"
        >
          尝试拼接九宫格图片
        </ElLink>
        <ElLink
          type="success"
          v-else
        >
          拼接成功！
        </ElLink>
      </ElText>
      <canvas
        class="hidden"
        ref="ninePicRenderCanvasRef"
      />
    </div>

    <CustomDivider v-if="ninePicData.length > 0">
      九宫格拼接图
    </CustomDivider>
    <ElSpace
      class="w-full justify-center"
      v-if="ninePicData.length > 0"
      wrap
    >
      <ImageVideoCard
        :image="ninePicData"
        title="九宫格拼接图"
        :download-name="`动态${dynamicID} - 九宫格拼接图`"
        suffix="png"
      />
    </ElSpace>

    <!-- 动态图片 -->
    <CustomDivider v-if="pictureLinks?.length ?? 0 > 0">
      动态配图
    </CustomDivider>
    <ElSpace
      class="w-full justify-center"
      wrap
    >
      <ImageVideoCard
        v-for="(image, index) in pictureLinks"
        :key="image"
        :download-name="image.split('/').pop()"
        :image="image"
        :index="index"
        :preview-images="pictureLinks"
      />
    </ElSpace>
  </div>
</template>