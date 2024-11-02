import { LazyStore } from "@tauri-apps/plugin-store";


const store = new LazyStore('config.json')

const DEFAULT_CONFIG = {
    showDebugButton: true,
    showNavigationButtons: true,
    showLocationBar: true,

    readClipboard: true,
    requestCacheTime: 300,

    maxConcurrentDownloadTasks: 3,
    background: {
        enable: false,
        opacity: 0.6,
        url: ``
    }
}

const globalConfig = ref(DEFAULT_CONFIG)

// 自动保存
watch(globalConfig, async () => {
    await store.set('config', globalConfig.value)
}, { deep: true })

async function readConfig() {
    globalConfig.value = await store.get<typeof DEFAULT_CONFIG>('config') ?? DEFAULT_CONFIG
}

function resetConfig() {
    globalConfig.value = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as typeof DEFAULT_CONFIG
}

readConfig()

export { globalConfig, resetConfig }