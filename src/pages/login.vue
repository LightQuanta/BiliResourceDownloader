<script setup lang="ts">
import { toDataURL } from 'qrcode'
import { ElMessage } from "element-plus";
import { checkLoginState, clearLoginCookie, saveLoginCookie, userLoggedIn } from "../utils/loginManager.ts";
import { APIFetch } from "../APIFetch.ts";
import { GeneralAPIResponse } from "../types.ts";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const qrCodeData = ref('')

// 是否正在进行登录
const loggingIn = ref(false)
const login = async () => {
  userLoggedIn.value = await checkLoginState()
  if (userLoggedIn.value) {
    ElMessage({
      message: '已经登录！',
      type: 'success',
    })
    return
  }

  loggingIn.value = true
  const resp: GeneralAPIResponse<{
    url: string
    qrcode_key: string
  }> = await fetch('https://passport.bilibili.com/x/passport-login/web/qrcode/generate')
      .then(d => d.json())
  if (resp.code !== 0) {
    ElMessage({
      message: '获取登录二维码出错：' + resp.message,
      type: 'error',
    })
    return
  }

  const { url, qrcode_key } = resp.data
  qrCodeData.value = await toDataURL(url)

  const pollURL = new URL('https://passport.bilibili.com/x/passport-login/web/qrcode/poll')
  pollURL.searchParams.append('qrcode_key', qrcode_key)

  let pollResp: GeneralAPIResponse<{
    url: string
    refresh_token: string
    code: number
    message: string
  }>

  do {
    await sleep(1000)

    pollResp = await fetch(pollURL).then(d => d.json())

    console.log(pollResp)

    if (pollResp.code !== 0) {
      ElMessage({
        message: '获取登录信息出错：' + pollResp.message,
        type: 'error',
      })
      return
    }
  } while (pollResp.data.code === 86101 || pollResp.data.code === 86090)

  if (pollResp.data.code === 86038) {
    ElMessage({
      message: '二维码已失效，请重新刷新',
      type: 'error',
    })
    loggingIn.value = false
    return
  }

  if (pollResp.data.code === 0) {
    ElMessage({
      message: '登录成功',
      type: 'success',
    })

    const loginURL = new URL(pollResp.data.url)
    const params = loginURL.search.substring(1)

    await saveLoginCookie(params)
    userLoggedIn.value = true
    loggingIn.value = false
  }
}
const logoff = async () => {
  await clearLoginCookie()
  userLoggedIn.value = false
  ElMessage({
    message: '已退出登录',
    type: 'success',
  })
}

onMounted(async () => {
  userLoggedIn.value = await checkLoginState()
})

const testLoginState = async () => {
  let resp: GeneralAPIResponse<{
    isLogin: boolean
    uname?: string
  }>
  try {
    resp = await APIFetch<{
      isLogin: boolean
      uname?: string
    }>('https://api.bilibili.com/x/web-interface/nav', undefined, { useCache: false })
  } catch (e) {
    if ((e as GeneralAPIResponse<unknown>).code === -101) {
      ElMessage({
        message: '当前账号未登录',
        type: 'error',
      })
    } else {
      ElMessage({
        message: '获取登录信息出错：' + e,
        type: 'error',
      })
    }
    return
  }

  userLoggedIn.value = resp.data?.isLogin
  if (userLoggedIn.value) {
    ElMessage({
      message: '登录成功，欢迎 ' + resp.data.uname,
      type: 'success',
    })
  }
}
</script>

<template>
  <div>
    <ElButton
      :disabled="loggingIn || userLoggedIn"
      type="primary"
      @click="login"
    >
      登录
    </ElButton>
    <ElButton
      type="primary"
      @click="testLoginState"
    >
      测试登录状态
    </ElButton>
    <ElButton
      v-if="userLoggedIn"
      type="primary"
      @click="logoff"
    >
      退出登录
    </ElButton>
    <ElButton @click="userLoggedIn = false">
      （调试） 模拟登出状态
    </ElButton>
    <ElButton @click="userLoggedIn = true">
      （调试） 模拟登录状态
    </ElButton>
    <div
      class="mt-4 flex flex-col"
      v-if="loggingIn"
    >
      请使用app端进行扫码登录
      <ElImage
        :src="qrCodeData"
        class="w-72 h-72"
      />
    </div>
  </div>
</template>
