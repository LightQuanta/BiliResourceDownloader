import { createStore, Store } from "@tauri-apps/plugin-store";

let internalStore: Store | null = null

const userLoggedIn = ref(false)

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
    userLoggedIn.value = true
}

async function getLoginCookie() {
    const store = await getLoginStore()
    return await store.get('cookie')
}

async function checkLoginState() {
    const cookie = await getLoginCookie()
    userLoggedIn.value = cookie !== null
    return userLoggedIn.value
}

async function clearLoginCookie() {
    const store = await getLoginStore()
    await store.clear()
    await store.save()
    userLoggedIn.value = false
}

export { saveLoginCookie, getLoginCookie, checkLoginState, clearLoginCookie, userLoggedIn }