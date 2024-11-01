<script setup lang="ts">
import { BatchDownloadTask } from "../types.ts";
import { clearDownload, getAllDownloadTasks, pauseDownload, startDownload } from "../utils/downloadManager.ts";
import { emitter } from "../main.ts";
import { ElMessage } from "element-plus";

const tasks = reactive<BatchDownloadTask[]>([])

const refreshTasks = async () => {
  tasks.splice(0, tasks.length)
  tasks.push(...await getAllDownloadTasks())
}

interface Progress {
  percentage?: number
  total?: number
}

interface DownloadProgress {
  name: string
  file: {
    path: string
    url: string
  }
  downloadInfo: {
    progress: number
    total: number
  }
}

interface FileDownloadFinish {
  name: string
  file: {
    path: string
    url: string
  }
}

emitter.on('downloadProgress', (info: DownloadProgress) => {
  const task = tasks.find(t => t.name === info.name)
  if (!task) return

  const file = task.files?.find(f => f.path === info.file.path)
  if (!file) return

  if (!file.percentage) file.percentage = 0

  file.percentage += info.downloadInfo.progress
  file.total = info.downloadInfo.total
})

// 该组件位于 drawer 内是懒加载的，所以页面首次渲染时触发的事件与该回调处于同个任务循环，因此不需要 onMounted 来触发刷新，否则会导致任务列表重复
emitter.on('drawerOpen', async () => {
  await refreshTasks()
})

emitter.on('fileDownloadFinish', (info: FileDownloadFinish) => {
  tasks.find(t => t.name === info.name)?.files.splice(tasks.find(t => t.name === info.name)?.files.findIndex(f => f.path === info.file.path) ?? 0, 1)
})

emitter.on('downloadFinish', (info: { name: string }) => {
  const index = tasks.findIndex(t => t.name === info.name)
  if (index === -1) return

  tasks.splice(index, 1)
  ElMessage({
    message: `${info.name} 下载完成`,
    type: 'success',
  })
})

const start = async () => {
  // await refreshTasks()
  await startDownload()
}

const pause = async () => {
  await pauseDownload()
  await refreshTasks()
  console.debug(tasks)
}

const clear = async () => {
  await clearDownload()
  await refreshTasks()
  ElMessage({
    message: '已清空下载任务',
    type: 'success',
  })
}

const getProgress = (file: Progress) => {
  return Math.round((file.percentage ?? 0) * 100 / (file.total ?? 100))
}
</script>

<template>
  <div>
    <ElButton
      type="primary"
      @click="start"
    >
      开始下载
    </ElButton>
    <ElButton
      type="primary"
      @click="pause"
    >
      暂停下载
    </ElButton>
    <ElPopconfirm
      title="确定要清空下载任务吗？"
      confirm-button-text="确定"
      cancel-button-text="取消"
      @confirm="clear"
    >
      <template #reference>
        <ElButton type="primary">
          清空任务
        </ElButton>
      </template>
    </ElPopconfirm>
    <div class="flex flex-col overflow-hidden">
      <TransitionGroup name="list">
        <div
          v-for="task in tasks"
          :key="task.path + '-' + task.path"
        >
          <ElText
            class="block"
            size="large"
            type="primary"
          >
            {{ task.name }}
          </ElText>
          <TransitionGroup name="list">
            <div
              v-for="file in task.files"
              :key="file.path"
            >
              <ElText>{{ file.path }}</ElText>
              <ElProgress :percentage="getProgress(file)" />
            </div>
          </TransitionGroup>
        </div>
      </TransitionGroup>
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
  transform: translateX(300px);
}

:deep(.el-progress-bar__inner) {
  transition: none;
}
</style>