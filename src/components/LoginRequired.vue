<script setup lang="ts">

import { userLoggedIn } from "../pages/loginManager.ts";

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
  <template>
    <ElTooltip :visible="showTooltip" placement="top">
      <template #content>
        由于B站的API限制，该功能需要用户登录后才可以使用，请至登录界面进行扫码登录
      </template>
      <div v-loading="!userLoggedIn"
           :element-loading-text="'该功能需要登录后才能使用'"
           element-loading-spinner="''"
           element-loading-background="rgba(0, 0, 0, 0.6)"
           @mouseenter="displayTooltip"
           @mouseleave="hideTooltip"
      >
        <slot/>
      </div>
    </ElTooltip>
  </template>
</template>

<style scoped>
:deep(.circular) {
  animation: none;
}
</style>