import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { autoJump } from "./linkResolver.ts";
import { createStore, Store } from "@tauri-apps/plugin-store";

// TODO 实现自动跳转对应的配置项
// const enabled = true

let taskID = 0

let internalStore: Store | null = null

async function getClipboardStore() {
    if (internalStore === null) {
        internalStore = await createStore('clipboard')
    }
    return internalStore
}

function startClipboardListening() {
    if (taskID > 0) return
    taskID = setInterval(async () => {
        let text: string
        try {
            text = await readText()
        } catch {
            return
        }
        const store = await getClipboardStore()
        const clipboardCache = await store.get('clipboard') as string | undefined
        if (text !== clipboardCache) {
            await store.set('clipboard', text)
            await autoJump(text)
        }
    }, 1000)
}

async function stopClipboardListening() {
    clearInterval(taskID)
    const store = await getClipboardStore()
    await store.delete('clipboard')
    taskID = -1
}

export { startClipboardListening, stopClipboardListening }