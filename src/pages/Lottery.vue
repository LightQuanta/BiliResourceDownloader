<script lang="ts" setup>
import type { LotteryCardInfo, LotteryInfo, LotteryDetail } from '../lottery.ts'

const searchText = ref('')
const name = ref('')
const jumpLink = ref('')
const cards = ref<LotteryCardInfo[]>([])

const loading = ref(false)

const test = async () => {
  loading.value = true

  let url = new URL('https://api.bilibili.com/x/garb/v2/mall/home/search')
  url.searchParams.set('key_word', searchText.value)
  url.searchParams.set('pn', '1')
  const lotteryInfo: LotteryInfo[] = (await fetch(url)
          .then(r => r.json())
          .then(r => r.data.list)
  ).filter(i => i.properties.type === 'dlc_act')

  // TODO 实现收藏集选择
  const { name: lotteryName, jump_link: lotteryLink } = lotteryInfo[0]
  const { dlc_act_id: actId, dlc_lottery_id: lotteryId } = lotteryInfo[0].properties

  name.value = lotteryName
  jumpLink.value = lotteryLink

  url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
  url.searchParams.set('act_id', String(actId))
  url.searchParams.set('lottery_id', String(lotteryId))

  const lotteryDetail: LotteryDetail = await fetch(url).then(r => r.json()).then(r => r.data)
  cards.value = lotteryDetail.item_list.map(i => i.card_info).sort((a, b) => b.card_scarcity - a.card_scarcity)

  loading.value = false
}

</script>
<template>
  <div v-loading="loading">
    <!-- TODO 实现收藏集相关页面 -->
    <ElInput type="text" v-model="searchText" placeholder="搜索收藏集"/>
    <ElButton class="w-20 mx-auto" @click="test">测试搜索</ElButton>
    <ElLink type="primary" :href="jumpLink" target="_blank">{{ name }}</ElLink>
    <ElSpace wrap>
      <LotteryCard v-for="card in cards" :key="card.card_type_id" :card="card"/>
    </ElSpace>
  </div>
</template>