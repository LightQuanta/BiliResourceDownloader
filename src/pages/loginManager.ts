import { createStore, Store } from "@tauri-apps/plugin-store";

let internalStore: Store | null = null

async function getLoginStore() {
    if (internalStore === null) {
        internalStore = await createStore('login.bin')
    }
    return internalStore
}

async function saveLoginCookie(cookie: string) {
    const store = await getLoginStore()
    await store.set('cookie', cookie)
    await store.save()
}

async function getLoginCookie() {
    const store = await getLoginStore()
    return await store.get('cookie')
}

async function loggedIn() {
    const cookie = await getLoginCookie()
    return cookie !== null
}

async function clearLoginCookie() {
    const store = await getLoginStore()
    await store.clear()
    await store.save()
}

export { saveLoginCookie, getLoginCookie, loggedIn, clearLoginCookie }