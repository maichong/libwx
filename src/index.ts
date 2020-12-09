import * as _ from 'lodash';
import * as stringRandom from 'string-random';
import * as hasha from 'hasha';
import akita, { Client } from 'akita';
import {
  Options,
  Request,
  Result,
  JsConfigOptions,
  JsConfig,
  AccessToken,
  AuthInfo,
  UserInfo,
  GetUserListResult,
  MaterialType,
  GetMaterialListResult,
  Menu,
  Message,
  TemplateMessage,
  MediaData,
  QrCodeOptions,
  WXACodeOptions
} from '..';

export default class Weixin {
  options: Options;
  _client: Client;
  _globalToken: string;
  _globalTokenTime: number;
  _jsapiTicket: string;
  _jsapiTicketTime: number;
  _getGlobalTokenPromise: Promise<string>;

  constructor(options?: Options) {
    this.options = options || ({} as Options);
    if (!this.options.channel) {
      this.options.channel = 'jssdk';
    }
    this._client = akita.create({});
  }

  /**
   * 设置libwx选项
   * @param {Options} options
   */
  setOptions(options: Options) {
    _.assign(this.options, options);
  }

  /**
   * 获取全局访问token
   * @param {boolean} [refresh] 是否强制刷新
   */
  getGlobalToken(refresh?: boolean): Promise<string> {
    if (this._getGlobalTokenPromise) {
      return this._getGlobalTokenPromise;
    }
    this._getGlobalTokenPromise = this._getGlobalToken(refresh);

    this._getGlobalTokenPromise.finally(() => {
      this._getGlobalTokenPromise = null;
    });

    return this._getGlobalTokenPromise;
  }

  async _getGlobalToken(refresh?: boolean): Promise<string> {
    if (this.options.getGlobalTokenCache) {
      if (!refresh) {
        let token = await this.options.getGlobalTokenCache();
        if (token) return token;
      }
      let { access_token, expires_in } = await this._fetchGlobalToken();
      await this.options.setGlobalTokenCache(access_token, expires_in * 1000 - 5000);
      return access_token;
    }

    if (!refresh && this._globalToken && Date.now() < this._globalTokenTime) {
      return this._globalToken;
    }

    let data = await this._fetchGlobalToken();

    this._globalToken = data.access_token;
    this._globalTokenTime = Date.now() + data.expires_in * 1000 - 5000;
    return this._globalToken;
  }

