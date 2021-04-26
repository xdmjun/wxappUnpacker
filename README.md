
# 说明
- 来自网友基于 [wxappUnpacker](https://github.com/qwerty472123/wxappUnpacker "wxappUnpacker") 改进的开源项目。

# 安装
```
npm install
```

# 安装依赖
```
npm install esprima
    
npm install css-tree
    
npm install cssbeautify
    
npm install vm2
    
npm install uglify-es
    
npm install js-beautify
```

# 分包功能

当检测到 wxapkg 为子包时, 添加-s 参数指定主包源码路径即可自动将子包的 wxss,wxml,js 解析到主包的对应位置下. 完整流程大致如下: 
1. 获取主包和若干子包
2. 解包主包  
    - windows系统使用: `./bingo.bat testpkg/master-xxx.wxapkg`
    - Linux系统使用: `./bingo.sh testpkg/master-xxx.wxapkg`
3. 解包子包  
    - windows系统使用: `./bingo.bat testpkg/sub-1-xxx.wxapkg -s=../master-xxx`
    - Linux系统使用:  `./bingo.sh testpkg/sub-1-xxx.wxapkg -s=../master-xxx`

觉得麻烦?可以使用[自助解包客户端](#自助解包客户端)

TIP
> -s 参数可为相对路径或绝对路径, 推荐使用绝对路径, 因为相对路径的起点不是当前目录 而是子包解包后的目录

```
├── testpkg
│   ├── sub-1-xxx.wxapkg #被解析子包
│   └── sub-1-xxx               #相对路径的起点
│       ├── app-service.js
│   ├── master-xxx.wxapkg
│   └── master-xxx             # ../master-xxx 就是这个目录
│       ├── app.json
```

# 公众号
<img src="geek_road.jpg" alt="公众号" height="145" />  

# 逆向教程小程序
<img src="http://cdn.xuedingmiao.com/nxjc.jpg" alt="逆向教程" height="185" />  

# 自助解包客户端
[基于electron-vue开发的微信小程序自助解包(反编译)客户端](https://github.com/xuedingmiaojun/mp-unpack)

# [小程序逆向视频专栏](https://m.lizhiweike.com/channel2/1037814)
- 还是不知道怎么逆向？
- 遇到问题不会处理？  

快来看看视频系列课程吧~    
[人人都能学会的微信小程序逆向技能](https://m.lizhiweike.com/channel2/1037814)

# 逆向疑难小程序
- [逆向喜茶Go](https://www.bilibili.com/video/BV1Lv411a73w/)

# 项目推荐
### [微信小程序多端实时运行工具](https://github.com/wetools/wept)
> WEPT项目从最近到后续即将升级WEPT2.0版本，支持运行微信小程序 小游戏基础库2.9后版本功能，同时支持实现ios Android三端统一运行环境，欢迎大家持续关注

- WEPT 是一个微信小程序实时开发环境，它的目标是为小程序开发提供高效、稳定、友好、无限制的运行环境。
- 项目后台使用 node 提供服务完全动态生成小程序，前端实现了 view 层、service 层和控制层之间的相关通讯逻辑。
- 支持iOS Android Mac, Window 以及 Linux

#### 实现微信小程序最新运行环境

- [实现小程序编译和运行环境系列(一)](https://mp.weixin.qq.com/s/OjW7GYrNSq-5ojGC3Qa83g)
- [实现小程序编译和运行环境系列(二)](https://mp.weixin.qq.com/s/f6onZC8AWyqg7GL-e0pFXw)
- [实现小程序编译和运行环境系列(三)](https://mp.weixin.qq.com/s/p9xhv1wxhERAn3LlsFVxHA)
- [实现小程序编译和运行环境系列(四)](https://mp.weixin.qq.com/s/StENBEoEIl2_9PrQYl5xkg)
- [实现小程序编译和运行环境系列(五)](https://mp.weixin.qq.com/s/FMrmmAZoayld19WKW75hyQ)
- [实现小程序编译和运行环境系列(终)](https://mp.weixin.qq.com/s/go4imhKuAXv808c52UyiNg)
- [如何深入分析小程序运行原理？](https://mp.weixin.qq.com/s/ZbUFogydJ1d1wGKIjzc21Q)
