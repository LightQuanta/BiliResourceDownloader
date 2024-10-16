<script setup lang="ts">
import type { GarbSearchResult, LotteryProperties } from '../types.ts'

const router = useRouter()

const prop = defineProps<{
  garb: GarbSearchResult
}>()

const isLottery = computed(() => prop.garb.properties.type === 'dlc_act')
const jump = () => {
  if (isLottery.value) {
    const { dlc_act_id, dlc_lottery_id } = prop.garb.properties as LotteryProperties
    router.push({ path: '/lottery', query: { act_id: dlc_act_id, lottery_id: dlc_lottery_id } })
  } else {
    router.push({ path: `/suit/${prop.garb.item_id}` })
  }
}
</script>

<template>
  <ElCard class="w-80">
    <template #header>
      <ElTooltip placement="top" :content="garb.name">
        <ElLink type="primary" :href="garb.jump_link" class="w-full text-center text-nowrap" target="_blank">
          {{ garb.name }}
        </ElLink>
      </ElTooltip>
      <br/>
      <div class="flex flex-row w-full">
        <ElText class="block">{{ isLottery ? '收藏集' : '装扮' }}</ElText>
        <ElText class="block !ml-auto">销量：{{ garb.sale_count_desc }}</ElText>
      </div>
    </template>
    <ElImage fit="contain"
             :src="garb.properties.image_cover"
             :alt="garb.name"
             :preview-src-list="[garb.properties.image_cover]"
             :hide-on-click-modal="true"
             referrerpolicy="no-referrer"
             class="w-full h-96"
             lazy
             preview-teleported
    />
    <template #footer>
      <div class="flex h-4 items-center justify-center">
        <ElButton type="primary" @click="jump">查看</ElButton>
      </div>
    </template>
  </ElCard>
</template>