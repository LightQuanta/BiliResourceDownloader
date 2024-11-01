import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { autoJump } from "./linkResolver.ts";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { globalConfig } from "./globalConfig.ts";

let clipboardCache = ''

const window = getCurrentWindow()
window.onFocusChanged(async ({ payload: focused }) => {
    if (!focused || !globalConfig.value.readClipboard) return

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