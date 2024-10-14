import { BatchDownloadTask } from "./types.ts";
import { createStore } from '@tauri-apps/plugin-store';
import { download } from "@tauri-apps/plugin-upload";
import { emitter } from "./main.ts";

const store = await createStore('download')

async function pushNewTask(task: BatchDownloadTask) {
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
    await store.clear()
}

async function startDownload() {
    if (downloading) return
    downloading = true
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

                emitter.emit('downloadFinish', { name })
                await store.set('tasks', tasks)
                continue
            }

            const file = files.shift()!
            const header = new Map<string, string>()
            header.set('User-Agent', '111')

            await download(file.url,
                `${path}/${file.name}`,
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
    }
}

async function getAllDownloadTasks() {
    return await store.get('tasks') as BatchDownloadTask[]
}

export { pushNewTask, pauseDownload, clearDownload, startDownload, getAllDownloadTasks }