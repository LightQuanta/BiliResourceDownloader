<script lang="ts" setup>
import type { GarbSearchResult, LotteryCardInfo, LotteryProperties, LotteryDetail } from '../types.ts'

const name = ref('')
const jumpLink = ref('')
const cards = ref<LotteryCardInfo[]>([])

const loading = ref(false)

const params = useUrlSearchParams('history')

const coverURL = ref('')
const saleQuantity = ref(0)
const saleStartTime = ref(0)
const saleEndTime = ref(0)


onMounted(async () => {
  loading.value = true

  const lotteryInfo = JSON.parse(params.lottery as string) as GarbSearchResult

  const lotteryProperties = lotteryInfo.properties as LotteryProperties

  const { name: lotteryName, jump_link: lotteryLink } = lotteryInfo
  const { dlc_act_id: actId, dlc_lottery_id: lotteryId } = lotteryProperties

  name.value = lotteryName
  jumpLink.value = lotteryLink

  const url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
  url.searchParams.set('act_id', String(actId))
  url.searchParams.set('lottery_id', String(lotteryId))

  const lotteryDetail: LotteryDetail = await fetch(url).then(r => r.json()).then(r => r.data)

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

</script>
<template>
  <div class="flex flex-col gap-4" v-loading="loading">
    <ElDescriptions border :column="2">
      <ElDescriptionsItem label="名称">
        <ElLink type="primary" :href="jumpLink" target="_blank">{{ name }}</ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="销量">{{ saleQuantity }}</ElDescriptionsItem>
      <ElDescriptionsItem label="销售时间" :span="2">
        {{ new Date(saleStartTime).toLocaleString() }} ~ {{ new Date(saleEndTime).toLocaleString() }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElSpace wrap class="justify-center">
      <ImageCard title="收藏集封面" :image="coverURL" :download-name="`${name}-封面`"/>
      <LotteryCard v-for="card in cards" :key="card.card_type_id" :card="card"/>
    </ElSpace>
  </div>
</template>