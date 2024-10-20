import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { autoJump } from "./linkResolver.ts";

let clipboardCache = ""

// TODO 实现自动跳转对应的配置项
// const enabled = true

let taskID = 0

function startClipboardListening() {
    if (taskID > 0) return
    taskID = setInterval(async () => {
        let text: string
        try {
            text = await readText()
        } catch {
            return
        }
        if (text !== clipboardCache) {
            clipboardCache = text
            await autoJump(text)
        }
    }, 1000)
}

function stopClipboardListening() {
    clearInterval(taskID)
    clipboardCache = ""
    taskID = -1
}

export { startClipboardListening, stopClipboardListening }