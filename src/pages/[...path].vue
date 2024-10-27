<script setup lang="ts">
const router = useRouter()
const back = () => {
  router.back()
}
</script>

<template>
  <ElResult
    icon="error"
    title="404"
    sub-title="未找到该页面"
  >
    <template #extra>
      <ElButton
        type="primary"
        @click="back"
      >
        返回上一页
      </ElButton>
    </template>
  </ElResult>
</template>
