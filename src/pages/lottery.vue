<script lang="ts" setup>
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import type {
  GarbSearchResult,
  LotteryProperties,
  ActInfo,
  BatchDownloadTask,
  LotteryDetail,
} from '../types.ts'
import { FormInstance } from "element-plus";
import { pushNewTask } from "../downloadManager.ts";
import { open } from "@tauri-apps/plugin-dialog";
import { sep } from "@tauri-apps/api/path";
import { CarouselInstance } from "element-plus/lib/components";

const loading = ref(true)

const selectedKey = ref('')

const actID = ref(-1)
const lotteryID = ref(-1)
const actInfo = ref<ActInfo>()

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
        dlc_sale_start_time: l.start_time.toString(),
        dlc_sale_end_time: l.end_time.toString(),
        type: "dlc_act",
      }
    } as GarbSearchResult<LotteryProperties>
  }) ?? []
})

const route = useRoute()

const fetchData = async () => {
  loading.value = true

  if (actID.value !== +route.query.act_id!) {
    lotteryID.value = -1
  }

  actID.value = +route.query.act_id!
  const lotteryIDStr = route.query.lottery_id as string | undefined
  if (lotteryIDStr) {
    lotteryID.value = +lotteryIDStr
  }

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

  if (lotteryID.value !== -1) {
    selectedKey.value = lotteryID.value.toString()
  } else {
    const newLotteryID = resp.lottery_list[0].lottery_id
    selectedKey.value = newLotteryID.toString()

    lotteryID.value = newLotteryID
    await router.push({ query: { act_id: route.query.act_id, lottery_id: newLotteryID.toString() } })
  }

  loading.value = false
}

const triggerReload = async () => {
  if (actID.value === -1) {
    await fetchData()
  } else if (lotteryID.value !== -1) {
    await fetchData()
  }
  selectedKey.value = lotteryID.value.toString()
}

watch(() => route.query.act_id, triggerReload, { immediate: true })

const router = useRouter()
const carousel = ref<CarouselInstance>()

watch(selectedKey, () => {
  carousel.value?.setActiveItem(selectedKey.value)
  router.push({ query: { act_id: actID.value, lottery_id: lotteryID.value } })
})

const saleTime = computed(() => `${new Date((actInfo.value?.start_time ?? 0) * 1000).toLocaleString()} ~ ${new Date((actInfo.value?.end_time ?? 0) * 1000).toLocaleString()}`)

const showDialog = ref(false)
const formRef = ref<FormInstance>()
const downloadConfig = reactive({
  path: '',
  downloadCover: false,
  useWatermarkVersion: false,
  downloadContents: ['image', 'video'],
})

const rules = reactive(({
  path: [
    { required: true, message: '请选择保存位置', trigger: 'blur' },
  ],
}))

const extractExtensionName = (url: string) => {
  return '.' + url.split('?')[0].split('.').pop()!.split('_')[0]
}

const submit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid || !downloadConfig.path) return

    const downloadFileInfo: BatchDownloadTask = {
      name: actInfo.value!.act_title,
      path: `${downloadConfig.path}${sep()}${actInfo.value?.act_title}`,
      files: [],
    }
    console.log(downloadFileInfo.path)
    let lotteryDetails: LotteryDetail[]
    try {
      lotteryDetails = await Promise.all(lotteryInfo.value!.map(l => {
        const url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
        url.searchParams.set('act_id', actID.value.toString())
        url.searchParams.set('lottery_id', l.lottery_id.toString())

        return cachedAPIFetch(url).then(r => r.data) as Promise<LotteryDetail>
      }))
    } catch (e) {
      console.error(e)
      ElMessage({
        message: `获取收藏集信息出错：${e}`,
        type: 'error',
      })
      return
    }

    if (downloadConfig.downloadCover) {
      lotteryInfo.value!.forEach(l => {
        downloadFileInfo.files.push({
          name: '封面' + extractExtensionName(l.lottery_image),
          url: l.lottery_image,
        })
      })

    }

    if (downloadConfig.downloadContents.includes('image')) {
      lotteryDetails.forEach(detail => {
        detail.item_list.forEach(({ card_info: cardInfo }) => {
          if (downloadConfig.useWatermarkVersion) {
            downloadFileInfo.files.push({
              name: detail.name + sep() + cardInfo.card_name + '（水印）' + extractExtensionName(cardInfo.card_img_download),
              url: cardInfo.card_img_download,
            })
          } else {
            downloadFileInfo.files.push({
              name: detail.name + sep() + cardInfo.card_name + extractExtensionName(cardInfo.card_img),
              url: cardInfo.card_img,
            })
          }
        })
      })
    }

    if (downloadConfig.downloadContents.includes('video')) {
      lotteryDetails.forEach(detail => {
        detail.item_list
            .filter(i => i.card_info.video_list?.length ?? 0 > 0)
            .forEach(({ card_info: cardInfo }) => {
              if (downloadConfig.useWatermarkVersion) {
                downloadFileInfo.files.push({
                  name: detail.name + sep() + cardInfo.card_name + '（水印）' + extractExtensionName(cardInfo.video_list_download![0]),
                  url: cardInfo.video_list_download![0],
                })
              } else {
                downloadFileInfo.files.push({
                  name: detail.name + sep() + cardInfo.card_name + extractExtensionName(cardInfo.video_list![0]),
                  url: cardInfo.video_list![0],
                })
              }
            })
      })
    }

    console.debug(downloadFileInfo)

    await pushNewTask(downloadFileInfo)
    ElMessage({
      message: '已提交下载任务，请到下载管理界面进行查看',
      type: 'success',
    })

    showDialog.value = false
  })
}

