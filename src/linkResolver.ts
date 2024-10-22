import { router } from "./main.ts";

type Types = 'liveroom' | 'user' | 'dynamic' | 'video' | 'suit' | 'lottery'

function resolveText(text?: string): Types | null {
    if (text === null || text === undefined) return null
    if (URL.canParse(text)) {
        const url = new URL(text)
        if (/^https:\/\/live\.bilibili\.com\/\d+(\?.+)?$/.test(text)) {
            return 'liveroom'
        } else if (/^https:\/\/space\.bilibili\.com\/\d+(.+)?$/.test(text) || /^UID:\d+$/.test(text)) {
            return 'user'
        } else if (/^https:\/\/t\.bilibili\.com\/\d+(\?.+)?$/.test(text)
            || /^https:\/\/(www\.)?bilibili\.com\/opus\/\d+(\?.+)?$/.test(text)
        ) {
            return 'dynamic'
        } else if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)/.test(text)) {
            return 'video'
        } else if ('https://www.bilibili.com/blackboard/activity-Mz9T5bO5Q3.html' === text.split('?')[0]) {
            const id = url.searchParams.get('id')
            const type = url.searchParams.get('type')
            if (id != null && type != null) {
                if (type === 'suit') {
                    return 'suit'
                } else if (type === 'dlc') {
                    return 'lottery'
                }
            }
        } else if (text.split('?')[0] === 'https://www.bilibili.com/h5/mall/digital-card/home') {
            const actId = url.searchParams.get('act_id')
            if (/^\d+$/.test(actId ?? '')) {
                return 'lottery'
            }
        } else if (text.split('?')[0] === 'https://www.bilibili.com/h5/mall/equity-link/collect-home') {
            const itemId = url.searchParams.get('item_id')

            if (/^\d+$/.test(itemId ?? '')) {
                return 'suit'
            }
        } else if (text.split('?')[0] === 'https://www.bilibili.com/h5/mall/suit/detail') {
            const id = url.searchParams.get('id')
            if (id != null) {
                return 'suit'
            }
            return null
        }
    } else if (/^((av|AV)\d+|BV\w+)$/.test(text)) {
        return 'video'
    }
    return null
}

async function resolveB23Link(url: string): Promise<string | null> {
    const resp = await fetch(url)
    return resp.url
}

function resolveUID(text: string): string | null {
    let uid = ''
    if (resolveText(text) === 'user') {
        if (URL.canParse(text)) {
            uid = new URL(text).pathname.split('?')[0].split('/')[1]
        } else {
            uid = text.substring(4)
        }
    } else if (/^\d+$/.test(text)) {
        uid = text
    } else {
        return null
    }
    return uid
}

function resolveLiveroomID(text: string): string | null {
    let roomId: string
    if (resolveText(text) === 'liveroom') {
        roomId = new URL(text).pathname.substring(1).split('?')[0]
    } else if (/^\d+$/.test(text)) {
        roomId = text
    } else {
        return null
    }
    return roomId
}

function resolveDynamicID(text: string): string | null {
    if (resolveText(text) !== 'dynamic') {
        return null
    }

    let id: string
    if (/^https:\/\/t\.bilibili\.com\/\d+(\?.+)?$/.test(text)) {
        id = new URL(text).pathname.substring(1).split('?')[0]
    } else {
        // /新版动态 opus/id 类型
        id = new URL(text).pathname.substring(6).split('?')[0]
    }
    return id
}

function resolveAVBVID(text: string): string | null {
    if (resolveText(text) !== 'video') {
        return null
    }

    let id: string
    if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)/.test(text)) {
        id = new URL(text).pathname.substring(1).split('?')[0]
        if (id.startsWith('video/')) {
            id = id.substring(6).replace('/', '')
        } else {
            id = id.replace('/', '')
        }
    } else {
        id = text
    }
    return id
}

function resolveActID(text: string): string | null {
    if (resolveText(text) !== 'lottery') {
        return null
    }

    const url = new URL(text)
    return url.searchParams.get('id') ?? url.searchParams.get('act_id')
}

function resolveSuitID(text: string): string | null {
    if (resolveText(text) !== 'suit') {
        return null
    }

    const url = new URL(text)
    return url.searchParams.get('id') ?? url.searchParams.get('item_id')
}

// 根据输入内容自动跳转至指定处理界面，若输入无效则不进行操作
async function autoJump(input?: string, showMessage = false, typeOverride = ''): Promise<boolean> {
    if (input === undefined) return false

    let processedInput = input.trim()
    if (processedInput.startsWith('https://b23.tv/')) {
        const link = await resolveB23Link(processedInput)
        if (link === null) {
            if (showMessage) {
                ElMessage({
                    message: '请输入正确的b23短链接！',
                    type: 'error',
                })
            }
            return false
        }
        processedInput = link
    }

    const type = typeOverride.length > 0 ? typeOverride : resolveText(processedInput)
    if (type === null) return false
    if (type === 'user') {
        const uid = resolveUID(processedInput)
        if (uid === null) {
            if (showMessage) {
                ElMessage({
                    message: '请输入正确的用户空间链接或UID！',
                    type: 'error',
                })
            }
            return false
        }

        await router.push({ path: `/space/${uid}` })
        return true
    } else if (type === 'liveroom') {
        const roomId = resolveLiveroomID(processedInput)
        if (roomId === null) {
            if (showMessage) {
                ElMessage({
                    message: '请输入正确的直播间链接或直播间号！',
                    type: 'error'
                })
            }
            return false
        }

        await router.push({ path: `/liveroom/${roomId}` })
        return true
    } else if (type === 'dynamic') {
        const id = resolveDynamicID(processedInput)
        if (id === null) {
            if (showMessage) {
                ElMessage({
                    message: '请输入正确的动态链接！',
                    type: 'error',
                })
            }
            return false
        }
        await router.push({ path: `/dynamic/${id}` })
        return true
    } else if (type === 'video') {
        const id = resolveAVBVID(processedInput)
        if (id === null) {
            if (showMessage) {
                ElMessage({
                    message: '请输入正确的视频链接、BV号或AV号！',
                    type: 'error',
                })
            }
            return false
        }
        await router.push({ path: `/video/${id}` })
        return true
    } else if (type === 'lottery') {
        const id = resolveActID(processedInput)
        if (id === null) {
            if (showMessage) {
                ElMessage({
                    message: '请输入正确的收藏集链接！',
                    type: 'error',
                })
            }
            return false
        }

        await router.push({ path: '/lottery', query: { act_id: id } })
        return true
    } else if (type === 'suit') {
        const id = resolveSuitID(processedInput)
        if (id === null) {
            if (showMessage) {
                ElMessage({
                    message: '请输入正确的收藏集链接！',
                    type: 'error',
                })
            }
            return false
        }

        await router.push({ path: `/suit/${id}` })
        return true
    }
    return false
}

export {
    resolveText,
    resolveUID,
    resolveLiveroomID,
    resolveDynamicID,
    resolveAVBVID,
    resolveActID,
    resolveSuitID,
    autoJump,
}