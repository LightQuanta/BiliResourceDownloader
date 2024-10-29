import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { createRouter, createWebHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import mitt from "mitt";
import { continueUnfinishedDownloadTasks } from "./utils/downloadManager.ts";
import { BiliResourceDownloadEventEmitter } from "./types.ts";
import { checkLoginState } from "./utils/loginManager.ts";
import { createPinia } from 'pinia'
import './utils/cliboardListener.ts'
import JsonEditorVue from 'json-editor-vue'

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
app.use(JsonEditorVue)

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
continueUnfinishedDownloadTasks()

checkLoginState()

export { emitter, router }