const selectSaveFolder = async () => {
  const path = await open({
    defaultPath: downloadConfig.path,
    directory: true,
  })

  if (path === null) return
  downloadConfig.path = path
}

</script>
<template>
  <div class="flex flex-col content-center" v-loading="loading">
    <!-- 收藏集组合详细信息 -->
    <ElDescriptions border :column="2" v-if="!loading">
      <template #title>
        <ElText size="large">收藏集组合信息</ElText>
      </template>

      <template #extra>
        <ElButton type="primary" @click="showDialog = true">全部下载</ElButton>
      </template>

      <ElDescriptionsItem label="名称" name="name">
        <ElLink v-if="!loading"
                type="primary"
                :href="`https://www.bilibili.com/h5/mall/digital-card/home?-Abrowser=live&act_id=${parsedLotteryInfo[0].properties.dlc_act_id}&hybrid_set_header=2`"
                target="_blank"
        >{{ actInfo?.act_title }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="销售时间" :span="2">{{ saleTime }}</ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider>收藏集内容</ElDivider>

    <ElRadioGroup v-model="selectedKey" v-show="(parsedLotteryInfo?.length ?? 0) > 1" class="mx-auto">
      <ElRadioButton v-for="lottery in parsedLotteryInfo"
                     :key="lottery.properties.dlc_lottery_id"
                     :value="lottery.properties.dlc_lottery_id.toString()"
                     :label="lottery.name"
      />
    </ElRadioGroup>
    <br/>
    <ElCarousel class="!h-full !overflow-y-auto"
                :autoplay="false"
                arrow="never"
                indicator-position="none"
                height="100%"
                ref="carousel"
                v-if="!loading"
                :initial-index="parsedLotteryInfo.map(l => l.properties.dlc_lottery_id).indexOf(lotteryID)"
                :loop="false"
    >
      <ElCarouselItem v-for="lottery in parsedLotteryInfo"
                      :key="lottery.properties.dlc_lottery_id"
                      class="h-full !overflow-y-auto"
                      :name="lottery.properties.dlc_lottery_id.toString()"
      >
        <KeepAlive>
          <SingleLotteryPage
              :lottery="lottery"
              class="h-full"
          />
        </KeepAlive>
      </ElCarouselItem>
    </ElCarousel>

    <!-- 批量保存对话框 -->
    <ElDialog v-model="showDialog" title="批量下载设置" class="max-w-lg">
      <ElForm label-width="auto"
              ref="formRef"
              :model="downloadConfig"
              :rules="rules"
              class="max-w-lg"
      >
        <ElFormItem label="保存路径" prop="name">
          <ElInput v-model="downloadConfig.path" readonly>
            <template #append>
              <ElButton @click="selectSaveFolder">浏览</ElButton>
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem label="下载封面" prop="downloadCover">
          <ElSwitch v-model="downloadConfig.downloadCover"/>
        </ElFormItem>
        <ElFormItem label="下载水印版本" prop="useWatermarkVersion">
          <ElSwitch v-model="downloadConfig.useWatermarkVersion"/>
        </ElFormItem>
        <ElFormItem label="下载内容选择">
          <ElCheckboxGroup v-model="downloadConfig.downloadContents">
            <ElCheckbox label="图片" value="image"/>
            <ElCheckbox label="视频" value="video"/>
          </ElCheckboxGroup>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton type="primary" @click="submit">确定</ElButton>
        <ElButton @click="showDialog = false">取消</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
