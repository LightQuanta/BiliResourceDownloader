<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import {
  BasicLiveUserInfo,
  BasicUserInfo,
  BatchDownloadTask,
  ChargeEmojiInfo,
  DynamicInfo,
  ExtremelyDetailedUserInfo,
  GeneralAPIResponse,
  PowerRights,
  SuitDetail,
  UserDynamicList
} from "../../types.ts";
import { sep } from "@tauri-apps/api/path";
import { autoJump, resolveText } from "../../utils/linkResolver.ts";
import DebugButton from "../../components/DebugButton.vue";

const route = useRoute<'/space/[id]'>()
const loading = ref(false)

// 基础用户信息
const userInfo = ref<BasicUserInfo>()
// 详细用户信息
const detailedUserInfo = ref<ExtremelyDetailedUserInfo>()
// 直播间信息
const liveUserInfo = ref<BasicLiveUserInfo>()
// 空间公告
const userNotice = ref('')
// 充电权益
const powerRights = ref<PowerRights>()
// 动态信息（仅存储第一个）
const dynamicInfo = ref<DynamicInfo>()

// 用户UID
const uid = computed(() => route.params.id)
// 直播间号
const roomID = computed(() => detailedUserInfo.value?.live.roomid ?? liveUserInfo.value?.room_id ?? -1)
// 直播间标题
const roomTitle = computed(() => detailedUserInfo.value?.live.title ?? roomID.value)

// 粉丝数
const fans = computed(() => detailedUserInfo.value?.card?.fans ?? userInfo.value?.follower)
// 关注数
const attention = computed(() => detailedUserInfo.value?.card.attention ?? userInfo.value?.card.attention)
// 点赞数
const like = computed(() => detailedUserInfo.value?.card.likes.like_num ?? userInfo.value?.like_num)

// 用户名
const userName = computed(() => detailedUserInfo.value?.card.name ?? userInfo.value?.card.name)
// 头像
const faceURL = computed(() => detailedUserInfo.value?.card.face ?? userInfo.value?.card.name)
// 签名
const userSign = computed(() => detailedUserInfo.value?.card.sign ?? userInfo.value?.card.sign)
// 性别
const gender = computed(() => userInfo.value?.card.sex)
// 空间tag（IP属地等信息，需要app端access_key验证，放弃解析）
const spaceTags = computed(() => detailedUserInfo.value?.card.space_tag.map(t => t.title) ?? [])

// app端头图
const appImage = computed(() => detailedUserInfo.value?.images.imgUrl)
// app端头图（暗色）
const appNightImage = computed(() => detailedUserInfo.value?.images.night_imgurl)


// 粉丝牌信息
const fansMedal = computed(() => detailedUserInfo.value?.card.live_fans_wearing)
// 头像框信息
const userPendant = computed(() => detailedUserInfo.value?.card.pendant ?? userInfo.value?.card.pendant)
// 收藏集头图
const lotteryCards = computed(() => detailedUserInfo.value?.images?.collection_top_simple?.top?.result?.map(r => {
  return {
    title: r.title.title + ' ' + r.title.sub_title,
    jumpLink: r.extra.detail_jump_url,
    cover: r.cover,
  }
}) ?? [])

// 充电表情信息
const chargeEmojiInfo = computed(() => {
  if (!powerRights.value) return ([] as ChargeEmojiInfo[])
  const rights = powerRights.value.privilege_rights
  const levels = Object.keys(rights).sort((a, b) => +b - +a)[0]
  const levelRights = rights[levels]
  return levelRights.emote?.emojis ?? []
})

// 根据动态信息提取的装扮信息
const decorateInfo = computed(() => dynamicInfo.value?.modules.module_author.decorate)

const debugRequestNames = ref<string[]>([])

