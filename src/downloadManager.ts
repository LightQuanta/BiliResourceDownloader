import { BatchDownloadTask } from "./types.ts";
import { createStore, Store } from '@tauri-apps/plugin-store';
import { download } from "@tauri-apps/plugin-upload";
import { emitter } from "./main.ts";
import { sep } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

let internalStore: Store | null = null

async function getStore() {
    if (internalStore === null) {
        internalStore = await createStore('downloadManager')
    }
    return internalStore
}

async function pushNewTask(task: BatchDownloadTask) {
    const store = await getStore()
    const tasks = (await store.get('tasks')) as BatchDownloadTask[]
    if (tasks === null) {
        await store.set('tasks', [task])
    } else {
        tasks.push(task)
        await store.set('tasks', tasks)
    }
}

let downloading = false

function pauseDownload() {
    downloading = false
}

async function clearDownload() {
    downloading = false
    const store = await getStore()
    await store.clear()
}

async function startDownload() {
    if (downloading) return
    downloading = true
    const store = await getStore()
    try {
        while (downloading && await store.get('tasks') !== null) {
            const tasks = (await store.get('tasks')) as BatchDownloadTask[]
            if (tasks.length === 0) {
                downloading = false
                break
            }

            const task = tasks[0]

            const { name, path, files } = task

            if (files.length === 0) {
                tasks.shift()
                await store.set('tasks', tasks)
                emitter.emit('downloadFinish', { name })
                continue
            }

            const file = files.shift()!
            const header = new Map<string, string>()
            header.set('User-Agent', '111')

            const finalDirectory = `${path}${sep()}${file.name}`
                .split(sep())
                .slice(0, -1)
                .join(sep())

            await invoke('create_dir', { path: finalDirectory })

            console.log(`${path}${sep()}${file.name}`)

            await download(file.url,
                `${path}${sep()}${file.name}`,
                (downloadInfo) => {
                    emitter.emit('downloadProgress', { name, file, downloadInfo })
                }, header)

            emitter.emit('fileDownloadFinish', { name, file })

            await store.set('tasks', tasks)
        }
    } catch (e) {
        console.error(e)
        ElMessage({
            message: `下载出错： ${e}`,
            type: 'error',
        })
        downloading = false
    }
}

async function getAllDownloadTasks() {
    const store = await getStore()
    return (await store.get('tasks') ?? []) as BatchDownloadTask[]
}

export { pushNewTask, pauseDownload, clearDownload, startDownload, getAllDownloadTasks }