# CLAUDE.md — Claude Code 项目上下文

> Claude Code 启动时会自动读取这个文件，把它当作"项目记忆"。

## 项目概述

港股热力图（Hong Kong Stock Heatmap）— 全屏 treemap 可视化，展示 ~2600 只港股。
- 区块面积 = 市值
- 颜色 = 涨跌幅（红涨绿跌）
- 基于 52etf.site 的 A 股架构，适配港股市场

## 关键文件

| 文件 | 用途 | 谁读 |
|------|------|------|
| `CLAUDE.md` | Claude Code 项目上下文 | Claude |
| `AGENTS.md` | AI 助手工作规则 | 所有 AI 工具 |
| `PROGRESS.md` | 项目进度追踪 | 人和 AI |
| `feature_list.json` | 功能清单 | 人和 AI |
| `Makefile` | 任务入口 | 人和 AI |
| `docs/DECISIONS.md` | 架构决策记录 | 人 |

## 技术栈

- **框架**: Nuxt 3 (Vue 3 + Vite), SSR
- **UI**: Arco Design + UnoCSS
- **可视化**: D3.js d3-hierarchy + Canvas 2D（双 Canvas 架构）
- **K 线图**: lightweight-charts
- **状态**: Pinia
- **测试**: Vitest (unit), Playwright (E2E)
- **部署**: Vercel

## 常用命令

```bash
make dev      # 启动开发服务器 (port 3000)
make test     # 运行测试
make lint     # 代码风格检查
make check    # 完整验证 (lint + test)
make build    # 生产构建
make status   # 查看项目状态
```

## 工作规则

在本项目中工作时，请遵守以下规则：

1. **一次只做一个功能**：读 `feature_list.json`，找到 `status` 为 `pending` 且依赖已完成的任务
2. **修改前先确认**：读相关文件，理解影响范围，再动手
3. **验证后才标记完成**：运行功能对应的 `verification` 命令，确认通过后才改 `status`
4. **保持进度更新**：每次完成任务后更新 `PROGRESS.md`
5. **不要碰其他功能**：只操作当前任务相关的内容

## 硬约束（不可违反）

1. 所有 API 响应必须通过 `normalizeTencentData()` / `normalizeSinaData()` 规范化
2. Market cap = 0 或 NaN 必须降级为 1e8，保持区块可见
3. 不要修改 `server/utils/cache.ts` 的 TTL 配置（当前 8s）
4. Canvas 渲染必须保持双层架构（Main + Hover）
5. 敏感信息（API key、密码）绝不提交到 git

## 会话开始时

1. 读 `PROGRESS.md` 了解当前状态
2. 读 `feature_list.json` 了解任务列表
3. 找到可以继续的工作
4. 开始前说清楚你要做什么

## 会话结束时

1. 运行 `make check` 确保一切正常
2. 更新 `PROGRESS.md`
3. 提交代码并写清楚 commit message

---

## 架构详情

### 数据流

```
Browser → /api/market/* (Nuxt Nitro) → Rate Limiter + Cache (8s TTL) → External APIs
  ├── Tencent Stock API (主): qt.gtimg.cn/q=hk{code}
  ├── Sina Finance API (备): hq.sinajs.cn/list=rt_hk{code}
  ├── akshare (Python): 股票列表 + 行业数据
  └── HSCI classification (静态数据, 每日刷新)
```

### 双 Canvas 渲染

- **Main Canvas** (`#treemap`): 绘制所有股票区块，仅数据更新时重绘（8s 刷新）
- **Hover Canvas** (`#hover-map`): 处理鼠标交互（高亮、提示框），pointer-events: auto

### 渐进式渲染

1. 首次渲染：Top 200 股票（覆盖 ~95% 市值）— 目标 < 1.5s
2. 后台获取：剩余 ~2400 只，然后全量重绘
3. 移动端：仅渲染 Top 100

### 颜色映射

Sigmoid 非线性映射（处理 30%+ 极端涨跌）：
```
normalized = 2 / (1 + e^(-change/10)) - 1
```
红 (#B71C1C → #FF8A80) 涨，灰 (#263238) 平，绿 (#69F0AE → #1B5E20) 跌

### 服务端限流

令牌桶算法 — 腾讯/新浪 API 最小间隔 3 秒。前端随机 jitter ±2s 避免惊群效应。

### 港股 vs A 股差异

- 无涨跌停限制 — 颜色使用连续渐变
- 每手股数不同（如腾讯=100，汇丰=400）
- 交易时间：09:30-12:00 + 13:00-16:10（午休 12:00-13:00）
- 多币种（主要 HKD，部分 USD/RMB）

## 目录结构

```
app/
  components/TreeMap/   # MainCanvas.vue, HoverCanvas.vue, Tooltip.vue, index.vue
  components/KlineChart/ # KlinePopup.vue
  composables/          # useTreeMapLayout, useCanvasRender, useMarketData 等
  utils/                # color.ts, normalization.ts, format.ts
  types/                # market.ts
server/
  api/market/           # Nuxt Nitro 服务端路由
  utils/                # tencent.ts, sina.ts, cache.ts, rate-limiter.ts
  data/                 # hk-stock-list.json, hsci-sectors.ts
docs/
  DECISIONS.md          # 架构决策日志
hooks/
  pre-commit            # Git 提交前验证
templates/
  NEW_FEATURE.md        # 新功能开工模板
```

## 数据规范化规则

所有外部 API 响应必须通过规范化函数处理，使用 `safeFloat()` / `safeInt()`（NaN → 降级默认值）防止 NaN 传播导致 D3 布局崩溃。Market cap = 0 或 NaN 降级为 1e8（1 亿），保持区块可见。

## HSCI 行业分类

恒生综合行业指数 12 个板块。Top 100 股票：手动映射。其余：按市值层级降级（大/中/小盘），避免"未分类"灰色区域。

## CLAUDE.md vs AGENTS.md

- **CLAUDE.md** 是 Claude Code 专属的，只有 Claude 会读。放 Claude 特有的配置和偏好。
- **AGENTS.md** 是通用的，所有 AI 工具（Copilot、Cursor、Windsurf 等）都可能读。放跨工具的通用规则。

如果你只用 Claude Code，可以在 CLAUDE.md 里写得更详细；如果要兼容多种 AI 工具，把通用规则放 AGENTS.md。
