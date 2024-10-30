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
    // JSON存储的收藏集不同等级头像框信息
    collector_medal_info: string

    // 收藏集组简介
    product_introduce: string
}

interface MedalInfo {
    level: number
    score: number
    image: string
    num_color: string
    card_count: number
    scene_image: Record<string, string>
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

    // 开售时间
    sale_time_begin: number

    type: "ip"
}

enum SuitPartType {
    // 头像框
    pendant = 1,
    // 点赞动画
    thumbUp = 3,
    // 完整装扮信息
    suit = 6,
    // 主题
    skin = 9,
    // 加载动画
    loading = 10,
    // 进度条
    playIcon = 11,
}

interface GeneralSuitItem<T> {
    item_id: number
    name: string
    properties: T
}

interface SuitCardProperties {
    // 粉丝牌颜色？
    fan_no_color: string
    // 粉丝牌背景图
    fans_image: string
    // 粉丝牌背景图？
    image: string
    // 粉丝牌背景图（小）？
    image_preview_small?: string
}

interface SuitCardBGProperties {
    // 粉丝牌颜色？
    fan_no_color: string
    // 评论背景
    image: string
    // 评论背景预览
    image_preview_small: string
}

interface SuitEmojiPackageProperties {
    // 表情包代表图？
    image: string
    // 表情包列表（JSON，{ name: string, image: string }[]）
    item_emoji_list: string
}

interface SuitLoadingProperties {
    image_preview_small: string
    // 逐帧加载动画
    loading_frame_url: string
    // 动图加载动画
    loading_url: string
}

interface SuitPlayIconProperties {
    // 拖动动画，lottie的JSON格式文本
    drag_icon?: string
    // 抬起动画，lottie的JSON格式文本（似乎没用）
    icon?: string

    // 这三个图非动画进度条才有
    drag_left_png?: string
    drag_right_png?: string
    middle_png?: string

    squared_image: string
    static_icon_image: string
}

interface SuitSkinProperties {
    // 皮肤压缩包md5
    package_md5: string
    // 皮肤压缩包链接
    package_url: string

    head_bg: string
    head_myself_mp4_bg: string
    head_myself_squared_bg: string
    head_tab_bg: string
    tail_bg: string
    tail_icon_channel: string
    tail_icon_dynamic: string
    tail_icon_main: string
    tail_icon_myself: string
    tail_icon_pub_btn_bg: string
    tail_icon_selected_channel: string
    tail_icon_selected_dynamic: string
    tail_icon_selected_main: string
    tail_icon_selected_myself: string
    tail_icon_selected_pub_btn_bg: string
    tail_icon_selected_shop: string
    tail_icon_shop: string
}

interface SuitSpaceBGProperties {
    goods_type: 'suit'

    /**
     * cnm这怎么标注类型
     *
     *  空间背景图（完整）
     *  image1_landscape: string
     *  空间背景图（肖像）
     *  image1_portrait: string
     */
    [K: string]: string
}

interface SuitThumbUpProperties {

    // SVGA格式点赞动画
    image_ani: string
    image_ani_cut: string
    // 点赞动画预览图？
    image_preview: string
}

interface SuitPendantProperties {
    // 头像框效果演示图
    garb_avatar: string
    // 头像框
    image: string
}

