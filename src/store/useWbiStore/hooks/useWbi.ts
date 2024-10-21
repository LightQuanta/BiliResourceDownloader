import { getWbiKeys } from "../api"
import { getWbi } from "../internal"

// 1h
const CACHE_TIME = 60 * 60 * 1000

export default function useWbi() {
    const state = ref<HookState>('ready')
    const errMsg = ref('')
    const data = ref<WbiStore>()

    // todo!: 增加刷新错误处理
    function refreshWbi() {
        state.value = 'pending'
        return getWbiKeys().then((keys) => {
            data.value = {
                img_url: keys.img_key,
                sub_url: keys.sub_key,
                w_webid: keys.w_webid,
                last_update: Date.now()
            }
            state.value = 'ok'
        }).catch((e) => {
            errMsg.value = e
            state.value = 'error'
        })
    }

    getWbi().then((v) => {
        if (v) {
            data.value = v
            if (v.last_update + CACHE_TIME > Date.now()) {
                state.value = 'ok'
            }
            else {
                refreshWbi()
            }
        }
        else {
            refreshWbi()
        }
    })

    return {
        state,
        data,
        errMsg,
        refreshWbi
    }
}
