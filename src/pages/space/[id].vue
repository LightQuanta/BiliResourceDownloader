<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import {
  BasicLiveUserInfo,
  BasicUserInfo,
  BatchDownloadTask,
  ChargeEmojiInfo,
  GeneralAPIResponse,
  PowerRights,
  SuitDetail
} from "../../types.ts";
import { sep } from "@tauri-apps/api/path";
import { autoJump } from "../../linkResolver.ts";
import DebugButton from "../../components/DebugButton.vue";
import { setDebugInfo } from "../../utils/debug.ts";

const route = useRoute<'/space/[id]'>()
const loading = ref(false)

const uid = computed(() => route.params.id)
const roomID = ref('')

const apiUrl = ref('')
const responseText = ref('')

const userInfo = ref<BasicUserInfo>()
const chargeEmojiInfo = ref<ChargeEmojiInfo[]>([])

const generateDownloadTask = () => {
  const userName = userInfo.value?.card.name
  const task: BatchDownloadTask = {
    name: userInfo.value?.card.name ?? '',
    files: [],
  }

  task.files.push({
    path: `${userName}空间${sep()}头像`,
    url: userInfo.value?.card.face ?? '',
  })

  if (hasPendant.value) {
    task.files.push({
      path: `头像框 - ${userInfo.value?.card.pendant?.name}`,
      url: userInfo.value?.card.pendant?.image_enhance ?? '',
    })
  }

  if (userInfo.value?.space.l_img) {
    task.files.push({
      path: `${userName}空间${sep()}网页端空间背景图`,
      url: userInfo.value?.space.l_img ?? '',
    })
  }

  if (chargeEmojiInfo.value?.length ?? 0 > 0) {
    task.files.push(...chargeEmojiInfo.value.map(emoji => ({
      path: `${userName}空间${sep()}充电表情${sep()}${emoji.name}`,
      url: emoji.icon,
    })))
  }

  return task
}

const fetchData = async () => {
  loading.value = true
  const url = new URL('https://api.bilibili.com/x/web-interface/card')
  url.searchParams.set('mid', uid.value)
  url.searchParams.set('photo', 'true')

  apiUrl.value = url.toString()

  let basicUserInfo: BasicUserInfo
  try {
    const resp = await cachedAPIFetch<BasicUserInfo>(url)
    basicUserInfo = resp.data
    setDebugInfo('用户空间信息', url, JSON.stringify(resp, null, 2), { mid: '用户UID' })
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取UP主信息出错：${e}`,
      type: 'error',
    })
    loading.value = false
    return
  }

  responseText.value = JSON.stringify(basicUserInfo, null, 2)
  userInfo.value = basicUserInfo

  // 尝试获取直播间号
  const url2 = new URL('https://api.live.bilibili.com/live_user/v1/Master/info')
  url2.searchParams.set('uid', uid.value)

  try {
    const resp = await cachedAPIFetch<BasicLiveUserInfo>(url2)
    roomID.value = resp.data.room_id.toString()
    setDebugInfo('用户直播间信息', url2, JSON.stringify(resp, null, 2), { uid: '用户UID' })
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取直播间信息出错：${e}`,
      type: 'error',
    })
  }

  const url3 = new URL('https://api.bilibili.com/x/upowerv2/gw/rights/index')
  url3.searchParams.set('up_mid', uid.value)

  let rightsData: PowerRights | undefined
  try {
    const resp = await cachedAPIFetch<PowerRights | undefined>(url3)
    rightsData = resp.data
    setDebugInfo('用户充电信息', url3, JSON.stringify(resp, null, 2), { up_mid: '用户UID' })
  } catch (e) {
    // 203010似乎是无充电信息专属错误码，只处理空充电信息以外的错误
    if ((e as GeneralAPIResponse<unknown>).code !== 203010) {
      console.error(e)
      ElMessage({
        message: `获取充电信息出错：${e}`,
        type: 'error',
      })
    }
  }

  if (rightsData !== undefined) {
    const rights = rightsData.privilege_rights
    const levels = Object.keys(rights).sort((a, b) => +b - +a)[0]
    const levelRights = rights[levels]

    if (levelRights.emote !== undefined) {
      chargeEmojiInfo.value = levelRights.emote.emojis
    }
  }

  loading.value = false
}
onMounted(fetchData)
watch(uid, fetchData)

