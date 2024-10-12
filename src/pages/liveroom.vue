<script setup lang="ts">
const params = useUrlSearchParams('history')
// const resp = ref('')

const backgroundImage = ref('')
const coverImage = ref('')
const keyframeImage = ref('')
const liveroomTitle = ref('')
const liveroomDescription = ref('')
const areaType = ref('')

watchEffect(async () => {
  const { id: roomId } = params

  const url = new URL('https://api.live.bilibili.com/room/v1/Room/get_info')
  url.searchParams.set('room_id', roomId as string)

  const data = await fetch(url).then(r => r.json()).then(d => d.data)
  // resp.value = data

  const { description, title, background, user_cover, keyframe, area_name } = data

  backgroundImage.value = background
  coverImage.value = user_cover
  keyframeImage.value = keyframe

  liveroomTitle.value = title
  liveroomDescription.value = description
  areaType.value = area_name
})

</script>

<template>
  <div>
    <!-- TODO 什么b玩意丑死了，谁能帮忙改改UI -->
    <ElDescriptions title="直播间基础信息" border :column="2">
      <ElDescriptionsItem label="直播间标题">{{ liveroomTitle }}</ElDescriptionsItem>
      <ElDescriptionsItem label="直播间简介">{{ liveroomDescription }}</ElDescriptionsItem>
      <ElDescriptionsItem label="直播分区">{{ areaType }}</ElDescriptionsItem>
    </ElDescriptions>
    <ElDivider/>
    <ElSpace direction="vertical" class="w-full justify-center">
      <ElText size="large">直播间相关图片</ElText>
      <div>{{ params.roomId }}</div>
      <ElSpace wrap class="justify-center">
        <ImageCard :image="backgroundImage" title="网页端直播间背景图"/>
        <ImageCard :image="coverImage" title="直播间封面"/>
        <ImageCard v-if="keyframeImage != ''" :image="keyframeImage" title="直播间关键帧"/>
      </ElSpace>
    </ElSpace>
    <!-- <pre>{{ resp }}</pre> -->
  </div>
</template>

<style scoped>

</style>