import { getDownloadPath } from "./deviceUtils.ts";
import { LazyStore } from "@tauri-apps/plugin-store";
import { ref, watch } from 'vue';

const store = new LazyStore('config.json');

const DEFAULT_CONFIG = {
    showDebugButton: true,
    showNavigationButtons: true,
    showLocationBar: true,
    autoStartDownload: true,
    downloadPath: "", // Placeholder, will be updated
    readClipboard: true,
    requestCacheTime: 300,
    maxConcurrentDownloadTasks: 5,
    background: {
        enable: false,
        opacity: 0.6,
        url: ''
    }
};

const globalConfig = ref<typeof DEFAULT_CONFIG>({ ...DEFAULT_CONFIG });

const initializeConfig = async () => {
    const downloadPath = await getDownloadPath();
    const storedConfig = await store.get<typeof DEFAULT_CONFIG>('config');
    const config = { ...DEFAULT_CONFIG, ...storedConfig }
    if (!config.downloadPath) {
        config.downloadPath = downloadPath;
    }
    globalConfig.value = config;
};

const setupConfig = async () => {
    await initializeConfig();
    watch(globalConfig, async () => {
        await store.set('config', globalConfig.value);
    }, { deep: true });
};

setupConfig().then(() => {
    console.log("配置设置完成。");
}).catch(error => {
    console.error("配置设置失败：", error);
});

async function resetConfig() {
    const downloadPath = await getDownloadPath();
    globalConfig.value = {
        ...DEFAULT_CONFIG,
        downloadPath: downloadPath // Use the download path provided by the function
    };
}

export { globalConfig, resetConfig };