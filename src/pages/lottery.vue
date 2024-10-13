<script lang="ts" setup>
import type { GarbSearchResult, LotteryCardInfo, LotteryProperties, LotteryDetail } from '../types.ts'

const name = ref('')
const jumpLink = ref('')
const cards = ref<LotteryCardInfo[]>([])

const loading = ref(false)

const params = useUrlSearchParams('history')

onMounted(async () => {
  loading.value = true

  const lotteryInfo = JSON.parse(params.lottery as string) as GarbSearchResult

  // TODO 实现收藏集选择
  const { name: lotteryName, jump_link: lotteryLink } = lotteryInfo
  const { dlc_act_id: actId, dlc_lottery_id: lotteryId } = lotteryInfo.properties as LotteryProperties

  name.value = lotteryName
  jumpLink.value = lotteryLink

  const url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
  url.searchParams.set('act_id', String(actId))
  url.searchParams.set('lottery_id', String(lotteryId))

  const lotteryDetail: LotteryDetail = await fetch(url).then(r => r.json()).then(r => r.data)
  cards.value = lotteryDetail.item_list.map(i => i.card_info).sort((a, b) => b.card_scarcity - a.card_scarcity)

  loading.value = false
})

</script>
<template>
  <div v-loading="loading">
    <ElLink type="primary" :href="jumpLink" target="_blank">{{ name }}</ElLink>
    <ElSpace wrap class="justify-center">
      <LotteryCard v-for="card in cards" :key="card.card_type_id" :card="card"/>
    </ElSpace>
  </div>
</template>