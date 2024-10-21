import { getWbiKeys } from "../api"

export default function useWbi() {
    const state = ref<HookState>('ready')
    const errMsg = ref('')
    const data = ref<{
        img_url: string
        sub_url: string
        w_webid: string
    }>()

    // todo!: 增加刷新错误处理
    function refreshWbi(sessionData?: string) {
        state.value = 'pending'
        return getWbiKeys(sessionData).then((keys) => {
            data.value = {
                img_url: keys.img_key,
                sub_url: keys.sub_key,
                w_webid: keys.w_webid,
            }
            state.value = 'ok'
        }).catch((e) => {
            errMsg.value = e
            state.value = 'error'
        })
    }

    return {
        state,
        data,
        errMsg,
        refreshWbi
    }
}
