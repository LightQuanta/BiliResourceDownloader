<script setup lang="ts">
const params = useUrlSearchParams('history')
// const resp = ref('')

const loading = ref(false)

const backgroundImage = ref('')
const coverImage = ref('')
const keyframeImage = ref('')
const liveroomTitle = ref('')
const liveroomDescription = ref('')
const areaType = ref('')

onMounted(async () => {
  loading.value = true
  const { id: roomId } = params

  const url = new URL('https://api.live.bilibili.com/room/v1/Room/get_info')
  url.searchParams.set('room_id', roomId as string)

  let data = null
  try {
    data = await fetch(url).then(r => r.json()).then(d => d.data)
    if (Object.keys(data).length == 0) throw '服务器未正确返回数据'
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取直播间信息出错：${e}`,
      type: 'error',
    })
    loading.value = false
    return null
  }

  // resp.value = data

  const { description, title, background, user_cover, keyframe, area_name } = data

  backgroundImage.value = background
  coverImage.value = user_cover
  keyframeImage.value = keyframe

  liveroomTitle.value = title
  liveroomDescription.value = description
  areaType.value = area_name

  loading.value = false
})

</script>

<template>
  <div v-loading="loading">
    <!-- TODO 什么b玩意丑死了，谁能帮忙改改UI -->
    <ElDescriptions title="直播间基础信息" border :column="2">
      <ElDescriptionsItem label="标题">{{ liveroomTitle }}</ElDescriptionsItem>
      <ElDescriptionsItem label="直播分区">{{ areaType }}</ElDescriptionsItem>
      <ElDescriptionsItem label="直播间简介" :span="2">{{ liveroomDescription }}</ElDescriptionsItem>
    </ElDescriptions>
    <ElDivider/>
    <ElSpace direction="vertical" class="w-full justify-center" v-if="loading == true">
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