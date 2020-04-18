import * as _ from 'lodash';
import * as stringRandom from 'string-random';
import * as hasha from 'hasha';
import akita from 'akita';
import {
  Options,
  JsConfigOptions,
  JsConfig,
  AccessToken,
  UserInfo,
  FansInfo,
  MediaData,
  QrCodeOptions,
  WXACodeOptions
} from '..';

const client = akita.resolve('libwx');

export class Weixin {
  options: Options;
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
  }

  setOptions(options: Options) {
    _.assign(this.options, options);
  }

  /**
   * 获取全局访问token
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
    let data = await client.get(url);
    if (data.errcode) {
      throw new Error(`Get weixin global token failed:${data.errmsg}`);
    }
    return data;
  }

  /**
   * 获取全局访问Ticket
   */
  async getTicket(noReTry?: boolean): Promise<string> {
    if (this._jsapiTicket && Date.now() < this._jsapiTicketTime) {
      return this._jsapiTicket;
    }
    let token = await this.getGlobalToken(noReTry);
    let url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
    let data = await client.get(url);
    if (data.errcode) {
      if (!noReTry && /access_token is invalid or not latest hints/.test(data.errmsg)) {
        // Global Token 过期，刷新重试
        return await this.getTicket(true);
      }
      throw new Error(`Get weixin ticket failed:${data.errmsg}`);
    }
    this._jsapiTicket = data.ticket;
    this._jsapiTicketTime = Date.now() + data.expires_in * 1000;
    return this._jsapiTicket;
  }

  /**
   * 获取公众号h5平台 JSSDK Config
   * @param options url
   */
  async getJsConfig(options: string | JsConfigOptions): Promise<JsConfig> {
    if (typeof options === 'string') {
      options = { url: options };
    }
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
   * @param code
   */
  async getAccessToken(code: string): Promise<AccessToken> {
    let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.options.appid}&secret=${this.options.secret}&code=${code}&grant_type=authorization_code`;
    if (this.options.channel === 'wxapp') {
      // 小程序平台
      url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.options.appid}&secret=${this.options.secret}&js_code=${code}&grant_type=authorization_code`;
    }
    let data = await client.get(url);
    if (data.errcode) {
      throw new Error(`Get weixin access_token failed:${data.errmsg}`);
    }
    return data;
  }

  /**
   * 获取用户信息，小程序平台不可用
   * @param openid
   * @param access_token
   */
  async getUserInfo(openid: string, access_token: string): Promise<UserInfo> {
    let url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    let data = await client.get(url);
    if (data.errcode) {
      throw new Error(`Get weixin user info failed:${data.errmsg}`);
    }
    return data;
  }

  /**
   * 获取公众号关注者信息
   * @param openid
   * @param access_token
   */
  async getFansInfo(openid: string, noReTry?: boolean): Promise<FansInfo> {
    let token = await this.getGlobalToken(noReTry);
    let url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`;
    let data = await client.get(url);
    if (data.errcode) {
      if (!noReTry && /access_token is invalid or not latest hints/.test(data.errmsg)) {
        // Global Token 过期，刷新重试
        return await this.getFansInfo(openid, true);
      }
      throw new Error(`Get weixin fans info failed:${data.errmsg}`);
    }
    return data;
  }

  /**
   * 下载媒体文件
   * @param media_id
   */
  async downloadMedia(media_id: string, noReTry?: boolean): Promise<MediaData> {
    let token = await this.getGlobalToken(noReTry);
    let url = `http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=${token}&media_id=${media_id}`;

    let result = client.get(url);
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
   * @param {QrCodeOptions} options 二维码选项
   */
  async getQrCode(
    options: QrCodeOptions,
    noReTry?: boolean
  ): Promise<{ ticket: string; expire_seconds: number; url: string }> {
    let token = await this.getGlobalToken(noReTry);
    let url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${token}`;
    let data = await client.post(url, { body: options });

    if (data.errmsg) {
      if (!noReTry && /access_token is invalid or not latest hints/.test(data.errmsg)) {
        // Global Token 过期，刷新重试
        return await this.getQrCode(options, true);
      }
      let e = new Error(data.errmsg);
      // @ts-ignore
      e.errcode = data.errcode;
      throw e;
    }

    return data;
  }

  /**
   * 生成小程序二维码
   * @param {WXACodeOptions} options 二维码选项
   */
  async getWXACodeUnlimit(options: WXACodeOptions, noReTry?: boolean): Promise<Buffer> {
    let token = await this.getGlobalToken();
    let url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`;

    let result = await client.post(url, { body: options }).buffer();

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
}

/**
 * 获取当前时间戳
 * @returns {Number}
 */
function time(): number {
  // @ts-ignore
  return parseInt(Date.now() / 1000);
}
