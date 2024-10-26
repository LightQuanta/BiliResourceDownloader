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
    url.searchParams.set('aid', videoID.substring(2))
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
    const extraParams = /^(av|AV)\d+$/.test(videoID) ? { aid: 'AV号' } : { bvid: 'BV号' }
    const resp = await APIFetch<BasicVideoInfo>(url, undefined, {
      debug: {
        name: '视频信息',
        extraParams,
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

  avid.value = videoInfo.value.aid.toString()
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
        :span="3"
        min-width="100px"
      >
        <ElLink
          type="primary"
          :href="`https://www.bilibili.com/video/${bvid}`"
          target="_blank"
        >
          {{ videoInfo?.title }}
        </ElLink>
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="分区"
        :span="3"
        min-width="100px"
      >
        {{ videoInfo?.tname }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="UP主信息"
        :span="6"
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
          :mid="videoInfo?.owner.mid.toString()"
          :name="videoInfo?.owner.name"
          :face="videoInfo?.owner.face"
        />
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="发布时间"
        :span="3"
      >
        {{ new Date(videoInfo?.pubdate * 1000).toLocaleString() }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="投稿时间"
        :span="3"
      >
        {{ new Date(videoInfo?.ctime * 1000).toLocaleString() }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="AV号"
        :span="3"
      >
        av{{ avid }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="BV号"
        :span="3"
      >
        {{ bvid }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="播放"
        :span="1"
      >
        {{ videoInfo?.stat.view }}
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
        {{ videoInfo?.stat.reply }}
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
        {{ videoInfo?.stat.favorite }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="分享"
        :span="1"
      >
        {{ videoInfo?.stat.share }}
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="简介"
        :span="6"
        v-if="videoInfo?.desc?.length ?? 0 > 0"
      >
        <div class="whitespace-pre-wrap max-h-24 hover:max-h-screen overflow-y-auto transition-all duration-500">
          {{ videoInfo?.desc }}
        </div>
      </ElDescriptionsItem>

      <ElDescriptionsItem
        label="动态简介"
        :span="6"
        v-if="videoInfo?.dynamic.length ?? 0 > 0"
      >
        <div class="whitespace-pre-wrap max-h-24 hover:max-h-screen overflow-y-auto transition-all duration-500">
          {{ videoInfo?.dynamic }}
        </div>
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider>视频图片</ElDivider>
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