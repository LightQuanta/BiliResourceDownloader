<script setup lang="ts">
const route = useRoute()

const loading = ref(false)

const backgroundImage = ref('')
const coverImage = ref('')
const keyframeImage = ref('')
const liveroomTitle = ref('')
const liveroomDescription = ref('')
const areaType = ref('')
const roomId = ref('')
const roomTags = ref<string[]>([])
const uid = ref('')

onMounted(async () => {
  loading.value = true
  roomId.value = route.params.id

  const url = new URL('https://api.live.bilibili.com/room/v1/Room/get_info')
  url.searchParams.set('room_id', roomId.value)

  let data = null
  try {
    const resp = await fetch(url).then(r => r.json())
    if (resp.code !== 0) throw resp.msg
    data = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取直播间信息出错：${e}`,
      type: 'error',
    })
    loading.value = false
    return null
  }

  const { description, title, background, user_cover, keyframe, area_name, tags, uid: userId } = data

  backgroundImage.value = background
  coverImage.value = user_cover
  keyframeImage.value = keyframe
  liveroomTitle.value = title
  liveroomDescription.value = description
  areaType.value = area_name
  uid.value = userId
  roomTags.value = tags.split(',')

  loading.value = false
})

</script>

<template>
  <div v-loading="loading">
    <!-- TODO 什么b玩意丑死了，谁能帮忙改改UI -->
    <ElDescriptions border :column="2">
      <template #title>
        <div>
          <ElLink type="primary" :href="`https://live.bilibili.com/${roomId}`" target="_blank">直播间{{
              roomId
            }}
          </ElLink>
          基础信息
        </div>
      </template>
      <ElDescriptionsItem label="标题">{{ liveroomTitle }}</ElDescriptionsItem>
      <ElDescriptionsItem label="分区">{{ areaType }}</ElDescriptionsItem>
      <ElDescriptionsItem label="简介" :span="2">{{ liveroomDescription }}</ElDescriptionsItem>
      <ElDescriptionsItem label="标签" :span="2">
        <ElSpace wrap>
          <ElTag v-for="tag in roomTags" :key="tag">{{ tag }}</ElTag>
        </ElSpace>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="空间" :span="2">
        <ElLink type="primary" :href="`/space/${uid}`">点击跳转</ElLink>
      </ElDescriptionsItem>
    </ElDescriptions>
    <ElDivider/>
    <ElSpace direction="vertical" class="w-full justify-center" v-if="backgroundImage">
      <ElText size="large">直播间相关图片</ElText>
      <ElSpace wrap class="justify-center">
        <ImageCard :image="backgroundImage" title="网页端直播间背景图"/>
        <ImageCard :image="coverImage" title="直播间封面"/>
        <ImageCard v-if="keyframeImage != ''" :image="keyframeImage" title="直播间关键帧"/>
      </ElSpace>
    </ElSpace>
  </div>
</template>
