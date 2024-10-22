<script setup lang="ts">
import DownloadManager from "./components/DownloadManager.vue";
import { emitter } from "./main.ts";

const showDownloadDrawer = ref(false)
</script>

<template>
  <div class="flex w-full h-full items-stretch color-bg">
    <ElMenu
      :router="true"
      class="h-full w-32 m-0 shrink-0 router-mark"
      default-active="test"
    >
      <ElMenuItem index="/">
        主页
      </ElMenuItem>
      <ElMenuItem index="/search/garb">
        装扮/收藏集搜索
      </ElMenuItem>
      <ElMenuItem index="/search/emoji">
        表情包搜索
      </ElMenuItem>
      <ElMenuItem @click="showDownloadDrawer = true">
        下载管理
      </ElMenuItem>
      <ElMenuItem index="/login">
        登录
      </ElMenuItem>
      <ElMenuItem index="/settings">
        设置
      </ElMenuItem>
      <ElMenuItem index="/about">
        关于
      </ElMenuItem>
    </ElMenu>

    <RouterView
      v-slot="{ Component }"
      class="p-4 flex-grow overflow-y-auto overflow-x-hidden"
    >
      <Transition
        mode="out-in"
        name="fade"
      >
        <Component :is="Component" />
      </Transition>
    </RouterView>
  </div>


  <ElDrawer
    v-model="showDownloadDrawer"
    size="60%"
    title="下载管理"
    @open="emitter.emit('drawerOpen')"
  >
    <DownloadManager />
  </ElDrawer>
</template>

<style scoped>
.color-bg {
  background: linear-gradient(to left bottom, hsl(16, 100%, 85%) 0%, hsl(217, 100%, 85%) 100%);
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