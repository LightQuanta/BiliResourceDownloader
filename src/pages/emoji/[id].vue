<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import { BatchDownloadTask, EmojiPackageDetail } from "../../types.ts";
import { autoJump, resolveText } from "../../linkResolver.ts";
import { sep } from "@tauri-apps/api/path";

const route = useRoute<'/emoji/[id]'>()

const id = ref('')
const requestURL = ref('')
const responseJSON = ref('')

const packageDetail = ref<EmojiPackageDetail>()
const emojis = computed(() => packageDetail.value?.emote ?? [])

const downloadTask = ref<BatchDownloadTask>()

const extractExtensionName = (url: string) => {
  return '.' + url.split('?')[0].split('.').pop()!.split('_')[0]
}
const generateDownloadTask = () => {
  downloadTask.value = {
    name: packageDetail.value!.text! + ' - 表情包',
    files: packageDetail.value?.emote.map(e => {
      return {
        path: packageDetail.value!.text! + ' - 表情包' + sep() + (e.meta.alias ?? e.text) + extractExtensionName(e.url),
        url: e.url,
      }
    }) ?? [],
  } as BatchDownloadTask
}

const fetchData = async () => {
  id.value = route.params.id

  const url = new URL('https://api.bilibili.com/x/emote/package')
  url.searchParams.set('ids', id.value)
  url.searchParams.set('business', 'reply')

  requestURL.value = url.toString()

  try {
    const resp = await cachedAPIFetch(url)
    packageDetail.value = resp.data.packages![0]! as EmojiPackageDetail
    responseJSON.value = JSON.stringify(packageDetail.value, null, 2)
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取表情信息出错：${e}`,
      type: 'error',
    })
  }

  generateDownloadTask()
}

watch(() => route.params.id, fetchData, { immediate: true })

const resolveLink = async () => {
  const link = packageDetail.value!.meta.item_url
  if (await resolveText(link) !== null) {
    await autoJump(link, true)
  } else {
    window.open(link)
  }
}

const pictureLinks = computed(() => emojis.value.map(e => e.url))
</script>

<template>
  <div>
    <ElDescriptions border :column="2">
      <template #title>表情包信息</template>

      <template #extra>
        <BatchDownloadButton :task="downloadTask"/>
      </template>

      <ElDescriptionsItem label="名称">{{ packageDetail?.text }}</ElDescriptionsItem>
      <ElDescriptionsItem label="ID">{{ packageDetail?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间" :span="2">{{
          new Date(packageDetail?.mtime * 1000).toLocaleString()
        }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="相关链接" :span="2" v-if="packageDetail?.meta.item_url">
        <ElLink type="primary" @click="resolveLink">点击解析</ElLink>
      </ElDescriptionsItem>

    </ElDescriptions>

    <ElDivider v-if="pictureLinks?.length ?? 0 > 0">表情包内容</ElDivider>
    <ElSpace class="w-full justify-center" wrap>
      <ImageCard v-for="(emoji, index) in emojis"
                 :key="emoji"
                 :image="emoji.url"
                 :title="emoji.meta.alias ?? emoji.text"
                 :download-name="emoji.meta.alias ?? emoji.text"
                 :preview-images="pictureLinks"
                 :index="index"
      />
    </ElSpace>
  </div>
</template>
