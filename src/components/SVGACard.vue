<script setup lang="ts">
import { Parser, Player } from "svga";
import { open, save } from "@tauri-apps/plugin-dialog";
import { download } from "@tauri-apps/plugin-upload";
import { Video } from "svga/dist/types";
import { invoke } from "@tauri-apps/api/core";
import { sep } from "@tauri-apps/api/path";

const props = defineProps<{
  url?: string
  title?: string
  subtitle?: string

  downloadName?: string
}>()

let SVGAVideo: Video

const playerCanvasRef = ref<HTMLCanvasElement>()
let playerCtx: CanvasRenderingContext2D | undefined

const renderCanvasRef = ref<HTMLCanvasElement>()
let player: Player
let renderedFrames: (ImageData | undefined)[]
const renderedFramesCount = ref(0)
const totalFrames = ref(0)
const fps = ref(0)

// 渲染序列帧图片
const renderSequence = async () => {
  await renderFramesData()

  const renderCanvas = renderCanvasRef.value as HTMLCanvasElement

  const { width, height } = SVGAVideo.size

  renderCanvas.height = height
  renderCanvas.width = width * totalFrames.value

  const renderCtx = renderCanvas.getContext('2d') as CanvasRenderingContext2D
  renderCtx.reset()

  for (let i = 0; i < totalFrames.value; i++) {
    const data = renderedFrames[i] as ImageData
    renderCtx.putImageData(data, i * width, 0)
  }
}

// 渲染所有帧图片，返回dataURL[]
const renderSequenceImages = async () => {
  await renderFramesData()

  const renderCanvas = renderCanvasRef.value as HTMLCanvasElement

  const { width, height } = SVGAVideo.size

  renderCanvas.height = height
  renderCanvas.width = width

  const renderCtx = renderCanvas.getContext('2d') as CanvasRenderingContext2D
  renderCtx.reset()

  const images: string[] = []
  for (let i = 0; i < totalFrames.value; i++) {
    const data = renderedFrames[i] as ImageData
    renderCtx.putImageData(data, 0, 0)
    images.push(renderCanvas.toDataURL())
  }
  return images
}

// 通过playerCanvas渲染动画每帧数据
const renderFramesData = async () => {
  return new Promise<void>(resolve => {
    player.onProcess = () => {
      if (renderedFramesCount.value === totalFrames.value) {
        player.onProcess = undefined
        resolve()
      }

      const index = player.currentFrame

      if (!renderedFrames?.[index]) {
        renderedFrames[index] = playerCtx?.getImageData(0, 0, playerCanvasRef.value?.width ?? 0, playerCanvasRef.value?.height ?? 0)
        renderedFramesCount.value++
      }
    }
  })
}


const init = async () => {
  const url = props.url
  if (!url) return

  const blob = await fetch(url).then(r => r.blob())

  const dataUrl = URL.createObjectURL(blob)
  const parser = new Parser()
  SVGAVideo = await parser.load(dataUrl)

  player = new Player(playerCanvasRef.value as HTMLCanvasElement)
  await player.mount(SVGAVideo)
  player.start()

  playerCtx = playerCanvasRef.value?.getContext('2d', { willReadFrequently: true }) ?? undefined

  fps.value = SVGAVideo.fps
  totalFrames.value = SVGAVideo.frames - 1
  renderedFrames = Array<ImageData | undefined>(totalFrames.value)
  renderedFramesCount.value = 0
}

onMounted(init)
watch(() => props.url, init)

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

const downloadSequenceImages = async () => {
  const name = props.downloadName ?? props.title + '序列帧'

  const path = await open({
    defaultPath: name,
    directory: true,
  })

  if (path === null) return

  ElMessage('正在渲染帧数据，请稍等')
  const images = await renderSequenceImages()
  await invoke('create_dir', { path: `${path}${sep()}${name}` })
  const results = await Promise.all(images.map((data, index) => invoke('save_data_url', {
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

const downloadSequence = async () => {
  const name = props.downloadName ?? props.title + ' - 序列帧'
  const path = await saveFile(name, 'png')
  if (path === null) return

  ElMessage('正在渲染帧数据，请稍等')

  await renderSequence()
  const data = renderCanvasRef.value?.toDataURL() ?? ''

  if (await invoke('save_data_url', { path, data }) === 'ok') {
    ElMessage({
      message: `下载${name}成功！`,
      type: "success",
    })
  }
}

const downloadSVGA = async () => {
  if (!props.url) return

  const name = props.downloadName ?? props.title ?? 'file'
  const path = await saveFile(name, 'svga')
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

</script>

<template>
  <ElCard>
    <template
      v-if="title"
      #header
    >
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

    <div class="flex justify-center">
      <!-- SVGA播放器 -->
      <canvas ref="playerCanvasRef" />
    </div>

    <!-- 渲染序列帧用canvas -->
    <canvas
      ref="renderCanvasRef"
      class="hidden"
    />

    <template #footer>
      <div class="flex flex-col gap-2 items-center justify-center">
        <ElText
          size="small"
          class="whitespace-pre-wrap"
        >
          FPS: {{ fps }}，共计{{ totalFrames }}帧
        </ElText>
        <ElButtonGroup>
          <ElButton
            type="primary"
            @click="downloadSVGA"
          >
            SVGA动画
            <ElIcon size="20">
              <i-ep-download />
            </ElIcon>
          </ElButton>
          <ElButton
            type="primary"
            @click="downloadSequenceImages"
          >
            每帧图片
            <ElIcon size="20">
              <i-ep-download />
            </ElIcon>
          </ElButton>
          <ElButton
            type="primary"
            @click="downloadSequence"
          >
            序列帧图
            <ElIcon size="20">
              <i-ep-download />
            </ElIcon>
          </ElButton>
        </ElButtonGroup>
      </div>
    </template>
  </ElCard>
</template>