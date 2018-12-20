# libwx

NodeJs端微信SDK

## Installation

```sh
npm i libwx
```

## Usage

```js
import { Weixin } from 'libwx';

const wx = new Weixin({
  type: 'h5',
  appid: '',
  secret: '',
  mch_id: '',
  pay_key: '',
  // xxxx
});

let accessToken = await wx.getAccessToken(code);

```

## API

* setOptions(config) 设置
* getGlobalToken() 获取公众平台全局Token
* getTicket() 获取公众平台JSSDK ticket
* getJsConfig(options) 获取JSSDK配置
* getAccessToken(code) 微信登录后将用户的code转化为access_token
* getUserInfo(openid, accessToken) 获取登录后用户的信息
* getFansInfo(openid) 获取微信关注者的用户信息
* downloadMedia(media_id) 从微信服务器上下载媒体文件
* orderquery(orderId) 查询订单信息
* unifiedorder(data) 统一下单
* createPayReq(data) 创建支付参数


## Contribute
[Maichong Software](http://maichong.io)

[Liang Xingchen](https://github.com/liangxingchen)

## License

This project is licensed under the terms of the MIT license
