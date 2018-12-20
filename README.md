# libwx

NodeJs端微信SDK

## Installation

libwx is available as an [npm package](https://www.npmjs.com/package/libwx).


```sh
npm i libwx
```

## API

* getInstance(name) 获取实例
* init(config) 初始化
* getGlobalToken() 获取公众平台全局Token
* getTicket() 获取公众平台JSSDK ticket
* getJSConfig(url) 获取JSSDK配置
* getAccessToken(code) 微信登录后将用户的code转化为access_token
* getUserInfo(openid, accessToken) 获取登录后用户的信息
* getFansInfo(openid) 获取微信关注者的用户信息
* downloadMedia(media_id) 从微信服务器上下载媒体文件
* orderquery(orderId) 查询订单信息
* unifiedorder(data) 统一下单
* createPayReq(data) 创建支付参数


## Contribute
[Maichong Software](http://maichong.it)

[Liang Xingchen](https://github.com/liangxingchen)

## License

This project is licensed under the terms of the MIT license
