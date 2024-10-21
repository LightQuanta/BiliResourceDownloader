import { createStore, Store } from "@tauri-apps/plugin-store";

let internalStore: Store | null = null

async function getWbiStore() {
  if (internalStore === null) {
    internalStore = await createStore('wbi.bin')
  }
  return internalStore
}

async function clearWbiStore() {
  const store = await getWbiStore()
  await store.clear()
  internalStore = null
}

async function getWbi() {
  const store = await getWbiStore()
  return await store.get('wbi') as WbiStore
}

async function setWbi(wbi: WbiStore) {
  const store = await getWbiStore()
  await store.set('wbi', wbi)
  await store.save()
}

export { getWbiStore, clearWbiStore, getWbi, setWbi }