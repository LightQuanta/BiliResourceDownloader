<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import {
  BasicLiveUserInfo,
  BasicUserInfo,
  BatchDownloadTask,
  ChargeEmojiInfo,
  ExtremelyDetailedUserInfo,
  GeneralAPIResponse,
  PendantInfo,
  PowerRights,
  SuitDetail
} from "../../types.ts";
import { sep } from "@tauri-apps/api/path";
import { autoJump } from "../../utils/linkResolver.ts";
import DebugButton from "../../components/DebugButton.vue";

const route = useRoute<'/space/[id]'>()
const loading = ref(false)

const uid = computed(() => route.params.id)
const roomID = ref(0)
const roomTitle = ref<string>()

const fans = ref(0)
const attention = ref(0)
const like = ref(0)

const userInfo = ref<BasicUserInfo>()
const detailedUserInfo = ref<ExtremelyDetailedUserInfo>()
// 用户名
const userName = ref('')
// 头像
const faceURL = ref('')
// 签名
const userSign = ref('')
// 性别
const gender = ref('未知')
// 空间tag（IP属地等信息，需要app端access_key验证，放弃解析）
const spaceTags = ref<string[]>([])

// app端头图
const appImage = ref<string>()
// app端头图（暗色）
const appNightImage = ref<string>()

// 空间公告
const userNotice = ref('')

// 粉丝牌信息
const fansMedal = ref<{
  level: number
  medal_name: string
}>()

// 头像框信息
const userPendant = ref<PendantInfo>()

// 收藏集头图
const lotteryCards = ref<{
  title: string
  jumpLink: string
}[]>([])

// 充电表情信息
const chargeEmojiInfo = ref<ChargeEmojiInfo[]>([])

const generateDownloadTask = () => {
  const task: BatchDownloadTask = {
    name: userName.value,
    files: [],
  }

  task.files.push({
    path: `${userName.value}空间${sep()}头像`,
    url: userInfo.value?.card.face ?? '',
  })

  if (hasPendant.value) {
    task.files.push({
      path: `头像框 - ${userInfo.value?.card.pendant?.name}`,
      url: userInfo.value?.card.pendant?.image_enhance ?? '',
    })
  }

  if (appImage.value) {
    task.files.push({
      path: `${userName.value}空间${sep()}App端空间背景图`,
      url: appImage.value,
    })
  }

  if (appNightImage.value) {
    task.files.push({
      path: `${userName.value}空间${sep()}App端空间背景图（夜间模式）`,
      url: appNightImage.value,
    })
  }

  if (userInfo.value?.space.l_img) {
    task.files.push({
      path: `${userName.value}空间${sep()}网页端空间背景图`,
      url: userInfo.value?.space.l_img ?? '',
    })
  }

  if (chargeEmojiInfo.value?.length ?? 0 > 0) {
    task.files.push(...chargeEmojiInfo.value.map(emoji => ({
      path: `${userName.value}空间${sep()}充电表情${sep()}${emoji.name}`,
      url: emoji.icon,
    })))
  }

  return task
}

