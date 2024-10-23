<script lang="ts" setup>
import { APIFetch } from "../APIFetch.ts";
import type { GarbSearchResult, LotteryCardInfo, LotteryDetail, LotteryProperties, RedeemInfo, } from '../types.ts'

const props = defineProps<{
  lottery: GarbSearchResult<LotteryProperties>
  extraCardsInfo?: {
    lottery_id: number
    card_type_id: number
    total_cnt: number
    holding_rate: number
  }[]
}>()

const name = ref('')
const jumpLink = ref('')
const cards = ref<LotteryCardInfo[]>([])

const loading = ref(false)

const lotteryDetail = ref<LotteryDetail>()
const coverURL = ref('')
const saleQuantity = ref(-1)
const saleStartTime = ref(0)
const saleEndTime = ref(0)

const combinedRedeemInfo = computed<RedeemInfo[]>(() => [].concat(lotteryDetail.value?.collect_list.collect_chain ?? [], lotteryDetail.value?.collect_list.collect_infos ?? []))

// 收藏集表情包信息
const emojiInfo = computed(() => combinedRedeemInfo.value.filter(r => r.redeem_item_type === 2))

// 钻石头像背景
const diamondBackgrounds = computed(() => combinedRedeemInfo.value.filter(r => r.redeem_item_type === 1000))
// 收藏集勋章
const medals = computed(() => combinedRedeemInfo.value.filter(r => r.redeem_item_type === 1001))
// 典藏卡
const specialCards = computed(() => combinedRedeemInfo.value.filter(r => r.redeem_item_type === 1))
// 头像框
const pendants = computed(() => combinedRedeemInfo.value.filter(r => r.redeem_item_type === 3))

// 装扮
// TODO 这玩意怎么解析？
// const suit = computed(() => combinedRedeemInfo.value.filter(r => r.redeem_item_type === 5))

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
    lotteryDetail.value = await APIFetch<LotteryDetail>(url, null, {
      debug: {
        name: `收藏集${lotteryID}详情`,
        extraParams: {
          act_id: '收藏集组ID',
          lottery_id: '收藏集ID'
        },
      }
    }).then(r => r.data)
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

const previewImages = computed(() => cards.value.map(c => c.card_img))

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
          :type="saleQuantity === -1 ? 'danger' : 'primary'"
        >
          {{ name }}{{ saleQuantity === -1 ? '（收藏集已下架）' : '' }}
        </ElLink>
      </ElDescriptionsItem>

      <!-- 销量 -->
      <ElDescriptionsItem label="总销量">
        {{
          saleQuantity !== -1 ? saleQuantity : extraCardsInfo.filter(i => cards.map(c => c.card_type_id).includes(i.card_type_id)).reduce((acc, curr) => acc + curr.total_cnt, 0) + '（销量可能不准确，根据每张卡牌销量总和计算得出）'
        }}
      </ElDescriptionsItem>

      <!-- 销售时间 -->
      <ElDescriptionsItem
        :span="1"
        label="销售时间"
      >
        <div v-if="saleStartTime > 0">
          {{ new Date(saleStartTime).toLocaleString() }} ~ {{ new Date(saleEndTime).toLocaleString() }}
        </div>
        <ElText
          type="danger"
          v-else
        >
          未知
        </ElText>
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
          {{ emojiInfo[0].redeem_item_name }}
        </ElLink>
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 收藏集图片展示 -->
    <ElSpace
      class="justify-center w-full"
      wrap
    >
      <ImageVideoCard
        v-for="(card, index) in cards"
        :key="card.card_type_id"
        :title="card.card_name"
        :subtitle="`销量：${extraCardsInfo?.filter(i => i.card_type_id === card.card_type_id)[0]?.total_cnt}     概率：${extraCardsInfo?.filter(i => i.card_type_id === card.card_type_id)[0]?.holding_rate / 100}%`"
        :download-name="`${name} - ${card.card_name}`"
        :image="card.card_img"
        :video="card.video_list?.[0]"
        :index="index"
        :preview-images="previewImages"
      />
    </ElSpace>

    <ElDivider>其他内容</ElDivider>
    <ElSpace
      class="justify-center w-full"
      wrap
    >
      <!-- 封面 -->
      <ImageVideoCard
        v-if="coverURL !== ''"
        :download-name="`${name} - 封面`"
        :image="coverURL"
        title="收藏集封面"
      />
      <!-- 典藏卡 -->
      <ImageVideoCard
        v-for="special in specialCards"
        :key="special.redeem_item_name"
        :title="special.redeem_item_name"
        :subtitle="special.redeem_text"
        :download-name="`${name} - ${special.redeem_item_name}`"
        :image="special.redeem_item_image"
        :video="special.card_item.card_type_info?.content.animation?.animation_video_urls[0] ?? ''"
      />
      <!-- 钻石头像背景 -->
      <ImageVideoCard
        v-for="diamond in diamondBackgrounds"
        :key="diamond.redeem_item_name"
        :title="diamond.redeem_item_name"
        :subtitle="diamond.redeem_text"
        :download-name="`${name} - ${diamond.redeem_item_name}`"
        :image="diamond.redeem_item_image"
      />
      <!-- 勋章 -->
      <ImageVideoCard
        v-for="medal in medals"
        :key="medal.redeem_item_name"
        :title="medal.redeem_item_name"
        :subtitle="medal.redeem_text"
        :download-name="`${name} - ${medal.redeem_item_name}`"
        :image="medal.redeem_item_image"
      />
      <!-- 头像框 -->
      <ImageVideoCard
        v-for="pendant in pendants"
        :key="pendant.redeem_item_name"
        :title="pendant.redeem_item_name"
        :subtitle="pendant.redeem_text"
        :download-name="`${name} - ${pendant.redeem_item_name}`"
        :image="pendant.redeem_item_image"
      />
    </ElSpace>
  </div>
</template>