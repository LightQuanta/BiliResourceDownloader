import { createStore, Store } from '@tauri-apps/plugin-store';

let internalStore: Store | null = null

// 缓存5分钟
const CACHE_TIME = 5 * 60 * 1000

interface CachedJSONResponse {
    cachedTime: number
    response: any
}

async function getStore() {
    if (internalStore === null) {
        internalStore = await createStore('cachedAPIFetch')
    }
    return internalStore
}

async function cachedAPIFetch(url: URL | string): Promise<any> {
    const strURL = (url as URL).href ?? url
    const store = await getStore()

    if (await store.has(strURL)) {
        const cacheData = (await store.get(strURL)) as CachedJSONResponse
        if (cacheData.cachedTime > Date.now()) {
            return cacheData.response
        }
    }

    const json = await fetch(strURL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0'
        }
    }).then(r => r.json())
    if ((json as { code: number }).code !== 0) {
        throw (json as { msg: string }).msg as string
    }

    await store.set(strURL, {
        cachedTime: Date.now() + CACHE_TIME,
        response: json,
    })

    console.debug(`cached ${strURL}`)

    return json
}

export { cachedAPIFetch }