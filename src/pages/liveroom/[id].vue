<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import { BasicLiveUserInfo, BasicRoomInfo, BatchDownloadTask, LiveroomEmojiListInfo } from "../../types.ts";
import { userLoggedIn } from "../../utils/loginManager.ts";
import { sep } from "@tauri-apps/api/path";

const route = useRoute<'/liveroom/[id]'>()

const loading = ref(false)

const backgroundImage = ref('')
const coverImage = ref('')
const keyframeImage = ref('')
const liveroomTitle = ref('')
const liveroomDescription = ref('')
const areaType = ref('')
const roomID = ref('')
const roomTags = ref<string[]>([])
const uid = ref('')

const liveroomUserInfo = ref<BasicLiveUserInfo>()

const liveroomEmojis = ref<LiveroomEmojiListInfo[]>()
const upEmoji = computed<LiveroomEmojiListInfo | undefined>(() => liveroomEmojis.value?.find(e => e.pkg_name === 'UP主大表情') ?? undefined)
const roomEmoji = computed<LiveroomEmojiListInfo | undefined>(() => liveroomEmojis.value?.find(e => e.pkg_name === '房间专属表情') ?? undefined)

const generateDownloadTask = () => {
  const task: BatchDownloadTask = {
    name: `${roomID.value} 直播间图片`,
    files: []
  }

  if (backgroundImage.value) {
    task.files.push({ path: `${liveroomUserInfo.value?.info.uname}直播间${sep()}背景图`, url: backgroundImage.value })
  }

  if (coverImage.value) {
    task.files.push({ path: `${liveroomUserInfo.value?.info.uname}直播间${sep()}封面`, url: coverImage.value })
  }

  if (keyframeImage.value) {
    task.files.push({ path: `${liveroomUserInfo.value?.info.uname}直播间${sep()}关键帧`, url: keyframeImage.value })
  }

  upEmoji.value?.emoticons.forEach(e => {
    task.files.push({
      path: `${liveroomUserInfo.value?.info.uname}直播间${sep()}UP主大表情${sep()}${e.emoji}`,
      url: e.url
    })
  })

  roomEmoji.value?.emoticons.forEach(e => {
    task.files.push({
      path: `${liveroomUserInfo.value?.info.uname}直播间${sep()}房间专属表情${sep()}${e.emoji}`,
      url: e.url
    })
  })

  return task
}

const fetchData = async (paramID: string) => {
  loading.value = true
  roomID.value = paramID

  const url = new URL('https://api.live.bilibili.com/room/v1/Room/get_info')
  url.searchParams.set('room_id', roomID.value)

  let data: BasicRoomInfo
  try {
    const resp = await APIFetch<BasicRoomInfo>(url, undefined, {
      debug: {
        name: '直播间信息',
        extraParams: { room_id: '直播间ID' },
      }
    })
    data = resp.data
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
    const resp = await APIFetch<BasicLiveUserInfo>(url2, null, {
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

  if (userLoggedIn.value) {
    const url3 = new URL('https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons')
    url3.searchParams.set('platform', 'pc')
    url3.searchParams.set('room_id', roomID.value)

    try {
      const resp = await APIFetch<{ data: LiveroomEmojiListInfo[] }>(url3, null, {
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
  let images = [backgroundImage.value, coverImage.value]
  if (keyframeImage.value) images.push(keyframeImage.value)
  return images
})

const hasImages = computed(() => backgroundImage.value || coverImage.value || keyframeImage.value)

</script>

<template>
  <div v-loading="loading">
    <!-- TODO 什么b玩意丑死了，谁能帮忙改改UI -->
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
        <DebugButton :names="['直播间信息','直播间用户信息', '直播间表情信息']" />

        <BatchDownloadButton :task="generateDownloadTask" />
      </template>

      <ElDescriptionsItem
        label="标题"
        min-width="80px"
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
        min-width="80px"
      >
        {{ areaType }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="简介"
      >
        {{ liveroomDescription }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
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
        v-if="liveroomUserInfo?.medal_name"
        :span="2"
        label="粉丝牌"
      >
        <ElTag
          round
          size="large"
          type="success"
        >
          {{ liveroomUserInfo?.medal_name }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="liveroomUserInfo?.room_news?.content.length ?? 0 > 0"
        :span="2"
        label="直播间公告"
      >
        <span class="whitespace-pre-wrap">
          {{ liveroomUserInfo?.room_news.content }}
        </span>
        <br>
        <ElText size="small">
          {{ liveroomUserInfo?.room_news.ctime_text }}更新
        </ElText>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="主播信息"
      >
        <UPInfo :mid="uid" />
      </ElDescriptionsItem>
    </ElDescriptions>

    <template v-if="hasImages">
      <ElDivider>直播间相关图片</ElDivider>
      <ElSpace
        class="w-full justify-center"
        direction="vertical"
      >
        <ElSpace
          class="justify-center"
          wrap
        >
          <ImageVideoCard
            v-if="backgroundImage"
            :download-name="`${liveroomUserInfo?.info.uname} - 直播间背景图`"
            :image="backgroundImage"
            :index="0"
            :preview-images="previewImages"
            title="网页端直播间背景图"
          />
          <ImageVideoCard
            v-if="coverImage"
            :download-name="`${liveroomUserInfo?.info.uname} - 直播间封面`"
            :image="coverImage"
            :index="1"
            :preview-images="previewImages"
            title="直播间封面"
          />
          <ImageVideoCard
            v-if="keyframeImage != ''"
            :download-name="`${liveroomUserInfo?.info.uname} - 直播间关键帧`"
            :image="keyframeImage"
            :index="2"
            :preview-images="previewImages"
            title="直播间关键帧"
          />
        </ElSpace>
      </ElSpace>
    </template>

    <ElDivider v-if="!userLoggedIn">
      直播间表情
    </ElDivider>
    <LoginRequired>
      <div v-if="upEmoji !== undefined">
        <ElDivider>UP主大表情</ElDivider>
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
            :download-name="`${liveroomUserInfo?.info.uname}UP主大表情 - ${emoji.emoji}`"
            :subtitle="emoji.unlock_show_text"
          />
        </ElSpace>
      </div>
      <div v-if="roomEmoji !== undefined">
        <ElDivider>房间专属表情</ElDivider>
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
            :download-name="`${liveroomUserInfo?.info.uname}房间专属表情 - ${emoji.emoji}`"
          />
        </ElSpace>
      </div>
    </LoginRequired>
  </div>
</template>
