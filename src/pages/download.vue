<script setup lang="ts">
import { BatchDownloadTask } from "../types.ts";
import { getAllDownloadTasks, pauseDownload, startDownload, clearDownload } from "../downloadManager.ts";
import { emitter } from "../main.ts";

const tasks = reactive<BatchDownloadTask[]>([])

onMounted(async () => {
  tasks.push(...await getAllDownloadTasks())
})

interface Progress {
  percentage?: number
  total?: number
}

interface DownloadProgress {
  path: string
  file: {
    name: string
    url: string
  }
  downloadInfo: {
    progress: number
    total: number
  }
}

interface FileDownloadFinish {
  path: string
  file: {
    name: string
    url: string
  }
}

emitter.on('downloadProgress', (info: DownloadProgress) => {
  const task = tasks.find(t => t.path === info.path)!
  const file = task.files?.find(f => f.name === info.file.name)!

  if (!file.percentage) file.percentage = 0

  file.percentage += info.downloadInfo.progress
  file.total = info.downloadInfo.total
})

emitter.on('fileDownloadFinish', (info: FileDownloadFinish) => {
  tasks.find(t => t.path === info.path)?.files.splice(tasks.find(t => t.path === info.path)?.files.findIndex(f => f.name === info.file.name)!, 1)
})

emitter.on('downloadFinish', (path: string) => {
  tasks.splice(tasks.findIndex(t => t.path === path), 1)
})

const start = () => {
  startDownload()
}

const pause = () => {
  pauseDownload()
  console.log(tasks)
}

const clear = () => {
  tasks.splice(0, tasks.length)
  clearDownload()
}

const getProgress = (file: Progress) => {
  return Math.round((file.percentage ?? 0) * 100 / (file.total ?? 100))
}
</script>

<template>
  <div>
    <div>下载管理</div>
    <ElButton type="primary" @click="start">开始下载</ElButton>
    <ElButton type="primary" @click="pause">暂停下载</ElButton>
    <ElButton type="primary" @click="clear">清空任务</ElButton>
    <div class="flex flex-col">

      <TransitionGroup name="list">
        <div v-for="task in tasks" key="path">
          <ElText type="primary" size="large">{{ task.path }}</ElText>
          <TransitionGroup name="list">
            <div v-for="file in task.files" :key="file.name">
              <ElText>{{ file.name }}</ElText>
              <!-- TODO 解决抖动问题 -->
              <ElProgress :percentage="getProgress(file)"/>
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

.list-leave-active {
  position: absolute;
}

</style>