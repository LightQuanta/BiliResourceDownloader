import { getWbiKeys } from "../api"

export default function useWbi() {
    const state = ref<HookState>('ready')
    const data = ref<{
        img_url: string
        sub_url: string
    }>()

    // todo!: 增加刷新错误处理
    function refreshWbi(sessionData?: string) {
        state.value = 'pending'
        return getWbiKeys(sessionData).then((keys) => {
            data.value = {
                img_url: `https://wbi.biliapi.net/img/${keys.img_key}.jpg`,
                sub_url: `https://wbi.biliapi.net/sub/${keys.sub_key}.jpg`
            }
            state.value = 'ok'
        }).catch(() => {
            state.value = 'error'
        })
    }

    return {
        state,
        data,
        refreshWbi
    }
}
