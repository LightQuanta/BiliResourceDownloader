<script lang="ts" setup>
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import type {
  GarbSearchResult,
  LotteryProperties,
  ActInfo,
} from '../types.ts'
import { MenuInstance } from "element-plus";

const loading = ref(false)
const params = useUrlSearchParams('history')

const selectedKey = ref('')

const actID = ref(0)
const actInfo = ref<ActInfo>(null)

const lotteryInfo = computed(() => actInfo.value?.lottery_list)
const parsedLotteryInfo = computed<GarbSearchResult<LotteryProperties>[]>(() => {
  return lotteryInfo.value?.map(l => {
    return {
      item_id: 0,
      name: l.lottery_name,
      jump_link: `https://www.bilibili.com/h5/mall/digital-card/home?-Abrowser=live&act_id=${actID.value}&hybrid_set_header=2&lottery_id=${l.lottery_id}`,
      sale_count_desc: l.total_sale_amount.toString(),
      properties: {
        dlc_act_id: actID.value,
        dlc_lottery_id: l.lottery_id,
        dlc_lottery_sale_quantity: l.total_sale_amount,
        image_cover: l.lottery_image,
        dlc_sale_start_time: l.start_time,
        dlc_sale_end_time: l.end_time,
        type: "dlc_act",
      }
    }
  })
})

const menu = ref<MenuInstance>()

onMounted(async () => {
  loading.value = true

  console.log(params)
  actID.value = params.act_id
  const lotteryID = params.lottery_id as string | undefined

  let resp: ActInfo
  try {
    resp = await cachedAPIFetch(`https://api.bilibili.com/x/vas/dlc_act/act/basic?act_id=${actID.value}`).then(r => r.data)
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取收藏集信息出错：${e}`,
      type: 'error',
    })
    return
  }

  actInfo.value = resp

  if (lotteryID !== undefined) {
    selectedKey.value = lotteryID
  } else {
    selectedKey.value = resp.lottery_list[0].lottery_id.toString()
  }
})

</script>
<template>
  <div class="flex flex-col content-center gap-4">
    <ElRadioGroup v-model="selectedKey">
      <ElRadioButton v-for="lottery in parsedLotteryInfo"
                     :key="lottery.properties.dlc_lottery_id"
                     :value="lottery.properties.dlc_lottery_id.toString()"
                     :label="lottery.name"
      />
    </ElRadioGroup>
    <template v-for="lottery in parsedLotteryInfo" :key="lottery.properties.dlc_lottery_id.toString()">
      <KeepAlive>
        <TransitionGroup name="list" class="overflow-hidden">
          <SingleLotteryPage
              :lottery="lottery"
              v-if="selectedKey === lottery.properties.dlc_lottery_id.toString()"
          />
        </TransitionGroup>
      </KeepAlive>
    </template>
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
  transform: translateX(1280px);
}

.list-leave-active {
  position: absolute;
}

.list-leave-active {
  position: absolute;
}
</style>