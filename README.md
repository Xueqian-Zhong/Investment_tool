# 观市 StockScope · 美股决策台

中文美股看盘工具，包含关注列表、公开行情、新闻、财报日历、双周期趋势、成交量信号和历史回测。

## 功能

- 行情每 5 分钟自动刷新，可暂停或手动更新；关注列表保存于浏览器。
- 超短线：5 分钟 K 线、EMA9/21、RSI14、VWAP；中短线：日线、EMA20/50、RSI、ATR。
- 成交量：同时间段相对量、日线相对量、OBV、放量突破、缩量回踩、量价背离。
- 疑似吸筹条件逐项展示。这些是价格成交量规则，不能确认大基金身份或真实资金流向。
- Yahoo Finance 行情和新闻 RSS、Nasdaq 财报日历；失败时标明缓存、历史快照或不可用状态。
- 固定日线策略回测，包含次日成交、止损、费用/滑点、回撤和买入持有基准。

## 本地运行

需要 Node.js >=22.13 及 npm。

```sh
npm ci
npm test
npm run dev
```

打开终端显示的本地地址（默认端口 5173），访问 `/dashboard`。

```sh
npm run build
npm start
```

使用 React、Vinext、Vite 与 Cloudflare Workers。`build/`、`scripts/` 和 `vendor/` 包含必要的模板运行文件。`.openai/hosting.json` 仅含原 Sites 项目标识，不含凭证。上传 GitHub 不会自动部署原网站。完整看盘界面已部署到 https://xueqian-zhong.github.io/Investment_tool/ 。GitHub Pages 托管 docs/ 静态界面，行情、新闻、财报接口继续由原 Sites 网站提供；服务端允许该 GitHub 来源的无凭证 GET 请求。修改 public/ 后运行 `node scripts/build-pages.mjs` 重新生成 docs/，推送 main 后自动发布。关注列表按网站来源保存在浏览器中，新网址不会自动继承旧网址的关注列表。

## 数据和回测

```sh
npm run data:fetch
npm run research
```

第一条更新公开数据快照，需要网络；第二条使用已有快照将报告写入 `outputs/`。仓库的 `public/data/` 是带时间戳的历史回退快照，不是实时行情。

5 分钟是请求刷新频率，不能保证交易所实时数据。公开接口可能延迟、限流、改版或不可用；请查看页面的数据时间。来源数据的使用及再分发受供应商条款约束。

回测仅验证固定日线价格/成交量规则，不验证新闻、财报事件、超短线或新增吸筹提示。当前名单存在选股和幸存者偏差，成交与公司行为处理是简化模型，历史表现不保证未来收益。

## 源码位置

- `public/dashboard.html`、`public/live.js`：界面。
- `public/engine.mjs`：指标和回测；`public/short.mjs`：超短线规则。
- `public/volume*.mjs`：成交量与疑似吸筹信号。
- `app/api/`、`lib/providers.ts`：数据接口。
- `tests/`：指标、成交、刷新和成交量边界测试。

依赖、环境变量文件和本机临时配置已通过 `.gitignore` 排除。
