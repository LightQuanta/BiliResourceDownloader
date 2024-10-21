import md5 from 'md5'
import { useWbiStore } from '../store/useWbiStore';

const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig: string) =>
    mixinKeyEncTab
        .map((n) => orig[n])
        .join("")
        .slice(0, 32);

function handleQuery(
    params: Record<string, string | number | object>,
) {
    const curr_time = Math.round(Date.now() / 1000),
        chr_filter = /[!'()*]/g;

    Object.assign(params, { wts: curr_time }); // 添加 wts 字段
    // 按照 key 重排参数
    return Object.keys(params)
        .sort()
        .map((key) => {
            // 过滤 value 中的 "!'()*" 字符
            const value = params[key].toString().replace(chr_filter, "");
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join("&")
}

// 为请求参数进行 wbi 签名
export function encWbi(
    params: Record<string, string | number | object>,
    img_key: string,
    sub_key: string
) {
    const mixin_key = getMixinKey(img_key + sub_key)

    const query = handleQuery(params)

    const wbi_sign = md5(query + mixin_key); // 计算 w_rid

    return query + "&w_rid=" + wbi_sign;
}

/**
 * 根据请求参数获取 wbi 签名
 *
 * 该版本为 fetch 版本，假如 store 内无 wbi 签名, 则请求服务器进行获取
 *
 * @param params 请求参数
 * @returns wbi 签名
 */
export async function encWbiWithFetch(
    params: Record<string, string | number | object>,
) {
    const store = useWbiStore()
    if (!store.data) {
        await store.refreshWbi()
    }
    return encWbi(params, store.data.img_url, store.data.sub_url)
}

/**
 * 根据请求参数获取 wbi 签名
 *
 * **注意**: 假如 store 内无 wbi 签名, 则会直接返回序列化后的请求参数
 *
 * @param params 请求参数
 * @returns wbi 签名
 */
export function encWbiByStore(
    params: Record<string, string | number | object>,
) {
    // 返回缓存实例
    const store = useWbiStore()
    if (store.state === 'ready' || !store.data) {
        return handleQuery(params)
    }
    return encWbi(params, store.data.img_url, store.data.sub_url)
}
