# 港股热力图 · HK Stock Heatmap

> 全屏 treemap 可视化，一屏纵览 ~2600 只港股的市值与实时涨跌。

- **区块面积** = 市值
- **区块颜色** = 涨跌幅（红涨 / 绿跌）
- **行业分组** = HSCI 恒生综合行业 12 板块

基于 [52etf.site](https://52etf.site) 的 A 股架构，适配港股市场。

---

## 功能特性

- **Treemap 全屏布局** — D3-hierarchy 计算、Canvas 2D 渲染，支持 ~2600 个区块
- **渐进式加载** — 首屏 Top 200 股票 < 1.5s，剩余后台补全
- **双 Canvas 架构** — 主 Canvas 绘制数据，Hover Canvas 处理交互，互不阻塞
- **K 线弹窗** — 点击任意股票查看 lightweight-charts K 线
- **多维筛选** — 互联互通、南向资金覆盖、AH 溢价视图
- **自动刷新** — 8 秒间隔 + 随机 jitter 避免惊群
- **响应式适配** — 桌面 / 平板 / 移动端（移动端 Top 100）

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | [Nuxt 3](https://nuxt.com) (Vue 3 + Vite, SSR) |
| UI | [Arco Design](https://arco.design) + [UnoCSS](https://unocss.dev) |
| 可视化 | [D3.js](https://d3js.org) d3-hierarchy + Canvas 2D |
| K 线 | [lightweight-charts](https://www.tradingview.com/lightweight-charts/) |
| 状态 | [Pinia](https://pinia.vuejs.org) |
| 测试 | [Vitest](https://vitest.dev) (unit) + [Playwright](https://playwright.dev) (E2E) |
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

### 启动开发

```bash
make dev        # 等价于 yarn dev，默认 http://localhost:3000
```

### 生产构建

```bash
make build      # 等价于 yarn build
```

### 运行测试

```bash
make test       # 单元测试 (Vitest)
make lint       # 代码风格 (ESLint)
make check      # lint + test 完整验证
```

更多命令见 [Makefile](Makefile)，或直接 `make help`。

---

## 目录结构

```
app/
  components/TreeMap/     # MainCanvas / HoverCanvas / Tooltip / index
  components/KlineChart/  # KlinePopup
  composables/            # useTreeMapLayout / useCanvasRender / useMarketData 等
  utils/                  # color / normalization / format
  types/                  # market 类型定义
server/
  api/market/             # Nuxt Nitro 服务端路由
  utils/                  # tencent / sina / cache / rate-limiter
  data/                   # hk-stock-list.json / hsci-sectors.ts
docs/
  DECISIONS.md            # 架构决策日志
hooks/
  pre-commit              # Git 提交前验证
templates/
  NEW_FEATURE.md          # 新功能开工模板
```

---

## 数据源

| 数据源 | 用途 | 状态 |
|---|---|---|
| 腾讯 API `qt.gtimg.cn/q=hk{code}` | 实时行情（主） | ✅ |
| 新浪 API `hq.sinajs.cn/list=rt_hk{code}` | 实时行情（备） | ✅ |
| akshare (Python) | 股票列表 / 行业 | ⚠️ 东方财富 API 不可用 |
| HSCI 分类 | 行业归属（静态数据，每日刷新） | ✅ |

**数据流**：
```
Browser → /api/market/* (Nuxt Nitro)
       → Rate Limiter + Cache (8s TTL)
       → Tencent / Sina / akshare / HSCI
```

所有外部 API 响应必须通过 `normalizeTencentData()` / `normalizeSinaData()` 规范化，并用 `safeFloat()` / `safeInt()` 兜底 NaN，防止 D3 布局崩溃。

---

## 核心机制

### 颜色映射（Sigmoid 非线性）

处理 30%+ 的极端涨跌，避免线性映射饱和：

```
normalized = 2 / (1 + e^(-change/10)) - 1
```

- 红 `#B71C1C → #FF8A80` 涨
- 灰 `#263238` 平
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
3. 不要修改 `server/utils/cache.ts` 的 TTL 配置（当前 8s）
4. Canvas 渲染必须保持双层架构（Main + Hover）
5. 敏感信息（API key、密码）绝不提交到 git

---

## 性能指标

| 指标 | 目标 |
|---|---|
| 首屏渲染 | ≤ 1.5s |
| 数据获取 | ≤ 90s |
| 刷新耗时 | ≤ 200ms |
| 内存占用 | ≤ 150MB |
| 交互响应 | ≤ 100ms |

---

## 项目进度

当前 **23/28 步完成 (82%)**，详见 [PROGRESS.md](PROGRESS.md) 与 [feature_list.json](feature_list.json)。

| Phase | 名称 | 状态 |
|---|---|---|
| 0 | 数据源验证 | ✅ |
| 1 | 数据层 | ✅ |
| 2 | 布局层 | ✅ |
| 3 | 渲染层 | ✅ |
| 4 | 交互层 | ⏳ 60% |
| 5 | P1 功能 | ✅ |
| 6 | 部署上线 | ⬜ 待开始 |

---

## 相关文档

- [CLAUDE.md](CLAUDE.md) — Claude Code 项目上下文
- [AGENTS.md](AGENTS.md) — AI 助手通用工作规则
- [PROGRESS.md](PROGRESS.md) — 开发进度追踪
- [docs/DECISIONS.md](docs/DECISIONS.md) — 架构决策记录

---

## License

Private · 仅用于个人/团队内部使用。