  async _fetchGlobalToken() {
    let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.options.appid}&secret=${this.options.secret}`;
    let data = await this._client.get(url);
    if (data.errcode) {
      let e = new Error(`Get weixin global token failed:${data.errmsg}`);
      // @ts-ignore
      e.errcode = data.errcode;
      throw e;
    }
    return data;
  }

  /**
   * 通用请求方法，自动会为url加上 access_token 参数
   * @param {string} req
   */
  async request(req: Request): Promise<any> {
    if (req.query?.access_token) {
      return this._client.request(req.url, req);
    }

    let access_token = await this.getGlobalToken();
    req.query = Object.assign({ access_token }, req.query);

    let res = await this._client.request(req.url, req);

    if (res.errcode) {
      if (/access_token is invalid or not latest hints/.test(res.errmsg)) {
        // Global Token 过期，刷新重试
        access_token = await this.getGlobalToken(true);
        req.query = Object.assign(req.query, { access_token });
        res = await this._client.request(req.url, req);
        if (res.errcode) {
          let e = new Error(res.errmsg);
          // @ts-ignore
          e.errcode = res.errcode;
          throw e;
        }
      } else {
        let e = new Error(res.errmsg);
        // @ts-ignore
        e.errcode = res.errcode;
        throw e;
      }
    }

    return res;
  }

  /**
   * 获取全局访问Ticket
   */
  async getTicket(): Promise<string> {
    if (this._jsapiTicket && Date.now() < this._jsapiTicketTime) {
      return this._jsapiTicket;
    }
    let res = await this.request({
      url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
      query: {
        type: 'jsapi'
      }
    });
    this._jsapiTicket = res.ticket;
    this._jsapiTicketTime = Date.now() + res.expires_in * 1000;
    return this._jsapiTicket;
  }

  /**
   * 获取公众号h5平台 JSSDK Config
   * @param {JsConfigOptions} options
   */
  async getJsConfig(options: JsConfigOptions): Promise<JsConfig> {
    let data: any = {
      jsapi_ticket: '',
      noncestr: stringRandom(),
      timestamp: time(),
      url: options.url
    };

    data.jsapi_ticket = await this.getTicket();

    let arr: string[] = _.map(data, (value, key) => `${key}=${value}`);

    data.signature = hasha(arr.join('&'), { algorithm: 'sha1' });
    data.appId = this.options.appid;
    data.nonceStr = data.noncestr;
    data.jsApiList = options.jsApiList || [
      'checkJsApi',
      'updateAppMessageShareData',
      'updateTimelineShareData',
      'onMenuShareTimeline',
      'onMenuShareAppMessage',
      'onMenuShareQQ',
      'onMenuShareWeibo',
      'onMenuShareQZone',
      'startRecord',
      'stopRecord',
      'onVoiceRecordEnd',
      'playVoice',
      'pauseVoice',
      'stopVoice',
      'onVoicePlayEnd',
      'uploadVoice',
      'downloadVoice',
      'chooseImage',
      'previewImage',
      'uploadImage',
      'downloadImage',
      'translateVoice',
      'getNetworkType',
      'openLocation',
      'getLocation',
      'hideOptionMenu',
      'showOptionMenu',
      'hideMenuItems',
      'showMenuItems',
      'hideAllNonBaseMenuItem',
      'showAllNonBaseMenuItem',
      'closeWindow',
      'scanQRCode',
      'chooseWXPay',
      'openProductSpecificView',
      'addCard',
      'chooseCard',
      'openCard'
    ];
    if (options.debug) {
      data.debug = true;
    }
    delete data.jsapi_ticket;
    delete data.noncestr;
    delete data.url;
    return data;
  }

  /**
   * 获取用户 AccessToken
   * 小程序和公众号都可用
   * @param {string} code
   */
  async getAccessToken(code: string): Promise<AccessToken> {
    let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.options.appid}&secret=${this.options.secret}&code=${code}&grant_type=authorization_code`;
    if (this.options.channel === 'wxapp') {
      // 小程序平台
      url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.options.appid}&secret=${this.options.secret}&js_code=${code}&grant_type=authorization_code`;
    }
    let data = await this._client.get(url);
    if (data.errcode) {
      let e = new Error(`Get weixin access_token failed:${data.errmsg}`);
      // @ts-ignore
      e.errcode = data.errcode;
      throw e;
    }
    return data;
  }

  /**
   * 获取网页授权用户信息
   * 小程序不可用
   * @param {string} openid
   * @param {string} access_token 用户 access_token，并非全局 access_token
   */
  getAuthInfo(openid: string, access_token: string): Promise<AuthInfo> {
    return this.request({
      url: 'https://api.weixin.qq.com/sns/userinfo',
      query: { openid, access_token }
    });
  }

  /**
   * 获取公众号关注者信息
   * 小程序不可用
   * @param {string} openid
   */
  getUserInfo(openid: string): Promise<UserInfo> {
    return this.request({
      url: 'https://api.weixin.qq.com/cgi-bin/user/info',
      query: {
        openid,
        lang: 'zh_CN'
      }
    });
  }

  /**
   * 获取公众号关注者列表
   * 只公众号可用
   * @param {string} [next_openid] 下一页开头，如果不传从第一页开始
   */
  getUserList(next_openid?: string): Promise<GetUserListResult> {
    return this.request({
      url: 'https://api.weixin.qq.com/cgi-bin/user/get',
      query: {
        next_openid
      }
    });
  }

  /**
   * 获取永久素材列表，每页20条
   * 只公众号可用
   * @param {string} type 素材类型
   * @param {number} [offset] 从全部素材的该偏移位置开始返回，0表示从第一个素材
   */
  getMaterialList(type: MaterialType, offset?: number): Promise<GetMaterialListResult> {
    return this.request({
      method: 'POST',
      url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',
      body: {
        type,
        offset: offset || 0,
        count: 20
      }
    });
  }

  /**
   * 创建自定义菜单
   * 只公众号可用
   */
  createMenu(menu: Menu): Promise<Result> {
    return this.request({
      method: 'POST',
      url: 'https://api.weixin.qq.com/cgi-bin/menu/get',
      body: menu
    });
  }

  /**
   * 获取自定义菜单
   * 只公众号可用
   */
  getMenu(): Promise<Menu> {
    return this.request({
      url: 'https://api.weixin.qq.com/cgi-bin/menu/get'
    });
  }

  /**
   * 向用户发送消息
   * 只公众号可用
   * @param {Message} message
   */
  sendMessage(message: Message): Promise<Result<{ msgid: number }>> {
    return this.request({
      method: 'POST',
      url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send',
      body: message
    });
  }

  /**
   * 向用户发送模板消息
   * 只公众号可用
   * @param {TemplateMessage} message
   */
  sendTemplateMessage(message: TemplateMessage): Promise<Result<{ msgid: number }>> {
    return this.request({
      method: 'POST',
      url: 'https://api.weixin.qq.com/cgi-bin/message/template/send',
      body: message
    });
  }

  /**
   * 下载媒体文件数据
   * @param {string} media_id
   */
  async downloadMedia(media_id: string, noReTry?: boolean): Promise<MediaData> {
    let token = await this.getGlobalToken(noReTry);
    let url = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${token}&media_id=${media_id}`;

