<script setup lang="ts">
import DownloadManager from "./components/DownloadManager.vue"
import { emitter } from "./main.ts"
import { getCurrentWindow } from "@tauri-apps/api/window"
import Icon from '../src-tauri/icons/icon.png'
import { globalConfig } from "./utils/globalConfig.ts";

const window = getCurrentWindow()
const showDownloadDrawer = ref(false)

const mainDivRef = ref<HTMLElement>()
// 向上滚动页面，避免搜索界面滚动时卡住
emitter.on('scrollUp', () => {
  mainDivRef.value?.scrollBy({ top: -100, behavior: 'smooth' })
})

const rotate180 = ref(false)
const minusX = ref(false)
const minusY = ref(false)

let achievementAchieved = false

watchEffect(() => {
  if (rotate180.value) {
    document.body.classList.add('rotate-180')
  } else {
    document.body.classList.remove('rotate-180')
  }

  if (minusX.value) {
    document.body.classList.add('scale-x-[-1]')
  } else {
    document.body.classList.remove('scale-x-[-1]')
  }

  if (minusY.value) {
    document.body.classList.add('scale-y-[-1]')
  } else {
    document.body.classList.remove('scale-y-[-1]')
  }

  if (!achievementAchieved && rotate180.value && minusX.value && minusY.value) {
    ElNotification({
      title: '获得成就',
      message: '了转反',
      type: 'success',
      duration: 0,
    })
    achievementAchieved = true
  }
})

const router = useRouter()
const reload = () => document.location.reload()
const route = useRoute()

const currentPath = ref('')
watch(() => route.fullPath, () => {
  currentPath.value = route.fullPath
})

</script>

<template>
  <div class="fixed top-0 left-0 right-0 bottom-0 p-0">
    <!-- 标题栏 -->
    <Teleport to="body">
      <!-- 导航栏 -->
      <div
        class="fixed top-0 w-full pointer-events-none h-[--title-bar-height] flex items-center z-[114515] justify-center gap-2"
      >
        <div class="pointer-events-auto flex max-w-screen-md">
          <ElButtonGroup
            class="shrink-0"
            v-if="globalConfig.showNavigationButtons"
          >
            <ElButton
              class="h-6 w-6"
              @click="router.back()"
            >
              <ElIcon>
                <i-ep-arrow-left-bold />
              </ElIcon>
            </ElButton>
            <ElButton
              class="h-6 w-6"
              @click="router.forward()"
            >
              <ElIcon>
                <i-ep-arrow-right-bold />
              </ElIcon>
            </ElButton>
            <ElButton
              class="h-6 w-6"
              @click="reload"
            >
              <ElIcon>
                <i-ep-refresh />
              </ElIcon>
            </ElButton>
          </ElButtonGroup>
          <ElInput
            v-if="globalConfig.showLocationBar"
            class="ml-1 h-6 w-80 hover:w-[600px] transition-all"
            v-model="currentPath"
            @change="router.push(currentPath)"
          />
        </div>
      </div>

      <!-- 图标、标题、操作按钮 -->
      <div
        class="fixed top-0 w-full h-[--title-bar-height] bg-gray-100 flex gap-2 items-center pl-2 z-[114514] shadow select-none"
        data-tauri-drag-region
      >
        <ElPopover
          placement="bottom-start"
          trigger="click"
        >
          <div
            class="reversed m-[-12px] rounded transition-colors bg-gradient-to-br from-green-300 via-blue-300 to-cyan-300 p-2"
          >
            <div class="flex">
              <div class="rotate-180 mr-auto flex justify-center items-center">
                反转了
              </div>
              <ElSwitch v-model="rotate180" />
            </div>
            <div class="flex">
              <div class="scale-x-[-1] mr-auto flex justify-center items-center">
                反转了
              </div>
              <ElSwitch v-model="minusX" />
            </div>
            <div class="flex">
              <div class="scale-y-[-1] mr-auto flex justify-center items-center">
                反转了
              </div>
              <ElSwitch v-model="minusY" />
            </div>
          </div>
          <template #reference>
            <ElImage
              :src="Icon"
              class="h-4 w-4 cursor-pointer"
            />
          </template>
        </ElPopover>

        <ElText
          size="small"
          class="overflow-ellipsis shrink pointer-events-none"
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
          <ElMenuItem index="/search/general">
            通用搜索
          </ElMenuItem>
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
          <ElMenuItem index="/tool/lottie">
            Lottie动画解析
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
      <div
        ref="mainDivRef"
        class="p-4 flex-grow overflow-y-auto overflow-x-hidden"
      >
        <RouterView
          v-slot="{ Component }"
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

.reversed {
  animation-name: hue;
  animation-iteration-count: infinite;
  animation-duration: 2s;
}

@keyframes hue {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

:deep(.el-input__inner) {
  line-height: 0.5px;
}
</style>