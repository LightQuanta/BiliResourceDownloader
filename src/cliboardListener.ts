import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { autoJump } from "./linkResolver.ts";
import { getCurrentWindow } from "@tauri-apps/api/window";

// TODO 实现自动跳转对应的配置项
// const enabled = true

let clipboardCache = ''

const window = getCurrentWindow()
window.onFocusChanged(async ({ payload: focused }) => {
    if (!focused) return

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
})