// https://api.bilibili.com/x/garb/v2/user/suit/benefit?item_id=${SuitID}
interface SuitDetail {
    name: string
    part_id: SuitPartType
    properties?: SuitProperties
    // 销售类型，pay、vip等
    biz_sale_type: string
    // 当前状态，active、inactive等
    state: string
    suit_items: {
        // 粉丝牌背景（动态右上角那个）
        card?: GeneralSuitItem<SuitCardProperties>[]
        card_bg?: GeneralSuitItem<SuitCardBGProperties>[]
        // 为什么这b数据在直接请求装扮部分时可以是任何东西？
        emoji_package?: (GeneralSuitItem<SuitEmojiPackageProperties | unknown> & {
            items: {
                // [XXX_xxx]格式
                name: string
                properties: {
                    image: string
                }
            }[]
        })[]
        // 获取收藏集表情信息时用
        emoji?: GeneralSuitItem<{ image: string }>[]

        // 加载动画
        loading?: GeneralSuitItem<SuitLoadingProperties>[]
        // 进度条
        play_icon?: GeneralSuitItem<SuitPlayIconProperties>[]
        // 各种乱七八糟的皮肤图片
        skin?: GeneralSuitItem<SuitSkinProperties>[]
        // 空间背景图
        space_bg?: GeneralSuitItem<SuitSpaceBGProperties>[]
        // 点赞动画
        thumbup?: GeneralSuitItem<SuitThumbUpProperties>[]
        // 头像框
        pendant?: GeneralSuitItem<SuitPendantProperties>[]
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

interface RedeemInfo {
    collect_id: number

    start_time: number
    end_time: number

    redeem_item_type: number
    // 重要，可使用装扮API获取信息
    redeem_item_id: string

    // 描述
    redeem_text: string
    // 名称
    redeem_item_name: string
    // 相关图片
    redeem_item_image: string

    card_item: {
        /** 典藏卡信息？
         * redeem_item_type = 1
         */
        card_type_info?: {
            id: number
            name: string
            // 图片链接
            overview_image: string
            content: {
                animation: {
                    // 视频链接（取[0]即可）
                    animation_video_urls: string[]
                }
            }
        }
    }

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

/** https://api.bilibili.com/x/vas/dlc_act/asset_bag?act_id=279
 * 一个可以获得停售收藏集和抽卡概率信息的神秘API
 */
interface LotteryBagAssetsInfo {
    item_list: {
        item_type: 1
        card_item: LotteryCardInfo & {
            total_cnt: number
            // 抽出概率（万分之一）
            holding_rate: number
        }
    }[]
    // 所有收藏集列表，可以获得已经停售的
    lottery_simple_list: {
        lottery_id: number
        lottery_name: string
    }[]
}

interface BatchDownloadTask {
    name: string
    path?: string
    files: {
        path: string
        url: string
        // 文件后缀，留空则从URL中自动推断
        extension?: string
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
                        height: number
                        width: number
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

/**
 * https://app.bilibili.com/x/v2/space
 * 需要app签名
 */
interface ExtremelyDetailedUserInfo {
    card: {
        mid: string
        name: string
        face: string
        sign: string

        fans: number
        attention: number

        pendant: PendantInfo
        pendant_url: string

        // 获赞
        likes: {
            like_num: number
        }

        // 佩戴粉丝牌信息
        live_fans_wearing: {
            level: number
            medal_name: string
            medal_jump_url: string
        }

        space_tag: {
            type: string
            title: string
        }[]
    }

    // app端各种主页背景图
    images: {
        // app端主页背景图
        imgUrl: string
        // 可能是夜间模式背景图？
        night_imgurl: string

        // 似乎是收藏集等背景图
        collection_top_simple: {
            top: {
                result?: {
                    title: {
                        title: string
                        // 编号？
                        sub_title: string
                    }
                    extra: {
                        detail_jump_url: string
                    }
                    cover: string
                }[]
            }
        }
    }

    live: {
        roomid: number
        title: string
    }

    // 投稿
    archive: {
        item: {
            title: string
            cover: string
            // av号，纯数字格式
            param: string
        }[]
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
        item_id?: number
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

// https://api.bilibili.com/x/web-interface/view
interface BasicVideoInfo {
    bvid: string
    aid: number
    // 分区
    tname: string
    title: string
    pic: string
    // 发布时间
    pubdate: number
    // 投稿时间
    ctime: number
    // 简介
    desc: string
// UP信息
    owner: {
        mid: number
        name: string
        face: string
    }
    stat: {
        view: number
        danmaku: number
        reply: number
        favorite: number
        coin: number
        share: number
        like: number
    }
    // 视频动态简介
    dynamic: string

    staff?: {
        mid: number
        name: string
        title: string
        face: string
    }[]
}

interface TypedSearchResultGroup {
    result_type: string
    data: SearchResultItem[]
}

interface SearchResultItem {
    type: string
}

interface BiliUserSearchResultItem extends SearchResultItem {
    type: 'bili_user'
    mid: number
    uname: string
    usign: string
    // 头像，注：无 https: 前缀
    upic: string
}

interface VideoSearchResultItem extends SearchResultItem {
    type: 'video'
    aid: number
    bvid: string
    title: string
    // 封面，注：无 https: 前缀
    pic: string
    description: string
    // 逗号分隔tag
    tag: string
}

// https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=${keyword}
interface GeneralSearchResult {
    result: TypedSearchResultGroup[]
    numPages: number
}


// https://api.bilibili.com/x/web-interface/wbi/search/type?search_type=${type}&keyword=${keyword}
interface TypedSearchResult {
    result: SearchResultItem[]
    numPages: number
}

// https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=${uid}
// 需要登录或wbi签名
interface UserDynamicList {
    has_more: boolean
    items: DynamicInfo[]
    offset: string
}

export { SuitPartType }

export type {
    GeneralAPIResponse,
    BiliResourceDownloadEventEmitter,
    GarbSearchResult,
    LotteryProperties,
    LotteryDetail,
    RedeemInfo,
    LotteryCardInfo,
    LotteryBagAssetsInfo,
    ActInfo,
    MedalInfo,
    LotteryInfo,
    SuitProperties,
    SuitDetail,
    GeneralSuitItem,
    SuitSpaceBGProperties,
    SuitThumbUpProperties,
    SuitPendantProperties,
    SuitCardProperties,
    SuitSkinProperties,
    SuitPlayIconProperties,
    SuitLoadingProperties,
    SuitEmojiPackageProperties,
    SuitCardBGProperties,
    BatchDownloadTask,
    DynamicInfo,
    DynamicTypes,
    TopicInfo,
    DynamicStat,
    RichTextNode,
    EmojiTextNode,
    VideoTextNode,
    AtTextNode,
    PendantInfo,
    BasicUserInfo,
    ExtremelyDetailedUserInfo,
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
    BasicVideoInfo,
    GeneralSearchResult,
    TypedSearchResult,
    TypedSearchResultGroup,
    BiliUserSearchResultItem,
    VideoSearchResultItem,
    UserDynamicList,
}