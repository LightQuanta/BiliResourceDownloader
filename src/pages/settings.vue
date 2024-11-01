<script setup lang="ts">

import { globalConfig } from "../utils/globalConfig.ts";
import { clearAPICache } from "../APIFetch.ts";

const clearCache = async () => {
  await clearAPICache()
  ElMessage({
    message: '已清空请求缓存！',
    type: 'success',
  })
}
</script>

<template>
  <div class="p-12 flex flex-col gap-4 max-w-screen-sm">
    <ElCard>
      <template #header>
        界面设置
      </template>
      <ElForm
        label-position="left"
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
        label-position="left"
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
        label-position="left"
        label-width="200px"
      >
        <ElFormItem label="最大同时下载任务数">
          <ElInputNumber
            v-model="globalConfig.maxConcurrentDownloadTasks"
            :min="1"
            :max="20"
          />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard>
      <template #header>
        杂项
      </template>
      <ElButton
        type="primary"
        @click="clearCache"
      >
        清空请求缓存
      </ElButton>
    </ElCard>
  </div>
</template>
