<script setup lang="ts">
import { APIFetch } from "../../APIFetch.ts";
import { Search } from "@element-plus/icons-vue";
import type { GarbSearchResult, LotteryProperties, SuitProperties } from "../../types.ts";
import { emitter } from "../../main.ts";

const params = useUrlSearchParams()

const displayMode = ref('all')
const keyword = ref('')
const currentPage = ref(1)
const totalCount = ref(114514)
const searched = ref(false)

const cards = ref<GarbSearchResult<LotteryProperties | SuitProperties>[]>([])
const hasMore = computed(() => totalCount.value > 0)

onMounted(() => {
  emitter.emit('scrollToTop')
  keyword.value = params.keyword as string ?? ''
  displayMode.value = params.display as string ?? 'all'
  if (keyword.value !== '') searched.value = true
})

let loading = false
const router = useRouter()

// 仅应该在点击搜索按钮和搜索文本改变时调用
const newSearch = async () => {
  currentPage.value = 1
  totalCount.value = 114514
  loading = false

  if (keyword.value === '') {
    searched.value = false
    cards.value = []
    return
  }
  searched.value = true
  await updateQuery()
  await load()
}

// 修改显示模式时，同步更新路由参数
watch(displayMode, async () => await updateQuery())

// 浏览器返回或前进时，同步更新搜索参数和显示模式

const route = useRoute<'/search/garb'>()

let updatingQuery = false
watch(() => route.query.keyword, () => {
  if (updatingQuery) return
  emitter.emit('scrollToTop')
  keyword.value = route.query.keyword as string ?? ''
  newSearch()
})
watch(() => route.query.display, () => {
  if (updatingQuery) return
  displayMode.value = route.query.display as string ?? 'all'
})

// 更新路由参数
const updateQuery = async () => {
  updatingQuery = true
  await router.push({ query: { keyword: keyword.value, display: displayMode.value } }).finally(() => updatingQuery = false)
}

const load = async () => {
  if (loading || !searched.value || keyword.value === '' || totalCount.value === 0) return
  loading = true

  // 初次搜索应清空已存储卡片信息
  if (currentPage.value === 1) {
    cards.value = []
  }

  emitter.emit('scrollUp')

  const url = new URL('https://api.bilibili.com/x/garb/v2/mall/home/search')
  url.searchParams.set('key_word', keyword.value)
  url.searchParams.set('pn', currentPage.value.toString())

  let data: GarbSearchResult<LotteryProperties | SuitProperties>[] = []
  try {
    const resp = await APIFetch<{
      list: GarbSearchResult<LotteryProperties | SuitProperties>[]
      total: number
    }>(url, undefined, {
      debug: {
        name: '装扮/收藏集搜索',
        extraParams: { key_word: '搜索关键词', pn: '页数' },
      }
    })

    data = resp.data.list as GarbSearchResult<LotteryProperties | SuitProperties>[]
    totalCount.value = resp.data.total
    if (totalCount.value === 0) return
    currentPage.value++
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `搜索出错：${e}`,
      type: 'error',
    })
    return
  }

  cards.value = cards.value.concat(data) as GarbSearchResult<LotteryProperties | SuitProperties>[]
  loading = false
}
onMounted(load)

const filteredCards = computed(() => {
  if (displayMode.value === 'lottery') return cards.value.filter(c => c.properties.type === 'dlc_act')
  if (displayMode.value === 'suit') return cards.value.filter(c => c.properties.type === 'ip')
  return cards.value
})
</script>

<template>
  <div class="flex gap-4 flex-col">
    <ElInput
      v-model="keyword"
      placeholder="输入要搜索的内容"
      autofocus
      clearable
      @change="newSearch"
    >
      <template #append>
        <ElButton
          :icon="Search"
          type="primary"
          @click="newSearch"
        />
      </template>
    </ElInput>

    <div class="flex">
      <ElRadioGroup
        v-model="displayMode"
        class="mr-auto"
      >
        <ElRadio value="all">
          全部显示
        </ElRadio>
        <ElRadio value="lottery">
          只显示收藏集
        </ElRadio>
        <ElRadio value="suit">
          只显示装扮
        </ElRadio>
      </ElRadioGroup>
      <DebugButton :names="['装扮/收藏集搜索']" />
    </div>

    <ElText class="self-start my-[-8px]">
      * 仅可搜索在售的收藏集和装扮，已下架的收藏集和装扮无法搜索到，请直接在主页输入链接进行解析
    </ElText>

    <div
      v-infinite-scroll="load"
      class="flex flex-wrap gap-4 pb-32 justify-center content-start min-h-screen"
    >
      <TransitionGroup name="list">
        <GarbSearchCard
          v-for="card in filteredCards"
          :key="card.jump_link"
          :garb="card"
        />
      </TransitionGroup>

      <CustomDivider v-if="!searched">
        请输入搜索关键词
      </CustomDivider>
      <CustomDivider v-else-if="hasMore">
        正在加载...
      </CustomDivider>
      <CustomDivider v-else>
        已加载全部搜索结果
      </CustomDivider>
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
