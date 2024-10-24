import { BatchDownloadTask } from "./types.ts";
import { createStore, Store } from '@tauri-apps/plugin-store';
import { download } from "@tauri-apps/plugin-upload";
import { emitter } from "./main.ts";
import { sep } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

let internalStore: Store | null = null

const MAX_TASKS = 3

// todo!: 长时间运行可能存在对象过大内存占用
const taskDownloadFinishRecorder: Record<string, number> = {}

async function getDownloadStore() {
    if (internalStore === null) {
        internalStore = await createStore('downloadManager')
    }
    return internalStore
}

async function pushNewTask(task: BatchDownloadTask) {
    const store = await getDownloadStore()
    const tasks = (await store.get('tasks')) as BatchDownloadTask[]
    if (tasks === null) {
        await store.set('tasks', [task])
    } else {
        tasks.push(task)
        await store.set('tasks', tasks)
    }
}

let downloading = false

async function pauseDownload() {
    downloading = false
    await internalStore?.set('downloading', false)
}

async function clearDownload() {
    downloading = false
    const store = await getDownloadStore()
    await store.clear()
}

const concurrentCount = ref(0)
const subConcurrentCount = () => concurrentCount.value--

function enableDownloadScheduler() {
    return new Promise<() => void>((res) => {
        if (concurrentCount.value < MAX_TASKS) {
            concurrentCount.value++
            res(subConcurrentCount)
        } else {
            const unwatch = watch(() => concurrentCount.value, (n) => {
                if (n < MAX_TASKS) {
                    unwatch()
                    concurrentCount.value++
                    res(subConcurrentCount)
                }
            })
        }
    })
}

/**
 * 开始下载所有内容
 */
async function startDownload() {
    if (downloading) return
    downloading = true
    const store = await getDownloadStore()
    await store.set('downloading', true)
    try {
        while (downloading && await store.get('tasks') !== null) {
            const tasks = (await store.get('tasks')) as BatchDownloadTask[]
            if (tasks.length === 0) {
                downloading = false
                await store.set('downloading', false)
                break
            }

            const task = tasks[0]

            const { name, path, files } = task

            if (files.length === 0) {
                tasks.shift()
                await store.set('tasks', tasks)
                // 不能在这触发文件下载完成事件，因为此时文件只是进入了队列，没有真正下载完成，在下方 then 事件有触发
                continue
            }

            const file = files.shift()
            const header = new Map<string, string>()
            header.set('User-Agent', '111')
            // start
            const finalDirectory = `${path}${sep()}${file?.path ?? ''}`
                .split(sep())
                .slice(0, -1)
                .join(sep())

            await invoke('create_dir', { path: finalDirectory })

            // 调度器，检测当前放行下载数量，只有小于 3 时 object 对象才转为 fulfilled
            const endOperate = await enableDownloadScheduler()

            taskDownloadFinishRecorder[name] = taskDownloadFinishRecorder[name] ? taskDownloadFinishRecorder[name] + 1 : 1

            // 不进行 await 的原因是不能阻塞这个循环，download 方法会在下载文件完成后才转为 fulfilled
            download(file?.url ?? '',
                `${path}${sep()}${file?.path ?? ''}`,
                (downloadInfo) => {
                    emitter.emit('downloadProgress', { name, file, downloadInfo })
                }, header)
                .then(async () => {
                    endOperate()
                    emitter.emit('fileDownloadFinish', { name, file })
                    taskDownloadFinishRecorder[name] = taskDownloadFinishRecorder[name] ? taskDownloadFinishRecorder[name] - 1 : 0
                    if (taskDownloadFinishRecorder[name] === 0) {
                        emitter.emit('downloadFinish', { name })
                    }
                })
                .catch(e => {
                    console.error(e)
                    ElMessage({
                        message: `下载${file?.url}出错：${e}`,
                        type: 'error',
                    })
                })
            // 主动触发视图更新，不能放到 download then 里头，会触发错误的下载状态
            await store.set('tasks', tasks)
        }
    } catch (e) {
        console.error(e)
        ElMessage({
            message: `下载出错： ${e}`,
            type: 'error',
        })
        downloading = false
        await store.set('downloading', false)
    }
}

async function getAllDownloadTasks() {
    const store = await getDownloadStore()
    return (await store.get('tasks') ?? []) as BatchDownloadTask[]
}

export { getDownloadStore, pushNewTask, pauseDownload, clearDownload, startDownload, getAllDownloadTasks }