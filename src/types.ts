interface GeneralAPIResponse<T> {
    code: number
    message: string
    data: T
}

interface GarbSearchResult<T extends LotteryProperties | SuitProperties> {
    // 神秘ID，貌似是装扮专用
    item_id: number
    // 名称
    name: string
    // 装扮/收藏集网页端跳转链接
    jump_link: string
    // 销量文本描述
    sale_count_desc: string
    properties: T
}

interface LotteryProperties {
    dlc_act_id: number
    dlc_lottery_id: number

    // 销量
    dlc_lottery_sale_quantity: number
    image_cover: string

    dlc_sale_start_time: string
    dlc_sale_end_time: string

    type: "dlc_act"
}

interface ActInfo {
    act_title: string

    start_time: number
    end_time: number

    lottery_list: LotteryInfo[]
    related_mids: string[]
    related_user_infos: Record<string, {
        uid: string
        nickname: string
        avatar: string
    }>
}

interface LotteryInfo {
    lottery_id: number
    lottery_name: string
    lottery_image: string
    total_sale_amount: number

    start_time: number
    end_time: number
}

interface SuitProperties {
    // 描述
    desc: string

    // 装扮API所需ID
    fan_id: string
    // 装扮所属者UID
    fan_mid: string

    // 我是xxx的xxx号装扮的背景图
    fan_share_image: string
    // 装扮本身背景图
    image_cover: string

    type: "ip"
}

interface SuitDetail {
    properties: SuitProperties
    suit_items: {
        card: {
            name: string
            properties: {
                // 粉丝牌颜色？
                fan_no_color: string
                // 粉丝牌背景图
                fans_image: string
                // 粉丝牌背景图？
                image: string
                // 粉丝牌背景图（小）？
                image_preview_small?: string
            }
        }[]
        card_bg: {
            name: string
            properties: {
                // 粉丝牌颜色？
                fan_no_color: string
                // 评论背景
                image: string
                // 评论背景预览
                image_preview_small: string
            }
        }[]
        emoji_package: {
            name: string
            properties: {
                // 表情包代表图？
                image: string
                // 表情包列表（JSON，{ name: string, image: string }[]）
                item_emoji_list: string
            }
            // 表情表列表（详细信息）
            items: {
                // 表情表名称（即评论区触发关键词，[xxx_xxx]）
                name: string
                properties: {
                    // 表情包图片链接
                    image: string
                    sale_type: string
                }
            }[]
        }[]
        loading: {
            name: string
            properties: {
                image_preview_small: string
                // 逐帧加载动画
                loading_frame_url: string
                // 动图加载动画
                loading_url: string
            }
        }[]
        // 进度条
        play_icon: {
            name: string
            properties: {
                drag_left_png: string
                drag_right_png: string
                middle_png: string
                squared_image: string
                static_icon_image: string
            }
        }[]
        skin: {
            name: string
            properties: {
                // 这边的属性敢不敢更多点？
                // 谁爱标谁标，反正我不愿意标

                // head_bg: string
                // // 背景视频
                // head_myself_mp4_bg: string

                // 皮肤压缩包md5
                package_md5: string
                // 皮肤压缩包链接
                package_url: string

                // 下略
            }
        }[]
        space_bg: {
            name: string
            /**
             * cnm这怎么标注类型
             *
             *  空间背景图（完整）
             *  image1_landscape: string
             *  空间背景图（肖像）
             *  image1_portrait: string
             */
            properties: Record<string, string>

        }
        thumbup: {
            name: string
            properties: {
                // 这是个啥？？？
                image_ani: string
                // 这是个啥？？？？？
                image_ani_cut: string
                // 点赞动画预览图？
                image_preview: string
            }
        }[]

        // 装扮拥有者信息
        fan_user: {
            // UID
            mid: string
            // 名称
            nickname: string
            // 头像
            avatar: string
        }
    }
    buy_link: string
}

