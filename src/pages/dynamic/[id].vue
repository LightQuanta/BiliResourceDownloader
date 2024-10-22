<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import { AtTextNode, DynamicInfo, DynamicTypes } from "../../types.ts";
import { autoJump, resolveText } from "../../linkResolver.ts";
import { setDebugInfo } from "../../utils/debug.ts";

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

const fetchData = async (paramID: string) => {
  loading.value = true
  dynamicID.value = paramID

  const url = new URL('https://api.bilibili.com/x/polymer/web-dynamic/v1/detail')
  url.searchParams.set('id', paramID)
  url.searchParams.set('features', 'itemOpusStyle')

  let data: DynamicInfo
  try {
    const resp = await cachedAPIFetch<{ item: DynamicInfo }>(url)
    setDebugInfo('动态信息', url, JSON.stringify(resp, null, 2), { id: '动态ID' })

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

const pictureLinks = computed(() => dynamicInfo.value?.major?.opus?.pics?.map(p => p.url))

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
      </template>

      <!-- UP主信息 -->
      <ElDescriptionsItem
        label="UP主"
        min-width="80px"
      >
        <UPInfo
          :face="authorInfo?.face"
          :mid="authorInfo?.mid?.toString() ?? ''"
          :name="authorInfo?.name"
        />
      </ElDescriptionsItem>

      <!-- 收藏集/装扮信息展示 -->
      <ElDescriptionsItem :label="decorateDescription">
        <div class="flex items-center">
          <ElLink
            v-if="hasDecoration"
            type="primary"
            @click="jump"
          >
            {{ authorInfo?.decorate?.name ?? '无' }}
          </ElLink>
          <template v-else>
            无
          </template>
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

      <ElDescriptionsItem
        :span="2"
        label="类型"
      >
        {{ dynamicTypeDesc }}
      </ElDescriptionsItem>
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
        <div class="flex justify-start">
          <RouterLink
            :to="`/video/${BVID}`"
            class="flex items-stretch justify-start"
          >
            <ElImage
              :src="videoCover"
              class="h-36"
              referrerpolicy="no-referrer"
            />
            <div class="h-36 w-72 border text-wrap rounded-r-md p-2">
              <ElText class="font-bold">
                {{ videoTitle }}
              </ElText>
              <div class="text-wrap overflow-hidden h-16 text-ellipsis">
                {{ videoDesc }}
              </div>
            </div>
          </RouterLink>
        </div>
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider v-if="pictureLinks?.length ?? 0 > 0">
      动态配图
    </ElDivider>
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