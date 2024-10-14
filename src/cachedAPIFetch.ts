import { createStore } from '@tauri-apps/plugin-store';

const responseCache = await createStore('responseCache')

// 缓存5分钟
const CACHE_TIME = 5 * 60 * 1000

interface CachedJSONResponse {
    cachedTime: number
    response: any
}

async function cachedAPIFetch(url: URL | string): Promise<any> {
    const strURL = (url as URL).href ?? url

    if (await responseCache.has(strURL)) {
        const cacheData = (await responseCache.get(strURL)) as CachedJSONResponse
        if (cacheData.cachedTime > Date.now()) {
            return cacheData.response
        }
    }

    const json = await fetch(strURL).then(r => r.json())
    if ((json as { code: number }).code !== 0) {
        throw (json as { msg: string }).msg as string
    }

    await responseCache.set(strURL, {
        cachedTime: Date.now() + CACHE_TIME,
        response: json,
    })

    console.debug(`cached ${strURL}`)

    return json
}

export { cachedAPIFetch }