<script setup lang="ts">

</script>

<template>
  <div class="flex w-full h-full items-stretch">
    <ElMenu default-active="test" class="h-full w-32 m-0 shrink-0">
      <ElMenuItem index="test">test</ElMenuItem>
      <ElMenuItem index="test2">test2</ElMenuItem>
    </ElMenu>
    <!-- TODO 接入router -->
    <div class="p-4 flex-grow overflow-auto">
      <Lottery/>
    </div>
  </div>
</template>

<style scoped>
.el-menu-item {
  justify-content: center;
}
</style>