const hasPendant = computed(() => userInfo.value?.card?.pendant.pid ?? 0 !== 0)

const jumpToPendant = async () => {
  const id = userInfo.value?.card.pendant.n_pid ?? -1
  const url = new URL('https://api.bilibili.com/x/garb/v2/user/suit/benefit')
  url.searchParams.set('item_id', id.toString())
  url.searchParams.set('part', 'card')

  let data: SuitDetail | null
  try {
    const resp = await cachedAPIFetch<SuitDetail | null>(url)
    data = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取头像框信息出错：${e}`,
      type: 'error',
    })
    return
  }

  // 这玩意怎么还能为空的？
  if (data === null) {
    ElMessage({
      message: '获取头像框信息失败，该头像框信息无效！',
      type: 'error',
    })
    return
  }

  // 收藏集
  if (data.buy_link.length > 0) {
    await autoJump(data.buy_link, true)
  } else {
    await autoJump(`https://www.bilibili.com/h5/mall/equity-link/collect-home?item_id=${id}&part=pendant`, true)
  }
}
// https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/dynamic/space.md#%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E7%A9%BA%E9%97%B4%E5%8A%A8%E6%80%81
// 尝试根据第一条获取的动态获得装扮信息？

</script>

<template>
  <div
    class="flex flex-col"
    v-loading="loading"
  >
    <!-- 信息展示界面 -->
    <ElDescriptions
      :column="6"
      border
    >
      <template #title>
        UP主信息
      </template>

      <template #extra>
        <DebugButton :names="['用户空间信息','用户直播间信息','用户充电信息']" />
        <BatchDownloadButton :task="generateDownloadTask" />
      </template>


      <ElDescriptionsItem
        :span="2"
        label="名称"
      >
        <ElLink
          :href="`https://space.bilibili.com/${uid}`"
          target="_blank"
          type="primary"
        >
          {{ userInfo?.card.name }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="性别"
      >
        {{ userInfo?.card.sex }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="UID"
      >
        {{ userInfo?.card.mid }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="关注数"
      >
        {{ userInfo?.card.attention }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="粉丝数"
      >
        {{ userInfo?.follower }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="获赞数"
      >
        {{ userInfo?.like_num }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="签名"
      >
        <span class="whitespace-pre-wrap">{{ userInfo?.card.sign }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="hasPendant"
        :span="6"
        label="头像框"
      >
        <ElLink
          type="primary"
          @click="jumpToPendant"
        >
          {{ userInfo?.card.pendant.name }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="直播间"
      >
        <RouterLink
          v-if="+roomID > 0"
          :to="`/liveroom/${roomID}`"
        >
          <ElLink type="primary">
            {{ roomID }}
          </ElLink>
        </RouterLink>
        <ElText
          v-else
          type="danger"
        >
          未开通
        </ElText>
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider>用户相关图片</ElDivider>
    <div class="flex flex-wrap gap-4 justify-center items-center">
      <ImageVideoCard
        :download-name="`${userInfo?.card.name} - 头像`"
        :image="userInfo?.card.face"
        title="头像"
      />
      <ImageVideoCard
        v-if="hasPendant"
        :image="userInfo?.card.pendant?.image_enhance"
        :title="`头像框 - ${userInfo?.card.pendant.name}`"
      />
      <ImageVideoCard
        :image="userInfo?.space.l_img"
        title="网页端空间背景图"
        :download-name="`${userInfo?.card.name} - 网页端空间背景图`"
      />
    </div>
    <template v-if="chargeEmojiInfo.length > 0">
      <ElDivider>充电表情</ElDivider>
      <ElSpace
        class="w-full justify-center"
        wrap
      >
        <ImageVideoCard
          v-for="(emoji, index) in chargeEmojiInfo"
          :key="emoji.id"
          :download-name="`${userInfo?.card.name}充电表情 - ${emoji.name}`"
          :image="emoji.icon"
          :index="index"
          :preview-images="chargeEmojiInfo.map(e => e.icon)"
          :title="emoji.name"
        />
      </ElSpace>
    </template>
  </div>
</template>
