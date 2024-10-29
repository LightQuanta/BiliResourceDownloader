import { LazyStore } from "@tauri-apps/plugin-store";
import { clearAPICache } from "../APIFetch.ts";

const store = new LazyStore('login.json')

const userLoggedIn = ref(false)

async function saveLoginCookie(cookie: string) {
    await store.set('cookie', cookie)
    await store.save()
    await clearAPICache()
    userLoggedIn.value = true
}

async function getLoginCookie() {
    return await store.get<string>('cookie')
}

async function checkLoginState() {
    const cookie = await getLoginCookie()
    userLoggedIn.value = (cookie?.length ?? 0) > 0
    return userLoggedIn.value
}

async function clearLoginCookie() {
    await store.clear()
    await store.save()
    await clearAPICache()
    userLoggedIn.value = false
}

export { saveLoginCookie, getLoginCookie, checkLoginState, clearLoginCookie, userLoggedIn }