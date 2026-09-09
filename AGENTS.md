# FindToilet — Project Guide

## 设计规范（最高优先级，所有 UI 工作必须遵守）

- **风格：简洁风 / Apple 风**。少即是多——大量留白、细分割线、克制用色、圆角卡片、无多余装饰和阴影
- **品牌色**：墨绿 `#0F6773`（取自 logo），辅以浅色 tint `#DFF0F1` / 背景 `#F2F8F8`
- **Logo 融入背景**：页头/彩色背景上用 `logo-mark.png`（白色 pin 图形、透明底，直接悬浮于背景色之上）；**不加白框、不加底色、不加投影**。完整墨绿方块版 `logo.png` 仅用于 README、社交预览等外部场景
- 字体用系统字体栈（-apple-system / SF Pro 风格），标题字重 700–800，正文 400–600
- 功能位标记色：免费 `#22C55E` / 付费 `#F59E0B` / 未知 `#94A3B8` / 有密码=品牌墨绿
- UI 文案：**全英文**

## 技术约定

- 纯静态站点，零后端：`web/` 为页面目录，`data/` 为按城市分片的 GeoJSON
- 厕所数据来源 OpenStreetMap（ODbL），Overpass 拉取用 `scripts/fetch-osm-toilets.mjs`（Node fetch 会被 Overpass 拦 406，脚本内走 curl）
- 新增城市：改 `data/cities.json` + 跑拉取脚本即可，无需改页面代码
- 底图：默认 CARTO Positron（`light_all`，契合简洁风），右下角可切 Voyager / OSM Standard；底图瓦片为联网调用，只有 `data/` 下 GeoJSON 是本地静态文件
- 响应式（≤640px）：隐藏 GitHub 文字链、Contribute 胶囊 nowrap、地图工具栏标题计数竖排+图例横向滚动、Leaflet 弹窗限宽 84vw、body `overflow-x:hidden` 兜底
- ⚠️ 手机端测试：无头 Chrome `--window-size` 最小宽度 500px，无法真测 390px；用 `/tmp/mobileshot/shot.js`（playwright-core + 系统 Chrome 设备模拟）截图验证
- 本地预览：项目根目录起静态服务，访问 `/web/`（页面以 `../data/` 相对路径取数据）
- PWA：`web/sw.js` 离线缓存（改缓存内容必须 bump 文件内 `VERSION`）+ `web/manifest.webmanifest` + `web/assets/pwa.js`（注册/更新提示/安装引导/城市离线下载，地图页经 `ft-city` 事件拿数据路径）；App 图标在 `web/assets/icons/`，由脚本从 `logo-mark.png` 生成

## 目录

- `web/index.html` 首页（国家→城市下钻）
- `web/map.html` + `web/assets/map.js` 地图页
- `web/assets/style.css` 全站样式（品牌变量在 `:root`）
- `web/assets/logo.png` / `favicon.png` 品牌资源
- `scripts/` 数据管线脚本
