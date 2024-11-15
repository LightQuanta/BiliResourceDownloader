<script setup lang="ts">
import { emitter } from "./main.ts"
import { getCurrentWindow } from "@tauri-apps/api/window"
import Icon from '../src-tauri/icons/icon.png'
import { globalConfig } from "./utils/globalConfig.ts";
import AppBackground from "./components/AppBackground.vue";
import { isMobileDevice } from "./utils/deviceUtils.ts";


const window = getCurrentWindow()
const showDownloadDrawer = ref(false)
const showLoginDrawer = ref(false)

const isMobile = ref(true)
const enoughWidth = useMediaQuery('(min-width: 640px)')

onMounted(() => {
  isMobile.value = isMobileDevice()
})

const mainDivRef = ref<HTMLElement>()
// 向上滚动页面，避免搜索界面滚动时卡住
emitter.on('scrollUp', () => {
  mainDivRef.value?.scrollBy({ top: -100, behavior: 'smooth' })
})

emitter.on('scrollToTop', () => {
  mainDivRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
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
          <!-- 导航栏按钮 -->
          <ElButtonGroup
            class="shrink-0"
            v-if="globalConfig.showNavigationButtons"
          >
            <ElButton
              class="h-8 w-6"
              @click="router.back()"
            >
              <ElIcon>
                <i-ep-arrow-left-bold />
              </ElIcon>
            </ElButton>
            <ElButton
              class="h-8 w-6"
              @click="router.forward()"
            >
              <ElIcon>
                <i-ep-arrow-right-bold />
              </ElIcon>
            </ElButton>
            <ElButton
              class="h-8 w-6"
              @click="reload"
            >
              <ElIcon>
                <i-ep-refresh />
              </ElIcon>
            </ElButton>
          </ElButtonGroup>
          <!-- 地址栏 -->
          <ElInput
            v-if="globalConfig.showLocationBar"
            class="ml-1 h-8 w-72 route-input transition-all"
            v-model="currentPath"
            @change="router.push(currentPath)"
          />
        </div>
      </div>

      <!-- 图标、标题、操作按钮 -->
      <div
        class="fixed top-0 w-full h-[--title-bar-height] bg-gray-100 flex gap-2 items-center pl-2 z-[114514] shadow select-none"
        data-tauri-drag-region
        v-if="!isMobile"
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
        <ElButtonGroup class="ml-auto h-[--title-bar-height]">
          <ElButton
            text
            class="hover:!bg-gray-300 rounded-none h-full"
            @click="window.minimize()"
          >
            <ElIcon>
              <i-ep-minus />
            </ElIcon>
          </ElButton>
          <ElButton
            text
            class="hover:!bg-gray-300 rounded-none h-full"
            @click="window.toggleMaximize()"
          >
            <ElIcon>
              <i-ep-full-screen />
            </ElIcon>
          </ElButton>
          <ElButton
            text
            class="hover:!bg-red-500 rounded-none h-full"
            @click="window.close()"
          >
            <ElIcon>
              <i-ep-close />
            </ElIcon>
          </ElButton>
        </ElButtonGroup>
      </div>
    </Teleport>

    <div
      class="flex mt-[--title-bar-height] w-full h-full items-stretch relative"
    >
      <AppBackground />
      <!-- 菜单 -->
      <ElMenu
        :router="true"
        class="h-full sm:w-40 w-16 m-0 shrink-0 router-mark select-none overflow-y-auto pb-16"
        default-active="test"
        :collapse="!enoughWidth"
      >
        <ElMenuItem index="/">
          <ElIcon>
            <i-ep-home-filled />
          </ElIcon>
          <span>主页</span>
        </ElMenuItem>

        <ElSubMenu index="search">
          <template #title>
            <ElIcon>
              <i-ep-search />
            </ElIcon>
            <span>搜索</span>
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
            <ElIcon>
              <i-ep-tools />
            </ElIcon>
            <span>工具</span>
          </template>
          <ElMenuItem index="/tool/svga">
            SVGA动画解析
          </ElMenuItem>
          <ElMenuItem index="/tool/lottie">
            Lottie动画解析
          </ElMenuItem>
        </ElSubMenu>

        <ElMenuItem @click="showDownloadDrawer = true">
          <ElIcon>
            <i-ep-download />
          </ElIcon>
          <span>下载管理</span>
        </ElMenuItem>
        <ElMenuItem @click="showLoginDrawer = true">
          <ElIcon>
            <i-ep-user-filled />
          </ElIcon>
          <span>登录</span>
        </ElMenuItem>
        <ElMenuItem index="/settings">
          <ElIcon>
            <i-ep-setting />
          </ElIcon>
          <span>设置</span>
        </ElMenuItem>
        <ElMenuItem index="/about">
          <ElIcon>
            <i-ep-info-filled />
          </ElIcon>
          <span>关于</span>
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
      @open="emitter.emit('downloadDrawerOpen')"
    >
      <DownloadManager />
    </ElDrawer>
    <ElDrawer
      v-model="showLoginDrawer"
      size="60%"
      title="登录"
      @open="emitter.emit('loginDrawerOpen')"
    >
      <LoginManager />
    </ElDrawer>
  </div>
</template>

<style scoped>
@media (min-width: 640px) {
  .route-input:has(.el-input__inner:focus) {
    width: 600px;
  }
}

.color-bg {
  background-image: linear-gradient(to left bottom, hsl(16, 100%, 85%) 0%, hsl(217, 100%, 85%) 100%);
  background-size: cover;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-position: center center;
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