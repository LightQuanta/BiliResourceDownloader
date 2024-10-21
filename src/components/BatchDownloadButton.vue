<script setup lang="ts">
import { ElMessage, FormInstance } from "element-plus";
import type { BatchDownloadTask } from "../types.ts";
import { pushNewTask } from "../downloadManager.ts";
import { open } from "@tauri-apps/plugin-dialog";
import { TreeInstance } from "element-plus/lib/components";
import { sep } from "@tauri-apps/api/path";

const props = defineProps<{
  task?: BatchDownloadTask

  // TODO 实现默认选择项
  defaultSelect?: string[]
}>()

const showDialog = ref(false)
const formRef = ref<FormInstance>()

const downloadConfig = reactive({
  path: '',
})

const rules = reactive({
  path: [
    { required: true, message: '请选择保存位置', trigger: 'blur' },
  ],
})

// 最终可选择数据
const finalData = ref<FilePathData[]>([])

// 根据下载链接提前文件扩展名
const extractExtensionName = (url: string) => {
  return '.' + url.split('?')[0]?.split('.').pop()?.split('_')[0]
}

// 生成文件选择数据
const initData = () => {
  finalData.value = []
  const files = props.task?.files ?? []

  const newData: FilePathData[] = []

  files.forEach(file => {
    const paths = file.path.split(sep())
    const name = paths.pop() as string

    let currentNode: FilePathData[] = newData
    while (paths.length > 0) {
      const dir = paths.shift() as string
      let nextNode = currentNode.find(d => d.value === dir)

      if (!nextNode) {
        nextNode = {
          value: dir,
          label: dir,
          children: []
        }
        currentNode.push(nextNode)
      }
      currentNode = nextNode.children ?? []
    }

    currentNode.push({
      value: `[final]${file.path}`,
      label: name,
    })
  })

  finalData.value = newData
}
watch(() => props.task, initData)
onMounted(initData)

// 已选择文件
const selectedFiles = ref<string[]>([])

interface FilePathData {
  value: string
  label: string
  children?: FilePathData[]
}

const treeRef = ref<TreeInstance>()
const submit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid || !downloadConfig.path) {
      ElMessage({
        message: '请选择保存位置！',
        type: 'error',
      })
      return
    }

    if ((treeRef.value?.getCheckedNodes()?.length ?? 0) === 0) {
      ElMessage({
        message: '请选择要下载的内容！',
        type: 'error',
      })
      return
    }

    // 获取选择的单文件
    const selected: string[] = (treeRef.value?.getCheckedNodes() as FilePathData[])
        .filter((data: FilePathData) => data.value?.startsWith('[final]'))
        .map((data: FilePathData) => data.value.substring(7)) ?? []

    console.debug('已选择列表：')
    console.debug(selected)

    // 将所选文件转换为下载任务格式
    const selectedFiles = selected.map(selection => {
      const url = props.task?.files.find(f => f.path === selection)?.url ?? ''
      const extension = extractExtensionName(url)
      return {
        path: selection + extension,
        url,
      }
    })

    // 合成最终下载任务
    const finalTask: BatchDownloadTask = {
      name: props.task?.name ?? '',
      path: downloadConfig.path,
      files: selectedFiles
    }

    await pushNewTask(finalTask)

    ElMessage({
      message: '已提交下载任务，请到下载管理界面进行查看',
      type: 'success',
    })

    showDialog.value = false
  })
}

// 选择保存文件夹
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
  <ElButton
    type="primary"
    @click="showDialog = true"
    class="ml-2"
  >
    批量下载
  </ElButton>

  <!-- 批量保存对话框 -->
  <Teleport to="body">
    <ElDialog
      v-model="showDialog"
      class="max-w-lg"
      title="批量下载设置"
    >
      <ElForm
        ref="formRef"
        :model="downloadConfig"
        :rules="rules"
        class="max-w-lg"
        label-width="auto"
      >
        <ElFormItem
          label="保存路径"
          prop="name"
        >
          <ElInput
            v-model="downloadConfig.path"
            readonly
          >
            <template #append>
              <ElButton @click="selectSaveFolder">
                浏览
              </ElButton>
            </template>
          </ElInput>
        </ElFormItem>

        <ElTreeSelect
          ref="treeRef"
          v-model="selectedFiles"
          :data="finalData"
          clearable
          collapse-tags
          collapse-tags-tooltip
          filterable
          multiple
          placeholder="选择要下载的内容"
          show-checkbox
          class="download-treeselect"
          size="large"
        />
      </ElForm>

      <template #footer>
        <ElButton
          type="primary"
          @click="submit"
        >
          确定
        </ElButton>
        <ElButton @click="showDialog = false">
          取消
        </ElButton>
      </template>
    </ElDialog>
  </Teleport>
</template>

<style>
.el-select-dropdown__wrap:has(.download-treeselect) {
  max-height: 500px;
}
</style>