const generateDownloadTask = () => {
  const task: BatchDownloadTask = {
    name: userName.value ?? '',
    files: [],
  }

  task.files.push({
    path: `${userName.value}空间${sep()}头像`,
    url: userInfo.value?.card.face ?? '',
  })

  if (hasPendant.value) {
    task.files.push({
      path: `头像框 - ${userPendant.value?.name}`,
      url: userPendant.value?.image_enhance ?? '',
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
  if (!/^\d+$/.test(uid.value)) {
    ElMessage({
      message: '无效的用户UID！',
      type: 'error',
    })
    return
  }

  loading.value = true

  userInfo.value = undefined
  detailedUserInfo.value = undefined
  liveUserInfo.value = undefined
  userNotice.value = ''
  powerRights.value = undefined
  dynamicInfo.value = undefined
  debugRequestNames.value = []

  try {
    debugRequestNames.value.push('用户详细信息')
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
    detailedUserInfo.value = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取详细用户信息出错：${e}`,
      type: 'error',
    })
  }

  // 获取基础用户信息
  let basicUserInfo: BasicUserInfo | undefined = undefined
  try {
    debugRequestNames.value.push('用户空间信息')
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
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取基础用户信息出错：${e}`,
      type: 'error',
    })
  }

  userInfo.value = basicUserInfo

  // 尝试获取直播间号
  if (roomID.value === 0) {
    debugRequestNames.value.push('用户直播间信息')
    try {
      const url = new URL('https://api.live.bilibili.com/live_user/v1/Master/info')
      url.searchParams.set('uid', uid.value)
      const resp = await APIFetch<BasicLiveUserInfo>(url, undefined, {
        debug: {
          name: '用户直播间信息',
          extraParams: { uid: '用户UID' },
        },
      })
      liveUserInfo.value = resp.data
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取直播间信息出错：${e}`,
        type: 'error',
      })
    }
  }


  // 获取用户充电信息
  try {
    debugRequestNames.value.push('用户充电信息')
    const url3 = new URL('https://api.bilibili.com/x/upowerv2/gw/rights/index')
    url3.searchParams.set('up_mid', uid.value)
    const resp = await APIFetch<PowerRights | undefined>(url3, undefined, {
      debug: {
        name: '用户充电信息',
        extraParams: { up_mid: '用户UID' },
      },
    })
    powerRights.value = resp.data
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

  try {
    debugRequestNames.value.push('用户空间公告')
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

  // 尝试获取首条动态
  try {
    debugRequestNames.value.push('用户动态列表')
    const url = new URL('https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space')
    url.searchParams.set('host_mid', uid.value)
    const resp = await APIFetch<UserDynamicList>(url, undefined, {
      debug: {
        name: '用户动态列表',
        extraParams: { host_mid: '用户UID' },
      },
      wbiSign: true,
    })
    dynamicInfo.value = resp.data.items[0]
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

const hasPendant = computed(() => (userPendant.value?.pid ?? 0) !== 0)

const jumpToPendant = async () => {
  const id = userPendant.value?.n_pid ?? -1
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
const jumpToLottery = async (link: string) => {
  if (!await autoJump(link)) {
    ElMessage({
      message: '链接类型未知',
      type: 'error',
    })
  }
}

// 装扮描述文本，显示用
const decorateDescription = computed(() => {
  const type = resolveText(decorateInfo.value?.jump_url)
  if (type === 'suit' && decorateInfo.value?.fan.is_fan) {
    return '粉丝装扮'
  } else if (type === 'lottery') {
    return '收藏集'
  }
  return '装扮'
})

const jump = async () => {
  await autoJump(decorateInfo.value?.jump_url, true)
}

</script>

<template>
  <div class="flex flex-col">
    <!-- 信息展示界面 -->
    <ElDescriptions
      :column="6"
      border
    >
      <template #title>
        UP主信息
      </template>

      <template #extra>
        <DebugButton :names="debugRequestNames" />
        <BatchDownloadButton :task="generateDownloadTask" />
      </template>

      <ElDescriptionsItem
        :span="2"
        label="名称"
        min-width="100px"
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
        <div class="whitespace-pre-wrap max-h-8 hover:max-h-64 overflow-y-scroll transition-all duration-500">
          {{
            userSign
          }}
        </div>
      </ElDescriptionsItem>

      <!-- 收藏集/装扮信息展示 -->
      <ElDescriptionsItem
        :label="decorateDescription"
        v-if="decorateInfo?.name"
        :span="6"
      >
        <div class="flex items-center">
          <ElLink
            type="primary"
            @click="jump"
          >
            {{ decorateInfo?.name }}
          </ElLink>
          <span
            v-if="decorateInfo?.fan.is_fan"
            :style="{color: decorateInfo?.fan.color}"
            class="ml-auto translate-x-24 z-50 font-bold select-none"
          >{{ decorateInfo.fan.num_str }}</span>
          <ElImage
            v-if="decorateInfo"
            :class="decorateInfo?.fan.is_fan ? 'h-12 select-none' : 'ml-auto h-12 select-none'"
            :src="decorateInfo?.card_url"
            referrerpolicy="no-referrer"
          />
        </div>
      </ElDescriptionsItem>

      <!-- 头像框 -->
      <ElDescriptionsItem
        v-if="hasPendant"
        :span="6"
        label="头像框"
      >
        <ElLink
          type="primary"
          @click="jumpToPendant"
        >
          {{ userPendant?.name }}
        </ElLink>
      </ElDescriptionsItem>

      <!-- 收藏集卡牌预览 -->
      <ElDescriptionsItem
        v-if="lotteryCards.length > 0"
        :span="6"
        label="收藏集卡牌"
      >
        <ElSpace wrap>
          <ElPopover
            v-for="card in lotteryCards"
            :key="card.title"
          >
            <ElImage
              :src="card.cover"
              :preview-src-list="[card.cover]"
              referrerpolicy="no-referrer"
              preview-teleported
              :hide-on-click-modal="true"
            />
            <template #reference>
              <ElLink
                type="primary"
                class="mr-2"
                @click="jumpToLottery(card.jumpLink)"
              >
                <ElTag size="large">
                  {{ card.title }}
                </ElTag>
              </ElLink>
            </template>
          </ElPopover>
        </ElSpace>
      </ElDescriptionsItem>

      <!-- 公告 -->
      <ElDescriptionsItem
        :span="6"
        label="公告"
        v-if="userNotice.length > 0"
      >
        <div class="whitespace-pre-wrap max-h-8 hover:max-h-64 overflow-y-scroll transition-all duration-500">
          {{
            userNotice
          }}
        </div>
      </ElDescriptionsItem>

      <!-- 粉丝牌 -->
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

      <!-- 标签（大学、IP属地等） -->
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

      <!-- 直播间链接 -->
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

    <CustomDivider>用户相关图片</CustomDivider>
    <div class="flex flex-wrap gap-4 justify-center items-center">
      <ImageVideoCard
        :download-name="`${userName} - 头像`"
        :image="faceURL"
        title="头像"
      />
      <ImageVideoCard
        v-if="hasPendant"
        :image="userPendant?.image_enhance"
        :title="`头像框 - ${userPendant?.name}`"
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
      <CustomDivider>充电表情</CustomDivider>
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
