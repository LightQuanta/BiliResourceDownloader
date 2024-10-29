import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore('wbi.bin')

async function clearWbiStore() {
    await store.clear()
}

async function getWbi() {
    return await store.get<WbiStore>('wbi')
}

async function setWbi(wbi: WbiStore) {
    await store.set('wbi', wbi)
    await store.save()
}

export { clearWbiStore, getWbi, setWbi }