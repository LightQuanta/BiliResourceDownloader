<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import { BasicLiveUserInfo, BasicRoomInfo } from "../../types.ts";

const route = useRoute<'/liveroom/[id]'>()

const loading = ref(false)

const backgroundImage = ref('')
const coverImage = ref('')
const keyframeImage = ref('')
const liveroomTitle = ref('')
const liveroomDescription = ref('')
const areaType = ref('')
const roomId = ref('')
const roomTags = ref<string[]>([])
const uid = ref('')

const apiUrl = ref('')
const responseText = ref('')

const liveroomUserInfo = ref<BasicLiveUserInfo>()

const fetchData = async (paramID: string) => {
  loading.value = true
  roomId.value = paramID

  const url = new URL('https://api.live.bilibili.com/room/v1/Room/get_info')
  url.searchParams.set('room_id', roomId.value)

  apiUrl.value = url.toString()

  let data: BasicRoomInfo
  try {
    const resp = await cachedAPIFetch(url)
    data = resp.data as BasicRoomInfo
    responseText.value = JSON.stringify(resp, null, 2)
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取直播间信息出错：${e}`,
      type: 'error',
    })
    loading.value = false
    return null
  }

  const { description, title, background, user_cover, keyframe, area_name, tags, uid: userId } = data

  backgroundImage.value = background
  coverImage.value = user_cover
  keyframeImage.value = keyframe
  liveroomTitle.value = title
  liveroomDescription.value = description
  areaType.value = area_name
  uid.value = userId.toString()
  roomTags.value = tags.split(',')

  // 额外信息获取
  const url2 = new URL('https://api.live.bilibili.com/live_user/v1/Master/info')
  url2.searchParams.set('uid', uid.value)

  try {
    const resp = await cachedAPIFetch(url2)
    liveroomUserInfo.value = resp.data as BasicLiveUserInfo
    // responseText.value = JSON.stringify(resp, null, 2)
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取额外直播间信息出错：${e}`,
      type: 'error',
    })
  }

  loading.value = false
}
watch(() => route.params.id, fetchData, { immediate: true })

const previewImages = computed(() => {
  let images = [backgroundImage.value, coverImage.value]
  if (keyframeImage.value) images.push(keyframeImage.value)
  return images
})

const hasImages = computed(() => backgroundImage.value || coverImage.value || keyframeImage.value)

const showDebugDrawer = ref(false)
const showDebugInfo = () => {
  showDebugDrawer.value = true
}
</script>

<template>
  <div v-loading="loading">
    <!-- TODO 什么b玩意丑死了，谁能帮忙改改UI -->
    <ElDescriptions border :column="2">

      <template #title>
        <div class="flex gap-1">
          <ElText>直播间</ElText>
          <ElLink type="primary" :href="`https://live.bilibili.com/${roomId}`" target="_blank">{{ roomId }}</ElLink>
          <ElText>基础信息</ElText>
        </div>
      </template>

      <template #extra>
        <ElButton @click="showDebugInfo">显示调试信息</ElButton>
        <!-- 调试信息 -->
        <!-- TODO 多API链接支持 -->
        <ElDrawer v-model="showDebugDrawer"
                  title="调试信息"
                  size="60%"
        >
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="API调用地址">
              <ElLink type="primary" :href="apiUrl" target="_blank">{{ apiUrl }}</ElLink>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="直播间号">
              {{ route.params.id }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="用户UID">
              {{ uid }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElDivider>原始返回数据</ElDivider>
          <ElInput v-model="responseText"
                   type="textarea"
                   readonly
                   aria-multiline="true"
                   autosize
          />
        </ElDrawer>
      </template>

      <ElDescriptionsItem label="标题" min-width="80px">{{ liveroomTitle }}</ElDescriptionsItem>
      <ElDescriptionsItem label="分区" min-width="80px">{{ areaType }}</ElDescriptionsItem>
      <ElDescriptionsItem label="简介" :span="2">{{ liveroomDescription }}</ElDescriptionsItem>
      <ElDescriptionsItem label="标签" :span="2">
        <ElSpace wrap v-if="(roomTags[0]?.length ?? 0) > 0">
          <ElTag v-for="tag in roomTags" :key="tag">{{ tag }}</ElTag>
        </ElSpace>
        <ElText v-else>无</ElText>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="粉丝牌" :span="2" v-if="liveroomUserInfo?.medal_name">
        <ElTag type="success" size="large" round>{{ liveroomUserInfo?.medal_name }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="直播间公告" :span="2" v-if="liveroomUserInfo?.room_news?.content.length ?? 0 > 0">
        <span class="whitespace-pre-wrap">
          {{ liveroomUserInfo?.room_news.content }}
        </span>
        <br/>
        <ElText size="small">{{ liveroomUserInfo?.room_news.ctime_text }}更新</ElText>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="主播信息" :span="2">
        <UPInfo :mid="uid"/>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template v-if="hasImages">
      <ElDivider>直播间相关图片</ElDivider>
      <ElSpace direction="vertical" class="w-full justify-center">
        <ElSpace wrap class="justify-center">
          <ImageCard v-if="backgroundImage"
                     :image="backgroundImage"
                     title="网页端直播间背景图"
                     :preview-images="previewImages"
                     :index="0"
                     :download-name="`直播间背景图 - ${route.params.id}`"
          />
          <ImageCard v-if="coverImage"
                     :image="coverImage"
                     title="直播间封面"
                     :preview-images="previewImages"
                     :index="1"
                     :download-name="`直播间封面 - ${route.params.id}`"
          />
          <ImageCard v-if="keyframeImage != ''"
                     :image="keyframeImage"
                     title="直播间关键帧"
                     :preview-images="previewImages"
                     :index="2"
                     :download-name="`直播间关键帧 - ${route.params.id}`"
          />
        </ElSpace>
      </ElSpace>
    </template>
  </div>
</template>
