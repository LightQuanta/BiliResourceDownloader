import { defineStore } from 'pinia'
import useWbi from './hooks/useWbi'

export const useWbiStore = defineStore('bilibili_wbi', () => {
    const {
        state,
        data,
        refreshWbi
    } = useWbi()

    refreshWbi()

    return {
        state,
        data,
        refreshWbi
    }
})
