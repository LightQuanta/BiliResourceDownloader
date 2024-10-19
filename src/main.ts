import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { createWebHistory, createRouter } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import mitt from "mitt";
import { getDownloadStore, startDownload } from "./downloadManager.ts";
import { BiliResourceDownloadEventEmitter } from "./types.ts";
import { startClipboardListening } from "./cliboardListener.ts";
import { checkLoginState } from "./pages/loginManager.ts";

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

createApp(App)
    .use(router)
    .mount("#app");

// 若批量下载未完成，自动重新发起下载
getDownloadStore().then(async store => {
    if (await store.get('downloading') === true) {
        console.debug('发现未完成下载任务，继续下载')
        await startDownload()
        console.debug('未完成下载任务下载完成')
    }
})

startClipboardListening()
checkLoginState();

export { emitter, router }
