# 捡漏 · 校园免费剩余物

一个页面，把校园里正在被免费送掉的东西按距离排序。纯 HTML/CSS/JS，零依赖、无构建。

- 首页：距离说话的首屏 + 分类 chips +「手慢无」横滑 + 按距离分档列表
- 详情：16:9 实拍图 + 4 位领取码
- 发布：20 秒发一条，发布后置顶
- 我的：省钱账单 + 领取记录 + Pro 卡

## 文件

```
index.html    结构（含桌面左侧说明 + 右侧 390×844 手机框）
styles.css    全部样式（直角、磨砂玻璃、低饱和实拍图）
app.js        状态与交互（localStorage 持久化）
data.js       CAMPUSES 常量 + 14 条种子 + 6 个分类
assets/photos 实拍图，4:3 与 16:9 两档裁切，灰度 50% / 对比 +5%
assets/qr.png 部署地址二维码
PRD.md        产品说明
```

## 本地跑

```bash
python -m http.server 8899
# 打开 http://127.0.0.1:8899/index.html
```

手机验收：浏览器开发者工具切 390×844，或用手机连同一 WiFi 访问
`http://<本机 IP>:8899/index.html`。

## 换成一所真实学校

1. 改 `data.js` 里的 `CAMPUSES`：`name` / `short` / `spots`（地点数组）。
2. 改 `SEED`：每条 `spot` 用 `spots` 里的 id，`photo` 用 `assets/photos/` 里的文件名前缀。
3. 发布表单的配图来自 `PHOTO_CHOICES`，同样指向 `assets/photos/`。
4. 图片两档一起换：`<name>-4x3.jpg`（480×360）与 `<name>-16x9.jpg`（960×540）。

## 隐私

页面不发起任何需要登录态的请求，不写 cookie，无埋点、无 key。
领取与发布记录只写在本机 `localStorage`（键 `campusloot.v1`）。
示例地点为虚构，集中在 `CAMPUSES` 常量；示例图是公开演示图，**上线前请换成自有版权图**。

## 部署

任意静态托管；GitHub Pages 为例：

```bash
gh repo create campus-loot --public --source=. --push
gh api -X POST repos/:owner/campus-loot/pages -f source[branch]=main -f source[path]=/
```