    let result = this._client.get(url);
    let headers = await result.headers();
    let buffer = (await result.buffer()) as MediaData;

    if (!noReTry && buffer[0] === 0x7b) {
      // 以 { 开头
      let data;
      try {
        data = JSON.parse(result.toString());
      } catch (e) {}
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (data && data.errmsg) {
        if (!noReTry && /access_token is invalid or not latest hints/.test(data.errmsg)) {
          // Global Token 过期，刷新重试
          return await this.downloadMedia(media_id, true);
        }
        let e = new Error(data.errmsg);
        // @ts-ignore
        e.errcode = data.errcode;
        throw e;
      }
    }

    if (!headers.has('Content-Disposition') && !headers.has('content-disposition')) {
      throw new Error('No media disposition');
    }

    if (!buffer) {
      throw new Error('No media data');
    }

    buffer.type = headers.get('Content-Type') || headers.get('content-type');

    return buffer;
  }

  /**
   * 生成公众号二维码
   * 只公众号可用
   * @param {QrCodeOptions} options 二维码选项
   */
  getQrCode(options: QrCodeOptions): Promise<{ ticket: string; expire_seconds: number; url: string }> {
    return this.request({
      method: 'POST',
      url: 'https://api.weixin.qq.com/cgi-bin/qrcode/create',
      body: options
    });
  }

  /**
   * 生成小程序二维码
   * @param {WXACodeOptions} options 二维码选项
   */
  async getWXACodeUnlimit(options: WXACodeOptions, noReTry?: boolean): Promise<Buffer> {
    let token = await this.getGlobalToken();
    let url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`;

    let result = await this._client.post(url, { body: options }).buffer();

    if (result[0] === 0x7b) {
      // 以 { 开头
      let data;
      try {
        data = JSON.parse(result.toString());
      } catch (e) {}
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (data && data.errmsg) {
        if (!noReTry && /access_token is invalid or not latest hints/.test(data.errmsg)) {
          // Global Token 过期，刷新重试
          return await this.getWXACodeUnlimit(options, true);
        }
        let e = new Error(data.errmsg);
        // @ts-ignore
        e.errcode = data.errcode;
        throw e;
      }
    }
    return result;
  }

  /**
   * 监测图片是否包含违规内容
   * 如果有违规内容，返回false
   * 图片应小于1M，像素小于 750px x 1334px
   * @param {Buffer} image 图片Buffer数据
   */
  async imgSecCheck(image: Buffer): Promise<boolean> {
    const FormData = this._client._options.FormData;
    let body = new FormData();
    body.append('media', image as any, 'image.jpg');

    try {
      await this.request({
        method: 'POST',
        url: 'https://api.weixin.qq.com/wxa/img_sec_check',
        body
      });
    } catch (e) {
      return false;
    }
    return true;
  }
}

/**
 * 获取当前时间戳
 * @returns {Number}
 */
function time(): number {
  // @ts-ignore
  return parseInt(Date.now() / 1000);
}
