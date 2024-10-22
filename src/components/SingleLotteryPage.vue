<script lang="ts" setup>
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import type { GarbSearchResult, LotteryCardInfo, LotteryDetail, LotteryProperties, RedeemInfo, } from '../types.ts'
import { setDebugInfo } from "../utils/debug.ts";

const props = defineProps<{
  lottery: GarbSearchResult<LotteryProperties>
}>()

const name = ref('')
const jumpLink = ref('')
const cards = ref<LotteryCardInfo[]>([])

const loading = ref(false)

const lotteryDetail = ref<LotteryDetail>()
const coverURL = ref('')
const saleQuantity = ref(0)
const saleStartTime = ref(0)
const saleEndTime = ref(0)

const combinedRedeemInfo = computed<RedeemInfo[]>(() => lotteryDetail.value?.collect_list.collect_chain?.concat(lotteryDetail.value?.collect_list.collect_infos) ?? [])
const emojiInfo = computed(() => combinedRedeemInfo.value.filter(r => r.redeem_item_type === 2))

onMounted(async () => {
  loading.value = true

  const lotteryInfo = props.lottery
  const lotteryProperties = lotteryInfo.properties

  const { name: lotteryName, jump_link: lotteryLink } = lotteryInfo
  const { dlc_act_id: actID, dlc_lottery_id: lotteryID } = lotteryProperties

  name.value = lotteryName
  jumpLink.value = lotteryLink

  const url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
  url.searchParams.set('act_id', String(actID))
  url.searchParams.set('lottery_id', String(lotteryID))

  try {
    lotteryDetail.value = await cachedAPIFetch<LotteryDetail>(url).then(r => r.data)
    setDebugInfo(`收藏集${lotteryID}详情`, url, JSON.stringify(lotteryDetail.value, null, 2), {
      act_id: '收藏集组ID',
      lottery_id: '收藏集ID'
    })
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取收藏集信息出错：${e}`,
      type: 'error',
    })
    return
  }

  const {
    image_cover,
    dlc_lottery_sale_quantity,
    dlc_sale_start_time,
    dlc_sale_end_time,
  } = lotteryProperties

  coverURL.value = image_cover
  saleQuantity.value = dlc_lottery_sale_quantity
  saleStartTime.value = +dlc_sale_start_time * 1000
  saleEndTime.value = +dlc_sale_end_time * 1000

  cards.value = lotteryDetail.value?.item_list.map(i => i.card_info).sort((a, b) => b.card_scarcity - a.card_scarcity) ?? []
  loading.value = false
})

const previewImages = computed(() => [coverURL.value, ...cards.value.map(c => c.card_img)])

const router = useRouter()
const resolveEmoji = () => {
  if (emojiInfo.value.length === 0) return

  const { redeem_item_id } = emojiInfo.value[0]
  router.push(`/emoji/${redeem_item_id}?suit=true`)
}
</script>
<template>
  <div
    v-loading="loading"
    class="flex flex-col gap-4 p-2"
  >
    <!-- 收藏集详细信息 -->
    <ElDescriptions
      :column="2"
      border
    >
      <template #title>
        <ElText size="large">
          {{ name }}
        </ElText>
      </template>

      <template #extra>
        <DebugButton :names="[`收藏集${lottery.properties.dlc_lottery_id}详情`]" />
      </template>

      <!-- 收藏集名称 -->
      <ElDescriptionsItem
        label="名称"
        name="name"
      >
        <ElLink
          :href="jumpLink"
          target="_blank"
          type="primary"
        >
          {{ name }}
        </ElLink>
      </ElDescriptionsItem>

      <!-- 销量 -->
      <ElDescriptionsItem label="销量">
        {{ saleQuantity }}
      </ElDescriptionsItem>

      <!-- 销售时间 -->
      <ElDescriptionsItem
        :span="1"
        label="销售时间"
      >
        {{ new Date(saleStartTime).toLocaleString() }} ~ {{ new Date(saleEndTime).toLocaleString() }}
      </ElDescriptionsItem>

      <!-- 收藏集表情包信息 -->
      <ElDescriptionsItem
        label="表情包"
        :span="1"
        v-if="emojiInfo.length > 0"
      >
        <ElLink
          type="primary"
          @click="resolveEmoji"
        >
          {{ name + emojiInfo[0].redeem_item_name }}
        </ElLink>
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 收藏集图片展示 -->
    <ElSpace
      class="justify-center"
      wrap
    >
      <ImageVideoCard
        v-if="!loading"
        :download-name="`${name} - 封面`"
        :image="coverURL"
        :preview-images="previewImages"
        title="收藏集封面"
      />
      <ImageVideoCard
        v-for="(card, index) in cards"
        :key="card.card_type_id"
        :title="card.card_name"
        :subtitle="`稀有度：${card.card_scarcity}`"
        :download-name="`${name} - ${card.card_name}`"
        :image="card.card_img"
        :video="card.video_list?.[0]"
        :index="index + 1"
        :preview-images="previewImages"
      />
    </ElSpace>
  </div>
</template>