import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { createRouter, createWebHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import mitt from "mitt";
import { getDownloadStore, startDownload } from "./utils/downloadManager.ts";
import { BiliResourceDownloadEventEmitter } from "./types.ts";
import { checkLoginState } from "./utils/loginManager.ts";
import { createPinia } from 'pinia'
import './utils/cliboardListener.ts'

const pinia = createPinia()

const emitter = mitt<BiliResourceDownloadEventEmitter>()

const router = createRouter({
    history: createWebHistory(),
    routes
})

if (import.meta.hot) {
    handleHotUpdate(router)
}

// 自动生成的路由
console.debug(routes)

const app = createApp(App)
app.use(pinia)
app.use(router)

app.config.errorHandler = (err, instance, info) => {
    console.error(err)
    console.error(instance)
    console.error(info)

    ElMessage({
        message: `出现未知错误：${err}`,
        type: 'error',
    })
}

app.mount("#app");

// 若批量下载未完成，自动重新发起下载
getDownloadStore().then(async store => {
    if (await store.get('downloading') === true) {
        console.debug('发现未完成下载任务，继续下载')
        await startDownload()
        console.debug('未完成下载任务下载完成')
    }
})

checkLoginState()

export { emitter, router }
