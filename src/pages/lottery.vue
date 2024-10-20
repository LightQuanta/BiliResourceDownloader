<script lang="ts" setup>
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import type { ActInfo, BatchDownloadTask, GarbSearchResult, LotteryDetail, LotteryProperties, } from '../types.ts'
import { sep } from "@tauri-apps/api/path";
import { CarouselInstance } from "element-plus/lib/components";

const loading = ref(true)

const selectedKey = ref('')

const actID = ref(-1)
const lotteryID = ref(-1)
const actInfo = ref<ActInfo>()

const lotteryInfo = computed(() => actInfo.value?.lottery_list)
const parsedLotteryInfo = computed<GarbSearchResult<LotteryProperties>[]>(() => {
  return lotteryInfo.value?.map(l => {
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
  }) ?? []
})

const route = useRoute()

const fetchData = async () => {
  loading.value = true

  if (actID.value !== +route.query.act_id) {
    lotteryID.value = -1
  }

  actID.value = +route.query.act_id
  const lotteryIDStr = route.query.lottery_id as string | undefined
  if (lotteryIDStr) {
    lotteryID.value = +lotteryIDStr
  }

  let resp: ActInfo
  try {
    resp = await cachedAPIFetch(`https://api.bilibili.com/x/vas/dlc_act/act/basic?act_id=${actID.value}`).then(r => r.data)
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取收藏集信息出错：${e}`,
      type: 'error',
    })
    return
  }

  actInfo.value = resp

  if (lotteryID.value !== -1) {
    selectedKey.value = lotteryID.value.toString()
  } else {
    const newLotteryID = resp.lottery_list[0].lottery_id
    selectedKey.value = newLotteryID.toString()

    lotteryID.value = newLotteryID
    await router.replace({ query: { act_id: route.query.act_id, lottery_id: newLotteryID.toString() } })
  }
  await generateDownloadTask()
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

watch(selectedKey, () => {
  carousel.value?.setActiveItem(selectedKey.value)
  router.replace({ query: { act_id: actID.value, lottery_id: lotteryID.value } })
})

const saleTime = computed(() => `${new Date((actInfo.value?.start_time ?? 0) * 1000).toLocaleString()} ~ ${new Date((actInfo.value?.end_time ?? 0) * 1000).toLocaleString()}`)

// 批量下载相关信息生成
const batchDownloadInfo = ref<BatchDownloadTask>()
const generateDownloadTask = async () => {
  const downloadFileInfo: BatchDownloadTask = {
    name: actInfo.value.act_title,
    path: actInfo.value.act_title,
    files: [],
  }

  console.debug(downloadFileInfo.path)

  let lotteryDetails: LotteryDetail[]
  try {
    lotteryDetails = await Promise.all(lotteryInfo.value.map(l => {
      const url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
      url.searchParams.set('act_id', actID.value.toString())
      url.searchParams.set('lottery_id', l.lottery_id.toString())

      return cachedAPIFetch(url).then(r => r.data) as Promise<LotteryDetail>
    }))
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取收藏集信息出错：${e}`,
      type: 'error',
    })
    return
  }

  // 每个收藏集的封面
  lotteryInfo.value.forEach(l => {
    downloadFileInfo.files.push({
      path: l.lottery_name + ' - 封面',
      url: l.lottery_image,
    })
  })

  // 每个收藏集的所有图片
  lotteryDetails.forEach(detail => {
    // 水印版
    detail.item_list
        .filter(i => i.card_info.card_img_download?.length ?? 0 > 0)
        .forEach(({ card_info: cardInfo }) => {
          downloadFileInfo.files.push({
            path: detail.name + '（水印）' + sep() + cardInfo.card_name,
            url: cardInfo.card_img_download,
          })
        })
    // 原版
    detail.item_list
        .filter(i => i.card_info.card_img?.length ?? 0 > 0)
        .forEach(({ card_info: cardInfo }) => {
          downloadFileInfo.files.push({
            path: detail.name + sep() + cardInfo.card_name,
            url: cardInfo.card_img,
          })
        })
  })

  // 每个收藏集的所有视频
  lotteryDetails.forEach(detail => {
    // 水印版
    detail.item_list
        .filter(i => i.card_info.video_list_download?.length ?? 0 > 0)
        .forEach(({ card_info: cardInfo }) => {
          downloadFileInfo.files.push({
            path: detail.name + '（水印）' + sep() + cardInfo.card_name,
            url: cardInfo.video_list_download[0],
          })
        })
    // 原版
    detail.item_list
        .filter(i => i.card_info.video_list?.length ?? 0 > 0)
        .forEach(({ card_info: cardInfo }) => {
          downloadFileInfo.files.push({
            path: detail.name + sep() + cardInfo.card_name,
            url: cardInfo.video_list[0],
          })
        })
  })

  console.debug(downloadFileInfo)
  batchDownloadInfo.value = downloadFileInfo
}


// https://api.bilibili.com/x/emote/setting/panel?business=dynamic
// 获得所有表情表（需要登录）
// 直接嗯搜？

</script>
<template>
  <div
    v-loading="loading"
    class="flex flex-col content-center"
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
        <BatchDownloadButton :task="batchDownloadInfo" />
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
    <br>
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
            class="h-full"
          />
        </KeepAlive>
      </ElCarouselItem>
    </ElCarousel>
  </div>
</template>
