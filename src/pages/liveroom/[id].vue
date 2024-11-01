<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import {
  BasicLiveUserInfo,
  BasicRoomInfo,
  BatchDownloadTask,
  ExtremelyDetailedRoomInfo,
  LiveroomEmojiListInfo
} from "../../types.ts";
import { userLoggedIn } from "../../utils/loginManager.ts";
import { sep } from "@tauri-apps/api/path";

const route = useRoute<'/liveroom/[id]'>()
const loading = ref(false)

const detailedRoomInfo = ref<ExtremelyDetailedRoomInfo>()
const basicRoomInfo = ref<BasicRoomInfo>()
const liveroomUserInfo = ref<BasicLiveUserInfo>()
const liveroomEmojis = ref<LiveroomEmojiListInfo[]>()

const debugRequestNames = ref<string[]>([])

const userName = computed(() => detailedRoomInfo.value?.anchor_info?.base_info?.uname ?? liveroomUserInfo.value?.info.uname)
const backgroundImage = computed(() => detailedRoomInfo.value?.room_info?.background ?? basicRoomInfo.value?.background)
const appBackgroundImage = computed(() => detailedRoomInfo.value?.room_info?.app_background)
const coverImage = computed(() => detailedRoomInfo.value?.room_info?.cover ?? basicRoomInfo.value?.user_cover)
const keyframeImage = computed(() => detailedRoomInfo.value?.room_info?.keyframe ?? basicRoomInfo.value?.keyframe)
const liveroomTitle = computed(() => detailedRoomInfo.value?.room_info?.title ?? basicRoomInfo.value?.title)
const liveroomDescription = computed(() => detailedRoomInfo.value?.room_info?.description ?? basicRoomInfo.value?.description)
const roomNews = computed(() => detailedRoomInfo.value?.room_info?.room_news?.news_content ?? liveroomUserInfo.value?.room_news?.content)
const roomNewsUpdateTime = computed(() => liveroomUserInfo.value?.room_news?.ctime_text)
const areaType = computed(() => detailedRoomInfo.value?.room_info?.area_name ?? basicRoomInfo.value?.area_name)
const roomTags = computed<string[]>(() => detailedRoomInfo.value?.room_info.tags?.split(',') ?? basicRoomInfo.value?.tags?.split(',') ?? [])
const uid = computed(() => detailedRoomInfo.value?.room_info.uid ?? basicRoomInfo.value?.uid ?? 0)
const medalName = computed(() => detailedRoomInfo.value?.anchor_info?.medal_info?.medal_name ?? liveroomUserInfo.value?.medal_name)
const fansNum = computed(() => detailedRoomInfo.value?.anchor_info?.relation_info?.attention ?? liveroomUserInfo.value?.follower_num)
const roomID = ref('')

// 为什么这里不能自动推断出类型？
const upEmoji = computed<LiveroomEmojiListInfo | undefined>(() => liveroomEmojis.value?.find(e => e.pkg_name === 'UP主大表情') ?? undefined)
const roomEmoji = computed<LiveroomEmojiListInfo | undefined>(() => liveroomEmojis.value?.find(e => e.pkg_name === '房间专属表情') ?? undefined)

const generateDownloadTask = () => {
  const task: BatchDownloadTask = {
    name: `${roomID.value} 直播间图片`,
    files: []
  }

  if (coverImage.value) {
    task.files.push({ path: `${userName.value}直播间${sep()}封面`, url: coverImage.value })
  }

  if (backgroundImage.value) {
    task.files.push({ path: `${userName.value}直播间${sep()}网页端背景图`, url: backgroundImage.value ?? '' })
  }

  if (appBackgroundImage.value) {
    task.files.push({ path: `${userName.value}直播间${sep()}App端背景图`, url: appBackgroundImage.value ?? '' })
  }

  if (keyframeImage.value) {
    task.files.push({ path: `${userName.value}直播间${sep()}关键帧`, url: keyframeImage.value })
  }

  upEmoji.value?.emoticons.forEach(e => {
    task.files.push({
      path: `${userName.value}直播间${sep()}UP主大表情${sep()}${e.emoji}`,
      url: e.url
    })
  })

  roomEmoji.value?.emoticons.forEach(e => {
    task.files.push({
      path: `${userName.value}直播间${sep()}房间专属表情${sep()}${e.emoji}`,
      url: e.url
    })
  })

  return task
}

