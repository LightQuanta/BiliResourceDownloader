<script setup lang="ts">

import { userLoggedIn } from "../loginManager.ts";

const showTooltip = ref(false)

const displayTooltip = () => {
  if (!userLoggedIn.value) {
    showTooltip.value = true
  }
}

const hideTooltip = () => {
  showTooltip.value = false
}
</script>

<template>
  <div
    v-loading="!userLoggedIn"
    :element-loading-text="'由于B站API的限制，该功能需要用户登录后才能使用\n请转到登录界面进行扫码登录'"
    class="min-h-40"
    element-loading-background="rgba(255, 255, 255, 0.3)"
    element-loading-spinner="''"
    @mouseenter="displayTooltip"
    @mouseleave="hideTooltip"
  >
    <slot />
  </div>
</template>

<style scoped>
:deep(.circular) {
  display: none;
}

:deep(.el-loading-text) {
  white-space: pre-wrap;
}

:deep(.el-loading-mask) {
  backdrop-filter: blur(3px);
  box-shadow: rgba(128, 128, 128, 0.3) 0 0 10px;
}

:deep(.el-loading-text) {
  font-size: 1em;
}
</style>