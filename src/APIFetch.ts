import { LazyStore } from '@tauri-apps/plugin-store';
import { clearLoginCookie, getLoginCookie, userLoggedIn } from "./utils/loginManager.ts";
import { GeneralAPIResponse } from "./types.ts";
import { encWbiWithFetch } from "./utils/wbi.ts";
import { useWbiStore } from "./store/useWbiStore";
import { setDebugInfo } from "./utils/debug.ts";
import md5 from "md5";
import { ClientOptions, fetch } from "@tauri-apps/plugin-http";
import { globalConfig } from "./utils/globalConfig.ts";

const store = new LazyStore('APIResponseCache', {
    // 不要持久化请求缓存
    autoSave: false
})

// 请求缓存
const CACHE_TIME = computed(() => globalConfig.value.requestCacheTime)

interface CachedJSONResponse<T> {
    cachedTime: number
    response: T
}


interface ExtraAPIFetchOptions {
    wbiSign?: boolean
    appSign?: boolean
    useCache?: boolean
    useCookie?: boolean
    debug?: {
        name: string
        extraParams?: Record<string, string>
    }
}

// 对URL搜索参数进行app签名，原地更新搜索参数
function paramsAppSign(params: URLSearchParams) {
    params.set('build', '8160400')
    // params.set('ts', Math.floor(Date.now() / 1000).toString())
    // 不使用正确的时间戳似乎也能过验证，为了避免缓存失效，这里直接使用固定时间戳
    params.set('ts', '1700000000')
    params.set('appkey', '1d8b6e7d45233436')

    const appSec = '560c52ccd288fed045859ed18bffd973'
    params.sort()

    params.set('sign', md5(params.toString() + appSec))
}

async function APIFetch<T>(url: URL | string, init?: RequestInit, extraOptions?: ExtraAPIFetchOptions): Promise<GeneralAPIResponse<T>> {
    const parsedURL = new URL(url)
    const getURLStr = () => parsedURL.toString()

    const { useCache, wbiSign, appSign, useCookie, debug: debugInfo } = {
        useCache: true,
        wbiSign: false,
        appSign: false,
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

    // app签名参数
    if (appSign) {
        paramsAppSign(parsedURL.searchParams)
    }

    if (useCache && await store.has(getURLStr())) {
        const cacheData = await store.get(getURLStr()) as CachedJSONResponse<T>
        if ((cacheData.cachedTime + CACHE_TIME.value) > Date.now()) {
            console.debug(`using cached ${getURLStr()}`)

            if (debugInfo) {
                setDebugInfo(debugInfo.name, parsedURL, JSON.stringify(cacheData.response, null, 2), debugInfo.extraParams)
            }
            return cacheData.response as GeneralAPIResponse<T>
        } else {
            await store.delete(getURLStr())
            console.debug(`expired cache ${getURLStr()}`)
        }
    }

    let cookie: string | undefined
    if (useCookie) {
        cookie = await getLoginCookie()
    }

    const options: RequestInit & ClientOptions = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
            // 无cookie时，填写这几个参数貌似也能过一些验证
            'Cookie': cookie ?? 'bili_ticket=1; b_nut=1; buvid3=1; buvid4=1',
            'Origin': 'https://www.bilibili.com',
        },
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

            if (debugInfo) {
                setDebugInfo(debugInfo.name, parsedURL, JSON.stringify(json, null, 2), debugInfo.extraParams)
            }
            throw {
                ...json,
                toString() {
                    return JSON.stringify(this)
                }
            }
        }
        break
    } while (retryCount < 1)

    if (debugInfo) {
        setDebugInfo(debugInfo.name, parsedURL, JSON.stringify(json, null, 2), debugInfo.extraParams)
    }

    if (useCache) {
        await store.set(getURLStr(), {
            cachedTime: Date.now(),
            response: json,
        })
        console.debug(`cached ${getURLStr()}`)
    }

    return json
}

async function clearAPICache() {
    await store.clear()
}

export { APIFetch, clearAPICache }