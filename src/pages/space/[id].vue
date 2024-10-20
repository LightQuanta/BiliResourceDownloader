<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import { BasicLiveUserInfo, BasicUserInfo } from "../../types.ts";

const route = useRoute<'/space/[id]'>()
const uid = computed(() => route.params.id)
const roomID = ref('')

const apiUrl = ref('')
const responseText = ref('')

const UPInfo = ref<BasicUserInfo>()

const fetchData = async () => {
  const url = new URL('https://api.bilibili.com/x/web-interface/card')
  url.searchParams.set('mid', uid.value)

  apiUrl.value = url.toString()

  let resp: BasicUserInfo
  try {
    resp = await cachedAPIFetch(url).then(r => r.data) as BasicUserInfo
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取UP主信息出错：${e}`,
      type: 'error',
    })
    return
  }

  responseText.value = JSON.stringify(resp, null, 2)
  UPInfo.value = resp

  // 尝试获取直播间号
  const url2 = new URL('https://api.live.bilibili.com/live_user/v1/Master/info')
  url2.searchParams.set('uid', uid.value)

  try {
    const resp = await cachedAPIFetch(url2)
    roomID.value = (resp.data as BasicLiveUserInfo).room_id.toString()
    // responseText.value = JSON.stringify(resp, null, 2)
  } catch (e) {
    console.error(e)
    ElMessage({
      message: `获取直播间信息出错：${e}`,
      type: 'error',
    })
  }
}
onMounted(fetchData)
watch(uid, fetchData)

const showDebugDrawer = ref(false)
const showDebugInfo = () => {
  showDebugDrawer.value = true
}

const hasPendant = computed(() => UPInfo.value?.card?.pendant.pid ?? 0 !== 0)

const router = useRouter()
const searchPendant = () => {
  router.push({ path: '/search/garb', query: { keyword: UPInfo.value?.card.pendant.name } })
}
// https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/dynamic/space.md#%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E7%A9%BA%E9%97%B4%E5%8A%A8%E6%80%81
// 尝试根据第一条获取的动态获得装扮信息？

</script>

<template>
  <div class="flex flex-col">
    <!-- 信息展示界面 -->
    <ElDescriptions
      :column="6"
      border
    >
      <template #title>
        UP主信息
      </template>

      <template #extra>
        <ElButton @click="showDebugInfo">
          显示调试信息
        </ElButton>
        <!-- 调试信息 -->
        <ElDrawer
          v-model="showDebugDrawer"
          size="60%"
          title="调试信息"
        >
          <ElDescriptions
            :column="1"
            border
          >
            <ElDescriptionsItem label="API调用地址">
              <ElLink
                :href="apiUrl"
                target="_blank"
                type="primary"
              >
                {{ apiUrl }}
              </ElLink>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="用户UID">
              {{ uid }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElDivider>原始返回数据</ElDivider>
          <ElInput
            v-model="responseText"
            aria-multiline="true"
            autosize
            readonly
            type="textarea"
          />
        </ElDrawer>
      </template>


      <ElDescriptionsItem
        :span="2"
        label="名称"
      >
        <ElLink
          :href="`https://space.bilibili.com/${uid}`"
          target="_blank"
          type="primary"
        >
          {{ UPInfo?.card.name }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="性别"
      >
        {{ UPInfo?.card.sex }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="UID"
      >
        {{ UPInfo?.card.mid }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="关注数"
      >
        {{ UPInfo?.card.attention }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="粉丝数"
      >
        {{ UPInfo?.follower }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="2"
        label="获赞数"
      >
        {{ UPInfo?.like_num }}
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="签名"
      >
        <span class="whitespace-pre-wrap">{{ UPInfo?.card.sign }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="hasPendant"
        :span="6"
        label="头像框"
      >
        <!--  TODO 头像框的pid是否可以解析？ -->
        <ElLink
          type="primary"
          @click="searchPendant"
        >
          {{ UPInfo?.card.pendant.name }} - 点击搜索
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :span="6"
        label="直播间"
      >
        <RouterLink
          v-if="roomID > 0"
          :to="`/liveroom/${roomID}`"
        >
          <ElLink type="primary">
            {{ roomID }}
          </ElLink>
        </RouterLink>
        <ElText
          v-else
          type="danger"
        >
          未开通
        </ElText>
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider>图片资源</ElDivider>
    <div class="flex flex-wrap gap-4 justify-center">
      <ImageCard
        :download-name="`${UPInfo?.card.name} - 头像`"
        :image="UPInfo?.card.face"
        title="头像"
      />
      <ImageCard
        v-if="hasPendant"
        :image="UPInfo?.card.pendant?.image"
        :title="`头像框 - ${UPInfo?.card.pendant.name}`"
      />
    </div>
  </div>
</template>
