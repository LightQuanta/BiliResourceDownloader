import { createStore, Store } from "@tauri-apps/plugin-store";
import { clearAPICache } from "../APIFetch.ts";

let internalStore: Store | null = null

const userLoggedIn = ref(false)

async function getLoginStore() {
    if (internalStore === null) {
        internalStore = await createStore('login.json')
    }
    return internalStore
}

async function saveLoginCookie(cookie: string) {
    const store = await getLoginStore()
    await store.set('cookie', cookie)
    await store.save()
    await clearAPICache()
    userLoggedIn.value = true
}

async function getLoginCookie() {
    const store = await getLoginStore()
    return await store.get('cookie') as string
}

async function checkLoginState() {
    const cookie = await getLoginCookie()
    userLoggedIn.value = (cookie?.length ?? 0) > 0
    return userLoggedIn.value
}

async function clearLoginCookie() {
    const store = await getLoginStore()
    await store.clear()
    await store.save()
    await clearAPICache()
    userLoggedIn.value = false
}

export { saveLoginCookie, getLoginCookie, checkLoginState, clearLoginCookie, userLoggedIn }