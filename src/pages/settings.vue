<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import {allowedImageFormats, globalConfig, resetConfig} from "../utils/globalConfig.ts";
import { clearAPICache } from "../APIFetch.ts";
import { invoke } from "@tauri-apps/api/core";
import { isMobileDevice } from "../utils/deviceUtils.ts";
import { resolveContentUri } from "../utils/deviceUtils";

const enoughWidth = useMediaQuery('(min-width: 640px)')
const labelPosition = computed(() => enoughWidth.value ? 'left' : 'top')

const clearCache = async () => {
  await clearAPICache()
  ElMessage({
    message: '已清空请求缓存！',
    type: 'success',
  })
}

const reset = () => {
  ElMessageBox.confirm(
      '确定要重置所有设置吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(() => {
    resetConfig()
    ElMessage({
      message: '成功重置所有设置！',
      type: 'success',
    })
  })
}

const selectImg = async () => {
  let url = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp',],
      },
    ]
  })

  if (!url) return

  // resolve content:// urls on mobile devices
  if (isMobileDevice()) {
    url = resolveContentUri(url)
  }

  globalConfig.value.background.url = url

}

const selectDownloadDir = async () => {
  const path = await open({
    defaultPath: globalConfig.value.downloadPath,
    directory: true,
  })

  if (path === null) return null

  globalConfig.value.downloadPath = path
}

</script>

<template>
  <div class="sm:p-12 p-0 flex flex-col gap-4 max-w-screen-sm">
    <ElCard>
      <template #header>
        界面设置
      </template>
      <ElForm
        :label-position="labelPosition"
        label-width="200px"
      >
        <ElFormItem label="显示调试按钮">
          <ElSwitch v-model="globalConfig.showDebugButton" />
        </ElFormItem>
        <ElFormItem label="显示导航按钮">
          <ElSwitch v-model="globalConfig.showNavigationButtons" />
        </ElFormItem>
        <ElFormItem label="显示地址栏">
          <ElSwitch v-model="globalConfig.showLocationBar" />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard>
      <template #header>
        功能设置
      </template>
      <ElForm
        :label-position="labelPosition"
        label-width="200px"
      >
        <ElFormItem label="自动识别剪切板里的有效链接">
          <ElSwitch v-model="globalConfig.readClipboard" />
        </ElFormItem>
        <ElFormItem label="请求缓存时间(单位：秒)">
          <ElInputNumber
            v-model="globalConfig.requestCacheTime"
            :min="0"
            :max="86400"
          />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard>
      <template #header>
        下载设置
      </template>
      <ElForm
        :label-position="labelPosition"
        label-width="200px"
      >
        <ElFormItem label="最大同时下载任务数">
          <ElInputNumber
            v-model="globalConfig.maxConcurrentDownloadTasks"
            :min="1"
            :max="20"
          />
        </ElFormItem>

        <ElFormItem label="自动开始下载">
          <ElSwitch v-model="globalConfig.autoStartDownload" />
        </ElFormItem>

        <ElFormItem label="下载目录">
          <ElInput
            v-model="globalConfig.downloadPath"
            :disabled="isMobileDevice()"
            placeholder="下载目录"
          >
            <template #append>
              <ElButton
                v-if="!isMobileDevice()"
                @click="selectDownloadDir"
              >
                浏览
              </ElButton>
            </template>
          </ElInput>
        </ElFormItem>
        <ElSelect
          v-model="globalConfig.imageSaveFormat"
          placeholder="图片保存格式"
        >
          <ElOption
            v-for="format in allowedImageFormats"
            :key="format"
            :label="format.toUpperCase()"
            :value="format"
          />
        </ElSelect>
      </ElForm>
    </ElCard>

    <ElCard>
      <template #header>
        背景图像
      </template>
      <ElForm
        :label-position="labelPosition"
        label-width="120px"
      >
        <ElFormItem label="启用背景">
          <ElSwitch v-model="globalConfig.background.enable" />
        </ElFormItem>
        <ElFormItem label="背景路径">
          <ElInput
            v-model="globalConfig.background.url"
            :disabled="!globalConfig.background.enable"
            placeholder="可以是网络图片，也可以是本地图片"
          >
            <template #append>
              <ElButton @click="selectImg">
                浏览
              </ElButton>
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem label="不透明度">
          <ElSlider
            :disabled="!globalConfig.background.enable"
            v-model="globalConfig.background.opacity"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard>
      <template #header>
        杂项
      </template>
      <ElButton
        type="danger"
        @click="reset"
      >
        重置设置
      </ElButton>
      <ElButton
        type="primary"
        @click="clearCache"
      >
        清空请求缓存
      </ElButton>
      <ElButton
        type="primary"
        @click="() => invoke('open_webview_devtools')"
      >
        启动开发者工具
      </ElButton>
    </ElCard>
  </div>
</template>