const fetchData = async () => {
  loading.value = true

  try {
    // 获取app端详细用户信息
    const uu = new URL('https://app.bilibili.com/x/v2/space')
    uu.searchParams.set('vmid', uid.value)
    // 获得app头图必须
    uu.searchParams.set('mobi_app', 'android')


    const resp = await APIFetch<ExtremelyDetailedUserInfo>(uu, undefined, {
      appSign: true,
      debug: {
        name: '用户详细信息',
        extraParams: {
          vmid: '用户UID'
        }
      }
    })
    const data = resp.data
    detailedUserInfo.value = data

    userName.value = data.card.name
    faceURL.value = data.card.face
    userSign.value = data.card.sign

    fans.value = data.card.fans
    like.value = data.card.likes.like_num
    attention.value = data.card.attention

    fansMedal.value = data.card.live_fans_wearing
    spaceTags.value = data.card.space_tag.map(t => t.title)
    userPendant.value = data.card.pendant

    appImage.value = data.images.imgUrl
    appNightImage.value = data.images.night_imgurl

    lotteryCards.value = data.images?.collection_top_simple?.top?.result?.map(r => {
      return {
        title: r.title.title + ' ' + r.title.sub_title,
        jumpLink: r.extra.detail_jump_url,
      }
    }) ?? []

    roomID.value = data.live.roomid
    roomTitle.value = data.live.title
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取详细用户信息出错：${e}`,
      type: 'error',
    })
  }

  // 获取基础用户信息
  let basicUserInfo: BasicUserInfo
  try {
    const url = new URL('https://api.bilibili.com/x/web-interface/card')
    url.searchParams.set('mid', uid.value)
    url.searchParams.set('photo', 'true')
    const resp = await APIFetch<BasicUserInfo>(url, undefined, {
      debug: {
        name: '用户空间信息',
        extraParams: { mid: '用户UID' },
      },
    })
    basicUserInfo = resp.data

    userName.value = basicUserInfo.card.name
    faceURL.value = basicUserInfo.card.face
    userSign.value = basicUserInfo.card.sign
    gender.value = basicUserInfo.card.sex

    fans.value = basicUserInfo.follower
    like.value = basicUserInfo.like_num
    attention.value = basicUserInfo.card.attention

    userPendant.value = basicUserInfo.card.pendant
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取基础用户信息出错：${e}`,
      type: 'error',
    })
  }

  userInfo.value = basicUserInfo

  // 尝试获取直播间号
  if (roomID.value.length === 0) {
    try {
      const url = new URL('https://api.live.bilibili.com/live_user/v1/Master/info')
      url.searchParams.set('uid', uid.value)
      const resp = await APIFetch<BasicLiveUserInfo>(url, undefined, {
        debug: {
          name: '用户直播间信息',
          extraParams: { uid: '用户UID' },
        },
      })
      roomID.value = resp.data.room_id
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取直播间信息出错：${e}`,
        type: 'error',
      })
    }
  }


  // 获取用户充电信息
  let rightsData: PowerRights | undefined
  try {
    const url3 = new URL('https://api.bilibili.com/x/upowerv2/gw/rights/index')
    url3.searchParams.set('up_mid', uid.value)
    const resp = await APIFetch<PowerRights | undefined>(url3, undefined, {
      debug: {
        name: '用户充电信息',
        extraParams: { up_mid: '用户UID' },
      },
    })
    rightsData = resp.data
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

  try {
    const url = new URL('https://api.bilibili.com/x/space/notice')
    url.searchParams.set('mid', uid.value)
    userNotice.value = (await APIFetch<string>(url, undefined, {
      debug: {
        name: '用户空间公告'
      }
    })).data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取用户空间公告出错：${e}`,
      type: 'error',
    })
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
    const resp = await APIFetch<SuitDetail | null>(url)
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

const jumpToLottery = async (link: string) => {
  if (!await autoJump(link)) {
    ElMessage({
      message: '链接类型未知',
      type: 'error',
    })
  }
}

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
        <DebugButton :names="['用户详细信息','用户空间信息','用户空间公告','用户直播间信息','用户充电信息']" />
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
          {{ userName }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="性别"
      >
        {{ gender }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="UID"
      >
        {{ uid }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="关注数"
      >
        {{ attention }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="粉丝数"
      >
        {{ fans }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="获赞数"
      >
        {{ like }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="签名"
      >
        <span class="whitespace-pre-wrap">{{ userSign }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="公告"
        v-if="userNotice.length > 0"
      >
        <span class="whitespace-pre-wrap">{{ userNotice }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="标签"
        v-if="spaceTags.length > 0"
      >
        <ElTag
          v-for="tag in spaceTags"
          :key="tag"
        >
          {{ tag }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="佩戴粉丝牌"
        v-if="fansMedal"
      >
        <ElTag
          type="success"
          size="large"
        >
          lv.{{ fansMedal.level }} {{ fansMedal.medal_name }}
        </ElTag>
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
        v-if="lotteryCards.length > 0"
        :span="6"
        label="收藏集卡牌"
      >
        <ElLink
          v-for="card in lotteryCards"
          :key="card.title"
          type="primary"
          class="mr-2"
          @click="jumpToLottery(card.jumpLink)"
        >
          <ElTag size="large">
            {{ card.title }}
          </ElTag>
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="直播间"
      >
        <RouterLink
          v-if="roomID > 0"
          :to="`/liveroom/${roomID}`"
        >
          <ElLink type="primary">
            {{ roomTitle ? roomTitle : roomID }}
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
        :download-name="`${userName} - 头像`"
        :image="faceURL"
        title="头像"
      />
      <ImageVideoCard
        v-if="hasPendant"
        :image="userInfo?.card.pendant?.image_enhance"
        :title="`头像框 - ${userInfo?.card.pendant.name}`"
      />
      <ImageVideoCard
        v-if="appImage"
        :image="appImage"
        title="App端空间背景图"
        :download-name="`${userName} - App端空间背景图`"
      />
      <ImageVideoCard
        v-if="appNightImage"
        :image="appNightImage"
        title="App端空间背景图（夜间模式）"
        :download-name="`${userName} - App端空间背景图（夜间模式）`"
      />
      <ImageVideoCard
        :image="userInfo?.space.l_img"
        title="网页端空间背景图"
        :download-name="`${userName} - 网页端空间背景图`"
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
          :download-name="`${userName}充电表情 - ${emoji.name}`"
          :image="emoji.icon"
          :index="index"
          :preview-images="chargeEmojiInfo.map(e => e.icon)"
          :title="emoji.name"
        />
      </ElSpace>
    </template>
  </div>
</template>
