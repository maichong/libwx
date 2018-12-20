declare namespace libwx {
  interface Config {
    /**
     * APP ID
     */
    appid: string;
    /**
     * 秘钥
     */
    secret: string;
    /**
     * 微信支付商户ID
     */
    mch_id: string;
    /**
     * 支付秘钥
     */
    pay_key: string;
    /**
     * 支付通知地址
     */
    pay_notify_url: string;
    /**
     * 支付类型
     */
    pay_trade_type: string;
  }

  interface JSConfig {
    jsapi_ticket: string;
    timestamp: number;
    signature: string;
    appId: string;
    nonceStr: string;
    jsApiList: string[];
  }

  interface JSConfigOptions {
    url: string;
    debug?: boolean;
    jsApiList?: string[];
  }

  interface AccessToken {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
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
    groupid: number[];
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

  interface Weixin {
    /**
     * 获取实例
     * @param name
     */
    getInstance(name: stirng): Weixin;
    /**
     * 设置
     * @param config 
     */
    init(config: Partial<Config>): Weixin;
    getGlobalToken(): Promise<string>;
    getTicket(): Promise<string>;
    /**
     * 获取JSSDK Config
     * @param options url
     */
    getJSConfig(options: string | JSConfigOptions): Promise<JSConfig>;
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
     * 获取关注者信息
     * @param openid 
     * @param access_token 
     */
    getFansInfo(openid: string, access_token: string): Promise<FansInfo>;
    /**
     * 下载媒体文件
     * @param media_id 
     */
    downloadMedia(media_id: string): Promise<any>;
    /**
     * 查询订单
     * @param orderId 
     */
    orderquery(orderId: string): Promise<any>;
    /**
     * 统一下单
     * @param data 
     */
    unifiedorder(data: any): Promise<any>;
    /**
     * 创建支付参数
     * @param data 
     */
    createPayReq(data: any): Promise<any>;
  }
}

declare const libwx: libwx.Weixin;

export = libwx;
