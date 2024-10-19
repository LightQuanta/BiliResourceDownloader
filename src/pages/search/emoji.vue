<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import { Search } from "@element-plus/icons-vue";
import type { EmojiPackageInfo, EmojiPackages, GeneralAPIResponse } from "../../types.ts";
import Fuse from "fuse.js";

// 默认首页展示的表情数
const DEFAULT_SHOW_COUNT = 50

// 每次懒加载增加数量
const EACH_PAGE_COUNT = 30

const keyword = ref('')
const currentIndex = ref(DEFAULT_SHOW_COUNT)

const emojiInfo = ref<EmojiPackages>()
const allEmojis = ref<EmojiPackageInfo[]>([])

const hasMore = computed(() => currentIndex.value < allEmojis.value.length)
const onlyMyEmoji = ref(false)
const myEmojiIDs = computed(() => emojiInfo.value?.user_panel_packages.map(p => p.id))

const filteredEmojiGroups = ref<EmojiPackageInfo[]>([])

watch(keyword, () => currentIndex.value = DEFAULT_SHOW_COUNT)
const updateSearch = () => {
  let filtered = allEmojis.value ?? []
  if (onlyMyEmoji.value) {
    filtered = filtered.filter(p => myEmojiIDs.value?.includes(p.id))
  }

  if (keyword.value !== '') {
    const fuse = new Fuse(filtered, {
      keys: ['text'],
      threshold: 1.0,
    })
    filtered = fuse.search(keyword.value).map(result => result.item)
  }

  filtered = filtered.slice(0, currentIndex.value)
  filteredEmojiGroups.value = filtered
}

const load = async () => {
  loading.value = true

  const url = new URL('https://api.bilibili.com/x/emote/setting/panel')
  url.searchParams.set('business', 'reply')

  try {
    const resp = await cachedAPIFetch(url) as GeneralAPIResponse<EmojiPackages>
    emojiInfo.value = resp.data
    allEmojis.value = resp.data.all_packages
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取全部表情表信息出错：${e}`,
      type: 'error',
    })
    return
  }

  loading.value = false
}

const route = useRoute<"/search/emoji">()
onMounted(async () => {
  keyword.value = route.query.keyword as string ?? ''
  await load()
  updateSearch()
})

const loading = ref(false)
const router = useRouter()

// 浏览器返回或前进时，同步更新搜索参数
watch(() => route.query.keyword, () => {
  keyword.value = route.query.keyword as string ?? ''
  onlyMyEmoji.value = route.query.only_mine === 'true'
  updateSearch()
})

watch(() => route.query.only_mine, () => {
  onlyMyEmoji.value = route.query.only_mine === 'true'
  updateSearch()
})

// 更新路由参数
const updateQuery = () => {
  router.push({ query: { keyword: keyword.value, only_mine: onlyMyEmoji.value.toString() } })
}

const updateSearchAndQuery = () => {
  updateSearch()
  updateQuery()
}

const showMore = () => {
  currentIndex.value += EACH_PAGE_COUNT
  updateSearch()
}

</script>

<template>
  <LoginRequired class="flex gap-4 flex-col">
    <ElInput
        v-model="keyword"
        placeholder="输入要搜索的表情"
        autofocus
        clearable
        @change="updateSearchAndQuery"
        @keyup="updateSearch"
    >
      <template #append>
        <!-- TODO type为啥无效？ -->
        <ElButton type="primary" @click="updateSearchAndQuery" :icon="Search"/>
      </template>
    </ElInput>
    <ElSwitch v-model="onlyMyEmoji" @change="updateSearchAndQuery" active-text="只看我拥有的表情"/>

    <div class="flex flex-wrap gap-4 items-stretch justify-center" v-infinite-scroll="showMore">
      <TransitionGroup name="list">
        <!-- TODO 修改这个抽象UI -->
        <div v-for="emojiGroup in filteredEmojiGroups"
             :key="emojiGroup.id"
        >
          <ElImage :src="emojiGroup.url"
                   referrerpolicy="no-referrer"
                   class="h-8 w-8"
                   lazy
          />
          <RouterLink :to="`/emoji/${emojiGroup.id}`">
            <ElLink type="primary">
              {{ emojiGroup.text }}
            </ElLink>
          </RouterLink>
        </div>
      </TransitionGroup>
    </div>

    <ElDivider v-if="hasMore">正在加载...</ElDivider>
    <ElDivider v-else>已加载全部搜索结果</ElDivider>
  </LoginRequired>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(160px);
}

.list-leave-active {
  position: absolute;
}
</style>