<script setup lang="ts">
const router = useRouter()
const liveroomTest = () => {
  ElMessageBox.prompt('liveroom id')
      .then(({ value }) => {
        router.push({ path: '/liveroom', query: { id: value } })
      })
}
</script>

<template>
  <div>
    <div>11111</div>
    <ElButton type="primary" @click="liveroomTest">liveroom</ElButton>
  </div>
</template>