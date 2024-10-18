<script setup lang="ts">
import DownloadManager from "./components/DownloadManager.vue";
import { emitter } from "./main.ts";

const showDownloadDrawer = ref(false)
</script>

<template>
  <div class="flex w-full h-full items-stretch color-bg">
    <ElMenu default-active="test" class="h-full w-32 m-0 shrink-0 router-mark" :router="true">
      <ElMenuItem index="/">主页</ElMenuItem>
      <ElMenuItem index="/search/garb">装扮/收藏集搜索</ElMenuItem>
      <ElMenuItem @click="showDownloadDrawer = true">下载管理</ElMenuItem>
      <ElMenuItem index="/settings">设置</ElMenuItem>
      <ElMenuItem index="/about">关于</ElMenuItem>
    </ElMenu>

    <RouterView class="p-4 flex-grow overflow-y-auto overflow-x-hidden" v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <Component :is="Component" />
      </Transition>
    </RouterView>
  </div>


  <ElDrawer v-model="showDownloadDrawer" title="下载管理" size="80%" @open="emitter.emit('drawerOpen')">
    <DownloadManager />
  </ElDrawer>
</template>

<style scoped>
.color-bg {
  background: linear-gradient(to left bottom, hsl(16, 100%, 85%) 0%, hsl(217, 100%, 85%) 100%)
}

.el-menu-item {
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.router-mark :deep(.el-menu-item.is-active) {
  background-color: var(--el-menu-hover-bg-color);
}
</style>