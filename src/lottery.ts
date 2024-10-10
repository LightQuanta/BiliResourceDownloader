interface LotteryInfo {
    item_id: number
    name: string
    properties: {
        dlc_act_id: number
        dlc_lottery_id: number
        dlc_lottery_sale_quantity: number
        image_cover: string
        type: "dlc_act"
    }
    jump_link: string
}

interface LotteryDetail {
    lottery_id: number
    name: string
    item_list: ItemInfo[]
}

interface ItemInfo {
    item_type: 1
    card_info: LotteryCardInfo
}

interface LotteryCardInfo {
    card_type_id: number
    card_name: string

    card_scarcity: number

    card_img: string
    video_list?: string[]

    card_img_download: string
    video_list_download?: string[]
}

export type { LotteryInfo, LotteryDetail, LotteryCardInfo }