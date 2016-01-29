/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-01-29
 * @author Liang <liang@maichong.it>
 */

'use strict';

const _ = require('lodash');
const request = require('request-async');
const stringRandom = require('string-random');
const sha1 = require('sha1');
const xml2js = require('xml2js');
const md5 = require('MD5');

const instances = {};

function Weixin(config) {
  let me = this;
  me._config = _.extend({
    appid: '', //APP ID
    secret: '', //秘钥
    mch_id: '', //微信支付商户ID
    pay_key: '', //支付秘钥
    pay_notify_url: '', //支付通知地址
    pay_trade_type: '' //支付类型
  }, config);
}

/**
 * 获取实例
 * @param {string} name 实例名称
 * @returns {*}
 */
Weixin.getInstance = function (name) {
  if (!instances[name]) {
    instances[name] = new Weixin();
  }
  return instances[name];
};

Weixin.init = function (config) {
  let me = this;
  _.extend(me._config, config);
  return me;
};

/**
 * 获取公众平台全局token
 * @returns {Promise}
 */
Weixin.getGlobalToken = async function () {
  let me = this;
  if (me._globalToken && Date.now() < me._globalTokenTime) {
    return me._globalToken;
  }
  let url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + me._config.appid + '&secret=' + me._config.secret;
  let result = await request(url);
  let data = JSON.parse(result.body);
  if (data.errcode) {
    throw new Error('Get weixin token failed:' + data.errmsg);
  }
  me._globalToken = data.access_token;
  me._globalTokenTime = Date.now() + data.expires_in * 1000;
  return me._globalToken;
};

/**
 * 获取公众平台JSSDK ticket
 * @returns {Promise}
 */
Weixin.getTicket = async function () {
  let me = this;
  if (me._jsapiTicket && Date.now() < me._jsapiTicketTime) {
    return me._jsapiTicket;
  }
  let token = await me.getGlobalToken();
  let url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi';
  let result = await request(url);
  let data = JSON.parse(result.body);
  if (data.errcode) {
    throw new Error('Get weixin ticket failed:' + data.errmsg);
  }
  me._jsapiTicket = data.ticket;
  me._jsapiTicketTime = Date.now() + data.expires_in * 1000;
  return me._jsapiTicket;
};

/**
 * 获取JSSDK初始化参数
 * @returns {Promise}
 */
Weixin.getJSConfig = async function (url) {
  let me = this;
  let data = {
    jsapi_ticket: '',
    noncestr: stringRandom(),
    timestamp: time(),
    url: url
  };

  data.jsapi_ticket = await me.getTicket();

  let arr = [];
  _.each(data, function (value, key) {
    arr.push(key + '=' + value);
  });

  data.signature = sha1(arr.join('&'));
  data.appId = me._config.appid;
  data.nonceStr = data.noncestr;
  data.jsApiList = [
    'checkJsApi',
    'onMenuShareTimeline',
    'onMenuShareAppMessage',
    'onMenuShareQQ',
    'onMenuShareWeibo',
    'hideMenuItems',
    'showMenuItems',
    'hideAllNonBaseMenuItem',
    'showAllNonBaseMenuItem',
    'translateVoice',
    'startRecord',
    'stopRecord',
    'onRecordEnd',
    'playVoice',
    'pauseVoice',
    'stopVoice',
    'uploadVoice',
    'downloadVoice',
    'chooseImage',
    'previewImage',
    'uploadImage',
    'downloadImage',
    'getNetworkType',
    'openLocation',
    'getLocation',
    'hideOptionMenu',
    'showOptionMenu',
    'closeWindow',
    'scanQRCode',
    'chooseWXPay',
    'openProductSpecificView',
    'addCard',
    'chooseCard',
    'openCard',
    'onMenuShareWeibo',
    'hideMenuItems',
    'showMenuItems',
    'hideAllNonBaseMenuItem',
    'showAllNonBaseMenuItem'
  ];
  //data.debug = true; // config.init.env == 'development';
  //console.log(data);
  delete data.jsapi_ticket;
  delete data.noncestr;
  delete data.url;
  return data;
};

/**
 * 用户网页授权后，将code转化为access_token
 * @param code
 * @returns {Promise}
 *
 * Promise.then返回数据格式为:
 *  {
 *    "access_token":"ACCESS_TOKEN",
 *    "expires_in":7200,
 *    "refresh_token":"REFRESH_TOKEN",
 *    "openid":"OPENID",
 *    "scope":"SCOPE",
 *    "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
 *  }
 */
Weixin.getAccessToken = async function (code) {
  let me = this;

  let url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + me._config.appid + '&secret=' + me._config.secret + '&code=' + code + '&grant_type=authorization_code';

  let result = await request(url);
  let data = JSON.parse(result.body);
  if (data.errcode) {
    throw new Error('Get weixin access_token failed:' + data.errmsg);
  }
  return data;
};

/**
 * 获取授权用户信息
 * @param openid
 * @param accessToken 用户access token
 */
