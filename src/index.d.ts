namespace WBCNBot {
    export interface PageGlobals {
        data: Data;
        config: Config;
        performance: Performance;
    }

    export interface WeiboStatus extends Status { };

    export interface WeiboLocals {
        /** link to original weibo */
        url: string;
        /** for debug propose only */
        keep: boolean;
        id: string;
        mid: string;
        type: 'text' | 'picture' | 'video' | 'article';
        user: {
            id: number;
            name: string;
            avatar: string;
        };
        time: Date;
        content: {
            html: string;
            text: string;
        };
        thumbnail?: string[];
        video?: string[];
        picture?: string[];
        retweet?: WeiboLocals;
    }
}

interface Config {
    env: string;
    version: string;
    st: string;
    uid: string;
    pageConfig?: any;
    preferQuickapp: string;
    wm: string;
}

interface Data {
    status: Status;
    hotScheme: string;
    appScheme: string;
    callUinversalLink: boolean;
    callWeibo: boolean;
    hit: boolean;
    is_gray: number;
    schemeOrigin: boolean;
    appLink: string;
    xianzhi_scheme: string;
    third_scheme: string;
}

interface Status {
    created_at: string;
    id: string;
    mid: string;
    can_edit: boolean;
    show_additional_indication: number;
    text: string;
    textLength: number;
    source: string;
    favorited: boolean;
    pic_ids: any[];
    pic_types: string;
    is_paid: boolean;
    mblog_vip_type: number;
    user: User;
    reposts_count: number;
    comments_count: number;
    attitudes_count: number;
    pending_approval_count: number;
    isLongText: boolean;
    reward_exhibition_type: number;
    hide_flag: number;
    visible: Visible;
    darwin_tags: any[];
    mblogtype: number;
    more_info_type: number;
    cardid: string;
    number_display_strategy: NumberDisplayStrategy;
    enable_comment_guide: boolean;
    content_auth: number;
    page_info: PageInfo;
    bid: string;
    buttons: Button[];
    status_title: string;
    ok: number;
    scheme: string;
    tipScheme: string;
}

interface Button {
    type: string;
    name: string;
    sub_type: number;
    params: Params;
}

interface Params {
    uid: number;
}

interface NumberDisplayStrategy {
    apply_scenario_flag: number;
    display_text_min_number: number;
    display_text: string;
}

interface PageInfo {
    type: string;
    object_type: number;
    page_pic: PagePic;
    page_url: string;
    object_id: string;
    page_title: string;
    title: string;
    content1: string;
    content2: string;
    video_orientation: string;
    play_count: string;
    media_info: MediaInfo;
    urls: { [key: string]: string };
    video_details: VideoDetails;
}

interface MediaInfo {
    stream_url: string;
    stream_url_hd: string;
    duration: number;
}

interface PagePic {
    width: number;
    url: string;
    height: number;
}

interface VideoDetails {
    size: number;
    bitrate: number;
    label: string;
    prefetch_size: number;
}

interface User {
    id: number;
    screen_name: string;
    profile_image_url: string;
    profile_url: string;
    statuses_count: number;
    verified: boolean;
    verified_type: number;
    verified_type_ext: number;
    verified_reason: string;
    close_blue_v: boolean;
    description: string;
    gender: string;
    mbtype: number;
    urank: number;
    mbrank: number;
    follow_me: boolean;
    following: boolean;
    followers_count: number;
    follow_count: number;
    cover_image_phone: string;
    avatar_hd: string;
    like: boolean;
    like_me: boolean;
    badge: { [key: string]: number };
}

interface Visible {
    type: number;
    list_id: number;
}

interface Performance {
    v: string;
    m: string;
    pwa: number;
    sw: number;
}