const fetchData = async (paramID: string) => {
  loading.value = true
  roomID.value = paramID

  detailedRoomInfo.value = undefined
  basicRoomInfo.value = undefined
  liveroomUserInfo.value = undefined
  liveroomEmojis.value = undefined
  debugRequestNames.value = []

  try {
    // 移动端详细直播间信息
    const url = new URL('https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByRoom')
    url.searchParams.set('room_id', roomID.value)
    url.searchParams.set('device', 'android')
    url.searchParams.set('platform', 'android')
    debugRequestNames.value.push('详细直播间信息')
    const resp = await APIFetch<ExtremelyDetailedRoomInfo>(url, undefined, {
      appSign: true,
      debug: {
        name: '详细直播间信息',
        extraParams: {
          room_id: '直播间号',
        }
      }
    })
    detailedRoomInfo.value = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取详细直播间信息出错：${e}`,
      type: 'error',
    })
  }

  // 若无法使用app端直播间信息api，再考虑使用网页端API获取
  if (!detailedRoomInfo.value) {
    // 房间信息
    const url = new URL('https://api.live.bilibili.com/room/v1/Room/get_info')
    url.searchParams.set('room_id', roomID.value)

    debugRequestNames.value.push('直播间信息')
    try {
      const resp = await APIFetch<BasicRoomInfo>(url, undefined, {
        debug: {
          name: '直播间信息',
          extraParams: { room_id: '直播间ID' },
        }
      })
      basicRoomInfo.value = resp.data
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取直播间信息出错：${e}`,
        type: 'error',
      })
      loading.value = false
      return null
    }

    // 额外信息获取
    const url2 = new URL('https://api.live.bilibili.com/live_user/v1/Master/info')
    url2.searchParams.set('uid', uid.value?.toString() ?? '')

    debugRequestNames.value.push('直播间用户信息')
    try {
      const resp = await APIFetch<BasicLiveUserInfo>(url2, undefined, {
        debug: {
          name: '直播间用户信息',
          extraParams: { uid: '用户UID' },
        }
      })
      liveroomUserInfo.value = resp.data
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取直播间用户信息出错：${JSON.stringify(e)}`,
        type: 'error',
      })
    }

  }

  if (userLoggedIn.value) {
    // 直播间表情获取
    const url3 = new URL('https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons')
    url3.searchParams.set('platform', 'pc')
    url3.searchParams.set('room_id', roomID.value)

    debugRequestNames.value.push('直播间表情信息')
    try {
      const resp = await APIFetch<{ data: LiveroomEmojiListInfo[] }>(url3, undefined, {
        debug: {
          name: '直播间表情信息',
          extraParams: { room_id: '直播间ID' },
        }
      })
      liveroomEmojis.value = resp.data.data
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取直播间表情信息出错：${JSON.stringify(e)}`,
        type: 'error',
      })
    }
  }

  loading.value = false
}
watch(() => route.params.id, fetchData, { immediate: true })

const previewImages = computed(() => {
  return [coverImage.value, backgroundImage.value, appBackgroundImage.value, keyframeImage.value]
      .filter(i => (i?.length ?? 0) > 0) as string[]
})

const hasImages = computed(() => previewImages.value.length > 0)

</script>

