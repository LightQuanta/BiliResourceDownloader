<script setup lang="ts">
import type { GarbSearchResult, LotteryProperties, SuitProperties } from '../types.ts'

const router = useRouter()

const prop = defineProps<{
  garb: GarbSearchResult<LotteryProperties | SuitProperties>
}>()

const isLottery = computed(() => prop.garb.properties?.type === 'dlc_act')
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
  <ElCard class="sm:w-80 w-32">
    <template #header>
      <ElTooltip
        :content="garb.name"
        placement="top"
      >
        <ElLink
          :href="garb.jump_link"
          class="w-full text-center text-nowrap"
          target="_blank"
          type="primary"
        >
          {{ garb.name }}
        </ElLink>
      </ElTooltip>
      <br>
      <div class="flex flex-row w-full">
        <ElText class="block">
          {{ isLottery ? '收藏集' : '装扮' }}
        </ElText>
        <ElText class="block !ml-auto">
          销量：{{ garb.sale_count_desc }}
        </ElText>
      </div>
    </template>
    <ElImage
      :alt="garb.name"
      :hide-on-click-modal="true"
      :preview-src-list="[garb.properties?.image_cover]"
      :src="garb.properties?.image_cover"
      fit="contain"
      preview-teleported
      referrerpolicy="no-referrer"
      class="sm:h-96 h-36 w-full"
    />
    <template #footer>
      <div class="flex h-4 items-center justify-center">
        <ElButton
          type="primary"
          @click="jump"
        >
          查看
        </ElButton>
      </div>
    </template>
  </ElCard>
</template>