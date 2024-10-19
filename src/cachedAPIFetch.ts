import { createStore, Store } from '@tauri-apps/plugin-store';
import { getLoginCookie } from "./loginManager.ts";
import { GeneralAPIResponse } from "./types.ts";

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

async function cachedAPIFetch(url: URL | string, init?: RequestInit, useCache: boolean = true): Promise<GeneralAPIResponse<any>> {
    const strURL = (url as URL).href ?? url
    const store = await getStore()

    if (useCache && await store.has(strURL)) {
        const cacheData = (await store.get(strURL)) as CachedJSONResponse
        if (cacheData.cachedTime > Date.now()) {
            console.debug(`using cached ${strURL}`)
            return cacheData.response
        } else {
            console.debug(`expired cache ${strURL}`)
        }
    }

    const cookie = await getLoginCookie()
    const options: RequestInit = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0'
        }
    }
    if (cookie) {
        options.headers!.cookie! = cookie
    }

    const finalOptions = { ...options, ...init }

    const json = await fetch(strURL, finalOptions).then(r => r.json()) as GeneralAPIResponse<unknown>
    if (json.code !== 0) {
        throw json
    }

    if (useCache) {
        await store.set(strURL, {
            cachedTime: Date.now() + CACHE_TIME,
            response: json,
        })
        console.debug(`cached ${strURL}`)
    }

    return json
}

async function clearAPICache() {
    const store = await getStore()
    await store.clear()
}

export { cachedAPIFetch, clearAPICache }