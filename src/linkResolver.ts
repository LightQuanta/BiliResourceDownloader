type Types = 'liveroom' | 'user' | 'dynamic' | 'video' | 'suit' | 'lottery'

function resolveText(text: string): Types | null {
    if (URL.canParse(text)) {
        const url = new URL(text)!
        if (/^https:\/\/live\.bilibili\.com\/\d+(\?.+)?$/.test(text)) {
            return 'liveroom'
        } else if (/^https:\/\/space\.bilibili\.com\/\d+(\?.+)?$/.test(text) || /^UID:\d+$/.test(text)) {
            return 'user'
        } else if (/^https:\/\/t\.bilibili\.com\/\d+(\?.+)?$/.test(text)
            || /^https:\/\/(www\.)?bilibili\.com\/opus\/\d+(\?.+)?$/.test(text)
        ) {
            return 'dynamic'
        } else if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)(\?.+)?$/.test(text)) {
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
            if (/^\d+$/.test(actId)) {
                return 'lottery'
            }
        } else if (text.split('?')[0] === 'https://www.bilibili.com/h5/mall/equity-link/collect-home') {
            const itemId = url.searchParams.get('item_id')
            const part = url.searchParams.get('part')

            if (/^\d+$/.test(itemId) && part === 'card') {
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

function resolveUID(text: string): string | null {
    let uid = ''
    if (resolveText(text) === 'user') {
        if (URL.canParse(text)) {
            uid = URL.parse(text)!.pathname
        } else {
            uid = text.substring(4).split('?')[0]
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
        roomId = URL.parse(text)!.pathname.substring(1).split('?')[0]
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
        id = URL.parse(text)!.pathname.substring(1).split('?')[0]
    } else {
        // /新版动态 opus/id 类型
        id = URL.parse(text)!.pathname.substring(6).split('?')[0]
    }
    return id
}

function resolveAVBVID(text: string): string | null {
    if (resolveText(text) !== 'video') {
        return null
    }

    let id: string
    if (/^https:\/\/(www\.)?bilibili\.com\/(video\/)?((av|AV)\d+|BV\w+)(\?.+)?$/.test(text)) {
        id = URL.parse(text)!.pathname.substring(1).split('?')[0]
        if (id.startsWith('video/')) {
            id = id.substring(6).replaceAll('/', '')
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

    const url = URL.parse(text)!
    return url.searchParams.get('id') ?? url.searchParams.get('act_id')!
}

function resolveSuitID(text: string): string | null {
    if (resolveText(text) !== 'suit') {
        return null
    }

    const url = URL.parse(text)!
    return url.searchParams.get('id') ?? url.searchParams.get('item_id')
}

export {
    resolveText,
    resolveUID,
    resolveLiveroomID,
    resolveDynamicID,
    resolveAVBVID,
    resolveActID,
    resolveSuitID
}