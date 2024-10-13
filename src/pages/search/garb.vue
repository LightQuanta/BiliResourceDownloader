<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import type { GarbSearchResult } from "../../types.ts";

const params = useUrlSearchParams()

const displayMode = ref('all')
const keyword = ref('')
const currentPage = ref(1)
const totalCount = ref(114514)
const searched = ref(false)

const cards = ref<GarbSearchResult[]>([])
const hasMore = computed(() => totalCount.value > 0)

onMounted(() => {
  keyword.value = params.keyword as string
  if (keyword.value !== undefined && keyword.value !== '') searched.value = true
})

let loading = false

const newSearch = () => {
  currentPage.value = 1
  cards.value = []
  params.keyword = keyword.value
  totalCount.value = 114514
  searched.value = true
  loading = false
  load()
}

const load = async () => {
  if (loading || !searched.value || totalCount.value === 0) return
  loading = true

  const url = new URL('https://api.bilibili.com/x/garb/v2/mall/home/search')
  url.searchParams.set('key_word', keyword.value)
  url.searchParams.set('pn', currentPage.value.toString())

  let data: GarbSearchResult[] = []
  try {
    const resp = await fetch(url).then(r => r.json())
    if (resp.code !== 0) throw resp.msg
    data = resp.data.list as GarbSearchResult[]
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

  cards.value = cards.value.concat(data) as GarbSearchResult[]
  loading = false
}

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
        <!-- TODO type为啥无效？ -->
        <ElButton type="primary" @click="newSearch" :icon="Search"/>
      </template>
    </ElInput>

    <ElRadioGroup v-model="displayMode">
      <ElRadio value="all">全部显示</ElRadio>
      <ElRadio value="lottery">只显示收藏集</ElRadio>
      <ElRadio value="suit">只显示装扮</ElRadio>
    </ElRadioGroup>

    <div class="flex flex-wrap gap-4 justify-center" v-infinite-scroll="load">
      <TransitionGroup name="list">
        <GarbSearchCard v-for="card in filteredCards" :key="card.jump_link" :garb="card"/>
      </TransitionGroup>
    </div>

    <ElDivider v-if="!searched">请输入关键词进行搜索</ElDivider>
    <ElDivider v-else-if="hasMore">正在加载...</ElDivider>
    <ElDivider v-else>已加载全部搜索结果</ElDivider>
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