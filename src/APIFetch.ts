import { createStore, Store } from '@tauri-apps/plugin-store';
import { clearLoginCookie, getLoginCookie, userLoggedIn } from "./loginManager.ts";
import { GeneralAPIResponse } from "./types.ts";
import { encWbiWithFetch } from "./utils/wbi.ts";
import { useWbiStore } from "./store/useWbiStore";
import { setDebugInfo } from "./utils/debug.ts";

let internalStore: Store | null = null

// 缓存5分钟
const CACHE_TIME = 5 * 60 * 1000

interface CachedJSONResponse<T> {
    cachedTime: number
    response: T
}

async function getStore() {
    if (internalStore === null) {
        internalStore = await createStore('cachedAPIFetch')
    }
    return internalStore
}

interface ExtraAPIFetchOptions {
    wbiSign?: boolean
    useCache?: boolean
    useCookie?: boolean
    debug?: {
        name: string
        extraParams?: Record<string, string>
    }
}

async function APIFetch<T>(url: URL | string, init?: RequestInit, extraOptions?: ExtraAPIFetchOptions): Promise<GeneralAPIResponse<T>> {
    const parsedURL = new URL(url)
    const getURLStr = () => parsedURL.toString()
    const store = await getStore()

    const { useCache, wbiSign, useCookie, debug: debugInfo } = {
        useCache: true,
        wbiSign: false,
        useCookie: true,
        ...extraOptions
    }

    // wbi签名参数
    if (wbiSign) {
        const params: Record<string, string> = {}
        for (const [key, value] of parsedURL.searchParams) {
            params[key] = value
        }
        parsedURL.search = await encWbiWithFetch(params)
        console.debug(`wbi signed url: ${getURLStr()}`)
    }

    if (useCache && await store.has(getURLStr())) {
        const cacheData = (await store.get(getURLStr())) as CachedJSONResponse<T>
        if (cacheData.cachedTime > Date.now()) {
            console.debug(`using cached ${getURLStr()}`)
            
            if (debugInfo) {
                setDebugInfo(debugInfo.name, parsedURL, JSON.stringify(cacheData.response, null, 2), debugInfo.extraParams)
            }
            return cacheData.response as GeneralAPIResponse<T>
        } else {
            console.debug(`expired cache ${getURLStr()}`)
        }
    }

    const options: RequestInit = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
            'Cookie': 'bili_ticket=1&b_nut=1&buvid3=1&buvid4=1',
        }
    }
    if (useCookie) {
        const cookie = await getLoginCookie()
        if (cookie !== null) {
            options.headers['Cookie'] = cookie
        }
    }

    const finalOptions = { ...options, ...init }


    let retryCount = 0
    let json: GeneralAPIResponse<T>

    do {
        json = await fetch(parsedURL, finalOptions).then(r => r.json()) as GeneralAPIResponse<T>

        if (json.code !== 0) {
            if ((json.code === -352 || json.code === -403) && retryCount < 1) {
                // 假设是wbi校验失败，刷新wbi后进行重试
                const store = useWbiStore()
                await store.refreshWbi()

                retryCount++
                continue
            }

            // 账号登录失效时清空登录信息
            if (json.code === -101) {
                userLoggedIn.value = false
                await clearLoginCookie()
            }

            throw json
        }
        break
    } while (retryCount < 1)

    if (debugInfo) {
        setDebugInfo(debugInfo.name, parsedURL, JSON.stringify(json, null, 2), debugInfo.extraParams)
    }

    if (useCache) {
        await store.set(getURLStr(), {
            cachedTime: Date.now() + CACHE_TIME,
            response: json,
        })
        console.debug(`cached ${getURLStr()}`)
    }

    return json
}

async function clearAPICache() {
    const store = await getStore()
    await store.clear()
}

export { APIFetch, clearAPICache }