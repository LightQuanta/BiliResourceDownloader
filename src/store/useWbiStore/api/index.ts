// 获取最新的 img_key 和 sub_key
export async function getWbiKeys(SESSDATA = "") {
    const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
        headers: {
            // SESSDATA 字段
            Cookie: `SESSDATA=${SESSDATA}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            Referer: 'https://www.bilibili.com/'//对于直接浏览器调用可能不适用
        }
    })
    const {
        data: {
            wbi_img: { img_url, sub_url },
        },
    } = (await res.json()) as {
        data: {
            wbi_img: { img_url: string; sub_url: string };
        };
    };

    return {
        img_key: img_url.slice(
            img_url.lastIndexOf('/') + 1,
            img_url.lastIndexOf('.')
        ),
        sub_key: sub_url.slice(
            sub_url.lastIndexOf('/') + 1,
            sub_url.lastIndexOf('.')
        )
    }
}
