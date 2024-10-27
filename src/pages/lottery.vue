<script lang="ts" setup>
import { APIFetch } from "../APIFetch.ts";
import type {
  ActInfo,
  BatchDownloadTask,
  GarbSearchResult,
  LotteryBagAssetsInfo,
  LotteryDetail,
  LotteryProperties,
  MedalInfo,
  RedeemInfo,
} from '../types.ts'
import { sep } from "@tauri-apps/api/path";
import { CarouselInstance } from "element-plus/lib/components";

const loading = ref(true)

// 已选择收藏集
const selectedKey = ref('')

const actID = ref(-1)
const lotteryID = ref(-1)
// 收藏集组详细信息
const actInfo = ref<ActInfo>()

// 隐藏的收藏集信息（可能是已经下架的）
const hiddenLotteryInfo = ref<{
  lottery_id: number
  lottery_name: string
}[]>([])

// TODO 实现对应勋章的预览
// 不同等级的收藏集勋章
const medals = computed(() => JSON.parse(actInfo.value?.collector_medal_info ?? '[]') as MedalInfo[])

// 单个收藏集详细信息
const lotteryInfo = computed(() => actInfo.value?.lottery_list)

// 额外卡片信息（抽卡数量，概率）
const extraCardsInfo = ref<{
  card_type_id: number
  total_cnt: number
  holding_rate: number
}[]>([])

// 生成迫真收藏集搜索结果信息
const parsedLotteryInfo = computed<GarbSearchResult<LotteryProperties>[]>(() => {
  // 普通收藏集信息
  return [...lotteryInfo.value?.map(l => {
    return {
      item_id: 0,
      name: l.lottery_name,
      jump_link: `https://www.bilibili.com/h5/mall/digital-card/home?-Abrowser=live&act_id=${actID.value}&hybrid_set_header=2&lottery_id=${l.lottery_id}`,
      sale_count_desc: l.total_sale_amount.toString(),
      properties: {
        dlc_act_id: actID.value,
        dlc_lottery_id: l.lottery_id,
        dlc_lottery_sale_quantity: l.total_sale_amount,
        image_cover: l.lottery_image,
        dlc_sale_start_time: l.start_time.toString(),
        dlc_sale_end_time: l.end_time.toString(),
        type: "dlc_act",
      }
    } as GarbSearchResult<LotteryProperties>
  }) ?? [],
    // 下架（？）收藏集信息
    ...hiddenLotteryInfo.value.map(l => {
      return {
        item_id: 0,
        name: l.lottery_name,
        jump_link: ``,
        sale_count_desc: '-1',
        properties: {
          dlc_act_id: actID.value,
          dlc_lottery_id: l.lottery_id,
          dlc_lottery_sale_quantity: -1,
          image_cover: '',
          dlc_sale_start_time: '-1',
          dlc_sale_end_time: '-1',
          type: "dlc_act",
        }
      }
    })
  ] as GarbSearchResult<LotteryProperties>[]
})

const route = useRoute()
const fetchData = async () => {
  loading.value = true

  if (actID.value !== parseInt(route.query.act_id as string ?? '')) {
    lotteryID.value = -1
  }

  actID.value = parseInt(route.query.act_id as string ?? '')
  const lotteryIDStr = route.query.lottery_id as string | undefined
  if (lotteryIDStr) {
    lotteryID.value = +lotteryIDStr
  }

  try {
    // 收藏集组基础信息
    const url = 'https://api.bilibili.com/x/vas/dlc_act/act/basic?act_id=' + actID.value
    const resp = await APIFetch<ActInfo>(url, undefined, {
      debug: {
        name: '收藏集组信息',
        extraParams: { act_id: '收藏集组ID' }
      }
    })
    actInfo.value = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取收藏集信息出错：${e}`,
      type: 'error',
    })
    return
  }

  try {
    // 收藏集额外信息
    const url = new URL('https://api.bilibili.com/x/vas/dlc_act/asset_bag')
    url.searchParams.set('act_id', actID.value.toString())

    const resp = await APIFetch<LotteryBagAssetsInfo>(url, undefined, {
      debug: {
        name: '收藏集额外信息',
        extraParams: { act_id: '收藏集组ID' }
      }
    })
    const lotteryIDList = actInfo.value.lottery_list.map(l => l.lottery_id)
    // 提取隐藏收藏集ID
    hiddenLotteryInfo.value = resp.data.lottery_simple_list.filter(l => !lotteryIDList.includes(l.lottery_id) && l.lottery_id !== 0)

    // 保存额外卡片信息
    extraCardsInfo.value = resp.data.item_list.map(i => {
      return {
        card_type_id: i.card_item.card_type_id,
        total_cnt: i.card_item.total_cnt,
        holding_rate: i.card_item.holding_rate,
      }
    })
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取收藏集额外信息出错：${e}`,
      type: 'error',
    })
  }


  if (lotteryID.value !== -1) {
    selectedKey.value = lotteryID.value.toString()
  } else {
    const newLotteryID = actInfo.value.lottery_list[0].lottery_id
    updatingSelectedKey = true
    selectedKey.value = newLotteryID.toString()

    lotteryID.value = newLotteryID
    await router.replace({ query: { act_id: route.query.act_id, lottery_id: newLotteryID.toString() } })
    updatingSelectedKey = false
  }

  loading.value = false
}

