<script setup lang="ts">
import { genFileId, UploadUserFile } from "element-plus";
import { UploadInstance, UploadProps, UploadRawFile } from "element-plus/lib/components";

const upload = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])
const dataURL = ref('')
const name = ref('')

function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);  // 读取完成后返回dataURL
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);  // 以dataURL形式读取
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
  dataURL.value = ''
  name.value = ''
}

const process: UploadProps['onChange'] = async (file) => {
  try {
    name.value = file.name
    dataURL.value = await fileToDataURL(file.raw as File)
    console.log(dataURL.value)
  } catch (e) {
    ElMessage({
      message: `解析SVGA文件出错：${e}`,
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
      accept=".svga"
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
        点击选择SVGA文件
      </div>
    </ElUpload>
    <SVGACard
      v-if="dataURL.length > 0"
      :data-u-r-l="dataURL"
      :title="name.split('.').slice(0, -1).join('.')"
    />
  </div>
</template>