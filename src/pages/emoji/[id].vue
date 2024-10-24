<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import { BatchDownloadTask, EmojiPackageDetail, SuitDetail } from "../../types.ts";
import { autoJump, resolveText } from "../../linkResolver.ts";
import { sep } from "@tauri-apps/api/path";

const route = useRoute<'/emoji/[id]'>()
const loading = ref(false)

const id = ref('')
const requestURL = ref('')
const responseJSON = ref('')

interface EmojiInfo {
  name: string
  url: string
}

const name = ref('')
const emojiInfo = ref<EmojiInfo[]>([])
const link = ref('')
const createTime = ref(-1)

const isSuitAPI = ref(false)

const isPureText = ref(false)

const generateDownloadTask = () => {
  let finalName = name.value
  if (!name.value.endsWith('表情包') && !name.value.endsWith('表情')) {
    finalName += '表情包'
  }
  return {
    name: finalName,
    files: emojiInfo.value?.map(e => {
      return {
        path: finalName + sep() + e.name,
        url: e.url,
      }
    }) ?? [],
  } as BatchDownloadTask
}

const fetchData = async () => {
  loading.value = true
  id.value = route.params.id

  isSuitAPI.value = ((route.query.suit as string) ?? '') === 'true'

  if (!isSuitAPI.value) {
    // 使用表情包专属信息API，将ID视为表情包搜索界面ID
    // 尽量优先使用该API，不容易出问题
    const url = new URL('https://api.bilibili.com/x/emote/package')
    url.searchParams.set('ids', id.value)
    url.searchParams.set('business', 'reply')

    requestURL.value = url.toString()

    try {
      const resp = await APIFetch<{
        packages: EmojiPackageDetail[]
      }>(url, undefined, {
        debug: {
          name: '表情包信息',
          extraParams: { ids: '表情包ID' },
        }
      })

      const packageDetail = resp.data.packages[0] as EmojiPackageDetail

      name.value = packageDetail.text
      emojiInfo.value = packageDetail.emote.map(e => {
        return {
          name: e.meta.alias ?? '',
          url: e.url,
        }
      }) ?? []

      createTime.value = packageDetail.mtime * 1000
      link.value = packageDetail.meta.item_url ?? ''
      isPureText.value = packageDetail.type === 4
      responseJSON.value = JSON.stringify(packageDetail, null, 2)
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取表情包信息出错：${e}`,
        type: 'error',
      })
    }
  } else {
    // 使用装扮信息API，将ID视为装扮信息
    const url = new URL('https://api.bilibili.com/x/garb/v2/user/suit/benefit')
    url.searchParams.set('item_id', id.value)
    url.searchParams.set('part', 'card')

    try {
      const resp = await APIFetch<SuitDetail>(url, undefined, {
        debug: {
          name: '表情包信息',
          extraParams: { item_id: '表情包ID' }
        }
      })

      const suitEmojiDetail = resp.data.suit_items.emoji ?? []

      name.value = resp.data.name
      emojiInfo.value = suitEmojiDetail.map(e => {
        return {
          name: e.name.split('_')[1]?.slice(0, -1) ?? e.name,
          url: e.properties.image,
        }
      }) ?? []

      link.value = resp.data.buy_link
      isPureText.value = false
      responseJSON.value = JSON.stringify(suitEmojiDetail, null, 2)
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取表情包信息出错：${e}`,
        type: 'error',
      })
    }
  }

  loading.value = false
}

watch(() => route.params.id, fetchData, { immediate: true })

const resolveLink = async () => {
  if (resolveText(link.value) !== null) {
    await autoJump(link.value, true)
  } else {
    window.open(link.value)
  }
}

const pictureLinks = computed(() => emojiInfo.value.map(e => e.url))
</script>

<template>
  <div v-loading="loading">
    <ElDescriptions
      :column="2"
      border
    >
      <template #title>
        表情包信息
      </template>

      <template #extra>
        <DebugButton :names="['表情包信息']" />
        <BatchDownloadButton
          v-if="!isPureText"
          :task="generateDownloadTask"
        />
      </template>

      <ElDescriptionsItem label="名称">
        {{ name }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="ID">
        {{ route.params.id + (isSuitAPI ? ' (装扮信息ID)' : '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="创建时间"
        v-if="createTime > 0"
      >
        {{
          new Date(createTime).toLocaleString()
        }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="link"
        :span="2"
        label="相关链接"
      >
        <ElLink
          type="primary"
          @click="resolveLink"
        >
          点击解析
        </ElLink>
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider v-if="pictureLinks?.length ?? 0 > 0">
      表情包内容
    </ElDivider>
    <ElSpace
      class="w-full justify-center"
      wrap
      v-if="!isPureText"
    >
      <ImageVideoCard
        v-for="(emoji, index) in emojiInfo"
        :key="emoji.name"
        :image="emoji.url"
        :index="index"
        :preview-images="pictureLinks"
        :title="emoji.name"
      />
    </ElSpace>
    <div
      v-else
      class="flex flex-col gap-4 justify-center"
    >
      <ElText
        type="primary"
        size="large"
        v-for="emoji in emojiInfo"
        :key="emoji.name"
      >
        {{ emoji.name }}
      </ElText>
    </div>
  </div>
</template>
