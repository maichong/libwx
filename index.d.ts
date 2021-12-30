import { RequestInit } from 'akita';

export interface Options {
  /**
   * 平台渠道
   */
  channel?: 'jssdk' | 'app' | 'wxapp';
  /**
   * APP ID
   */
  appid: string;
  /**
   * 秘钥
   */
  secret: string;
  /**
   * 全局Token缓存器
   * 当多副本运行时，需在多副本之间共享全局 access_token 否则会报错 invalid credential, access_token is invalid or not latest
   */
  setGlobalTokenCache?: (token: string, expiredAt: number) => Promise<void>;
  /**
   * 全局Token缓存器
   * 当多副本运行时，需在多副本之间共享全局 access_token 否则会报错 invalid credential, access_token is invalid or not latest
   */
  getGlobalTokenCache?: () => Promise<string | null>;
}

export interface Request extends RequestInit {
  method?: 'GET' | 'POST';
  url: string;
  query?: any;
  body?: any;
}

export type Result<T = {}> = T & {
  errcode: number;
  errmsg: string;
};

export interface JsConfig {
  jsapi_ticket: string;
  timestamp: number;
  signature: string;
  appId: string;
  nonceStr: string;
  jsApiList: string[];
}

export interface JsConfigOptions {
  /**
   * JSSDK 业务域名
   */
  url: string;
  debug?: boolean;
  jsApiList?: string[];
}

/**
 * 用户账户 AccessToken
 */
export interface AccessToken {
  /**
   * 用户 openid
   */
  openid: string;
  /**
   * 用户 unionid
   */
  unionid?: string;
  /**
   * 会话密钥，只小程序平台可用
   */
  session_key?: string;
  /**
   * 会话令牌，只公众号可用
   */
  access_token?: string;
  /**
   * 会话令牌过期时间，只公众号可用
   */
  expires_in?: number;
  /**
   * 刷新会话令牌，只公众号可用
   */
  refresh_token?: string;
  /**
   * 用户授权的作用域，只公众号可用
   */
  scope?: string;
}

/**
 * 网页授权用户信息
 */
export interface AuthInfo {
  openid: string;
  unionid?: string;
  nickname: string;
  sex: 1 | 2 | 0;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege?: string[];
}

/**
 * 微信关注者信息
 */
export interface UserInfo {
  openid: string;
  unionid?: string;
  subscribe: 0 | 1;
  language: string;
  subscribe_time: number;
  remark: string;
  groupid: number;
  tagid_list: number[];
  subscribe_scene: SubscribeScene;
  qr_scene: number;
  qr_scene_str: string;
}

/**
 * 获取用户列表返回值
 */
export interface GetUserListResult {
  /**
   * 关注该公众账号的总用户数
   */
  total: number;
  /**
   * 拉取的OPENID个数，最大值为10000
   * 如果为10000说明还有下页
   */
  count: number;
  data: {
    /**
     * openid 字符串列表
     */
    openid: string[];
  };
  /**
   * 下一页 next_openid 参数
   */
  next_openid: string;
}

/**
 * 素材类型
 */
export type MaterialType = 'image' | 'video' | 'voice' | 'news';

/**
 * 素材
 */
export interface Material {
  media_id: string;
  update_time: string;
  /**
   * 图片、语音、视频 类型素材可用
   */
  name?: string;
  /**
   * 图片、语音、视频 类型素材可用
   */
  url?: string;
  /**
   * 图文消息素材内容
   */
  content?: {
    news_item: Array<{
      title: string;
      thumb_media_id: string;
      show_cover_pic: number;
      author: string;
      digest: string;
      content: string;
      url: string;
      thumb_url: string;
      content_source_url: string;
      need_open_comment?: number;
      only_fans_can_comment?: number;
    }>;
  };
}

/**
 * 获取素材列表
 */
export interface GetMaterialListResult {
  total_count: number;
  item_count: number;
  item: Material[];
}

