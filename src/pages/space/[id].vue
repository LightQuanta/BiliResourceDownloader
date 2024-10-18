<script setup lang="ts">
import { cachedAPIFetch } from "../../cachedAPIFetch.ts";
import { BasicLiveUserInfo, BasicUserInfo } from "../../types.ts";

const route = useRoute()
const uid = computed(() => route.params.id)
const roomID = ref('')

const apiUrl = ref('')
const responseText = ref('')

const UPInfo = ref<BasicUserInfo>(null)

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
    roomID.value = (resp.data as BasicLiveUserInfo).room_id
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

// https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/dynamic/space.md#%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E7%A9%BA%E9%97%B4%E5%8A%A8%E6%80%81
// 尝试根据第一条获取的动态获得装扮信息？

</script>

<template>
  <div class="flex flex-col">

    <!-- 信息展示界面 -->
    <ElDescriptions border :column="6">
      <template #title>
        UP主信息
      </template>

      <template #extra>
        <ElButton @click="showDebugInfo">显示调试信息</ElButton>
        <!-- 调试信息 -->
        <ElDrawer v-model="showDebugDrawer"
                  title="调试信息"
                  size="60%"
        >
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="API调用地址">
              <ElLink type="primary" :href="apiUrl" target="_blank">{{ apiUrl }}</ElLink>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="用户UID">
              {{ uid }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElDivider>原始返回数据</ElDivider>
          <ElInput v-model="responseText"
                   type="textarea"
                   readonly
                   aria-multiline="true"
                   autosize
          />
        </ElDrawer>
      </template>


      <ElDescriptionsItem label="名称" :span="3">
        <ElLink type="primary" :href="`https://space.bilibili.com/${uid}`" target="_blank">
          {{ UPInfo?.card.name }}
        </ElLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="UID" :span="3">
        {{ UPInfo?.card.mid }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="关注数" :span="2">
        {{ UPInfo?.card.attention }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="粉丝数" :span="2">
        {{ UPInfo?.follower }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="获赞数" :span="2">
        {{ UPInfo?.like_num }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="签名" :span="6">
        <span class="whitespace-pre-wrap">{{ UPInfo?.card.sign }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="头像框" :span="6" v-if="hasPendant">
        <RouterLink :to="`/search/garb?keyword=${UPInfo?.card.pendant?.name}`">
          <!--  TODO 头像框的pid是否可以解析？ -->
          <ElLink type="primary">{{ UPInfo.card.pendant.name }} - 点击搜索</ElLink>
        </RouterLink>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="直播间" :span="6" v-if="roomID">
        <RouterLink :to="`/liveroom/${roomID}`">
          <ElLink type="primary">
            {{ roomID }}
          </ElLink>
        </RouterLink>
      </ElDescriptionsItem>

    </ElDescriptions>

    <ElDivider>图片资源</ElDivider>
    <div class="flex flex-wrap gap-4 justify-center">
      <ImageCard title="头像" :image="UPInfo?.card.face"/>
      <ImageCard :title="`头像框 - ${UPInfo?.card.pendant.name}`"
                 v-if="hasPendant"
                 :image="UPInfo?.card.pendant?.image"
      />
    </div>
  </div>
</template>
