<script setup lang="ts">
import { Parser, Player } from "svga";

const props = defineProps<{
  url?: string
  title?: string
  subtitle?: string

  downloadName?: string
}>()

const canvasRef = ref<HTMLCanvasElement>()

const init = async () => {
  const url = props.url
  if (!url) return

  const blob = await fetch(url).then(r => r.blob())

  const dataUrl = URL.createObjectURL(blob)
  const parser = new Parser()
  const svga = await parser.load(dataUrl)

  const player = new Player(canvasRef.value as HTMLCanvasElement)
  await player.mount(svga)
  player.start()
}

onMounted(init)
watch(() => props.url, init)

// TODO 正确实现下载
// const downloadFile = async (url: string, suffix: string) => {
//   const name = (props.downloadName ?? props.title) + '.' + suffix
//
//   const path = await save({
//     defaultPath: name,
//     filters: [
//       {
//         name: suffix,
//         extensions: [suffix],
//       },
//     ],
//   })
//   if (path === null) return
//
//   try {
//     // await download(url, path, undefined, header)
//   } catch (e) {
//     console.error(e)
//
//     ElMessage({
//       message: `下载出错： ${e}`,
//       type: 'error',
//     })
//     return
//   }
//
//   ElMessage({
//     message: `${name}下载成功`,
//     type: 'success',
//   })
// }

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

    <!-- SVGA播放器 -->
    <canvas ref="canvasRef" />

    <template #footer>
      <div class="flex h-4 items-center justify-center">
        <!-- TODO 实现对应下载 -->
        <ElButtonGroup>
          <ElButton type="primary">
            SVGA图片
            <ElIcon size="20">
              <i-ep-download />
            </ElIcon>
          </ElButton>
          <ElButton type="primary">
            帧序列
            <ElIcon size="20">
              <i-ep-download />
            </ElIcon>
          </ElButton>
        </ElButtonGroup>
      </div>
    </template>
  </ElCard>
</template>