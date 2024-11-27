<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from "@tauri-apps/api/core";

const imagePaths = ref<string[]>([])
const converting = ref(false)

const selectImages = async () => {
  imagePaths.value = await open({
    title: '选择webp图片',
    multiple: true,
    filters: [{
      name: 'WebP图片',
      extensions: ['webp'],
    }]
  }) ?? []
}

// TODO 解决转换时卡顿问题
// TODO 解决图片转换质量问题
const convert = () => {
  converting.value = true
  Promise.all(imagePaths.value.map(p => {
    return invoke('convert_webp2gif', {
      inputPath: p,
      outputPath: p.split('.').slice(0, -1) + '.gif',
    })
  }))
      .then(() => {
        ElMessage({
          message: '转换成功！',
          type: 'success',
        })
      })
      .catch(e => {
        ElMessage({
          message: `转换图片出错：${e}`,
          type: 'error',
        })
      })
      .finally(() => {
        imagePaths.value = []
        converting.value = false
      })
}
</script>

<template>
  <div>
    <ElButton
      @click="selectImages"
      :disabled="converting"
      type="primary"
    >
      <ElIcon :size="16">
        <i-ep-upload-filled />
      </ElIcon>
      <div class="ml-2">
        选择WebP图片文件
      </div>
    </ElButton>

    <ElPopover
      width="800px"
      placement="bottom-end"
    >
      <span>
        WebP是一种新式图片格式，相比传统图片体积更小，既能能存储静态图片也能存储动态图片。但由于该格式较新，兼容性上会存在一定的问题
      </span>
      <br>
      <span>B站的很多图片均采用WebP格式，本工具可以将WebP格式图片转为gif</span>

      <template #reference>
        <ElText
          type="primary"
          class="cursor-pointer ml-2"
        >
          什么是WebP图片？
        </ElText>
      </template>
    </ElPopover>

    <div class="my-4">
      <TransitionGroup name="list">
        <ElText
          class="block"
          v-for="path in imagePaths"
          :key="path"
        >
          {{ path }}
        </ElText>
      </TransitionGroup>
    </div>

    <ElButton
      v-if="imagePaths.length > 0"
      :disabled="converting"
      @click="convert"
    >
      {{ converting ? '正在转换...' : '开始转换' }}
    </ElButton>
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
  transform: translateX(100px);
}

.list-leave-active {
  position: absolute;
}
</style>