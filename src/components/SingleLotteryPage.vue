<script lang="ts" setup>
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import type { GarbSearchResult, LotteryCardInfo, LotteryDetail, LotteryProperties, } from '../types.ts'

const name = ref('')
const jumpLink = ref('')
const cards = ref<LotteryCardInfo[]>([])

const loading = ref(false)

const coverURL = ref('')
const saleQuantity = ref(0)
const saleStartTime = ref(0)
const saleEndTime = ref(0)

const props = defineProps<{
  lottery: GarbSearchResult<LotteryProperties>
}>()


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

  let lotteryDetail: LotteryDetail
  try {
    lotteryDetail = await cachedAPIFetch(url).then(r => r.data)
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

  cards.value = lotteryDetail.item_list.map(i => i.card_info).sort((a, b) => b.card_scarcity - a.card_scarcity)
  loading.value = false
})

const previewImages = computed(() => [coverURL.value, ...cards.value.map(c => c.card_img)])
</script>
<template>
  <div
    v-loading="loading"
    class="flex flex-col gap-4"
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
      <ElDescriptionsItem label="销量">
        {{ saleQuantity }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="销售时间"
      >
        {{ new Date(saleStartTime).toLocaleString() }} ~ {{ new Date(saleEndTime).toLocaleString() }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 收藏集图片展示 -->
    <ElSpace
      class="justify-center"
      wrap
    >
      <ImageCard
        v-if="!loading"
        :download-name="`${name}-封面`"
        :image="coverURL"
        :preview-images="previewImages"
        title="收藏集封面"
      />
      <LotteryCard
        v-for="(card, index) in cards"
        :key="card.card_type_id"
        :card="card"
        :index="index + 1"
        :preview-images="previewImages"
      />
    </ElSpace>
  </div>
</template>