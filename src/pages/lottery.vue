<script lang="ts" setup>
import { cachedAPIFetch } from "../cachedAPIFetch.ts";
import type {
  GarbSearchResult,
  LotteryCardInfo,
  LotteryProperties,
  LotteryDetail,
  BatchDownloadInfo
} from '../types.ts'
import { FormInstance } from "element-plus";

const name = ref('')
const jumpLink = ref('')
const cards = ref<LotteryCardInfo[]>([])

const loading = ref(false)

const params = useUrlSearchParams('history')

const coverURL = ref('')
const saleQuantity = ref(0)
const saleStartTime = ref(0)
const saleEndTime = ref(0)


onMounted(async () => {
  loading.value = true

  const lotteryInfo = JSON.parse(params.lottery as string) as GarbSearchResult

  const lotteryProperties = lotteryInfo.properties as LotteryProperties

  const { name: lotteryName, jump_link: lotteryLink } = lotteryInfo
  const { dlc_act_id: actId, dlc_lottery_id: lotteryId } = lotteryProperties

  name.value = lotteryName
  jumpLink.value = lotteryLink

  const url = new URL('https://api.bilibili.com/x/vas/dlc_act/lottery_home_detail')
  url.searchParams.set('act_id', String(actId))
  url.searchParams.set('lottery_id', String(lotteryId))

  const lotteryDetail: LotteryDetail = await cachedAPIFetch(url).then(r => r.data)

  const {
    image_cover,
    dlc_lottery_sale_quantity,
    dlc_sale_start_time,
    dlc_sale_end_time,
  } = lotteryProperties

  coverURL.value = image_cover
  saleQuantity.value = dlc_lottery_sale_quantity
  saleStartTime.value = +dlc_sale_start_time * 1000
  saleEndTime.value = +dlc_sale_end_time * 1000

  cards.value = lotteryDetail.item_list.map(i => i.card_info).sort((a, b) => b.card_scarcity - a.card_scarcity)
  downloadConfig.name = lotteryName

  loading.value = false
})

const previewImages = computed(() => [coverURL.value, ...cards.value.map(c => c.card_img)])

const showDialog = ref(false)
const formRef = ref<FormInstance>()
const downloadConfig = reactive({
  name: '',
  downloadCover: false,
  useWatermarkVersion: false,
  downloadContents: ['image', 'video'],
})

const rules = reactive(({
  name: [
    { required: true, message: '请输入文件名称', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
}))

const submit = async () => {
  await formRef.value?.validate((valid) => {
    if (!valid) return

    const downloadFileInfo: BatchDownloadInfo = {
      name: downloadConfig.name + '.zip',
      files: [],
    }

    if (downloadConfig.downloadCover) {
      downloadFileInfo.files.push({
        name: '封面',
        url: coverURL.value,
      })
    }

    if (downloadConfig.downloadContents.includes('image')) {
      cards.value.forEach(c => {
        if (downloadConfig.useWatermarkVersion) {
          downloadFileInfo.files.push({
            name: c.card_name + '（水印）',
            url: c.card_img_download,
          })
        } else {
          downloadFileInfo.files.push({
            name: c.card_name,
            url: c.card_img,
          })
        }
      })
    }

    if (downloadConfig.downloadContents.includes('video')) {
      cards.value.filter(c => c.video_list?.length ?? 0 > 0).forEach(c => {
        if (downloadConfig.useWatermarkVersion) {
          downloadFileInfo.files.push({
            name: c.card_name + '（水印）',
            url: c.video_list_download![0],
          })
        } else {
          downloadFileInfo.files.push({
            name: c.card_name,
            url: c.video_list![0],
          })
        }
      })
    }

    // TODO 实现文件下载
    console.log(downloadFileInfo)
  })
}
</script>
<template>
  <div class="flex flex-col gap-4" v-loading="loading">
    <!-- 收藏集详细信息 -->
    <ElDescriptions border :column="2">
      <template #title>
        <ElText size="large">{{ name }}</ElText>
      </template>

      <template #extra>
        <ElButton type="primary" @click="showDialog = true">批量下载</ElButton>
      </template>

      <ElDescriptionsItem label="名称" name="name">
        <ElLink type="primary" :href="jumpLink" target="_blank">{{ name }}</ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="销量">{{ saleQuantity }}</ElDescriptionsItem>
      <ElDescriptionsItem label="销售时间" :span="2">
        {{ new Date(saleStartTime).toLocaleString() }} ~ {{ new Date(saleEndTime).toLocaleString() }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 收藏集图片展示 -->
    <ElSpace wrap class="justify-center">
      <ImageCard v-if="!loading" title="收藏集封面" :image="coverURL" :download-name="`${name}-封面`"
                 :preview-images="previewImages"/>
      <LotteryCard
          v-for="(card, index) in cards"
          :key="card.card_type_id"
          :card="card"
          :preview-images="previewImages"
          :index="index + 1"
      />
    </ElSpace>

    <!-- 批量保存对话框 -->
    <ElDialog v-model="showDialog" title="批量下载设置" class="max-w-lg">
      <ElForm label-width="auto"
              ref="formRef"
              :model="downloadConfig"
              :rules="rules"
              class="max-w-lg"
      >
        <ElFormItem label="文件名称" prop="name">
          <ElInput v-model="downloadConfig.name">
            <template #append>.zip</template>
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