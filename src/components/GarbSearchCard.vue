<script setup lang="ts">
import type { GarbSearchResult } from '../types.ts'

const router = useRouter()

const prop = defineProps<{
  garb: GarbSearchResult
}>()

const isLottery = computed(() => prop.garb.properties.type === 'dlc_act')
const jump = () => {
  if (isLottery.value) {
    router.push({ path: '/lottery', query: { lottery: JSON.stringify(prop.garb) } })
  } else {
    // TODO 实现装扮页面
  }
}
</script>

<template>
  <ElCard class="w-80">
    <template #header>
      <ElTooltip placement="top" :content="garb.name">
        <ElText size="large" type="primary" truncated>{{ garb.name }}</ElText>
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
    />
    <template #footer>
      <div class="flex h-4 items-center justify-center">
        <ElButton type="primary" @click="jump">查看</ElButton>
      </div>
    </template>
  </ElCard>
</template>