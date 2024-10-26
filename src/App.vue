<script setup lang="ts">
import DownloadManager from "./components/DownloadManager.vue";
import { emitter } from "./main.ts";
import { getCurrentWindow } from "@tauri-apps/api/window";

const window = getCurrentWindow()
const showDownloadDrawer = ref(false)
</script>

<template>
  <div class="fixed top-0 left-0 right-0 bottom-0 p-0">
    <!-- 标题栏 -->
    <Teleport to="body">
      <div
        class="fixed top-0 w-full h-[--title-bar-height] bg-gray-100 flex gap-2 items-center pl-2 z-[1145141919810] shadow select-none"
        data-tauri-drag-region
      >
        <ElImage
          src="../src-tauri/icons/icon.png"
          class="h-4 w-4"
        />
        <ElText
          size="small"
          class="overflow-ellipsis shrink"
        >
          BiliResourceDownloader
        </ElText>
        <ElButtonGroup class="ml-auto">
          <ElButton
            text
            class="hover:!bg-gray-300 rounded-none"
            @click="window.minimize()"
          >
            <ElIcon>
              <i-ep-minus />
            </ElIcon>
          </ElButton>
          <ElButton
            text
            class="hover:!bg-gray-300 rounded-none"
            @click="window.toggleMaximize()"
          >
            <ElIcon>
              <i-ep-full-screen />
            </ElIcon>
          </ElButton>
          <ElButton
            text
            class="hover:!bg-red-500 rounded-none"
            @click="window.close()"
          >
            <ElIcon>
              <i-ep-close />
            </ElIcon>
          </ElButton>
        </ElButtonGroup>
      </div>
    </Teleport>

    <div class="flex mt-[--title-bar-height] w-full h-full items-stretch color-bg">
      <!-- 菜单 -->
      <ElMenu
        :router="true"
        class="h-full w-40 m-0 shrink-0 router-mark select-none"
        default-active="test"
      >
        <ElMenuItem index="/">
          <span class="text-center">
            主页
          </span>
        </ElMenuItem>

        <ElSubMenu index="search">
          <template #title>
            搜索
          </template>
          <ElMenuItem index="/search/garb">
            装扮/收藏集搜索
          </ElMenuItem>
          <ElMenuItem index="/search/emoji">
            表情包搜索
          </ElMenuItem>
        </ElSubMenu>

        <ElSubMenu index="tool">
          <template #title>
            工具
          </template>
          <ElMenuItem index="/tool/svga">
            SVGA动画解析
          </ElMenuItem>
        </ElSubMenu>

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

      <!-- 内容 -->
      <RouterView
        v-slot="{ Component }"
        class="p-4 flex-grow overflow-y-auto overflow-x-hidden"
      >
        <KeepAlive>
          <Transition
            mode="out-in"
            name="fade"
          >
            <Component
              :is="Component"
              class="pb-10"
            />
          </Transition>
        </KeepAlive>
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
  </div>
</template>

<style scoped>
.color-bg {
  background: linear-gradient(to left bottom, hsl(16, 100%, 85%) 0%, hsl(217, 100%, 85%) 100%);
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