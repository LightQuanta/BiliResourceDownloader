<script setup lang="ts">
import { open, save } from "@tauri-apps/plugin-dialog";
import { download } from "@tauri-apps/plugin-upload";
import Lottie, { AnimationItem } from "lottie-web";
import { invoke } from "@tauri-apps/api/core";
import { sep } from "@tauri-apps/api/path";

const props = defineProps<{
  url?: string
  json?: unknown
  title?: string
  subtitle?: string

  downloadName?: string
}>()

const player = ref<HTMLDivElement>()
const animationInfo = ref<AnimationItem>()

const playing = ref(true)

const currentFrame = ref(0)
const totalFrames = ref(0)


const init = async () => {
  if (animationInfo.value) {
    animationInfo.value.destroy()
  }

  let json: unknown

  if (props.url) {
    json = await fetch(props.url).then(r => r.json())
  } else if (props.json) {
    json = props.json
  } else {
    ElMessage({
      message: '未正确向Lottie卡片提供u数据来源参数！',
      type: 'error',
    })
    return
  }

  animationInfo.value = Lottie.loadAnimation({
    container: player.value as Element,
    animationData: json,
    renderer: 'canvas',
    loop: true,
  })

  animationInfo.value.addEventListener("drawnFrame", (e) => {
    currentFrame.value = Math.floor(e.currentTime)
  })

  currentFrame.value = Math.floor(animationInfo.value.currentFrame)
  totalFrames.value = Math.floor(animationInfo.value.totalFrames)
}

// 拖动进度条时，更新对应动画帧数
watch(currentFrame, () => {
  if (animationInfo.value && animationInfo.value.isPaused) {
    animationInfo.value.goToAndStop(currentFrame.value, true)
  }
})
// 切换播放和暂停
watch(playing, () => {
  if (!animationInfo.value) return
  if (playing.value) {
    animationInfo.value.play()
  } else {
    animationInfo.value.pause()
  }
})

onMounted(init)
watch(() => props.url, init)
watch(() => props.json, init)

const saveFile = (name: string, extension: string) => {
  return save({
    defaultPath: name,
    filters: [
      {
        name: extension,
        extensions: [extension],
      },
    ],
  })
}


const downloadLottie = async () => {
  if (!props.url) return

  const name = props.downloadName ?? props.title ?? 'file'
  const path = await saveFile(name, 'json')
  if (path === null) return

  try {
    await download(props.url, path)
  } catch (e) {
    console.error(e)

    ElMessage({
      message: `下载出错： ${e}`,
      type: 'error',
    })
    return
  }

  ElMessage({
    message: `${name}下载成功`,
    type: 'success',
  })
}

const downloadAllFrames = async () => {
  if (!animationInfo.value || !player.value) return
  playing.value = false

  const name = props.downloadName ?? props.title ?? 'file' + '帧序列'
  const path = await open({
    defaultPath: name,
    directory: true,
  })
  if (path === null) return

  const canvas = player.value.querySelector('canvas')
  if (canvas === null) {
    ElMessage({
      message: '获取图像数据出错！',
      type: "error",
    })
    return
  }

  let allData: string[] = []
  for (let i = 0; i < totalFrames.value; i++) {
    animationInfo.value?.goToAndStop(i, true)
    allData.push(canvas.toDataURL())
  }

  await invoke('create_dir', { path: `${path}${sep()}${name}` })
  const results = await Promise.all(allData.map((data, index) => invoke('save_data_url', {
    path: `${path}${sep()}${name}${sep()}图片${index + 1}.png`,
    data,
  })))

  if (results.some(r => r !== 'ok')) {
    ElMessage({
      message: `保存${name}时出错`,
      type: "error",
    })
  } else {
    ElMessage({
      message: `保存${name}成功`,
      type: "success",
    })
  }

}

const downloadCurrentFrame = async () => {
  if (!animationInfo.value || !player.value) return
  playing.value = false

  const name = (props.downloadName ?? props.title ?? 'file') + ` - 第${animationInfo.value.currentFrame.toFixed(0)}帧`
  const path = await saveFile(name, 'png')
  if (path === null) return

  const canvas = player.value.querySelector('canvas')
  const data = canvas?.toDataURL()

  if (data === undefined) {
    ElMessage({
      message: '获取图像数据出错！',
      type: "error",
    })
    return
  }

  if (await invoke('save_data_url', { path, data }) === 'ok') {
    ElMessage({
      message: `下载${name}成功！`,
      type: "success",
    })
  }
}

</script>

<template>
  <ElCard>
    <template #header>
      <div class="flex flex-col items-center">
        <ElText
          size="large"
          type="primary"
        >
          {{ title }}
        </ElText>
        <ElText
          v-if="subtitle?.length ?? 0 > 0"
          size="small"
          type="info"
          class="text-center whitespace-pre-wrap"
        >
          {{ subtitle }}
        </ElText>
      </div>
    </template>

    <!-- 播放器 -->
    <div class="flex justify-center">
      <div
        ref="player"
        class="h-80 w-80"
      />
    </div>

    <template #footer>
      <div class="flex flex-col items-center justify-center">
        <!-- 动画播放控制 -->
        <span>{{ animationInfo?.currentFrame.toFixed(0) }} / {{ animationInfo?.totalFrames }}</span>
        <div class="flex w-full">
          <ElButton
            @click="playing = !playing"
            text
          >
            <ElIcon :size="24">
              <i-ep-video-pause v-if="playing" />
              <i-ep-video-play v-else />
            </ElIcon>
          </ElButton>
          <ElSlider
            v-model="currentFrame"
            :max="totalFrames"
            :min="0"
            :disabled="playing"
            class="w-32"
          />
        </div>

        <!-- 下载按钮 -->
        <div class="flex flex-row w-full">
          <ElButton
            v-if="url"
            type="primary"
            @click="downloadLottie"
          >
            Lottie动画
            <ElIcon size="20">
              <i-ep-download />
            </ElIcon>
          </ElButton>
          <ElButtonGroup class="ml-auto">
            <ElButton @click="downloadCurrentFrame">
              当前帧
              <ElIcon size="20">
                <i-ep-download />
              </ElIcon>
            </ElButton>
            <ElButton @click="downloadAllFrames">
              全部帧
              <ElIcon size="20">
                <i-ep-download />
              </ElIcon>
            </ElButton>
          </ElButtonGroup>
        </div>
      </div>
    </template>
  </ElCard>
</template>