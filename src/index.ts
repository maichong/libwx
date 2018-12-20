import * as _ from 'lodash';
import * as xml2js from 'xml2js';
import * as md5 from 'md5';
import * as stringRandom from 'string-random';
import akita from 'akita';
import { Options, JsConfigOptions, JsConfig, AccessToken, UserInfo, FansInfo, MediaData } from '..';
import sha1 = require('sha1');

const client = akita.create({});

export class Weixin {
  options: Options;
  _globalToken: string;
  _globalTokenTime: number;
  _jsapiTicket: string;
  _jsapiTicketTime: number;

  constructor(options?: Options) {
    this.options = options || {} as Options;
    if (!this.options.pay_trade_type) {
      let type = 'JSAPI';
      if (this.options.platform === 'app') {
        type = 'APP';
      }
      this.options.pay_trade_type = type;
    }
  }

  setOptions(options: Options) {
    _.assign(this.options, options);
  }

  /**
   * 获取全局访问token
   */
  async getGlobalToken(): Promise<string> {
    if (this._globalToken && Date.now() < this._globalTokenTime) {
      return this._globalToken;
    }
    let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.options.appid}&secret=${this.options.secret}`;
    let data = await client.get(url);
    if (data.errcode) {
      throw new Error(`Get weixin token failed:${data.errmsg}`);
    }
    this._globalToken = data.access_token;
    this._globalTokenTime = Date.now() + data.expires_in * 1000 - 5000;
    return this._globalToken;
  }

  /**
   * 获取全局访问Ticket
   */
  async getTicket(): Promise<string> {
    if (this._jsapiTicket && Date.now() < this._jsapiTicketTime) {
      return this._jsapiTicket;
    }
    let token = await this.getGlobalToken();
    let url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
    let data = await client.get(url);
    if (data.errcode) {
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

    data.signature = sha1(arr.join('&'));
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
    if (this.options.platform === 'wxapp') {
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
  async getFansInfo(openid: string): Promise<FansInfo> {
    let token = await this.getGlobalToken();
    let url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`;
    let data = await client.get(url);
    if (data.errcode) {
      throw new Error(`Get weixin fans info failed:${data.errmsg}`);
    }
    return data;
  }

  /**
   * 下载媒体文件
   * @param media_id
   */
  async downloadMedia(media_id: string): Promise<MediaData> {
    let token = await this.getGlobalToken();
    let url = `http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=${token}&media_id=${media_id}`;

    let result = client.get(url);
    let headers = await result.headers();

    if (!headers.has('Content-Disposition') && !headers.has('content-disposition')) {
      throw new Error('No media disposition');
    }

    let buffer = await result.buffer() as MediaData;

    if (!buffer) {
      throw new Error('No media data');
    }

    buffer.type = headers.get('Content-Type') || headers.get('content-type');

    return buffer;
  }

  /**
   * 查询订单
   * @param orderId
   */
  async orderquery(orderId: string): Promise<any> {
    let data: any = {
      appid: this.options.appid,
      mch_id: this.options.mch_id,
      nonce_str: stringRandom(),
      out_trade_no: orderId
    };
    data.sign = getPaySign(data, this.options.pay_key);

    let xml = data2xml(data);

    //console.log(xml);

    let result = await client.post('https://api.mch.weixin.qq.com/pay/orderquery', {
      body: xml
    }).text();

    return await xml2data(result);
  }

  /**
   * 统一下单
   * @param data
   */
  async unifiedorder(data: any): Promise<any> {
    _.defaults(data, {
      appid: this.options.appid,
      mch_id: this.options.mch_id,
      nonce_str: stringRandom(),
      notify_url: this.options.pay_notify_url,
      trade_type: this.options.pay_trade_type
    });

    data.sign = getPaySign(data, this.options.pay_key);

    let xml = data2xml(data);

    let result = await client.post('https://api.mch.weixin.qq.com/pay/unifiedorder', {
      body: xml
    }).text();

    let json = await xml2data(result);
    if (json.return_msg && json.return_msg !== 'OK') {
      throw new Error(json.return_msg);
    }

    return json;
  }

  /**
   * 创建支付参数
   * @param data
   */
  async createPayReq(data: any): Promise<any> {
    let params = _.assign({}, {
      trade_type: this.options.pay_trade_type
    }, data);

    let result = await this.unifiedorder(params);

    //下单成功
    let timestamp = time();
    let noncestr = stringRandom();

    if (this.options.pay_trade_type === 'JSAPI') {
      // JSSDK
      let payReq: any = {
        appId: this.options.appid,
        timeStamp: timestamp,
        nonceStr: noncestr,
        'package': `prepay_id=${result.prepay_id}`,
        signType: 'MD5'
      };
      payReq.paySign = getPaySign(payReq, this.options.pay_key);
      payReq.timestamp = payReq.timeStamp;
      delete payReq.appId;
      delete payReq.timeStamp;
      return payReq;
    }

    //APP 支付
    let reqData = {
      'appid': this.options.appid,
      'noncestr': noncestr,
      'package': 'Sign=WXPay',
      'partnerid': this.options.mch_id,
      'prepayid': result.prepay_id,
      'timestamp': timestamp
    };

    let sign = getPaySign(reqData, this.options.pay_key);

    let payReq = {
      'appId': this.options.appid,
      'partnerId': this.options.mch_id,
      'prepayId': result.prepay_id,
      'package': 'Sign=WXPay',
      'nonceStr': noncestr,
      'timeStamp': timestamp,
      'sign': sign
    };

    return payReq;
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

/**
 * 获取MD5签名
 * @param data
 * @param lastKey
 * @param lastValue
 * @returns {string}
 */
function getMd5Sign(data: any, lastKey: string, lastValue: string): string {
  let filted: any = {};
  for (let key in data) {
    let value = String(data[key]);
    if (!value) {
      continue;
    }
    filted[key] = value;
  }
  let keys = Object.keys(filted).sort();

  let arr: string[] = [];
  keys.forEach(function (key) {
    arr.push(`${key}=${filted[key]}`);
  });

  let string = arr.join('&');

  if (lastKey) {
    string += `&${lastKey}=${lastValue}`;
  }

  return md5(string).toUpperCase();
}

//获取支付通用签名
function getPaySign(data: any, pay_key: string): string {
  return getMd5Sign(data, 'key', pay_key);
}

/**
 * 将数据转化为XML字符串
 * @param data
 */
function data2xml(data: any): string {
  let builder = new xml2js.Builder({
    cdata: true,
    rootName: 'xml'
  });

  return builder.buildObject(data);
}

/**
 * 将XML转化为js数据
 * @param {string} xml
 * @returns {Promise}
 */
function xml2data(xml: string): Promise<any> {
  return new Promise(function (resolve, reject) {
    xml2js.parseString(xml, function (error: Error, result: any) {
      if (error) {
        return reject(error);
      }
      let data: any = {};
      for (let key in result.xml) {
        let value = result.xml[key];
        data[key] = value && value.length === 1 ? value[0] : value;
      }
      resolve(data);
    });
  });
}