/**
 * 自定义菜单按钮类型
 */
export type ButtonType =
  | 'miniprogram'
  | 'click'
  | 'view'
  | 'scancode_push'
  | 'scancode_waitmsg'
  | 'pic_sysphoto'
  | 'pic_photo_or_album'
  | 'pic_weixin'
  | 'location_select'
  | 'media_id'
  | 'view_limited';

/**
 * 自定义菜单按钮
 * https://developers.weixin.qq.com/doc/offiaccount/Custom_Menus/Creating_Custom-Defined_Menu.html
 */
export interface Button {
  /**
   * 按钮名称
   */
  name: string;
  /**
   * 按钮类型
   */
  type?: ButtonType;
  /**
   * 二级按钮列表，只第一级按钮可设置
   */
  sub_button?: Button[];
  /**
   * 网页链接，用户点击菜单可打开链接
   */
  url?: string;
  /**
   * 调用新增永久素材接口返回的合法media_id
   */
  media_id?: string;
  /**
   * 小程序的appid
   */
  appid?: string;
  /**
   * 小程序的页面路径
   */
  pagepath?: string;
}

export interface Menu {
  button: Button[];
}

/**
 * 客服消息
 */
export interface Message {
  touser: string;
  msgtype:
    | 'text'
    | 'image'
    | 'voice'
    | 'video'
    | 'music'
    | 'news'
    | 'mpnews'
    | 'msgmenu'
    | 'wxcard'
    | 'miniprogrampage';
  text?: { content: string };
  image?: { media_id: string };
  voice?: { media_id: string };
  video?: { media_id: string; thumb_media_id: string; title: string; description: string };
  music?: {
    media_id: string;
    thumb_media_id: string;
    title: string;
    description: string;
    musicurl: string;
    hqmusicurl: string;
  };
  news?: {
    articles: Array<{
      title: string;
      description: string;
      url: string;
      picurl: string;
    }>;
  };
  mpnews?: { media_id: string };
  msgmenu?: {
    head_content: string;
    tail_content: string;
    list: Array<{
      id: string;
      content: string;
    }>;
  };
  wxcard?: { card_id: string };
  miniprogrampage?: {
    title: string;
    appid: string;
    pagepath: string;
    thumb_media_id: string;
  };
  customservice?: {
    kf_account: string;
  };
}

/**
 * 模板消息
 */
export interface TemplateMessage {
  touser: string;
  template_id: string;
  url?: string;
  miniprogram?: {
    appid: string;
    pagepath?: string;
  };
  data: {
    [key: string]: {
      value: string;
      color?: string;
    };
  };
}

export type SubscribeScene =
  | 'ADD_SCENE_SEARCH'
  | 'ADD_SCENE_ACCOUNT_MIGRATION'
  | 'ADD_SCENE_PROFILE_CARD'
  | 'ADD_SCENE_QR_CODE'
  | 'ADD_SCENEPROFILE'
  | 'ADD_SCENE_PROFILE_ITEM'
  | 'ADD_SCENE_PAID'
  | 'ADD_SCENE_OTHERS';

export interface MediaData extends Buffer {
  type: string;
}

/**
 * 获取公众号二维码参数
 */
export interface QrCodeOptions {
  /**
   * 二维码类型
   * QR_SCENE 为临时的整型参数值
   * QR_STR_SCENE 为临时的字符串参数值
   * QR_LIMIT_SCENE 为永久的整型参数值
   * QR_LIMIT_STR_SCENE 为永久的字符串参数值
   */
  action_name: 'QR_SCENE' | 'QR_STR_SCENE' | 'QR_LIMIT_SCENE' | 'QR_LIMIT_STR_SCENE';
  /**
   * 该二维码有效时间，以秒为单位。 最大不超过2592000（即30天）
   * 此字段如果不填，则默认有效期为30秒。
   */
  expire_seconds?: number;
  /**
   * 二维码详细信息
   */
  action_info: {
    scene: {
      /**
       * 场景值ID
       * 临时二维码时为32位非0整型，永久二维码时最大值为100000
       */
      scene_id?: number;
      /**
       * 场景值ID（字符串形式的ID）
       * 字符串类型，长度限制为1到64
       */
      scene_str?: string;
    };
  };
}

