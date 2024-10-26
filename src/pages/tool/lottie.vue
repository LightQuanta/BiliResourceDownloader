<script setup lang="ts">
import { genFileId, UploadUserFile } from "element-plus";
import { UploadInstance, UploadProps, UploadRawFile } from "element-plus/lib/components";

const upload = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])
const JSONObject = ref()
const name = ref('')

function readText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
    reader.readAsText(file)
  });
}

const handleExceed: UploadProps['onExceed'] = (files) => {
  if (!upload.value) return

  upload.value.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value.handleStart(file)
}

const handleRemove: UploadProps['onRemove'] = () => {
  JSONObject.value = ''
  name.value = ''
}

const process: UploadProps['onChange'] = async (file) => {
  try {
    name.value = file.name
    JSONObject.value = JSON.parse(await readText(file.raw as File))
    // console.log(JSONObject.value)
  } catch (e) {
    ElMessage({
      message: `解析Lottie动画出错：${e}`,
      type: 'error',
    })
  }
}

</script>

<template>
  <div>
    <!-- 拖拽不知道为啥用不了，暂且当作点击上传使用 -->
    <ElUpload
      ref="upload"
      drag
      accept=".json"
      show-file-list
      v-model="fileList"
      :auto-upload="false"
      :limit="1"
      :on-change="process"
      :on-exceed="handleExceed"
      :on-remove="handleRemove"
    >
      <ElIcon :size="64">
        <i-ep-upload-filled />
      </ElIcon>
      <div>
        选择Lottie动画文件
      </div>
    </ElUpload>

    <LottieAnimationCard
      v-if="JSONObject"
      :json="JSONObject"
      :title="name.split('.').slice(0, -1).join('.')"
    />

    <ElPopover
      width="600px"
      placement="bottom-end"
    >
      <span>
        Lottie是由Airbnb开发的一种跨平台的开源矢量动画格式，以JSON格式存储动画，详细介绍请查看
        <ElLink
          type="primary"
          href="https://airbnb.io/lottie/#/"
          target="_blank"
        >
          Lottie官网
        </ElLink>
      </span>
      <br>
      <span>B站的部分装扮的进度条动画里使用Lottie格式，此页面可以将Lottie动画逐帧提取为图片</span>

      <template #reference>
        <ElText
          type="primary"
          class="cursor-pointer"
        >
          什么是Lottie动画？
        </ElText>
      </template>
    </ElPopover>
  </div>
</template>