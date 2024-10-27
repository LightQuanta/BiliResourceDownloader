<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import { Search } from "@element-plus/icons-vue";
import { EmojiPackageInfo, EmojiPackages, GeneralAPIResponse } from "../../types.ts";
import Fuse from "fuse.js";
import { userLoggedIn } from "../../utils/loginManager.ts";
import { emitter } from "../../main.ts";

// 默认首页展示的表情数
const DEFAULT_SHOW_COUNT = 50

// 每次懒加载增加数量
const EACH_PAGE_COUNT = 30

const keyword = ref('')
const currentIndex = ref(DEFAULT_SHOW_COUNT)

const emojiInfo = ref<EmojiPackages>()
const allEmojis = ref<EmojiPackageInfo[]>([])

const hasMore = computed(() => allEmojis.value.length === 0 || currentIndex.value < filteredEmojiGroups.value.length)
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
  if (!userLoggedIn.value) return
  loading.value = true

  const url = new URL('https://api.bilibili.com/x/emote/setting/panel')
  url.searchParams.set('business', 'reply')

  try {
    const resp = await APIFetch<EmojiPackages>(url)
    emojiInfo.value = resp.data
    allEmojis.value = resp.data.all_packages
  } catch (e) {
    console.error(e)
    if ((e as GeneralAPIResponse<unknown>).code === -101) {
      ElMessage({
        message: '登录失效，请至登录界面重新进行登录',
        type: 'error',
      })
    } else {
      ElMessage({
        message: `获取全部表情包信息出错：${e}`,
        type: 'error',
      })
    }
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

watch(userLoggedIn, async () => {
  await load()
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
  emitter.emit('scrollUp')
  currentIndex.value += EACH_PAGE_COUNT
  updateSearch()
}

const jumpToEmoji = (emoji: EmojiPackageInfo) => {
  router.push({ path: `/emoji/${emoji.id}` })
}

</script>

<template>
  <LoginRequired class="flex gap-4 flex-col h-full pb-40">
    <ElInput
      v-model="keyword"
      placeholder="输入要搜索的表情包"
      autofocus
      clearable
      @change="updateSearchAndQuery"
      @keyup="updateSearch"
    >
      <template #append>
        <!-- TODO type为啥无效？ -->
        <ElButton
          :icon="Search"
          type="primary"
          @click="updateSearchAndQuery"
        />
      </template>
    </ElInput>
    <ElSwitch
      v-model="onlyMyEmoji"
      active-text="只看我拥有的表情包"
      @change="updateSearchAndQuery"
    />

    <ElText class="self-start my-[-8px]">
      * UP主大表情、房间专属表情和大部分充电表情无法在此搜索到，请至UP主/直播间解析界面进行查看
    </ElText>

    <div
      v-infinite-scroll="showMore"
      class="flex flex-wrap gap-4 items-center justify-center min-w-screen"
      v-loading="loading"
    >
      <TransitionGroup name="list">
        <!-- TODO 修改这个抽象UI -->
        <div
          v-for="emojiGroup in filteredEmojiGroups"
          :key="emojiGroup.id"
          @click="jumpToEmoji(emojiGroup)"
          class="bg-white bg-opacity-60 rounded-xl flex items-center gap-2 p-4 w-72 transition-all shadow hover:shadow-2xl cursor-pointer"
        >
          <ElImage
            :src="emojiGroup.url"
            class="h-12 w-12 shrink-0"
            referrerpolicy="no-referrer"
          />
          <div class="flex flex-col w-full justify-end">
            <ElText
              size="large"
              type="primary"
            >
              {{ emojiGroup.text }}
            </ElText>
            <ElText size="small">
              {{ new Date(emojiGroup.mtime * 1000).toLocaleString() }}
            </ElText>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <ElDivider v-if="hasMore">
      正在加载...
    </ElDivider>
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