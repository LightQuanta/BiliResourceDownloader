<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import { Search } from "@element-plus/icons-vue";
import {
  BiliUserSearchResultItem,
  GeneralSearchResult,
  TypedSearchResult,
  VideoSearchResultItem
} from "../../types.ts";
import { emitter } from "../../main.ts";

const keyword = ref('')
const searchType = ref('all')
const page = ref(1)
const maxPage = ref(2)

const route = useRoute()
const loading = ref(false)

const usersInfo = ref<BiliUserSearchResultItem[]>([])
const videosInfo = ref<VideoSearchResultItem[]>([])

let searching = false
const loadMore = async () => {
  if ((keyword.value?.trim()?.length ?? 0) === 0) return
  if (page.value >= maxPage.value) return

  emitter.emit('scrollUp')

  if (searching) return
  searching = true

  loading.value = true
  if (searchType.value === 'all') {
    // 全部搜索
    const url = new URL('https://api.bilibili.com/x/web-interface/wbi/search/all/v2')
    url.searchParams.set('keyword', keyword.value)
    url.searchParams.set('page', page.value.toString())

    try {
      const resp = await APIFetch<GeneralSearchResult>(url, undefined, {
        wbiSign: true,
        debug: {
          name: '搜索',
          extraParams: {
            keyword: '关键词',
            page: '页数',
          }
        }
      })

      maxPage.value = resp.data.numPages
      if (page.value === 1) {
        // 全部搜索时，后面的页返回的用户似乎和第一页是一样的，这里只添加第一个搜出来的用户
        usersInfo.value.push(...((resp.data.result.filter(r => r.result_type === 'bili_user')?.[0].data as BiliUserSearchResultItem[]) ?? []))
      }
      videosInfo.value.push(...((resp.data.result.filter(r => r.result_type === 'video')?.[0].data as VideoSearchResultItem[]) ?? []))
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `搜索出错：${e}`,
        type: 'error',
      })
    }
  } else {
    // 按类型搜索
    const url = new URL('https://api.bilibili.com/x/web-interface/wbi/search/type')
    url.searchParams.set('keyword', keyword.value)
    url.searchParams.set('search_type', searchType.value)
    url.searchParams.set('page', page.value.toString())

    try {
      const resp = await APIFetch<TypedSearchResult>(url, undefined, {
        wbiSign: true,
        debug: {
          name: '搜索',
          extraParams: {
            keyword: '关键词',
            search_type: '类型',
            page: '页数',
          }
        }
      })

      maxPage.value = resp.data.numPages
      switch (searchType.value) {
        case 'bili_user':
          usersInfo.value.push(...(resp.data?.result as BiliUserSearchResultItem[] ?? []))
          break
        case 'video':
          videosInfo.value.push(...(resp.data?.result as VideoSearchResultItem[] ?? []))
          break
      }
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `搜索出错：${e}`,
        type: 'error',
      })
    }
  }

  searching = false
  page.value++
  loading.value = false
}

const newSearch = async () => {
  page.value = 1
  maxPage.value = 2

  usersInfo.value = []
  videosInfo.value = []

  await loadMore()
}

onMounted(() => {
  keyword.value = route.query.keyword as string
  searchType.value = route.query.type as string ?? 'all'
  newSearch()
})

const updateSearchAndQuery = () => {
  newSearch()
  updateQuery()
}
watch(() => route.query.keyword, () => {
  keyword.value = route.query.keyword as string
  newSearch()
})
watch(() => route.query.type, () => {
  searchType.value = route.query.type as string
  newSearch()
})

const router = useRouter()
const updateQuery = () => {
  router.push({ query: { keyword: keyword.value, type: searchType.value } })
}

</script>

<template>
  <div class="flex gap-4 flex-col">
    <ElInput
      v-model="keyword"
      placeholder="输入要搜索的内容"
      autofocus
      clearable
      @change="updateSearchAndQuery"
    >
      <template #append>
        <ElButton
          :icon="Search"
          type="primary"
          @click="updateSearchAndQuery"
        />
      </template>
    </ElInput>

    <div class="flex">
      <ElRadioGroup
        v-model="searchType"
        class="mr-auto"
        @change="updateSearchAndQuery"
      >
        <!-- TODO 视频等其他类型搜索 -->
        <ElRadio value="all">
          全部
        </ElRadio>
        <ElRadio value="bili_user">
          用户搜索
        </ElRadio>
        <ElRadio value="video">
          视频搜索
        </ElRadio>
      </ElRadioGroup>
      <DebugButton :names="['搜索']" />
    </div>

    <ElText class="self-start my-[-8px]">
      * 此处搜索的内容同B站主页搜索栏，要搜索表情包、装扮或收藏集，请查看单独的搜索界面
    </ElText>

    <div
      class="flex flex-wrap gap-4 pb-32 content-start items-center justify-center min-h-screen"
      v-loading="loading"
      v-infinite-scroll="loadMore"
    >
      <TransitionGroup name="list">
        <RouterLink
          v-for="user in usersInfo"
          :key="user.mid"
          :to="`/space/${user.mid}`"
          class="bg-white bg-opacity-60 rounded-xl flex items-center gap-2 p-4 w-40 transition-all shadow hover:shadow-2xl cursor-pointer"
        >
          <UPInfo
            :mid="user.mid?.toString() ?? ''"
            :name="user.uname"
            :face="'https:' + user.upic"
          />
        </RouterLink>
      </TransitionGroup>
      <TransitionGroup name="list">
        <VideoCard
          v-for="video in videosInfo"
          :key="video.bvid"
          :cover="video.pic"
          :bvid="video.bvid"
          :title="video.title"
          :desc="video.description"
        />
      </TransitionGroup>

      <ElDivider v-if="loading">
        正在加载...
      </ElDivider>
      <ElDivider
        v-else-if="page < maxPage"
        class="mt-auto"
      >
        向下滚动页面继续搜索（{{ page }} / {{ maxPage }}）
      </ElDivider>
      <ElDivider v-else>
        已显示全部搜索结果
      </ElDivider>
    </div>
  </div>
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