interface LotteryDetail {
    lottery_id: number
    name: string
    item_list: {
        item_type: 1
        card_info: LotteryCardInfo
    }[]
    collect_list: {
        collect_infos: RedeemInfo[]
        collect_chain: RedeemInfo[]
    }
}

// TODO 这里会有表情包、头像框等信息，等个解析
interface RedeemInfo {
    collect_id: number

    start_time: number
    end_time: number

    // 描述
    redeem_text: string
    // 名称
    redeem_item_name: string
    // 相关图片
    redeem_item_image: string

    jump_url: string
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

interface BatchDownloadTask {
    name: string
    path?: string
    files: {
        path: string
        url: string
        percentage?: number
        total?: number
    }[]
}

interface DynamicInfo {
    basic: {
        comment_id_str: string
        comment_type: number
        jump_url: string
        rid_str: string
    }
    id_str: string
    modules: {
        module_author: {
            name: string
            // 头像
            face: string
            mid: number

            decorate?: {
                card_url: string
                name: string
                fan: {
                    color: string
                    is_fan: boolean
                    num_prefix: string
                    num_str: string
                    number: number
                }
                jump_url: string
            }

            // 头像框？
            pendant: PendantInfo

            // 发布时间（文本）
            pub_time: string
            // 发布时间戳
            pub_ts: number

        }
        module_dynamic: {
            desc?: {
                rich_text_nodes: RichTextNode[]
                text: string
            }
            major?: {
                // 动态内容
                opus: {
                    pics?: {
                        url: string
                    }[]
                    summary: {
                        rich_text_nodes: RichTextNode[]
                        text: string
                    }
                    title?: string
                }
                // 动态话题
                topic?: TopicInfo
                // 视频动态原视频信息？
                archive: {
                    aid: string
                    bvid: string
                    cover: string
                    desc: string
                    duration_text: string
                    title: string
                }
                type: string
            }
            topic?: {
                id: number
                jump_url: string
                name: string
            }
        }
        module_stat: {
            comment: DynamicStat
            forward: DynamicStat
            like: DynamicStat
        }
    }
    // 转发动态的原动态信息
    orig?: DynamicInfo
    type: DynamicTypes
}

// 参考https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/dynamic/dynamic_enum.md
type DynamicTypes =
    'DYNAMIC_TYPE_WORD'
    | 'DYNAMIC_TYPE_DRAW'
    | 'DYNAMIC_TYPE_AV'
    | 'DYNAMIC_TYPE_FORWARD'
    | 'DYNAMIC_TYPE_ARTICLE'
    | 'DYNAMIC_TYPE_LIVE'
    | 'DYNAMIC_TYPE_LIVE_RCMD'

interface TopicInfo {
    id: number
    jump_url: string
    name: string
}

interface DynamicStat {
    count: number
    forbidden: boolean
}

interface RichTextNode {
    orig_text: string
    text: string
    type: string
}

interface EmojiTextNode extends RichTextNode {
    emoji: {
        icon_url: string
    }
    type: 'RICH_TEXT_NODE_TYPE_EMOJI'
}

interface VideoTextNode extends RichTextNode {
    jump_url: string
    type: 'RICH_TEXT_NODE_TYPE_WEB'
}

interface AtTextNode extends RichTextNode {
    rid: string
    type: 'RICH_TEXT_NODE_TYPE_AT'
}

type BiliResourceDownloadEventEmitter = {
    // preset events
} & Record<string, unknown>;

// https://api.bilibili.com/x/web-interface/card?mid=${mid}
interface BasicUserInfo {
    card: {
        mid: string
        name: string
        face: string
        sex: string

        // 关注数？
        friend: number
        // 关注数
        attention: number
        // 粉丝数
        fans: number
        // 签名
        sign: string

        birthday: string

        // 头像框
        pendant: PendantInfo

        official: {
            role: number
            title: string
            desc: string
            type: number
        }
        official_verify: {
            type: number
            desc: string
        }
    }
    // 粉丝数
    follower: number
    // 获赞数
    like_num: number