Weixin.getUserInfo = async function (openid, accessToken) {
  let url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + accessToken + '&openid=' + openid;
  let result = await request(url);
  let data = JSON.parse(result.body);
  if (data.errcode) {
    throw new Error('Get weixin user info failed:' + data.errmsg);
  }
  return data;
};

/**
 * 获取微信关注者的身份信息
 * @param openid
 * @returns {Promise}
 */
Weixin.getFansInfo = async function (openid) {
  let me = this;
  let token = await me.getGlobalToken();
  let url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + token + '&openid=' + openid + '&lang=zh_CN';
  let result = await request(url);
  let data = JSON.parse(result.body);
  if (data.errcode) {
    throw new Error('Get weixin fans info failed:' + data.errmsg);
  }
  return data;
};

/**
 * 下载文件
 * @returns {Promise}
 */
Weixin.downloadMedia = async function (media_id) {
  let me = this;
  let token = await me.getGlobalToken();
  let url = 'http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=' + token + '&media_id=' + media_id;
  let result = await request({
    encoding: null,
    url: url
  });

  if (!result.body) {
    throw new Error('No media data');
  }

  if (!result.headers['content-disposition']) {
    throw new Error('No media disposition');
  }

  let data = result.body;
  data.type = result.headers['content-type'];

  return data;
};

/**
 * 查询订单
 * @param orderId
 * @returns {Promise}
 */
Weixin.orderquery = async function (orderId) {
  let me = this;

  let data = {
    appid: me._config.appid,
    mch_id: me._config.mch_id,
    nonce_str: stringRandom(),
    out_trade_no: orderId
  };
  data.sign = getPaySign(data);

  let xml = data2xml(data);

  //console.log(xml);

  let result = await request({
    method: 'POST',
    url: 'https://api.mch.weixin.qq.com/pay/orderquery',
    body: xml
  });

  let json = await xml2data(result.body);

  return json;
};

Weixin.unifiedorder = async function (data) {
  let me = this;
  _.defaults(data, {
    appid: me._config.appid,
    mch_id: me.config.mch_id,
    nonce_str: stringRandom(),
    notify_url: me._config.pay_notify_url,
    trade_type: me._config.trade_type
  });

  data.sign = getPaySign(data);

  let xml = data2xml(data);

  let result = await request({
    method: 'POST',
    url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
    body: xml
  });

  let json = await xml2data(result.body);
  if (!json.prepay_id) {
    throw new Error('no prepay id');
  }
  return json;
};

/**
 * 支付接口
 * @param data 支付参数
 * @returns {Promise}
 */
Weixin.createPayReq = async function (data) {
  let me = this;

  let params = _.assign({}, {
    trade_type: me._config.pay_trade_type
  }, data);

  let result = await me.unifiedorder(params);

  //下单成功
  let timestamp = time();
  let noncestr = stringRandom();

  let reqData = {
    'appid': me._config.appid,
    'noncestr': noncestr,
    'package': 'Sign=WXPay',
    'partnerid': me._config.mch_id,
    'prepayid': result.prepay_id,
    'timestamp': timestamp
  };

  let sign = getPaySign(reqData);

  let payReq = {
    'appId': me._config.appid,
    'partnerId': me._config.mch_id,
    'prepayId': result.prepay_id,
    'package': 'Sign=WXPay',
    'nonceStr': noncestr,
    'timeStamp': timestamp,
    'sign': sign
  };

  return payReq;
};

module.exports = Weixin.prototype = Weixin.default = Weixin;
Weixin.call(Weixin);

/**
 * 获取当前时间戳
 * @returns {Number}
 */
function time() {
  return parseInt(Date.now() / 1000);
}

/**
 * 获取MD5签名
 * @param data
 * @param lastKey
 * @param lastValue
 * @returns {string}
 */
function getMd5Sign(data, lastKey, lastValue) {
  let filted = {};
  for (let key in data) {
    let value = data[key] + '';
    if (!value) {
      continue;
    }
    filted[key] = value;
  }
  let keys = Object.keys(filted).sort();

  let arr = [];
  keys.forEach(function (key) {
    arr.push(key + '=' + filted[key]);
  });

  let string = arr.join('&');

  if (lastKey) {
    string += '&' + lastKey + '=' + lastValue;
  }

  return md5(string).toUpperCase();
}

//获取支付通用签名
function getPaySign(data, pay_key) {
  return getMd5Sign(data, 'key', pay_key);
}

/**
 * 将数据转化为XML字符串
 * @param data
 */
function data2xml(data) {
  let builder = new xml2js.Builder({
    cdata: true,
    rootName: 'xml'
  });

  return builder.buildObject(data);
}

/**
 * 将XML转化为js数据
 * @param xml
 * @returns {Promise}
 */
function xml2data(xml) {
  return new Promise(function (resolve, reject) {
    xml2js.parseString(xml, function (error, result) {
      if (error) {
        return reject(error);
      }
      let data = {};
      for (let key in result.xml) {
        let value = result.xml[key];
        data[key] = value && value.length == 1 ? value[0] : value;
      }
      resolve(data);
    });
  });
}
