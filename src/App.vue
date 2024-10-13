<script setup lang="ts">

</script>

<template>
  <div class="flex w-full h-full items-stretch">
    <ElMenu
        default-active="test"
        class="h-full w-32 m-0 shrink-0"
        :router="true"
    >
      <ElMenuItem index="/">主页</ElMenuItem>
      <ElMenuItem index="/search/garb">装扮/收藏集搜索</ElMenuItem>
      <ElMenuItem index="/settings">设置</ElMenuItem>
      <ElMenuItem index="/about">关于</ElMenuItem>
    </ElMenu>

    <RouterView class="p-4 flex-grow overflow-auto" v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <Component :is="Component"/>
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
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
</style>