/**
 * 生成小程序二维码参数
 */
export interface WXACodeOptions {
  scene: string;
  page?: string;
  width?: number;
  auto_color?: boolean;
  line_color?: {
    r: number;
    g: number;
    b: number;
  };
  is_hyaline?: boolean;
}

export default class Weixin {
  options: Options;

  constructor(options?: Options);

  /**
   * 设置libwx选项
   * @param {Options} options
   */
  setOptions(options: Options): void;

  /**
   * 获取全局访问token
   * @param {boolean} [refresh] 是否强制刷新
   */
  getGlobalToken(refresh?: boolean): Promise<string>;

  /**
   * 通用请求方法，自动会为url加上 access_token 参数
   * @param {string} req
   */
  request(req: Request): Promise<any>;

  /**
   * 获取全局访问Ticket
   */
  getTicket(): Promise<string>;

  /**
   * 获取公众号h5平台 JSSDK Config
   * @param {JsConfigOptions} options
   */
  getJsConfig(options: JsConfigOptions): Promise<JsConfig>;

  /**
   * 获取用户 AccessToken
   * 小程序和公众号都可用
   * @param {string} code
   */
  getAccessToken(code: string): Promise<AccessToken>;

  /**
   * 获取网页授权用户信息
   * 只公众号可用
   * @param {string} openid
   * @param {string} access_token 用户 access_token，并非全局 access_token
   */
  getAuthInfo(openid: string, access_token: string): Promise<AuthInfo>;

  /**
   * 获取公众号关注者信息
   * 只公众号可用
   * @param {string} openid
   */
  getUserInfo(openid: string): Promise<UserInfo>;

  /**
   * 获取公众号关注者列表
   * 只公众号可用
   * @param {string} [next_openid] 下一页开头，如果不传从第一页开始
   */
  getUserList(next_openid?: string): Promise<GetUserListResult>;

  /**
   * 获取永久素材列表，每页20条
   * 只公众号可用
   * @param {string} type 素材类型
   * @param {number} [offset] 从全部素材的该偏移位置开始返回，0表示从第一个素材
   */
  getMaterialList(type: MaterialType, offset?: number): Promise<GetMaterialListResult>;

  /**
   * 创建自定义菜单
   * 只公众号可用
   */
  createMenu(menu: Menu): Promise<Result>;

  /**
   * 获取自定义菜单
   * 只公众号可用
   */
  getMenu(): Promise<Menu>;

  /**
   * 向用户发送消息
   * 只公众号可用
   * @param {Message} message
   */
  sendMessage(message: Message): Promise<Result<{ msgid: number }>>;

  /**
   * 向用户发送模板消息
   * 只公众号可用
   * @param {TemplateMessage} message
   */
  sendTemplateMessage(message: TemplateMessage): Promise<Result<{ msgid: number }>>;

  /**
   * 下载媒体文件数据
   * @param {string} media_id
   */
  downloadMedia(media_id: string): Promise<MediaData>;

  /**
   * 生成公众号二维码
   * 只公众号可用
   * @param {QrCodeOptions} options 二维码选项
   */
  getQrCode(options: QrCodeOptions): Promise<{ ticket: string; expire_seconds: number; url: string }>;

  /**
   * 生成小程序二维码
   * @param {WXACodeOptions} options 二维码选项
   */
  getWXACodeUnlimit(options: WXACodeOptions): Promise<Buffer>;

  /**
   * 监测图片是否包含违规内容
   * 如果有违规内容，返回false
   * 图片应小于1M，像素小于 750px x 1334px
   * @param {Buffer} image 图片Buffer数据
   */
  imgSecCheck(image: Buffer): Promise<boolean>;
}
