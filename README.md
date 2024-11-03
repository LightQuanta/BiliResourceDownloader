# BiliResourceDownloader

![MIT](https://img.shields.io/github/license/LightQuanta/BiliResourceDownloader
)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/LightQuanta/BiliResourceDownloader/total)
![GitHub Release](https://img.shields.io/github/v/release/LightQuanta/BiliResourceDownloader)
![Platform](https://img.shields.io/badge/Platform-%20win%20|%20linux%20|%20mac-lightgrey.svg)
![GitHub last commit](https://img.shields.io/github/last-commit/LightQuanta/BiliResourceDownloader)

多功能B站资源下载器

## 功能

- 收藏集搜索、解析与下载（包括收藏集图片、视频、表情包、对应的装扮等）
- 个性装扮搜索、解析与下载（包括空间背景图、App端皮肤、评论/动态背景、表情包、加载进度条、点赞动画等）
- 站内评论区表情包搜索、解析与下载
- 直播间：直播间封面、网页端和App端直播间背景图、UP主大表情、房间专属表情解析与下载
- 个人主页：头像、网页端和App端空间背景图、充电表情、收藏集卡牌、头像框、粉丝装扮解析与下载
- 视频封面下载
- 动态使用装扮解析，动态图片批量下载，动态九宫格图片拼接
- 部分装扮进度条使用的 [SVGA动画](https://svga.dev/) 、点赞动画使用的 [Lottie动画](https://airbnb.io/lottie/#/)
  的预览、解析与导出为序列帧图片
- ~~自定义软件背景图~~

## 下载

1. 蓝奏云（仅Windows版）

2. 查看 [Release](./release) ，Windows用户请下载 `
biliresourcedownloader_版本号_x64-setup.exe`

## 文档

WIP

## 主要技术栈

- 软件本体使用 [Tauri框架](https://tauri.app/zh-cn/) 进行搭建
- 前端包管理使用 [bun](https://bun.sh/)
- 前端页面使用 [Vue.js](https://cn.vuejs.org/) 和 [ElementPlus](https://cn.element-plus.org/zh-CN/) 进行构建
- Wbi签名算法，App
  API签名算法，部分API的文档参考 [bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)

## TODO

- Android端支持（缺布局适配，缺文件选择、下载适配）

- 视频下载（也许会做？）

- 专栏解析

## 开源协议

本项目基于 [MIT协议](./LICENSE) 进行开源