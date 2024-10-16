<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import { DynamicInfo } from "../../types.ts";
import { resolveActID, resolveSuitID, resolveText } from "../../linkResolver.ts";

const loading = ref(false)

const route = useRoute<'/dynamic/[id]'>()

const dynamicData = ref<DynamicInfo>()

const authorInfo = computed(() => dynamicData.value?.modules.module_author)
const dynamicInfo = computed(() => dynamicData.value?.modules.module_dynamic)

onMounted(async () => {
  loading.value = true

  const url = new URL('https://api.bilibili.com/x/polymer/web-dynamic/v1/detail')
  url.searchParams.set('id', route.params.id)
  url.searchParams.set('features', 'itemOpusStyle')

  let data: DynamicInfo
  try {
    const resp = await cachedAPIFetch(url)
    data = resp.data.item
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取动态信息出错：${e}`,
      type: 'error',
    })
    loading.value = false
    return
  }

  dynamicData.value = data

  loading.value = false
})

const dynamicContent = computed(() => {
  if (dynamicInfo.value?.desc) {
    return dynamicInfo.value.desc
  }
  return dynamicInfo.value?.major?.opus.summary
})

const hasDecoration = computed(() => authorInfo.value?.decorate)

const decorateDescription = computed(() => {
  const type = resolveText(authorInfo.value?.decorate?.jump_url)
  if (type === 'suit' && authorInfo.value?.decorate?.fan.is_fan) {
    return '粉丝装扮'
  } else if (type === 'lottery') {
    return '收藏集'
  }
  return '装扮'
})

const pictureLinks = computed(() => dynamicInfo.value?.major?.opus.pics?.map(p => p.url))

const router = useRouter()
const jump = async () => {
  const type = resolveText(authorInfo.value?.decorate?.jump_url)
  if (type === 'suit') {
    const id = resolveSuitID(authorInfo.value?.decorate?.jump_url)
    await router.push({ path: `/suit/${id}` })
  } else if (type === 'lottery') {
    const id = resolveActID(authorInfo.value?.decorate?.jump_url)
    await router.push({ path: '/lottery', query: { act_id: id } })
  }
}
</script>
<template>
  <div>
    <ElDescriptions :column="2" border v-if="!loading">
      <ElDescriptionsItem label="UP主" min-width="80px">
        <div class="flex items-center">
          <ElLink type="primary" :href="`https://space.bilibili.com/${authorInfo?.mid}`" target="_blank">
            <ElImage :src="authorInfo?.face" referrerpolicy="no-referrer" class="h-12 w-12 rounded-full"/>
            <span class="ml-2">{{ authorInfo?.name }}</span>
          </ElLink>
        </div>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="decorateDescription">
        <ElLink v-if="hasDecoration" type="primary" @click="jump">
          {{ authorInfo?.decorate?.name ?? '无' }}
          <template v-if="authorInfo?.decorate?.fan.is_fan"> {{
              authorInfo.decorate.fan.num_prefix + authorInfo.decorate.fan.num_str
            }}
          </template>
        </ElLink>
        <template v-else>无</template>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="标题" :span="2">{{ dynamicInfo?.major?.opus?.title ?? '无' }}</ElDescriptionsItem>

      <!-- TODO 换行？ -->
      <ElDescriptionsItem label="内容" :span="2">{{ dynamicContent?.text }}</ElDescriptionsItem>
    </ElDescriptions>
    <ElDivider>动态图片</ElDivider>
    <ElSpace class="w-full justify-center" wrap>

      <ImageCard v-for="(image, index) in pictureLinks"
                 :key="image"
                 :image="image"
                 :download-name="image.split('/').pop()"
                 :preview-images="pictureLinks"
                 :index="index"
      ></ImageCard>
    </ElSpace>
  </div>
</template>