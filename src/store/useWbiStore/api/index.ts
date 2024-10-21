// 获取最新的 img_key 和 sub_key
export async function getWbiKeys() {
    const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            Referer: 'https://www.bilibili.com/'
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

    const htmlResp = await fetch('https://space.bilibili.com/1',).then(d => d.text())
    const regex = /<script id="__RENDER_DATA__" type="application\/json">([^<]+)<\/script>/

    // 你是渲染数据吗？我觉得我是
    const renderData = JSON.parse(decodeURIComponent(htmlResp.match(regex)?.[1] ?? '')) as { access_id: string }

    return {
        img_key: img_url.slice(
            img_url.lastIndexOf('/') + 1,
            img_url.lastIndexOf('.')
        ),
        sub_key: sub_url.slice(
            sub_url.lastIndexOf('/') + 1,
            sub_url.lastIndexOf('.')
        ),
        w_webid: renderData.access_id
    }
}
