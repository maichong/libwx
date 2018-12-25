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
}

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

export interface AccessToken {
  openid: string;
  unionid?: string;
  /**
   * 会话密钥，只小程序平台可用
   */
  session_key?: string;
  /**
   * 会话令牌，小程序不可用
   */
  access_token?: string;
  /**
   * 会话令牌过期时间，小程序不可用
   */
  expires_in?: number;
  /**
   * 刷新会话令牌，小程序不可用
   */
  refresh_token?: string;
  /**
   * 用户授权的作用域，小程序不可用
   */
  scope?: string;
}

interface UserInfo {
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

interface FansInfo {
  openid: string;
  unionid?: string;
  subscribe: 0 | 1;
  nickname: string;
  sex: 1 | 2 | 0;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  language: string;
  subscribe_time: string;
  remark: string;
  groupid: number;
  tagid_list: number[];
  subscribe_scene: SubscribeScene;
  qr_scene: number;
  qr_scene_str: string;
}

type SubscribeScene = 'ADD_SCENE_SEARCH'
  | 'ADD_SCENE_ACCOUNT_MIGRATION'
  | 'ADD_SCENE_PROFILE_CARD'
  | 'ADD_SCENE_QR_CODE'
  | 'ADD_SCENEPROFILE'
  | 'ADD_SCENE_PROFILE_ITEM'
  | 'ADD_SCENE_PAID'
  | 'ADD_SCENE_OTHERS';

interface MediaData extends Buffer {
  type: string;
}

export class Weixin {
  constructor(options?: Options);

  setOptions(options: Options): void;
  /**
   * 获取全局访问token
   */
  getGlobalToken(): Promise<string>;
  /**
   * 获取全局访问Ticket
   */
  getTicket(): Promise<string>;
  /**
   * 获取公众号h5平台 JSSDK Config
   * @param options url
   */
  getJsConfig(options: string | JsConfigOptions): Promise<JsConfig>;
  /**
   * 获取用户 AccessToken
   * @param code
   */
  getAccessToken(code: string): Promise<AccessToken>;
  /**
   * 获取用户信息
   * @param openid
   * @param access_token
   */
  getUserInfo(openid: string, access_token: string): Promise<UserInfo>;
  /**
   * 获取公众号关注者信息
   * @param openid
   */
  getFansInfo(openid: string): Promise<FansInfo>;
  /**
   * 下载媒体文件
   * @param media_id
   */
  downloadMedia(media_id: string): Promise<MediaData>;
}
