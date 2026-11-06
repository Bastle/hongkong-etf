# 港股热力图 · HK Stock Heatmap

> 全屏 treemap 可视化，一屏纵览港股的市值与实时涨跌。

- **区块面积** = 市值
- **区块颜色** = 涨跌幅（红涨 / 绿跌）
- **行业分组** = HSCI 恒生综合行业 12 板块

基于 [52etf.site](https://52etf.site) 的 A 股架构，适配港股市场。

---

## 功能特性

- **Treemap 全屏布局** — D3-hierarchy 计算、Canvas 2D 渲染
- **渐进式加载** — 首屏 Top 200 股票 < 1.5s，剩余后台补全；移动端 Top 100
- **双 Canvas 架构** — 主 Canvas 绘制数据，Hover Canvas 处理交互，互不阻塞
- **K 线弹窗** — hover 查看 lightweight-charts 蜡烛图 + 成交量副图
- **K 线持久化** — 本地 JSON 存储 240 行日 K，配合实时行情自动拼接今日蜡烛
- **多维筛选** — 互联互通、南向资金覆盖、AH 溢价视图
- **自动刷新** — 8 秒间隔 + 随机 jitter 避免惊群
- **响应式适配** — 桌面 / 平板 / 移动端

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | [Next.js 14](https://nextjs.org) (React 18, Pages Router) |
| UI | [Tailwind CSS](https://tailwindcss.com) |
| 可视化 | [D3.js](https://d3js.org) d3-hierarchy + Canvas 2D |
| K 线 | [lightweight-charts](https://www.tradingview.com/lightweight-charts/) v5 |
| 状态 | React Context + useReducer |
| 测试 | [Vitest](https://vitest.dev) |
| 部署 | [Vercel](https://vercel.com) |

---

## 快速开始

### 环境要求

- Node.js ≥ 20
- Yarn ≥ 1.22

### 安装依赖

```bash
yarn install
```

### 同步 K 线数据（首次使用）

```bash
make sync-kline   # 全量拉取 89 只股票 240 行日 K，约 5 分钟
```

### 启动开发

```bash
make dev          # 等价于 yarn dev，默认 http://localhost:3000
```

### 构建与测试

```bash
make build        # 生产构建
make test         # 单元测试 (Vitest, 52 tests)
make lint         # 代码风格 (ESLint)
make check        # lint + test 完整验证
```

更多命令见 `make help`。

---

## 目录结构

```
components/
  TreeMap/            # MainCanvas / HoverCanvas / index
  KlinePopup.tsx      # K 线弹窗（lightweight-charts）
  IndexHeader.tsx     # 大盘指数头部
  MarketSwitcher.tsx  # 市场切换器
  FilterBar.tsx       # 筛选栏
contexts/
  MarketContext.tsx   # 全局状态（筛选/南向/AH 溢价）
hooks/
  useKlinePrefetch.ts # K 线预取 + 模块级缓存
  useAutoRefresh.ts   # 自动刷新
  useElementSize.ts   # ResizeObserver 尺寸监听
lib/
  treemap-layout.ts   # D3 treemap 布局计算
  canvas-render.ts    # Canvas 绘制函数
  color.ts            # Sigmoid 颜色映射
  tooltip-position.ts # Tooltip 视口钳制
  server/             # cache / rate-limiter / tencent / sina / stock-list
pages/
  index.tsx           # 主页面
  api/market/         # API 路由（kline / sectors / stocks / southbound 等）
data/
  kline/              # K 线本地存储（gitignore，make sync-kline 生成）
  hsci-sectors.ts     # HSCI 行业分类
scripts/
  sync-kline.ts       # K 线全量同步脚本
```

---

## 数据源

| 数据源 | 用途 | 状态 |
|---|---|---|
| 腾讯 `qt.gtimg.cn` | 实时行情（主） | ✅ |
| 腾讯 `ifzq.gtimg.cn` / `web.ifzq.gtimg.cn` | 日 K 线（多端点容错） | ✅ |
| 新浪 `hq.sinajs.cn` | 实时行情（备） | ✅ |
| HSCI 分类 | 行业归属（静态数据） | ✅ |

**数据流**：

```
Browser → /api/market/* (Next.js API Routes)
       → 内存缓存 (60s TTL) → 本地 JSON 文件 → 外部 API（多端点容错）
       → 行情 API 补全今日实时 K 线
```

**K 线数据三级读取**：

1. **内存缓存** — 60s TTL，命中直接返回
2. **本地 JSON** — `data/kline/{code}.json`，由 `make sync-kline` 生成
3. **外部 API** — `ifzq.gtimg.cn` + `web.ifzq.gtimg.cn` 双端点容错，成功后写回本地
4. **今日实时** — 从 `qt.gtimg.cn` 行情构造当日 OHLCV 追加到末尾

所有外部 API 响应必须通过 `normalizeTencentData()` / `normalizeSinaData()` 规范化，并用 `safeFloat()` / `safeInt()` 兜底 NaN，防止 D3 布局崩溃。

---

## 核心机制

### 颜色映射（Sigmoid 非线性）

处理 30%+ 的极端涨跌，9 级渐变色板：

```
normalized = 2 / (1 + e^(-change/8)) - 1
```

- 红 `#FF8A80 → #B71C1C` 涨
- 灰 `#8C8C8C` 平
- 绿 `#69F0AE → #1B5E20` 跌

### 服务端限流

令牌桶算法 — 腾讯 / 新浪 API 最小间隔 3 秒；前端随机 jitter ±2s 避免惊群效应。

### 港股 vs A 股差异

- 无涨跌停限制 — 颜色使用连续渐变
- 每手股数不同（腾讯=100，汇丰=400）
- 交易时间：09:30–12:00 + 13:00–16:10（午休 12:00–13:00）
- 多币种（主要 HKD，部分 USD / RMB）

---

## 硬约束（不可违反）

1. 所有 API 响应必须通过 `normalizeTencentData()` / `normalizeSinaData()` 规范化
2. Market cap = 0 或 NaN 必须降级为 `1e8`，保持区块可见
3. 不要修改 `lib/server/cache.ts` 的交易时段 TTL 配置（当前 5s）
4. Canvas 渲染必须保持双层架构（Main + Hover）
5. 敏感信息（API key、密码）绝不提交到 git

---

## 性能指标

| 指标 | 目标 |
|---|---|
| 首屏渲染 | ≤ 1.5s |
| 交互响应 | ≤ 100ms |
| 刷新耗时 | ≤ 200ms |
| 内存占用 | ≤ 150MB |

---

## 项目进度

详见 [PROGRESS.md](PROGRESS.md) 与 [feature_list.json](feature_list.json)。

| Phase | 名称 | 状态 |
|---|---|---|
| 0 | 数据源验证 | ✅ |
| 1 | 数据层 | ✅ |
| 2 | 布局层 | ✅ |
| 3 | 渲染层 | ✅ |
| 4 | 交互层 | ⏳ 80% |
| 5 | P1 功能 | ✅ |
| 6 | 部署上线 | ⬜ 待开始 |
| 7 | 视觉优化专项 | ✅ |
| 8 | React 重构 (Next.js) | ✅ |

---

## 相关文档

- [CLAUDE.md](CLAUDE.md) — Claude Code 项目上下文
- [AGENTS.md](AGENTS.md) — AI 助手通用工作规则
- [PROGRESS.md](PROGRESS.md) — 开发进度追踪
- [docs/DECISIONS.md](docs/DECISIONS.md) — 架构决策记录

---

## License

Private · 仅用于个人/团队内部使用。