    // 网页端空间背景图（需要参数photo=true）
    space: {
        s_img: string
        l_img: string
    }
}


// 头像框信息
interface PendantInfo {
    pid: number
    name: string
    image: string
    // 推荐使用这个
    image_enhance: string
    // 重要，可用此ID从装扮API处获取跳转链接
    n_pid: number
}

// https://api.live.bilibili.com/live_user/v1/Master/info?uid=${uid}
interface BasicLiveUserInfo {
    info: {
        uid: number
        uname: string
        face: string
    }
    // 粉丝数
    follower_num: number
    // 直播间号
    room_id: number
    // 粉丝牌
    medal_name: string

    // 房间公告
    room_news: {
        content: string
        ctime: string
        ctime_text: string
    }
}

// https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${liveroomID}
interface BasicRoomInfo {
    // 用户UID
    uid: number
    // 直播间号
    room_id: number

    // 直播间标题
    title: string
    // 直播间简介
    description: string

    // 背景图
    background: string
    // 直播间封面
    user_cover: string
    // 直播间关键帧（开播时才有）
    keyframe: string

    // 直播间分区名称
    area_name: string
    // 直播间Tag（逗号分隔）
    tags: string
}

interface EmojiPackages {
    user_panel_packages: EmojiPackageInfo[]
    all_packages: EmojiPackageInfo[]

}

// 参考https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/emoji/list.md
interface EmojiPackageInfo {
    // 表情包组ID
    id: number
    // 表情包组名称
    text: string
    // 封面图片链接
    url: string
    // 创建时间？
    mtime: number
    // 1:普通 2:会员专属 3:购买所得 4:颜文字
    type: 1 | 2 | 3 | 4
    attr: number
    meta: {
        size: 1 | 2
        // 购买ID
        item_id: number
        // 购买链接
        item_url?: string
    }
    flags: {
        added: boolean
        preview: boolean
    }
    label?: string
    package_sub_title: string
    ref_mid: number
    resource_type: number
}

interface EmojiPackageDetail extends EmojiPackageInfo {
    type: number
    emote: EmoteInfo[]
}

interface EmoteInfo {
    // 表情本身ID（好像没啥用）
    id: number
    // 所属表情表ID
    package_id: number
    // 显示文本（[XXX_xxx]格式）
    text: string
    // 图片链接
    url: string
    meta: {
        size: number
        // 表情名称？
        alias?: string
    }
    flags: {
        no_access: boolean
        unlocked: boolean
    }
}

/** 充电权益
 *
 *  https://api.bilibili.com/x/upowerv2/gw/rights/index?up_mid=${mid}
 */
interface PowerRights {
    privilege_rights: Record<string, {
        emote?: {
            type: 'emote'
            num: number
            emojis: ChargeEmojiInfo[]
        }
    }>
}

interface ChargeEmojiInfo {
    id: number
    name: string
    icon: string
}

// https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id=${roomID}
interface LiveroomEmojiListInfo {
    emoticons: LiveroomEmojiInfo[]
    pkg_id: number
    pkg_name: string
}

interface LiveroomEmojiInfo {
    // 表情包名称
    emoji: string
    url: string
    // 解锁条件
    unlock_show_text: string
    // 表情包识别名称？
    emoticon_unique: string
}

export type {
    GeneralAPIResponse,
    BiliResourceDownloadEventEmitter,
    GarbSearchResult,
    LotteryProperties,
    LotteryDetail,
    LotteryCardInfo,
    ActInfo,
    LotteryInfo,
    SuitProperties,
    SuitDetail,
    BatchDownloadTask,
    DynamicInfo,
    DynamicTypes,
    TopicInfo,
    DynamicStat,
    RichTextNode,
    EmojiTextNode,
    VideoTextNode,
    AtTextNode,
    BasicUserInfo,
    BasicLiveUserInfo,
    BasicRoomInfo,
    EmojiPackages,
    EmojiPackageInfo,
    EmojiPackageDetail,
    EmoteInfo,
    PowerRights,
    ChargeEmojiInfo,
    LiveroomEmojiListInfo,
    LiveroomEmojiInfo,
}