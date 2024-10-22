<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import { BasicVideoInfo } from "../../types.ts";

const loading = ref(false)
const route = useRoute<'/video/[id]'>()

const videoInfo = ref<BasicVideoInfo>()
const avid = ref('')
const bvid = ref('')

const fetchData = async () => {
  loading.value = true

  const videoID = route.params.id
  const url = new URL('https://api.bilibili.com/x/web-interface/view')

  if (/^(av|AV)\d+$/.test(videoID)) {
    url.searchParams.set('aid', videoID)
  } else if (/^(BV|bv)\w+/.test(videoID)) {
    url.searchParams.set('bvid', videoID)
  } else {
    ElMessage({
      message: '无效的视频ID',
      type: 'error',
    })
    loading.value = false
    return
  }

  try {
    const resp = await APIFetch<BasicVideoInfo>(url, null, {
      debug: {
        name: '视频信息',
        extra: { id: videoID },
      }
    })
    videoInfo.value = resp.data
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取视频信息出错：${e}`,
      type: 'error',
    })
    loading.value = false
    return
  }

  avid.valeu = videoInfo.value.aid
  bvid.value = videoInfo.value.bvid

  loading.value = false
}

watch(() => route.params.id, fetchData, { immediate: true })

</script>
<template>
  <div v-loading="loading">
    <ElDescriptions
      v-if="!loading"
      :column="6"
      border
    >
      <template #title>
        视频信息
      </template>

      <!-- 调试信息 -->
      <template #extra>
        <DebugButton :names="['视频信息']" />
      </template>

      <ElDescriptionsItem
        label="标题"
        :span="4"
      >
        {{ videoInfo.title }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="分区"
        :span="2"
      >
        {{ videoInfo.tname }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="UP主信息"
        :span="4"
      >
        <template v-if="(videoInfo?.staff ?? []).length > 0">
          <UPInfo
            v-for="up in videoInfo?.staff ?? []"
            :key="up.mid"
            :mid="up.mid.toString()"
            :name="up.name"
            :subtitle="up.title"
            :face="up.face"
          />
        </template>
        <UPInfo
          v-else
          :mid="videoInfo.owner.mid.toString()"
          :name="videoInfo.owner.name"
          :face="videoInfo.owner.face"
        />
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="发布时间"
        :span="1"
      >
        {{ new Date(videoInfo.pubdate * 1000).toLocaleString() }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="投稿时间"
        :span="1"
      >
        {{ new Date(videoInfo.ctime * 1000).toLocaleString() }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="播放"
        :span="1"
      >
        {{ videoInfo.stat.view }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="弹幕"
        :span="1"
      >
        {{ videoInfo.stat.danmaku }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="评论"
        :span="1"
      >
        {{ videoInfo.stat.reply }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="点赞"
        :span="1"
      >
        {{ videoInfo.stat.like }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="收藏"
        :span="1"
      >
        {{ videoInfo.stat.favorite }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="分享"
        :span="1"
      >
        {{ videoInfo.stat.share }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="简介"
        :span="6"
      >
        <span class="whitespace-pre-wrap">
          {{ videoInfo.desc }}
        </span>
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="动态简介"
        :span="6"
      >
        <span class="whitespace-pre-wrap">
          {{ videoInfo.dynamic }}
        </span>
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider v-if="12">
      视频图片
    </ElDivider>
    <ElSpace
      class="w-full justify-center"
      wrap
    >
      <ImageVideoCard
        :image="videoInfo?.pic ?? ''"
        title="封面"
      />
    </ElSpace>
  </div>
</template>