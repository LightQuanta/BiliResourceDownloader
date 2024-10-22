interface DebugInfo {
    url: string
    response: string
    extraParams: Record<string, string>
}

const debugInfos = new Map<string, DebugInfo>()
const lastUpdated = ref(0)

function setDebugInfo(name: string, url: string | URL, response: string, extraParams: Record<string, string> = {}) {
    const urlString = new URL(url).toString()
    debugInfos.set(name, { url: urlString, response, extraParams })
    lastUpdated.value = Date.now()
}

function getDebugInfo(name: string) {
    return debugInfos.get(name)
}

export type { DebugInfo }
export { setDebugInfo, getDebugInfo, lastUpdated }