const triggerReload = async () => {
  if (actID.value === -1) {
    await fetchData()
  } else if (lotteryID.value !== -1) {
    await fetchData()
  }
  selectedKey.value = lotteryID.value.toString()
}

watch(() => route.query.act_id, triggerReload, { immediate: true })

const router = useRouter()
const carousel = ref<CarouselInstance>()

let updatingSelectedKey = false
watch(selectedKey, () => {
  if (updatingSelectedKey) return
  carousel.value?.setActiveItem(selectedKey.value)
  router.push({ query: { act_id: actID.value, lottery_id: selectedKey.value } })
})

watch(() => route.query.lottery_id, () => {
  updatingSelectedKey = true
  selectedKey.value = route.query.lottery_id as string
  updatingSelectedKey = false
})

const saleTime = computed(() => `${new Date((actInfo.value?.start_time ?? 0) * 1000).toLocaleString()} ~ ${new Date((actInfo.value?.end_time ?? 0) * 1000).toLocaleString()}`)

const generateDownloadTask = async () => {
  const downloadFileInfo: BatchDownloadTask = {
    name: actInfo.value?.act_title ?? '',
    path: actInfo.value?.act_title ?? '',
    files: [],
  }

  console.debug(downloadFileInfo.path)

  let lotteryDetails: LotteryDetail[]
  try {
    const lotteryIDs = [...(lotteryInfo.value?.map(l => l.lottery_id) ?? []), ...hiddenLotteryInfo.value.map(l => l.lottery_id)]
    // 获取所有收藏集信息
    lotteryDetails = await Promise.all(lotteryIDs.map(lotteryID => {
      const url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
      url.searchParams.set('act_id', actID.value.toString())
      url.searchParams.set('lottery_id', lotteryID.toString())

      return APIFetch(url).then(r => r.data) as Promise<LotteryDetail>
    }) ?? [])
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取收藏集信息出错：${e}`,
      type: 'error',
    })
    return downloadFileInfo
  }

  // 不同等级的收藏集勋章
  if (actInfo.value?.collector_medal_info) {
    const keys = [1, 2, 3, 4, 6]
    medals.value.forEach(medal => {
      const level = medal.level + '级'
      downloadFileInfo.files.push(...keys.map(k => {
        return {
          path: [downloadFileInfo.name, '收藏集勋章', `类型${k}`, level].join(sep()),
          url: medal.scene_image[k],
        }
      }))
    })

  }

  // 遍历所有收藏集
  lotteryDetails.forEach(detail => {
    // 收藏集图片
    detail.item_list
        .filter(i => i.card_info.card_img?.length ?? 0 > 0)
        .forEach(({ card_info: cardInfo }) => {
          downloadFileInfo.files.push({
            path: [detail.name, '卡池图片', cardInfo.card_name].join(sep()),
            url: cardInfo.card_img,
          })
        })

    // 收藏集视频
    detail.item_list
        .filter(i => i.card_info.video_list?.length ?? 0 > 0)
        .forEach(({ card_info: cardInfo }) => {
          downloadFileInfo.files.push({
            path: [detail.name, '卡池视频', cardInfo.card_name].join(sep()),
            url: cardInfo.video_list?.[0] ?? '',
          })
        })

    const combinedRedeemInfo: RedeemInfo[] = ([] as RedeemInfo[]).concat(detail.collect_list.collect_chain ?? [], detail.collect_list.collect_infos ?? [])

    // 钻石头像背景、收藏集勋章、典藏卡、头像框
    combinedRedeemInfo
        .filter(i => [1000, 1001, 1, 3].includes(i.redeem_item_type))
        .forEach(i => {
          downloadFileInfo.files.push({
            path: [detail.name, '其他', i.redeem_item_name].join(sep()),
            url: i.redeem_item_image,
          })
          // 典藏卡视频
          if (i.redeem_item_type === 1 && i.card_item.card_type_info?.content.animation) {
            downloadFileInfo.files.push({
              path: [detail.name, '其他', i.redeem_item_name + '(视频)'].join(sep()),
              url: i.card_item.card_type_info?.content.animation?.animation_video_urls[0] ?? '',
            })
          }
        })
  })

  // 每个收藏集的封面
  lotteryInfo.value?.forEach(l => {
    downloadFileInfo.files.push({
      path: [l.lottery_name, '其他', '封面'].join(sep()),
      url: l.lottery_image,
    })
  })

  console.debug(downloadFileInfo)
  return downloadFileInfo
}


// https://api.bilibili.com/x/emote/setting/panel?business=dynamic
// 获得所有表情表（需要登录）
// 直接嗯搜？

</script>
<template>
  <div
    v-loading="loading"
    class="flex flex-col content-center h-full"
  >
    <!-- 收藏集组合详细信息 -->
    <ElDescriptions
      v-if="!loading"
      :column="2"
      border
    >
      <template #title>
        <ElText size="large">
          收藏集组合信息
        </ElText>
      </template>

      <template #extra>
        <DebugButton :names="['收藏集组信息','收藏集额外信息']" />
        <BatchDownloadButton :task="generateDownloadTask" />
      </template>

      <ElDescriptionsItem
        label="名称"
        name="name"
      >
        <ElLink
          v-if="!loading"
          :href="`https://www.bilibili.com/h5/mall/digital-card/home?-Abrowser=live&act_id=${parsedLotteryInfo[0].properties.dlc_act_id}&hybrid_set_header=2`"
          target="_blank"
          type="primary"
        >
          {{ actInfo?.act_title }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="销售时间"
      >
        {{ saleTime }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="简介"
      >
        <div
          class="max-h-8 hover:max-h-64 overflow-y-auto transition-all duration-500 whitespace-pre-wrap overflow-hidden text-ellipsis"
        >
          {{ actInfo?.product_introduce }}
        </div>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="(actInfo?.related_mids ?? undefined) !== undefined"
        :span="2"
        label="相关UP主"
      >
        <UPInfo
          v-for="mid in actInfo?.related_mids"
          :key="mid"
          :face="actInfo!.related_user_infos[mid]!.avatar"
          :mid="mid"
          :name="actInfo!.related_user_infos[mid]!.nickname"
        />
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider>收藏集内容</ElDivider>

    <ElRadioGroup
      v-show="(parsedLotteryInfo?.length ?? 0) > 1"
      v-model="selectedKey"
      class="mx-auto"
    >
      <ElRadioButton
        v-for="lottery in parsedLotteryInfo"
        :key="lottery.properties.dlc_lottery_id"
        :label="lottery.name"
        :value="lottery.properties.dlc_lottery_id.toString()"
      />
    </ElRadioGroup>
    <ElCarousel
      v-if="!loading"
      ref="carousel"
      :autoplay="false"
      :initial-index="parsedLotteryInfo.map(l => l.properties.dlc_lottery_id).indexOf(lotteryID)"
      :loop="false"
      arrow="never"
      class="!h-full !overflow-y-auto"
      height="100%"
      indicator-position="none"
    >
      <ElCarouselItem
        v-for="lottery in parsedLotteryInfo"
        :key="lottery.properties.dlc_lottery_id"
        :name="lottery.properties.dlc_lottery_id.toString()"
        class="h-full !overflow-y-auto"
      >
        <KeepAlive>
          <SingleLotteryPage
            :lottery="lottery"
            :extra-cards-info="extraCardsInfo"
          />
        </KeepAlive>

        <!-- 收藏集勋章展示 -->
        <template v-if="medals.length > 0">
          <ElDivider>收藏集勋章</ElDivider>
          <ElTabs
            class="h-[512px]"
            stretch
          >
            <ElTabPane
              v-for="type in [1, 2, 3, 4, 6]"
              :key="type"
              :label="`类型${type}`"
            >
              <ElSpace
                class="justify-center w-full"
                wrap
              >
                <ImageVideoCard
                  v-for="medal in medals.map(m => {return {level: m.level, image: m.scene_image[type]}})"
                  :key="medal.level"
                  :title="`等级${medal.level}`"
                  :image="medal.image"
                  :download-name="(actInfo?.act_title ?? '') + ` - 收藏集勋章（类型${type}，等级${medal.level}）` "
                />
              </ElSpace>
            </ElTabPane>
          </ElTabs>
        </template>
      </ElCarouselItem>
    </ElCarousel>
  </div>
</template>
