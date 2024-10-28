<script setup lang="ts">
import { toDataURL } from "qrcode";

const props = defineProps<{
  content: string
  buttonText?: string
  title?: string
}>()
const dialogVisible = ref(false)

const data = ref('')
const onOpen = async () => {
  if (!props.content) return
  data.value = await toDataURL(props.content)
}
</script>

<template>
  <div class="ml-2">
    <ElButton
      type="primary"
      @click="dialogVisible = true"
    >
      {{ buttonText ?? '显示二维码' }}
    </ElButton>
    <ElDialog
      append-to-body
      align-center
      v-model="dialogVisible"
      :title="title"
      @open="onOpen"
      width="360px"
    >
      <div class="flex justify-center items-center">
        <ElImage
          class="w-72 h-72"
          :src="data"
        />
      </div>
    </ElDialog>
  </div>
</template>
