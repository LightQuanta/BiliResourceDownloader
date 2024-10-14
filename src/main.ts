import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { createWebHistory, createRouter } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import mitt from "mitt";

const emitter = mitt()

const router = createRouter({
    history: createWebHistory(),
    routes
})

if (import.meta.hot) {
    handleHotUpdate(router)
}

console.log(routes)

createApp(App)
    .use(router)
    .mount("#app");

export { emitter }
