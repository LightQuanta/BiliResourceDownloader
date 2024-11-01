<script setup lang="ts">
import { DebugInfo, getDebugInfo, lastUpdated } from "../utils/debug.ts";
import { globalConfig } from "../utils/globalConfig.ts";

const props = defineProps<{
  names: string[]
}>()

const showDebugDrawer = ref(false)
const responseText = ref('')

const selected = ref('')

const info = ref<DebugInfo>()
const params = computed(() => Object.keys(info.value?.extraParams ?? {}))

const update = () => {
  info.value = getDebugInfo(selected.value)
  responseText.value = info.value?.response ?? '{}'
}

const getParam = (url: string | URL, name: string) => {
  return new URL(url).searchParams.get(name)
}

watch(lastUpdated, update)
watch(selected, update)
onMounted(() => {
  selected.value = props.names[0]
  update()
})
watch(() => props.names, () => {
  selected.value = props.names[0]
}, { deep: true })

const JSONObject = computed(() => JSON.parse(responseText.value))

</script>

<template>
  <ElButton
    @click="showDebugDrawer = true"
    v-if="globalConfig.showDebugButton"
  >
    显示调试信息
  </ElButton>
  <Teleport to="body">
    <ElDrawer
      v-model="showDebugDrawer"
      size="60%"
      title="调试信息"
    >
      <ElSelect
        v-model="selected"
        class="mb-4"
      >
        <ElOption
          v-for="name in names"
          :key="name"
          :value="name"
          :label="name"
        >
          {{ name }}
        </ElOption>
      </ElSelect>
      <ElDescriptions
        :column="1"
        border
      >
        <ElDescriptionsItem label="API调用地址">
          <ElLink
            :href="info?.url"
            target="_blank"
            type="primary"
          >
            {{ info?.url }}
          </ElLink>
        </ElDescriptionsItem>
        <ElDescriptionsItem
          v-for="key in params"
          :key="key"
          :label="info?.extraParams[key]"
        >
          {{ getParam(info?.url ?? '', key) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <CustomDivider>原始响应数据</CustomDivider>
      <JsonEditorVue
        v-model="JSONObject"
        read-only
      />
    </ElDrawer>
  </Teleport>
</template>