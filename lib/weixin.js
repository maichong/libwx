/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-01-29
 * @author Liang <liang@maichong.it>
 */

'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } step("next"); }); }; }

const _ = require('lodash');
const request = require('request-async');
const stringRandom = require('string-random');
const sha1 = require('sha1');
const xml2js = require('xml2js');
const md5 = require('MD5');

const instances = {};

function Weixin(config) {
  this._config = _.extend({
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
  _.extend(this._config, config);
  return this;
};

/**
 * 获取公众平台全局token
 * @returns {Promise}
 */
Weixin.getGlobalToken = _asyncToGenerator(function* () {
  if (this._globalToken && Date.now() < this._globalTokenTime) {
    return this._globalToken;
  }
  let url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + this._config.appid + '&secret=' + this._config.secret;
  let result = yield request(url);
  let data = JSON.parse(result.body);
  if (data.errcode) {
    throw new Error('Get weixin token failed:' + data.errmsg);
  }
  this._globalToken = data.access_token;
  this._globalTokenTime = Date.now() + data.expires_in * 1000;
  return this._globalToken;
});

/**
 * 获取公众平台JSSDK ticket
 * @returns {Promise}
 */
Weixin.getTicket = _asyncToGenerator(function* () {
  if (this._jsapiTicket && Date.now() < this._jsapiTicketTime) {
    return this._jsapiTicket;
  }
  let token = yield this.getGlobalToken();
  let url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi';
  let result = yield request(url);
  let data = JSON.parse(result.body);
  if (data.errcode) {
    throw new Error('Get weixin ticket failed:' + data.errmsg);
  }
  this._jsapiTicket = data.ticket;
  this._jsapiTicketTime = Date.now() + data.expires_in * 1000;
  return this._jsapiTicket;
});

/**
 * 获取JSSDK初始化参数
 * @returns {Promise}
 */
Weixin.getJSConfig = function () {
  var ref = _asyncToGenerator(function* (url) {
    let data = {
      jsapi_ticket: '',
      noncestr: stringRandom(),
      timestamp: time(),
      url: url
    };

    data.jsapi_ticket = yield this.getTicket();

    let arr = [];
    _.each(data, function (value, key) {
      arr.push(key + '=' + value);
    });

    data.signature = sha1(arr.join('&'));
    data.appId = this._config.appid;
    data.nonceStr = data.noncestr;
    data.jsApiList = ['checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'translateVoice', 'startRecord', 'stopRecord', 'onRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard', 'onMenuShareWeibo', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem'];
    //data.debug = true; // config.init.env == 'development';
    //console.log(data);
    delete data.jsapi_ticket;
    delete data.noncestr;
    delete data.url;
    return data;
  });

  return function (_x) {
    return ref.apply(this, arguments);
  };
}();

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
Weixin.getAccessToken = function () {
  var ref = _asyncToGenerator(function* (code) {
    let url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + this._config.appid + '&secret=' + this._config.secret + '&code=' + code + '&grant_type=authorization_code';
    let result = yield request(url);
    let data = JSON.parse(result.body);
    if (data.errcode) {
      throw new Error('Get weixin access_token failed:' + data.errmsg);
    }
    return data;
  });

  return function (_x2) {
    return ref.apply(this, arguments);
  };
}();

/**
 * 获取授权用户信息
 * @param openid
 * @param accessToken 用户access token
 */
Weixin.getUserInfo = function () {
  var ref = _asyncToGenerator(function* (openid, accessToken) {
    let url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + accessToken + '&openid=' + openid;
    let result = yield request(url);
    let data = JSON.parse(result.body);
    if (data.errcode) {
      throw new Error('Get weixin user info failed:' + data.errmsg);
    }
    return data;
  });

  return function (_x3, _x4) {
    return ref.apply(this, arguments);
  };
}();

/**
 * 获取微信关注者的身份信息
 * @param openid
 * @returns {Promise}
 */
Weixin.getFansInfo = function () {
  var ref = _asyncToGenerator(function* (openid) {
    let token = yield this.getGlobalToken();
    let url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + token + '&openid=' + openid + '&lang=zh_CN';
    let result = yield request(url);
    let data = JSON.parse(result.body);
    if (data.errcode) {
      throw new Error('Get weixin fans info failed:' + data.errmsg);
    }
    return data;
  });

  return function (_x5) {
    return ref.apply(this, arguments);
  };
}();

/**
 * 下载文件
 * @returns {Promise}
 */
Weixin.downloadMedia = function () {
  var ref = _asyncToGenerator(function* (media_id) {
    let token = yield this.getGlobalToken();
    let url = 'http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=' + token + '&media_id=' + media_id;
    let result = yield request({
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
  });

  return function (_x6) {
    return ref.apply(this, arguments);
  };
}();

/**
 * 查询订单
 * @param orderId
 * @returns {Promise}
 */
Weixin.orderquery = function () {
  var ref = _asyncToGenerator(function* (orderId) {
    let data = {
      appid: this._config.appid,
      mch_id: this._config.mch_id,
      nonce_str: stringRandom(),
      out_trade_no: orderId
    };
    data.sign = getPaySign(data, this._config.pay_key);

    let xml = data2xml(data);

    //console.log(xml);

    let result = yield request({
      method: 'POST',
      url: 'https://api.mch.weixin.qq.com/pay/orderquery',
      body: xml
    });

    return yield xml2data(result.body);
  });

  return function (_x7) {
    return ref.apply(this, arguments);
  };
}();

Weixin.unifiedorder = function () {
  var ref = _asyncToGenerator(function* (data) {
    _.defaults(data, {
      appid: this._config.appid,
      mch_id: this._config.mch_id,
      nonce_str: stringRandom(),
      notify_url: this._config.pay_notify_url,
      trade_type: this._config.trade_type
    });

    data.sign = getPaySign(data, this._config.pay_key);

    let xml = data2xml(data);

    let result = yield request({
      method: 'POST',
      url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
      body: xml
    });

    let json = yield xml2data(result.body);
    if (json.return_msg && json.return_msg != 'OK') {
      throw new Error(json.return_msg);
    }

    return json;
  });

  return function (_x8) {
    return ref.apply(this, arguments);
  };
}();

/**
 * 支付接口
 * @param data 支付参数
 * @returns {Promise}
 */
Weixin.createPayReq = function () {
  var ref = _asyncToGenerator(function* (data) {
    let params = _.assign({}, {
      trade_type: this._config.pay_trade_type
    }, data);

    let result = yield this.unifiedorder(params);

    //下单成功
    let timestamp = time();
    let noncestr = stringRandom();

    let reqData = {
      'appid': this._config.appid,
      'noncestr': noncestr,
      'package': 'Sign=WXPay',
      'partnerid': this._config.mch_id,
      'prepayid': result.prepay_id,
      'timestamp': timestamp
    };

    let sign = getPaySign(reqData, this._config.pay_key);

    let payReq = {
      'appId': this._config.appid,
      'partnerId': this._config.mch_id,
      'prepayId': result.prepay_id,
      'package': 'Sign=WXPay',
      'nonceStr': noncestr,
      'timeStamp': timestamp,
      'sign': sign
    };

    return payReq;
  });

  return function (_x9) {
    return ref.apply(this, arguments);
  };
}();

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