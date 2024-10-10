<script setup lang="ts">
import type { LotteryCardInfo } from '../lottery.ts'

defineProps<{
  card: LotteryCardInfo
}>()

</script>

<template>
  <ElCard class="w-64 h-128">
    <template #header>
      {{ card.card_name }}
    </template>
    <ElImage fit="contain"
             :src="card.card_img"
             :alt="card.card_name"
             :preview-src-list="[card.card_img]"
             :hide-on-click-modal="true"
             referrerpolicy="no-referrer"
    />
    <template #footer>
      <ElRow>
        <ElCol :span="12">
          <p>稀有度：{{ card.card_scarcity }}</p>
        </ElCol>
        <ElCol :span="12">
          <ElLink v-if="card.video_list" type="primary" :href="card.video_list[0]" target="_blank">查看视频</ElLink>
        </ElCol>
      </ElRow>
    </template>
  </ElCard>
</template>