<template>
  <div v-loading="loading">
    <ElDescriptions
      :column="2"
      border
    >
      <template #title>
        <div class="flex gap-1">
          <ElText>
            直播间 {{ roomID }} 基础信息
          </ElText>
        </div>
      </template>

      <template #extra>
        <DebugButton :names="debugRequestNames" />

        <BatchDownloadButton :task="generateDownloadTask" />
      </template>

      <ElDescriptionsItem
        label="标题"
        min-width="100px"
      >
        <ElLink
          :href="`https://live.bilibili.com/${roomID}`"
          target="_blank"
          type="primary"
        >
          {{ liveroomTitle }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        label="分区"
        min-width="100px"
      >
        {{ areaType }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="简介"
        v-if="(liveroomDescription?.length ?? 0) > 0"
      >
        <div class="whitespace-pre-wrap max-h-24 hover:max-h-screen overflow-y-auto transition-all duration-500">
          {{ liveroomDescription }}
        </div>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="1"
        label="标签"
      >
        <ElSpace
          v-if="(roomTags[0]?.length ?? 0) > 0"
          wrap
        >
          <ElTag
            v-for="tag in roomTags"
            :key="tag"
          >
            {{ tag }}
          </ElTag>
        </ElSpace>
        <ElText v-else>
          无
        </ElText>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="1"
        label="粉丝数"
      >
        {{ fansNum }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="medalName"
        :span="2"
        label="粉丝牌"
      >
        <ElTag
          round
          size="large"
          type="success"
        >
          {{ medalName }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="roomNews"
        :span="2"
        label="直播间公告"
      >
        <div class="whitespace-pre-wrap max-h-8 hover:max-h-64 overflow-y-auto transition-all duration-500">
          {{ roomNews }}
        </div>
        <br>
        <ElText
          size="small"
          v-if="roomNewsUpdateTime"
        >
          {{ roomNewsUpdateTime }}更新
        </ElText>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="主播信息"
      >
        <UPInfo
          v-if="uid"
          :mid="uid.toString()"
        />
      </ElDescriptionsItem>
    </ElDescriptions>

    <template v-if="hasImages">
      <CustomDivider>直播间相关图片</CustomDivider>
      <ElSpace
        class="w-full justify-center"
        direction="vertical"
      >
        <ElSpace
          class="justify-center"
          wrap
        >
          <ImageVideoCard
            v-if="coverImage"
            :download-name="`${userName} - 直播间封面`"
            :image="coverImage"
            title="直播间封面"
          />
          <ImageVideoCard
            v-if="backgroundImage"
            :download-name="`${userName} - 网页端直播间背景图`"
            :image="backgroundImage"
            title="网页端直播间背景图"
          />
          <ImageVideoCard
            v-if="appBackgroundImage"
            :download-name="`${userName} - App端直播间背景图`"
            :image="appBackgroundImage"
            title="App端直播间背景图"
          />
          <ImageVideoCard
            v-if="keyframeImage != ''"
            :download-name="`${userName} - 直播间关键帧`"
            :image="keyframeImage"
            title="直播间关键帧"
          />
        </ElSpace>
      </ElSpace>
    </template>

    <CustomDivider v-if="!userLoggedIn">
      直播间表情
    </CustomDivider>
    <LoginRequired>
      <div v-if="upEmoji !== undefined">
        <CustomDivider>UP主大表情</CustomDivider>
        <ElSpace
          class="justify-center w-full"
          wrap
        >
          <ImageVideoCard
            v-for="(emoji, index) in upEmoji.emoticons"
            :key="emoji.emoticon_unique"
            :index="index"
            :image="emoji.url"
            :preview-images="upEmoji.emoticons.map(e => e.url)"
            :title="emoji.emoji"
            :download-name="`${userName}UP主大表情 - ${emoji.emoji}`"
            :subtitle="emoji.unlock_show_text"
          />
        </ElSpace>
      </div>
      <div v-if="roomEmoji !== undefined">
        <CustomDivider>房间专属表情</CustomDivider>
        <ElSpace
          class="justify-center w-full"
          wrap
        >
          <ImageVideoCard
            v-for="(emoji, index) in roomEmoji.emoticons"
            :key="emoji.emoticon_unique"
            :index="index"
            :image="emoji.url"
            :preview-images="roomEmoji.emoticons.map(e => e.url)"
            :title="emoji.emoji"
            :download-name="`${userName}房间专属表情 - ${emoji.emoji}`"
          />
        </ElSpace>
      </div>
    </LoginRequired>
  </div>
</template>
